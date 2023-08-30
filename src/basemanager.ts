import { CLIControl, ShellCommandError } from './clicontrol';
import { Logger } from 'winston';
import { CONDA_COMMAND, REGISTRY_PATH } from './config';
import { RegistryManager } from './registry';
import { ShellString } from 'shelljs';


export interface JsonValue {
  [key: string]: string | number | boolean | null | JsonArray | JsonValue;
}

export type JsonArray = Array<string | number | boolean | null | JsonValue>;


export abstract class BaseManager {
  protected log: Logger | undefined;
  protected locks: { [environment: string]: boolean } = {};
  protected condaCommand: string;
  protected clicontrol: CLIControl;
  protected registryManager: RegistryManager;


  constructor(log?: Logger, condaCommand: string = CONDA_COMMAND) {
    this.log = log;
    this.condaCommand = condaCommand;
    this.clicontrol = new CLIControl(null, this.log);
    this.registryManager = new RegistryManager(REGISTRY_PATH, this.log);
  }

  protected handleLock(environ: string, lock: boolean): void {
    if (this.locks[environ] === lock) throw new Error(`Lock state inconsistency for '${environ}'`);
    this.locks[environ] = lock;
  }

  protected handleCommandResult(command: string, result: ShellCommandError | ShellString): void {
    if (result instanceof ShellCommandError) throw new Error(`Command '${command}' failed: ${result.message}`);
  }

  protected async executeWithLock<T>(key: string | null, cmdArgs: string[], action: (cmdArgs: string[]) => Promise<T>): Promise<T>{
    const entity: string = key || "registry";

    this.handleLock(entity, true);
    try {
      return await action(cmdArgs);
    } finally {
      this.handleLock(entity, false);
    }
  }

  protected async execCommand(cmdArgs: string[]): Promise<string> {
    const result = await this.clicontrol.exec(null, this.condaCommand, cmdArgs);
    this.handleCommandResult(this.condaCommand, result);
    return result.stdout.toString();
  }

  public safeJSONParse(data: string): JsonValue {
    try {
      let result = JSON.parse(data);
      result = result || {};
      return result;
    } catch (error) {
      this.log?.error(`Invalid JSON response: ${error}`);
      throw error;
    }
  }

  public async lockedExecHandler(args: string[], errPrefix: string, asJson = true): Promise<JsonValue | string> {
    return await this.executeWithLock(null, args, async (cmdArgs: string[]) => {
      return await this.execHandler(cmdArgs, errPrefix, asJson);
    });
  }

  public async execHandler(args: string[], errPrefix: string, asJson = true): Promise<JsonValue | string> {
    if (asJson) args.push('--json');
    try {
      const rawresult = await this.execCommand(args);
      if (asJson) {
        const result = this.safeJSONParse(rawresult);
        return result;
      } else {
        return rawresult;
      }
    } catch (error) {
      this.log?.error(`${errPrefix}: ${error}`);
      throw error;
    }
  }

  public async strictJSONExecHandler(args: string[], errPrefix: string): Promise<JsonValue> {
    return await this.execHandler(args, errPrefix, true) as JsonValue;
  }

  public async lockedStrictJSONExecHandler(args: string[], errPrefix: string): Promise<JsonValue> {
    return await this.lockedExecHandler(args, errPrefix, true) as JsonValue;
  }

  public async getEnvironmentsFromConda(asJson: boolean): Promise<JsonValue> {
    const args = ['env', 'list'];
    if (asJson) args.push('--json');
    return await this.lockedStrictJSONExecHandler(args, 'Failed to list environments');
  }

  public async getExtendedEnvironmentInfo(environmentName: string): Promise<{name: string, prefix: string, channels: string[]}> {
    const args = ['env', 'export', '-n', environmentName, '--json'];
    const result = await this.lockedStrictJSONExecHandler(args, 'Failed to discover environments');
    const channels = Array.isArray(result.channels) ? result.channels as string[] : [];
    const prefix = typeof result.prefix === 'string' ? result.prefix : '';
    return {name: environmentName, prefix, channels};
  }
}
