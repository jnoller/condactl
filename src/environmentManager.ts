import createLogger from './logging';
import { Logger } from 'winston';
import { CONDA_COMMAND, ENABLE_LOGGING, LOG_LEVEL, REGISTRY_PATH } from './config';
import { BaseManager } from './basemanager';
import * as fs from 'fs';
import { RegistryManager } from './registry';


export class EnvironmentManager extends BaseManager {
  private static instance: EnvironmentManager;

  private constructor(log: Logger | undefined) {
    super(log, CONDA_COMMAND);
    if (ENABLE_LOGGING) {
      this.log = log || createLogger(LOG_LEVEL);
    }
    this.registryManager = new RegistryManager(REGISTRY_PATH);
  }

  public static getInstance(log?: Logger): EnvironmentManager {
    if (!EnvironmentManager.instance)
      EnvironmentManager.instance = new EnvironmentManager(log);
    return EnvironmentManager.instance;
  }

  public async discoverEnvironments(forceRefresh = true): Promise<object> {
    await this.registryManager.init();
    if (forceRefresh) {
        this.log?.debug(`Force Refresh set, deleting registry: ${this.registryManager.registryPath}`);
        await this.registryManager.purgeRegistry();
    } else {
        this.log?.info(`Using existing registry: ${this.registryManager.registryPath}`);
  }

    let environments = this.registryManager.getEnvironments();
    this.log?.info(`Registry contains ${Object.keys(environments).length} environments.`);

    if (Object.keys(environments).length === 0) {
        const args = ['env', 'list', '--json'];
        this.log?.info('Registry empty, discovering environments.');
        try {
            const result = await this.execHandler(args, 'Failed to discover environments');
            this.log?.debug(`Discovery command executed successfully: ${result}`);

            if (typeof result === 'string') {
                throw new Error('Invalid response from execHandler');
            }

            let resultAsJson: {envs?: string[]};
            if (typeof result === 'string') {
              try {
                  resultAsJson = JSON.parse(result);
              } catch (error) {
                  throw new Error('Error parsing string response from execHandler into JSON.');
              }
          } else {
              resultAsJson = result;
          }

            const condaEnvironments = resultAsJson?.envs || [];
            for (const env of condaEnvironments) {
                if(env && env !== ''){
                    await this.registryManager.addEnvironment(env);
                    this.log?.info(`Discovered environment: ${env}`);
                }
            }
            environments = this.registryManager.getEnvironments();

        } catch (error) {
            this.log?.error(`Failed to discover environments: ${error}`);
            throw error;
        }
    } else {
        this.log?.info(`Using cached environments: ${environments}`);
    }

    return environments;
  }

  public async createEnvironment(name: string, asJson = true): Promise<string | object> {
    const args = ['create', '--name', name, '-y'];
    return this.execHandler(args, `Failed to create environment '${name}'`, asJson);
  }

  // TODO: Add support for a config{} object for the args conda clean can take, see https://docs.conda.io/projects/conda/en/latest/commands/clean.html
  public async cleanEnvironment(asJson = true): Promise<string | object> {
    const args = ['clean', '--all', '--yes'];
    return this.execHandler(args, 'Failed to clean environments', asJson);
  }

  public async compareEnvironment(environment: string, filePath: string, asJson = true): Promise<string | object> {
    if (!fs.existsSync(filePath)) {
       throw new Error(`Cannot compare environment, file '${filePath}' does not exist`);
    }

    const args = ['compare', '-n', environment, filePath];
    return this.execHandler(args, `Failed to compare environment '${environment}' with file '${filePath}'`, asJson);
  }

  public async environmentConfig(name: string, value?: string): Promise<void> {
    const args = ['config', '--env', name, '--set', 'env_prompt', value || ''];
    await this.execHandler(args, `Failed to configure environment '${name}'`);
  }

  public async renameEnvironment(oldName: string, newName: string): Promise<void> {
      const args = ['rename', '--name', oldName, '--new', newName];
      await this.execHandler(args, `Failed to rename environment '${oldName}' to '${newName}'`);
  }

  public async updateEnvironment(name: string, asJson = true): Promise<string | object> {
    const args = ['env', 'update', '--name', name, '-y'];
    return this.execHandler(args, `Failed to update environment '${name}'`, asJson);
  }

  public async listEnvironments(asJson = true): Promise<string | object> {
    const args = ['env', 'list'];
    if (asJson) args.push('--json');

    return this.execHandler(args, `Failed to list environments`, asJson);
  }

  public async removeEnvironment(name: string, asJson = true): Promise<string | object> {
    const args = ['env', 'remove', '--name', name, '-y'];
    if (asJson) args.push('--json');

    return this.execHandler(args, `Failed to remove environment '${name}'`, asJson);
  }

  public async installPackage(name: string, asJson = true, version?: string): Promise<string | object> {
    const args = ['install', '--name', name, '-y'];
    if (asJson) args.push('--json');
    if (version) args.push(`${name}=${version}`);
    else args.push(name);

    return this.execHandler(args, `Failed to install package '${name}'`, asJson);
  }

  public async uninstallPackage(name: string, asJson = true): Promise<string | object> {
    const args = ['remove', '--name', name, '-y'];
    if (asJson) args.push('--json');

    return this.execHandler(args, `Failed to uninstall package '${name}'`, asJson);
  }

  public async updatePackage(name: string, asJson = true): Promise<string | object> {
    const args = ['update', '--name', name, '-y'];
    if (asJson) args.push('--json');

    return this.execHandler(args, `Failed to update package '${name}'`, asJson);
  }

  public async listPackages(name: string, asJson = true): Promise<string | object> {
    const args = ['list', '--name', name, '-y'];
    if (asJson) args.push('--json');

    return this.execHandler(args, `Failed to list packages in environment '${name}'`, asJson);
  }

  public async searchForPackage(name: string, asJson = true): Promise<string | object> {
    const args = ['search', '--name', name, '-y'];
    if (asJson) args.push('--json');

    return this.execHandler(args, `Failed to search for package '${name}'`, asJson);
  }

  public async getCondaVersion(asJson = true): Promise<string | object> {
    const args = ['--version'];
    if (asJson) args.push('--json');

    return this.execHandler(args, 'Failed to get Conda version', asJson);
  }

  public async runCommand(environment: string | null, command: string): Promise<string | object> {
    let args = ['run', 'bash', '-c', command];
    if (environment) args = ['run', '-n', environment, 'bash', '-c', command];
    return this.execHandler(args, `Failed to run command '${command}' inside Conda environment`, false);
  }

  public async exportEnvironment(name: string, asJson = true): Promise<string | object> {
    const args = ['env', 'export', '--name', name];
    if(asJson) args.push('--json');
    return this.execHandler(args, `Failed export environment '${name}'`, asJson);
  }

  // TODO: Add support for a config{} object for the args conda info can take, see https://docs.conda.io/projects/conda/en/latest/commands/info.html
  public async condaInfo(asJson=true): Promise<string | object> {
    const args = ['info'];
    if(asJson) args.push('--json');
    return this.execHandler(args, 'Failed to get conda info', asJson);
  }

  // public async environmentDetails(name: string): Promise<string> {
  //   const args = ['info', '--envs', name];
  //   try {
  //     const result = await this.executeWithLock(name, args);
  //     return result;
  //   } catch (error) {
  //     this.log?.error(`Failed to get details for environment '${name}': ${error}`);
  //     throw error;
  //   }
  // }
}
