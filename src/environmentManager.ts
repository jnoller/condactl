import * as shelljs from 'shelljs';
import { RegistryManager } from './registry';
import { Commander } from './commander';

export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private registryManager: RegistryManager;
  private commander: Commander;
  private locks: { [environment: string]: boolean };

  private constructor() {
    this.registryManager = new RegistryManager();
    this.commander = new Commander();
    this.locks = {};
  }

    /**
   * example: const environmentManager = EnvironmentManager.getInstance();
   * Returns the singleton instance of the EnvironmentManager class.
   * If the instance does not exist, it creates a new instance.
   * @returns The singleton instance of the EnvironmentManager class.
   */
  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  /**
   * Acquires a lock for the specified environment.
   * @param environment The name of the environment to acquire the lock for.
   */
  private acquireLock(environment: string): void {
    if (this.locks[environment]) {
      throw new Error(`Lock already acquired for environment: ${environment}`);
    }

    this.locks[environment] = true;
  }

  /**
   * Releases the lock for the specified environment.
   * @param environment The name of the environment to release the lock for.
   */
  private releaseLock(environment: string): void {
    if (!this.locks[environment]) {
      throw new Error(`No lock acquired for environment: ${environment}`);
    }

    delete this.locks[environment];
  }
  /**
   * Handles the result of a command execution and throws an error if the command failed.
   * @param command The command that was executed.
   * @param result The result of the command execution.
   */
  private handleCommandResult(command: string, result: shelljs.ShellString): void {
    if (result.code !== 0) {
      throw new Error(`Command '${command}' failed: ${result.stderr}`);
    }
  }

  /**
   * Executes the specified action with a lock acquired for the specified environment.
   * The lock is released after the action is completed.
   * @param environment The name of the environment to acquire the lock for.
   * @param action The action to execute.
   * @returns The result of the action.
   */
  private async withLock<T>(environment: string, action: () => Promise<T>): Promise<T> {
    this.acquireLock(environment);
    try {
      return await action();
    } finally {
      this.releaseLock(environment);
    }
  }

  /**
   * Discovers the available environments.
   * @param forceRefresh Indicates whether to force a refresh of the environment registry.
   * @returns A promise that resolves to an array of discovered environment names.
   */
  public async discoverEnvironments(forceRefresh = false): Promise<string[]> {
    let environments: string[] = [];

    if (forceRefresh || !this.registryManager.isRegistryCreated()) {
      const condaCommand = 'conda env list --json';

      try {
        const result = await this.commander.exec('', condaCommand, [], { captureOutput: true });
        const condaEnvironments = JSON.parse(result.stdout)?.envs || [];
        environments.push(...condaEnvironments);

        environments = environments.filter(env => env !== '');
        environments.forEach(env => this.registryManager.addEnvironment(env));
      } catch (error) {
        console.error(`Failed to discover environments: ${error}`);
        throw error;
      }
    } else {
      environments = Object.keys(this.registryManager.getEnvironments());
    }

    return environments;
  }

  /**
   * Creates a new environment with the specified name.
   * @param name The name of the environment to create.
   * @returns A promise that resolves when the environment is created.
   */
  public async createEnvironment(name: string): Promise<void> {
    const condaCommand = 'conda';
    const args = ['create', '--name', name, 'python'];

    await this.withLock(name, async () => {
      try {
        const result = await this.commander.exec('', condaCommand, args, { captureOutput: true });
        this.handleCommandResult(condaCommand, result);
      } catch (error) {
        console.error(`Failed to create environment '${name}': ${error}`);
        throw error;
      }
    });
  }

  /**
   * Cleans the specified environment by removing all packages and caches.
   * @param name The name of the environment to clean.
   * @returns A promise that resolves when the environment is cleaned.
   */
  public async cleanEnvironment(name: string): Promise<void> {
    const condaCommand = 'conda';
    const args = ['clean', '--name', name, '--all'];

    await this.withLock(name, async () => {
      try {
        const result = await this.commander.exec('', condaCommand, args, { captureOutput: true });
        this.handleCommandResult(condaCommand, result);
      } catch (error) {
        console.error(`Failed to clean environment '${name}': ${error}`);
        throw error;
      }
    });
  }

  /**
   * Compares two environments and returns the comparison result.
   * @param env1 The name of the first environment to compare.
   * @param env2 The name of the second environment to compare.
   * @returns A promise that resolves to the comparison result.
   */
  public async compareEnvironments(env1: string, env2: string): Promise<string> {
    const condaCommand = 'conda';
    const args = ['compare', '--env1', env1, '--env2', env2];

    return await this.withLock(env1, async () => {
      return await this.withLock(env2, async () => {
        try {
          const result = await this.commander.exec('', condaCommand, args, { captureOutput: true });
          this.handleCommandResult(condaCommand, result);
          return result.stdout;
        } catch (error) {
          console.error(`Failed to compare environments '${env1}' and '${env2}': ${error}`);
          throw error;
        }
      });
    });
  }

  /**
   * Configures the specified environment with the specified value.
   * @param name The name of the environment to configure.
   * @param value The value to set for the configuration.
   * @returns A promise that resolves when the environment is configured.
   */
  public async environmentConfig(name: string, value?: string): Promise<void> {
    const condaCommand = 'conda';
    const args = ['config', '--env', '--add', 'env_prompt', value ? `'${value}'` : ''];

    await this.withLock(name, async () => {
      try {
        const result = await this.commander.exec('', condaCommand, args, { captureOutput: true });
        this.handleCommandResult(condaCommand, result);
      } catch (error) {
        console.error(`Failed to configure environment '${name}': ${error}`);
        throw error;
      }
    });
  }
  /**
   * Retrieves the details of the specified environment.
   * @param name The name of the environment to retrieve details for.
   * @returns A promise that resolves to the details of the environment.
   */
  public async environmentDetails(name: string): Promise<string> {
    const condaCommand = 'conda';
    const args = ['info', '--envs', name];

    return await this.withLock(name, async () => {
      try {
        const result = await this.commander.exec('', condaCommand, args, { captureOutput: true });
        this.handleCommandResult(condaCommand, result);
        return result.stdout;
      } catch (error) {
        console.error(`Failed to get details for environment '${name}': ${error}`);
        throw error;
      }
    });
  }

  /**
   * Renames the specified environment to the new name.
   * @param oldName The current name of the environment.
   * @param newName The new name for the environment.
   * @returns A promise that resolves when the environment is renamed.
   */
  public async renameEnvironment(oldName: string, newName: string): Promise<void> {
    const condaCommand = 'conda';
    const args = ['rename', '--old', oldName, '--new', newName];

    await this.withLock(oldName, async () => {
      await this.withLock(newName, async () => {
        try {
          const result = await this.commander.exec('', condaCommand, args, { captureOutput: true });
          this.handleCommandResult(condaCommand, result);
        } catch (error) {
          console.error(`Failed to rename environment '${oldName}' to '${newName}': ${error}`);
          throw error;
        }
      });
    });

    // TODO: Trigger registry refresh after renaming the environment
  }
  /**
   * Updates the specified environment with the specified arguments.
   * @param name The name of the environment to update.
   * @param args The arguments to pass to the update command.
   * @returns A promise that resolves when the environment is updated.
   */
  public async updateEnvironment(name: string, args: string[]): Promise<void> {
    const condaCommand = 'conda';
    const commandArgs = ['update', '--name', name, ...args];

    await this.withLock(name, async () => {
      try {
        const result = await this.commander.exec('', condaCommand, commandArgs, { captureOutput: true });
        this.handleCommandResult(condaCommand, result);
      } catch (error) {
        console.error(`Failed to update environment '${name}': ${error}`);
        throw error;
      }
    });
  }

  /**
   * Lists the environments.
   * @param name The name of the environment to list.
   * @returns A promise that resolves when the environments are listed.
   */
  public async listEnvironments(name: string): Promise<void> {
    const condaCommand = 'conda';
    const args = ['list'];

    await this.withLock(name, async () => {
      try {
        const result = await this.commander.exec('', condaCommand, args, { captureOutput: true });
        this.handleCommandResult(condaCommand, result);

        // TODO: Drop the lock and force a refresh of the registry after successful listing
      } catch (error) {
        console.error(`Failed to list environments: ${error}`);
        throw error;
      }
    });
  }

  /**
   * Deletes the specified environment.
   * @param name The name of the environment to delete.
   * @returns A promise that resolves when the environment is deleted.
   */
  public async deleteEnvironment(name: string): Promise<void> {
    const condaCommand = 'conda';
    const args = ['env', 'remove', '--name', name];

    await this.withLock(name, async () => {
      try {
        const result = await this.commander.exec('', condaCommand, args, { captureOutput: true });
        this.handleCommandResult(condaCommand, result);

        // TODO: Drop the lock and force a refresh of the registry after successful deletion
      } catch (error) {
        console.error(`Failed to delete environment '${name}': ${error}`);
        throw error;
      }
    });
  }

  /**
   * Installs the specified package in the specified environment.
   * @param environment The name of the environment to install the package in.
   * @param packageName The name of the package to install.
   * @returns A promise that resolves when the package is installed.
   */
  public async installPackage(environment: string, packageName: string): Promise<void> {
    const condaCommand = 'conda';
    const args = ['install', '--name', environment, packageName];

    await this.withLock(environment, async () => {
      try {
        const result = await this.commander.exec('', condaCommand, args, { captureOutput: true });
        this.handleCommandResult(condaCommand, result);
      } catch (error) {
        console.error(`Failed to install package '${packageName}' in environment '${environment}': ${error}`);
        throw error;
      }
    });
  }

  /**
   * Uninstalls the specified package from the specified environment.
   * @param environment The name of the environment to uninstall the package from.
   * @param packageName The name of the package to uninstall.
   * @returns A promise that resolves when the package is uninstalled.
   */
  public async uninstallPackage(environment: string, packageName: string): Promise<void> {
    const condaCommand = 'conda';
    const args = ['uninstall', '--name', environment, packageName];

    await this.withLock(environment, async () => {
      try {
        const result = await this.commander.exec('', condaCommand, args, { captureOutput: true });
        this.handleCommandResult(condaCommand, result);
      } catch (error) {
        console.error(`Failed to uninstall package '${packageName}' from environment '${environment}': ${error}`);
        throw error;
      }
    });
  }

  /**
   * Lists the packages installed in the specified environment.
   * @param name The name of the environment to list the packages for.
   * @returns A promise that resolves to the list of packages.
   */
  public async listPackages(name: string): Promise<string> {
    const condaCommand = 'conda';
    const args = ['list', '--name', name];

    return await this.withLock(name, async () => {
      try {
        const result = await this.commander.exec('', condaCommand, args, { captureOutput: true });
        this.handleCommandResult(condaCommand, result);
        return result.stdout;
      } catch (error) {
        console.error(`Failed to list packages in environment '${name}': ${error}`);
        throw error;
      }
    });
  }

  /**
   * Searches for packages matching the specified name.
   * @param name The name of the package to search for.
   * @returns A promise that resolves to the search results.
   */
  public async searchForPackage(name: string): Promise<string> {
    const condaCommand = 'conda';
    const args = ['search', name];

    try {
      const result = await this.commander.exec('', condaCommand, args, { captureOutput: true });
      this.handleCommandResult(condaCommand, result);
      return result.stdout;
    } catch (error) {
      console.error(`Failed to search for package '${name}': ${error}`);
      throw error;
    }
  }
  /**
   * Retrieves the version of Conda.
   * @returns A promise that resolves to the version of Conda.
   */
  public async getCondaVersion(): Promise<string> {
    const condaCommand = 'conda';
    const args = ['--version'];

    try {
      const result = await this.commander.exec('', condaCommand, args, { captureOutput: true });
      this.handleCommandResult(condaCommand, result);
      return result.stdout.trim();
    } catch (error) {
      console.error(`Failed to get Conda version: ${error}`);
      throw error;
    }
  }

  /**
   * Runs a command inside the Conda environment.
   * @returns A promise that resolves to the output of the command.
   */
  public async runCommand(command: string): Promise<string> {
    const condaCommand = 'conda';
    const args = ['run', '-n', 'myenv', 'bash', '-c', command];

    try {
      const result = await this.commander.exec('', condaCommand, args, { captureOutput: true });
      this.handleCommandResult(condaCommand, result);
      return result.stdout.trim();
    } catch (error) {
      console.error(`Failed to run command '${command}' inside Conda environment: ${error}`);
      throw error;
    }
  }
}
