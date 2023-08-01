import { CLIControl, ShellCommandError } from './clicontrol';
import { RegistryManager } from './registry';
import createLogger from './logging';
import { Logger } from 'winston';
import { CONDA_COMMAND, ENABLE_LOGGING, LOG_LEVEL, REGISTRY_PATH } from './config';
import * as fs from 'fs';
import * as path from 'path';

export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private registryManager: RegistryManager;
  private clicontrol: CLIControl;
  private locks: { [environment: string]: boolean };
  private log: Logger | undefined;
  private condaCommand: string;

  private constructor(log: Logger | undefined) {
      if (ENABLE_LOGGING) {
          this.log = log || createLogger(LOG_LEVEL);
      } else {
          this.log = undefined;
      }
      this.registryManager = new RegistryManager(REGISTRY_PATH, this.log);
      this.clicontrol = new CLIControl(null, this.log);
      this.locks = {};
      this.condaCommand = CONDA_COMMAND;
  }

  public static getInstance(log?: Logger): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager(log);
    }
    return EnvironmentManager.instance;
  }

  private acquireLock(environment: string): void {
    if (this.locks[environment]) {
      throw new Error(`Lock already acquired for environment: ${environment}`);
    }

    this.locks[environment] = true;
  }

  private releaseLock(environment: string): void {
    if (!this.locks[environment]) {
      throw new Error(`No lock acquired for environment: ${environment}`);
    }
    delete this.locks[environment];
  }

  private handleCommandResult(command: string, result: ShellCommandError | any): void {
    if (result instanceof ShellCommandError) {
      throw new Error(`Command '${command}' failed: ${result.message}`);
    }
  }

  private async withLock<T>(environment: string, action: () => Promise<T>): Promise<T> {
    this.acquireLock(environment);
    try {
      return await action();
    } finally {
      this.releaseLock(environment);
    }
  }

/**
 * Discovers all Conda environments.
 *
 * This method first initializes the registry manager. If 'forceRefresh' is true, it purges the registry and then
 * discovers all environments by running the 'conda env list' command.
 * If 'forceRefresh' is false, it uses the existing registry.
 * The discovered environments are then added to the registry (stored in ~/.cope as json).
 *
 * @param {boolean} forceRefresh - If true, the registry is purged before discovering environments. Default is true.
 * @throws Will throw an error if the 'conda env list' command fails.
 * @returns {Promise<string[]>} A Promise that resolves to an array of the paths of the discovered environments.
 */
  public async discoverEnvironments(forceRefresh = true): Promise<string[]> {
    let environments: string[] = [];
    await this.registryManager.init();
    // Check if force refresh is enabled, delete the registry file if it is
    if (forceRefresh) {
      this.log?.debug(`Force Refresh set, deleting registry: ${this.registryManager.registryPath}`);
      await this.registryManager.purgeRegistry();
    } else {
      this.log?.info(`Using existing registry: ${this.registryManager.registryPath}`);
    }

    environments = Object.keys(this.registryManager.getEnvironments());
    this.log?.info(`Registry contains ${environments.length} environments.`)
    if (environments.length === 0) {
      const args = ['env', 'list', '--json'];
      this.log?.info('Registry empty, discovering environments.');
      try {
        const result = await this.clicontrol.exec(null, this.condaCommand, args);
        this.log?.debug(`Discovery command executed successfully: ${result.stdout}`);
        const condaEnvironments = JSON.parse(result.stdout.toString())?.envs || [];
        environments = environments.concat(condaEnvironments);
        environments = environments.filter(env => env !== '');
        this.log?.info(`Discovered environments: ${environments}`);
        for (const env of environments) {
          await this.registryManager.addEnvironment(env);
        }
      } catch (error) {
        this.log?.error(`Failed to discover environments: ${error}`);
        throw error;
      }
    } else {
      this.log?.info(`Using cached environments: ${environments}`);
    }

    return environments;
  }

/**
 * Creates a new Conda environment.
 *
 * This method runs the 'conda create' command with the '--name' flag to specify the name of the
 * new environment, and the '--yes' flag to automatically confirm all prompts.
 * If a path is provided, it is used as the full path to the environment location (i.e., the
 * prefix).
 *
 * @param {string} name - The name of the new environment.
 * @param {string} [path] - An optional full path to the environment location.
 * @throws Will throw an error if the 'conda create' command fails.
 * @returns {Promise<void>} A Promise that resolves when the environment creation is complete.
 */
