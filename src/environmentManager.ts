import createLogger from './logging';
import { Logger } from 'winston';
import { CONDA_COMMAND, ENABLE_LOGGING, LOG_LEVEL, REGISTRY_PATH } from './config';
import { BaseManager, JsonValue, JsonArray } from './basemanager';
import * as fs from 'fs';
import { RegistryManager, EnvironmentData, Package } from './registry';
import * as path from 'path';

export class EnvironmentManager extends BaseManager {
  private static instance: EnvironmentManager;

  private constructor(log: Logger | undefined) {
    super(log, CONDA_COMMAND);
    if (ENABLE_LOGGING) {
      this.log = log || createLogger(LOG_LEVEL);
    }
    this.registryManager = new RegistryManager(REGISTRY_PATH, this.log);
  }

  public static getInstance(log?: Logger): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager(log);
    }
    return EnvironmentManager.instance;
  }

  public getEnvironmentsFromRegistry(): string[] {
    return this.registryManager.listAllEnvironments();
  }

  public async discoverEnvironments(forceRefresh = false): Promise<string[]> {
    if (forceRefresh) {
      this.log?.debug(`forceRefresh true, flushing: ${this.registryManager.registryPath}`);
      this.registryManager.clearRegistry();
    }
    const envnames = this.registryManager.listAllEnvironments();
    this.log?.debug(`discoverEnvironments: envnames: ${JSON.stringify(envnames)}`);
    if (!forceRefresh && envnames && envnames.length > 0) {
      return envnames // no-op, pull from cache
    }
    this.log?.debug(`discoverEnvironments: rebuilding from cli`);
    const args = ['env', 'list', '--json'];
    const result = await this.lockedStrictJSONExecHandler(args, 'Failed to discover environments');
    this.log?.debug(`discoverEnvironments: result: ${JSON.stringify(result)}`);
    const condaEnvironments = Array.isArray(result['envs']) ? result['envs'] as string[] : [];

    for (const env of condaEnvironments) {
      if (env && env !== '') {
        const envname = path.basename(env);
        if (envname === 'anaconda3') continue;
        const {name, prefix, channels} = await this.getExtendedEnvironmentInfo(envname);
        this.registryManager.addEnvironment(name, prefix, channels);
      }
    }
    return this.registryManager.listAllEnvironments();
  }

  public async listEnvironments(): Promise<JsonArray> {
    return this.getEnvironmentsFromRegistry();
  }

  public async createEnvironment(name: string): Promise<EnvironmentData> {
    let args = ['create', '--name', name, '-y'];
    try {
      await this.lockedStrictJSONExecHandler(args, `Failed to create environment '${name}'`);
    } catch (error) {
      const err = new Error(`Failed to create environment '${name}': ${error}`);
      this.log?.error(err);
      throw err;
    }

    args = ['env', 'export', '-n', name, '--json'];
    const jsonResult = await this.lockedStrictJSONExecHandler(args, `Failed to get environment data for '${name}'`);
    const result = jsonResult as JsonValue;
    const channels = Array.isArray(result['channels']) ? result['channels'] as string[] : [];
    const prefix = typeof result['prefix'] === 'string' ? result['prefix'] : '';

    this.registryManager.addEnvironment(name, prefix, channels);
    const newEnvironment = this.registryManager.getEnvironment(name);

    return newEnvironment;
  }

  public async cloneEnvironment(name: string, newName: string): Promise<EnvironmentData> {
    let args = ['env', '--name', newName, '--clone', name, '-y'];
    try {
      await this.lockedExecHandler(args, `Failed to clone environment '${name}' to '${newName}'`);
    } catch (error) {
      const err = new Error(`Failed to clone environment '${name}' to '${newName}': ${error}`);
      this.log?.error(err);
      throw err;
    }

    args = ['env', 'export', '-n', newName, '--json'];
    const jsonResult = await this.lockedStrictJSONExecHandler(args, `Failed to get environment data for '${newName}'`);
    const result = jsonResult as JsonValue;
    const channels = Array.isArray(result['channels']) ? result['channels'] as string[] : [];
    const prefix = typeof result['prefix'] === 'string' ? result['prefix'] : '';

    this.registryManager.addEnvironment(newName, prefix, channels);
    const newEnvironment = this.registryManager.getEnvironment(newName);

    return newEnvironment;
  }

  public async cleanEnvironment(asJson = true, args = []): Promise<string | object> {
    const flags: string[] = (args && args.length > 0) ? [...args, '--yes']: ['--all', '--yes'];
    const cmd = ['clean', ...flags];
    if (asJson) cmd.push('--json');
    return this.execHandler(cmd, 'Failed to clean environments', asJson);
  }

  public async compareEnvironment(environment: string, filePath: string, asJson = true): Promise<string | object> {
    if (!fs.existsSync(filePath)) {
       throw new Error(`Cannot compare environment, file '${filePath}' does not exist`);
    }
    const args = ['compare', '-n', environment, filePath];
    return this.execHandler(args, `Failed to compare environment '${environment}' with file '${filePath}'`, asJson);
  }

  public async getConfigValue(environment: string, name: string, args=[], asJson: true): Promise<JsonValue | string> {
    const flags: string[] = args.length > 0 ? [...args, '--yes']: ['--all', '--show', name, '--yes'];
    asJson && flags.push('--json');
    const baseCmd = ['config', ...flags];
    const cmd = environment ? ['env', 'config', '-n', environment, ...flags] : baseCmd;
    return this.execHandler(cmd, `Failed to retrieve config value '${name}'`, asJson);
  }

  public async setConfigValue(environment: string, name: string, value: string, args=[], asJson: true): Promise<JsonValue | string> {
    const flags: string[] = args.length > 0 ? [...args, '--yes']: ['--set', name, value, '--yes'];
    asJson && flags.push('--json');
    const baseCmd = ['config', ...flags];
    const cmd = environment ? ['env', 'config', '-n', environment, ...flags] : baseCmd;
    return this.lockedExecHandler(cmd, `Failed to set config value '${name}' to '${value}' for environment '${environment}`, asJson);
  }

  public async renameEnvironment(oldName: string, newName: string, dryRun: false): Promise<JsonValue> {
      const args = ['rename', '-n', oldName, newName];
      if (dryRun) {
          args.push('--dry-run');
          return this.strictJSONExecHandler(args, `Failed to rename environment '${oldName}' to '${newName}'`); // --json may fail
      }
      await this.lockedExecHandler(args, `Failed to rename environment '${oldName}' to '${newName}'`);
      const newEnvironment = this.registryManager.getEnvironment(newName);
      return newEnvironment as JsonValue;
  }

  public async removeEnvironment(name: string, asJson = true): Promise<boolean> {
    const args = ['env', 'remove', '--name', name, '-y'];
    await this.lockedExecHandler(args, `Failed to remove environment '${name}'`, asJson);
    this.registryManager.removeEnvironment(name);
    return true;
  }

  public async listPackages(environment: string, asJson = true, forceRefresh = true): Promise<Package[]> {
    const args = ['list', '--name', environment];
    if (asJson) args.push('--json');

    const fetchPackagesFromConda = async (): Promise<Package[]> => {
        const rawPackagesFromConda = await this.lockedStrictJSONExecHandler(args, `Failed to list packages in environment '${environment}'`);
        const packagesFromConda = Array.isArray(rawPackagesFromConda) ? rawPackagesFromConda as Package[] : [];
        this.registryManager.addEnvironmentPackages(environment, packagesFromConda);
        return packagesFromConda;
    };

    let packagesFromRegistry: Package[];
    if (forceRefresh || !(this.registryManager.getEnvironmentPackages(environment))) {
        packagesFromRegistry = await fetchPackagesFromConda();
    } else {
        packagesFromRegistry = this.registryManager.getEnvironmentPackages(environment) || await fetchPackagesFromConda();
    }
    return packagesFromRegistry;
  }

  public async updateEnvironmentPackages(name: string, asJson = true): Promise<Package[]> {
    const args = ['env', 'update', '--name', name, '-y'];
    // Delete the package data in the registry for the environment
    this.registryManager.removeEnvironmentPackages(name);
    await this.execHandler(args, `Failed to update environment '${name}'`, asJson);
    return this.listPackages(name, asJson, true);
  }

  public async installPackage(environment: string, name: string, asJson = true, version?: string): Promise<string | object> {
    const args = ['install', '--name', environment, '-y'];
    if (asJson) args.push('--json');
    if (version) args.push(`${name}=${version}`);
    else args.push(name);

    return this.lockedExecHandler(args, `Failed to install package '${name}'`);
  }

  public async uninstallPackage(environment: string, name: string, asJson = true): Promise<string | object> {
    const args = ['remove', '--name', environment, '-y'];
    if (asJson) args.push('--json');
    args.push(name);

    return this.lockedExecHandler(args, `Failed to uninstall package '${name}'`);
  }

  public async updatePackage(environment: string, name: string, asJson = true): Promise<string | object> {
    const args = ['update', '--name', environment, '-y'];
    if (asJson) args.push('--json');
    args.push(name);

    return this.lockedExecHandler(args, `Failed to update package '${name}'`);
  }

  public async searchForPackage(name: string, asJson = true, args: []): Promise<string | object> {
    const flags: string[] = (args && args.length > 0) ? [...args, '--yes']: ['--all', '--yes'];
    const cmd = ['search', `--name ${name}`, ...flags];
    asJson && cmd.push('--json');
    return this.lockedStrictJSONExecHandler(cmd, `Failed to search for package '${name}'`);
  }

  public async exportEnvironment(name: string, asJson = true): Promise<string | object> {
    const args = ['env', 'export', '--name', name];
    if(asJson) args.push('--json');
    return this.lockedExecHandler(args, `Failed export environment '${name}'`, asJson);
  }

  public async getCondaVersion(asJson = true): Promise<string | object> {
    const args = ['--version'];
    asJson && args.push('--json');
    return this.execHandler(args, 'Failed to get Conda version', asJson);
  }

  public async condaInfo(asJson=true, args = []): Promise<string | object> {
    const flags: string[] = (args && args.length > 0) ? [...args, '--yes']: ['--all', '--yes'];
    const cmd = ['info', ...flags];
    asJson && cmd.push('--json');
    return this.lockedStrictJSONExecHandler(args, 'Failed to get conda info');
  }


  public async runCommand(environment: string | null, command: string): Promise<string> {
    const args = ['run'];

    if(environment) {
      args.push('-n', environment);
    }
    args.push('bash', '-c', command);

    try {
      const result = await this.clicontrol.exec(null, this.condaCommand, args);
      this.handleCommandResult(this.condaCommand, result);
      return result.stdout.toString().trim();
    } catch (error) {
      const err = new Error(`Failed to run command '${command}': ${error}`);
      this.log?.error(err);
      throw error;
    }
  }
}
