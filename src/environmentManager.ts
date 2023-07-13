import * as shelljs from 'shelljs';
import { RegistryManager } from './registry';
import { PackageManager } from './packageManager';

/**
 * Environment manager manages the registry of environments.
 * When we start for the first time, we discover all the environments and store them in the registry.
 * When we create a new environment, we add it to the registry after it's validated to be created.
 *
 */
export class EnvironmentManager {
  private registryManager: RegistryManager;

  /**
   * Discovers existing environments.
   * @param {boolean} [forceRefresh=false] - A flag to force refresh the environments.
   * @returns {string[]} - An array of environment names.
   */
  public discoverEnvironments(forceRefresh = false): string[] {}



/*

Environment operations
clean
compare (env1, env2)
config
list
rename
update?



export class EnvironmentManager {
  private registryManager: RegistryManager;
  private packageManager: PackageManager;

  /**
   * Creates an instance of EnvironmentManager.
   */
  constructor() {
    this.registryManager = new RegistryManager();
    this.packageManager = new PackageManager();
  }

  /**
   * Discovers existing environments.
   * @param {boolean} [forceRefresh=false] - A flag to force refresh the environments.
   * @returns {string[]} - An array of environment names.
   */
  public discoverEnvironments(forceRefresh = false): string[] {
    let environments: string[] = [];

    if (forceRefresh || !this.registryManager.isRegistryCreated()) {
      const condaCommand = 'conda env list --json';

      let result = shelljs.exec(condaCommand, { silent: true });
      const condaEnvironments = JSON.parse(result.stdout)?.envs || [];
      environments.push(...condaEnvironments);

      environments = environments.filter(env => env !== '');
      environments.forEach(env => this.registryManager.addEnvironment(env));
    } else {
      environments = Object.keys(this.registryManager.getEnvironments());
    }

    return environments;
  }

  /**
   * Creates a new environment.
   * @param {string} name - The name of the environment.
   * @throws {Error} - If an invalid manager is provided.
   */
  public createEnvironment(name: string): void {
    const condaCommand = `conda create --name ${name} python`;

    shelljs.exec(condaCommand, { silent: true });
  }

  /**
   * Removes an existing environment.
   * @param {string} name - The name of the environment to remove.
   * @throws {Error} - If an invalid manager is provided.
   */
  public removeEnvironment(name: string): void {
    const condaCommand = `conda env remove --name ${name} --yes`;

    shelljs.exec(condaCommand, { silent: true });
  }

  /**
   * Installs a package in a specific environment.
   * @param {string} environmentName - The name of the environment.
   * @param {string} packageName - The name of the package to install.
   */
  public installPackage(environmentName: string, packageName: string): void {
    this.packageManager.installPackage(environmentName, packageName, 'conda');
  }

  /**
   * Uninstalls a package from a specific environment.
   * @param {string} environmentName - The name of the environment.
   * @param {string} packageName - The name of the package to uninstall.
   */
  public uninstallPackage(environmentName: string, packageName: string): void {
    this.packageManager.uninstallPackage(environmentName, packageName, 'conda');
  }

  /**
   * Retrieves details about an environment.
   * @param {string} environmentName - The name of the environment.
   * @returns {{ manager: string, scriptPath: string }} - An object containing the manager and script path of the environment.
   * @throws {Error} - If an invalid environment name is provided.
   */
  public getEnvironmentDetails(environmentName: string): { manager: string, scriptPath: string } {
    let manager = '';
    let scriptPath = '';

    if (environmentName === 'env1') {
      manager = 'conda';
      scriptPath = '/path/to/env1/activate_script.sh';
    } else {
      throw new Error(`Invalid environment name: ${environmentName}`);
    }

    return { manager, scriptPath };
  }
}