public async createEnvironment(name: string, path?: string): Promise<void> {
  const args = ['create', '--name', name, '--yes'];

  if (path) {
    args.push('-p', path);
  }

  await this.withLock(name, async () => {
    try {
      const result = await this.clicontrol.exec(null, this.condaCommand, args);
      this.handleCommandResult(this.condaCommand, result);
    } catch (error) {
      this.log?.error(`Failed to create environment '${name}': ${error}`);
      throw error;
    }
  });
}


/**
 * Cleans all Conda environments by removing unused packages and caches.
 *
 * This method runs the 'conda clean' command with the '--yes' and '--json' flags to automatically
 * confirm all prompts and output in json format.
 *
 * @throws Will throw an error if the 'conda clean' command fails.
 * @returns {Promise<void>} A Promise that resolves when the cleaning operation is complete.
 */
public async cleanEnvironment(): Promise<void> {
  const args = ['clean', '--all', '--yes', '--json'];

  try {
    const result = await this.clicontrol.exec(null, this.condaCommand, args);
    this.handleCommandResult(this.condaCommand, result);
  } catch (error) {
    this.log?.error(`Failed to clean environments: ${error}`);
    throw error;
  }
}


/**
 * Compares packages between a conda environment and an environment file.
 *
 * @param {string} environment - The name or prefix of the environment to compare.
 * @param {string} filePath - The path to the environment file to compare against.
 * @throws Will throw an error if the 'conda compare' command fails or if the file does not exist.
 * @returns {Promise<string>} A Promise that resolves to the output of the 'conda compare' command.
 */
