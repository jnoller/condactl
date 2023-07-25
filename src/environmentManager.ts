import { Commander, ShellCommandError } from './commander';
import { RegistryManager } from './registry';
import createLogger from './logging';
import { Logger } from 'winston';

export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private registryManager: RegistryManager;
  private commander: Commander;
  private locks: { [environment: string]: boolean };
  private log: Logger;

  private constructor(log?: Logger) {
    this.log = log || createLogger();
    this.registryManager = new RegistryManager(undefined, this.log);
    this.commander = new Commander(this.log);
    this.locks = {};
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

  public async discoverEnvironments(forceRefresh = true): Promise<string[]> {
    let environments: string[] = [];
    await this.registryManager.init();
    // Check if force refresh is enabled, delete the registry file if it is
    if (forceRefresh) {
      this.log.debug(`Force Refresh set, deleting registry: ${this.registryManager.registryPath}`);
      await this.registryManager.purgeRegistry();
    } else {
      this.log.info(`Using existing registry: ${this.registryManager.registryPath}`);
    }

    environments = Object.keys(this.registryManager.getEnvironments());
    this.log.info(`Registry contains ${environments.length} environments.`)
    if (environments.length === 0) {
      const condaCommand = 'conda';
      const args = ['env', 'list', '--json'];
      this.log.info('Registry empty, discovering environments.');
      try {
        const result = await this.commander.exec(null, condaCommand, args);
        this.log.debug(`Discovery command executed successfully: ${result.stdout}`);
        const condaEnvironments = JSON.parse(result.stdout.toString())?.envs || [];
        environments = environments.concat(condaEnvironments);
        environments = environments.filter(env => env !== '');
        this.log.info(`Discovered environments: ${environments}`);
        for (const env of environments) {
          await this.registryManager.addEnvironment(env);
        }
      } catch (error) {
        this.log.error(`Failed to discover environments: ${error}`);
        throw error;
      }
    } else {
      this.log.info(`Using cached environments: ${environments}`);
    }

    return environments;
  }

  public async createEnvironment(name: string): Promise<void> {
    const condaCommand = 'conda';
    const args = ['create', '--name', name, '--yes'];

    await this.withLock(name, async () => {
      try {
        const result = await this.commander.exec(null, condaCommand, args);
        this.handleCommandResult(condaCommand, result);
      } catch (error) {
        this.log.error(`Failed to create environment '${name}': ${error}`);
        throw error;
      }
    });
  }

  public async cleanEnvironment(name: string): Promise<void> {
    const condaCommand = 'conda';
    const args = ['clean', '--name', name, '--all', '--yes'];

    await this.withLock(name, async () => {
      try {
        const result = await this.commander.exec(null, condaCommand, args);
        this.handleCommandResult(condaCommand, result);
      } catch (error) {
        this.log.error(`Failed to clean environment '${name}': ${error}`);
        throw error;
      }
    });
  }

  public async compareEnvironments(env1: string, env2: string): Promise<string> {
    const condaCommand = 'conda';
    const args = ['compare', '--env1', env1, '--env2', env2];

    return await this.withLock(env1, async () => {
      return await this.withLock(env2, async () => {
        try {
          const result = await this.commander.exec(null, condaCommand, args);
          this.handleCommandResult(condaCommand, result);
          return result.stdout.toString();
        } catch (error) {
          this.log.error(`Failed to compare environments '${env1}' and '${env2}': ${error}`);
          throw error;
        }
      });
    });
  }

  public async environmentConfig(name: string, value?: string): Promise<void> {
    const condaCommand = 'conda';
    const args = ['config', '--env', '--add', 'env_prompt', value ? `'${value}'` : ''];

    await this.withLock(name, async () => {
      try {
        const result = await this.commander.exec(null, condaCommand, args);
        this.handleCommandResult(condaCommand, result);
      } catch (error) {
        this.log.error(`Failed to configure environment '${name}': ${error}`);
        throw error;
      }
    });
  }

  public async environmentDetails(name: string): Promise<string> {
    const condaCommand = 'conda';
    const args = ['info', '--envs', name];

    return await this.withLock(name, async () => {
      try {
        const result = await this.commander.exec(null, condaCommand, args);
        this.handleCommandResult(condaCommand, result);
        return result.stdout.toString();
      } catch (error) {
        this.log.error(`Failed to get details for environment '${name}': ${error}`);
        throw error;
      }
    });
  }

  public async renameEnvironment(oldName: string, newName: string): Promise<void> {
    const condaCommand = 'conda';
    const args = ['rename', '--old', oldName, '--new', newName];

    await this.withLock(oldName, async () => {
      await this.withLock(newName, async () => {
        try {
          const result = await this.commander.exec(null, condaCommand, args);
          this.handleCommandResult(condaCommand, result);
        } catch (error) {
          this.log.error(`Failed to rename environment '${oldName}' to '${newName}': ${error}`);
          throw error;
        }
      });
    });

    // TODO: Trigger registry refresh after renaming the environment
  }

  public async updateEnvironment(name: string, args: string[]): Promise<void> {
    const condaCommand = 'conda';
    const commandArgs = ['update', '--name', name, ...args];

    await this.withLock(name, async () => {
      try {
        const result = await this.commander.exec(null, condaCommand, commandArgs);
        this.handleCommandResult(condaCommand, result);
      } catch (error) {
        this.log.error(`Failed to update environment '${name}': ${error}`);
        throw error;
      }
    });
  }

  public async listEnvironments(name: string): Promise<void> {
    const condaCommand = 'conda';
    const args = ['list'];

    await this.withLock(name, async () => {
      try {
        const result = await this.commander.exec(null, condaCommand, args);
        this.handleCommandResult(condaCommand, result);

        // TODO: Drop the lock and force a refresh of the registry after successful listing
      } catch (error) {
        this.log.error(`Failed to list environments: ${error}`);
        throw error;
      }
    });
  }

  public async deleteEnvironment(name: string): Promise<void> {
    const condaCommand = 'conda';
    const args = ['env', 'remove', '--name', name];

    await this.withLock(name, async () => {
      try {
        const result = await this.commander.exec(null, condaCommand, args);
        this.handleCommandResult(condaCommand, result);

        // TODO: Drop the lock and force a refresh of the registry after successful deletion
      } catch (error) {
        this.log.error(`Failed to delete environment '${name}': ${error}`);
        throw error;
      }
    });
  }

  public async installPackage(environment: string, packageName: string): Promise<void> {
    const condaCommand = 'conda';
    const args = ['install', '--name', environment, packageName];

    await this.withLock(environment, async () => {
      try {
        const result = await this.commander.exec(null, condaCommand, args);
        this.handleCommandResult(condaCommand, result);
      } catch (error) {
        this.log.error(`Failed to install package '${packageName}' in environment '${environment}': ${error}`);
        throw error;
      }
    });
  }

  public async uninstallPackage(environment: string, packageName: string): Promise<void> {
    const condaCommand = 'conda';
    const args = ['uninstall', '--name', environment, packageName];

    await this.withLock(environment, async () => {
      try {
        const result = await this.commander.exec(null, condaCommand, args);
        this.handleCommandResult(condaCommand, result);
      } catch (error) {
        this.log.error(`Failed to uninstall package '${packageName}' from environment '${environment}': ${error}`);
        throw error;
      }
    });
  }

  public async listPackages(name: string): Promise<string> {
    const condaCommand = 'conda';
    const args = ['list', '--name', name];

    return await this.withLock(name, async () => {
      try {
        const result = await this.commander.exec(null, condaCommand, args);
        this.handleCommandResult(condaCommand, result);
        return result.stdout.toString();
      } catch (error) {
        this.log.error(`Failed to list packages in environment '${name}': ${error}`);
        throw error;
      }
    });
  }

  public async searchForPackage(name: string): Promise<string> {
    // TODO: Could this be a binary Y/N response instead of the stdout of the command?
    const condaCommand = 'conda';
    const args = ['search', name];

    try {
      const result = await this.commander.exec(null, condaCommand, args);
      this.handleCommandResult(condaCommand, result);
      return result.stdout.toString();
    } catch (error) {
      this.log.error(`Failed to search for package '${name}': ${error}`);
      throw error;
    }
  }

  public async getCondaVersion(): Promise<string> {
    const condaCommand = 'conda';
    const args = ['--version'];

    try {
      const result = await this.commander.exec(null, condaCommand, args);
      this.handleCommandResult(condaCommand, result);
      return result.stdout.toString().trim();
    } catch (error) {
      this.log.error(`Failed to get Conda version: ${error}`);
      throw error;
    }
  }

  public async runCommand(environment: string | null, command: string): Promise<string> {
    const condaCommand = 'conda';
    const args = ['run', '-n', 'myenv', 'bash', '-c', command];

    try {
      const result = await this.commander.exec(environment, condaCommand, args);
      this.handleCommandResult(condaCommand, result);
      return result.stdout.toString().trim();
    } catch (error) {
      this.log.error(`Failed to run command '${command}' inside Conda environment: ${error}`);
      throw error;
    }
  }
}
