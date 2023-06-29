/* eslint-disable @typescript-eslint/no-explicit-any */
import * as shelljs from 'shelljs';

export class PackageManager {
  public installPackage(environment: string, packageName: string, manager: string): void {
    if (manager === 'conda') {
      shelljs.exec(`conda activate ${environment} && conda install ${packageName} --yes`, { silent: true } as any);
    } else if (manager === 'pip') {
      shelljs.exec(`pip install ${packageName}`, { silent: true } as any);
    }
  }

  public uninstallPackage(environment: string, packageName: string, manager: string): void {
    if (manager === 'conda') {
      shelljs.exec(`conda activate ${environment} && conda uninstall ${packageName} --yes`, { silent: true } as any);
    } else if (manager === 'pip') {
      shelljs.exec(`pip uninstall ${packageName} --yes`, { silent: true } as any);
    }
  }

  public listPackages(environment: string, manager: string): any {
    if (manager === 'conda') {
      const result = shelljs.exec(`conda activate ${environment} && conda list --json`, { silent: true } as any);
      const packages = JSON.parse(result.stdout);
      return packages;
    } else if (manager === 'pip') {
      const result = shelljs.exec(`pip list --format json`, { silent: true } as any);
      const packages = JSON.parse(result.stdout);
      return packages;
    }
  }
}