public async compareEnvironment(environment: string, filePath: string): Promise<string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Can not compare environment, file '${filePath}' does not exist`);
  }

  const args = ['compare', '-n', environment, filePath, '--json'];

  try {
    const result = await this.clicontrol.exec(null, this.condaCommand, args);
    this.handleCommandResult(this.condaCommand, result);
    return result.stdout.toString();
  } catch (error) {
    this.log?.error(`Failed to compare environment '${environment}' with file '${filePath}': ${error}`);
    throw error;
  }
}



  public async environmentConfig(name: string, value?: string): Promise<void> {
    const args = ['config', `--env ${name}`, '--add', 'env_prompt', value ? `'${value}'` : ''];

    await this.withLock(name, async () => {
      try {
        const result = await this.clicontrol.exec(null, this.condaCommand, args);
        this.handleCommandResult(this.condaCommand, result);
      } catch (error) {
        this.log?.error(`Failed to configure environment '${name}': ${error}`);
        throw error;
      }
    });
  }

  public async environmentDetails(name: string): Promise<string> {
    const args = ['info', '--envs', name];

    return await this.withLock(name, async () => {
      try {
        const result = await this.clicontrol.exec(null, this.condaCommand, args);
        this.handleCommandResult(this.condaCommand, result);
        return result.stdout.toString();
      } catch (error) {
        this.log?.error(`Failed to get details for environment '${name}': ${error}`);
        throw error;
      }
    });
  }

  public async renameEnvironment(oldName: string, newName: string): Promise<void> {
    const args = ['rename', '--old', oldName, '--new', newName];

    await this.withLock(oldName, async () => {
      await this.withLock(newName, async () => {
        try {
          const result = await this.clicontrol.exec(null, this.condaCommand, args);
          this.handleCommandResult(this.condaCommand, result);
        } catch (error) {
          this.log?.error(`Failed to rename environment '${oldName}' to '${newName}': ${error}`);
          throw error;
        }
      });
    });
  }

  public async updateEnvironment(name: string, args: string[]): Promise<void> {
    const commandArgs = ['update', '--name', name, ...args];

    await this.withLock(name, async () => {
      try {
        const result = await this.clicontrol.exec(null, this.condaCommand, commandArgs);
        this.handleCommandResult(this.condaCommand, result);
      } catch (error) {
        this.log?.error(`Failed to update environment '${name}': ${error}`);
        throw error;
      }
    });
  }

  public async listEnvironments(name: string): Promise<void> {
    const args = ['list'];

    await this.withLock(name, async () => {
      try {
        const result = await this.clicontrol.exec(null, this.condaCommand, args);
        this.handleCommandResult(this.condaCommand, result);
      } catch (error) {
        this.log?.error(`Failed to list environments: ${error}`);
        throw error;
      }
    });
  }

/**
 * Removes a Conda environment.
 *
 * This method runs the 'conda env remove' command with either the '--name' flag to specify the
 * name of the environment to remove, or the '-p' flag to specify the full path to the environment
 * location. The '--json' flag is also included for json formatted output.
 *
 * @param {string} nameOrPath - The name or full path to the environment to remove.
 * @throws Will throw an error if the 'conda env remove' command fails.
 * @returns {Promise<void>} A Promise that resolves when the environment removal is complete.
 */
public async removeEnvironment(nameOrPath: string): Promise<void> {
  const args = ['env', 'remove', '--json'];

  if (path.isAbsolute(nameOrPath)) {
    args.push('-p', nameOrPath);
  } else {
    args.push('--name', nameOrPath);
  }

  await this.withLock(nameOrPath, async () => {
    try {
      const result = await this.clicontrol.exec(null, this.condaCommand, args);
      this.handleCommandResult(this.condaCommand, result);
    } catch (error) {
      this.log?.error(`Failed to remove environment '${nameOrPath}': ${error}`);
      throw error;
    }
  });
}

  /**
   * Installs a package in a Conda environment.
   *
   * This method runs the 'conda install' command with the '--name' flag to specify the environment to install
   * the package in, and the '-y' flag to automatically confirm all prompts. The '--json' flag is also included
   * for json formatted output.
   * If a file path is provided, it is passed to the '--file' flag to specify the package file to install.
   *
   * @param {string} environment - The name of the environment to install the package in.
   * @param {string} packageOrFile - The name of the package to install or the path to the package file.
   * @throws Will throw an error if the 'conda install' command fails.
   * @returns {Promise<void>} A Promise that resolves when the package installation is complete.
   */

  // TODO: add support for specifying the package version
  // in the file, the versions should be defined, so we only need it if it's a package name
  public async installPackage(environment: string, packageOrFile: string): Promise<void> {
    const args = ['install', '--name', environment, '-y', '--json'];

    if (path.isAbsolute(packageOrFile)) {
      args.push('--file', packageOrFile);
    } else {
      args.push(packageOrFile);
    }

    await this.withLock(environment, async () => {
      try {
        const result = await this.clicontrol.exec(null, this.condaCommand, args);
        this.handleCommandResult(this.condaCommand, result);
      } catch (error) {
        this.log?.error(`Failed to install package '${packageOrFile}' in environment '${environment}': ${error}`);
        throw error;
      }
    });
  }

  public async uninstallPackage(environment: string, packageName: string): Promise<void> {
    const args = ['uninstall', '--name', environment, packageName, '--yes'];

    await this.withLock(environment, async () => {
      try {
        const result = await this.clicontrol.exec(null, this.condaCommand, args);
        this.handleCommandResult(this.condaCommand, result);
      } catch (error) {
        this.log?.error(`Failed to uninstall package '${packageName}' from environment '${environment}': ${error}`);
        throw error;
      }
    });
  }

  public async listPackages(name: string): Promise<string> {
    const args = ['list', '--name', name];

    return await this.withLock(name, async () => {
      try {
        const result = await this.clicontrol.exec(null, this.condaCommand, args);
        this.handleCommandResult(this.condaCommand, result);
        return result.stdout.toString();
      } catch (error) {
        this.log?.error(`Failed to list packages in environment '${name}': ${error}`);
        throw error;
      }
    });
  }

  public async searchForPackage(name: string): Promise<string> {
    const args = ['search', name];

    try {
      const result = await this.clicontrol.exec(null, this.condaCommand, args);
      this.handleCommandResult(this.condaCommand, result);
      return result.stdout.toString();
    } catch (error) {
      this.log?.error(`Failed to search for package '${name}': ${error}`);
      throw error;
    }
  }

  public async getCondaVersion(): Promise<string> {
    const args = ['--version'];

    try {
      const result = await this.clicontrol.exec(null, this.condaCommand, args);
      this.handleCommandResult(this.condaCommand, result);
      return result.stdout.toString().trim();
    } catch (error) {
      this.log?.error(`Failed to get Conda version: ${error}`);
      throw error;
    }
  }

  public async runCommand(environment: string | null, command: string): Promise<string> {
    const args = ['run', '-n', 'myenv', 'bash', '-c', command];

    try {
      const result = await this.clicontrol.exec(environment, this.condaCommand, args);
      this.handleCommandResult(this.condaCommand, result);
      return result.stdout.toString().trim();
    } catch (error) {
      this.log?.error(`Failed to run command '${command}' inside Conda environment: ${error}`);
      throw error;
    }
  }
}
