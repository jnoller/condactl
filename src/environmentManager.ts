import * as shelljs from 'shelljs';
import { RegistryManager } from './registry';
import { PackageManager } from './packageManager';

export class EnvironmentManager {
  private registryManager: RegistryManager;
  private packageManager: PackageManager;

  constructor() {
    this.registryManager = new RegistryManager();
    this.packageManager = new PackageManager();
  }

  public discoverEnvironments(forceRefresh = false): string[] {
    let environments: string[] = [];

    if (forceRefresh || !this.registryManager.isRegistryCreated()) {
      const condaCommand = 'conda env list --json';
      const pyenvCommand = 'pyenv virtualenvs --bare';
      const virtualenvCommand = 'lsvirtualenv -b';

      let result = shelljs.exec(condaCommand, { silent: true });
      const condaEnvironments = JSON.parse(result.stdout)?.envs || [];
      environments.push(...condaEnvironments);

      result = shelljs.exec(pyenvCommand, { silent: true });
      const pyenvEnvironments = result.stdout?.split('\n') || [];
      environments.push(...pyenvEnvironments);

      result = shelljs.exec(virtualenvCommand, { silent: true });
      const virtualenvEnvironments = result.stdout?.split('\n') || [];
      environments.push(...virtualenvEnvironments);

      environments = environments.filter(env => env !== '');
      environments.forEach(env => this.registryManager.addEnvironment(env));
    } else {
      environments = Object.keys(this.registryManager.getEnvironments());
    }

    return environments;
  }

  public createEnvironment(name: string, manager: string): void {
    const commandMap: { [key: string]: string } = {
      conda: `conda create --name ${name} python`,
      pyenv: `pyenv virtualenv ${name}`,
      virtualenvwrapper: `mkvirtualenv ${name}`
    };

    const command = commandMap[manager];
    if (!command) {
      throw new Error(`Invalid manager: ${manager}`);
    }

    shelljs.exec(command, { silent: true });
  }

  public removeEnvironment(name: string, manager: string): void {
    const commandMap: { [key: string]: string } = {
      conda: `conda env remove --name ${name} --yes`,
      pyenv: `pyenv virtualenv-delete ${name}`,
      virtualenvwrapper: `rmvirtualenv ${name}`
    };

    const command = commandMap[manager];
    if (!command) {
      throw new Error(`Invalid manager: ${manager}`);
    }

    shelljs.exec(command, { silent: true });
  }

  public installPackage(environmentName: string, packageName: string, manager: string): void {
    this.packageManager.installPackage(environmentName, packageName, manager);
  }

  public uninstallPackage(environmentName: string, packageName: string, manager: string): void {
    this.packageManager.uninstallPackage(environmentName, packageName, manager);
  }

  public getEnvironmentDetails(environmentName: string): { manager: string, scriptPath: string } {
    let manager = '';
    let scriptPath = '';

    if (environmentName === 'env1') {
      manager = 'conda';
      scriptPath = '/path/to/env1/activate_script.sh';
    } else if (environmentName === 'env2') {
      manager = 'pyenv';
      scriptPath = '/path/to/env2/activate_script.sh';
    } else if (environmentName === 'env3') {
      manager = 'virtualenvwrapper';
      scriptPath = '/path/to/env3/activate_script.sh';
    } else {
      throw new Error(`Invalid environment name: ${environmentName}`);
    }

    return { manager, scriptPath };
  }
}
