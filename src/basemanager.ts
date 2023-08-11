import { CLIControl, ShellCommandError } from './clicontrol';
import { Logger } from 'winston';
import { CONDA_COMMAND, REGISTRY_PATH } from './config';
import { RegistryManager } from './registry';
import { ShellString } from 'shelljs';

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

  protected safeJSONParse(data: string): object {
    try {
      return JSON.parse(data);
    } catch (error) {
      this.log?.error(`Invalid JSON response: ${error}`);
      throw error;
    }
  }

  protected async execHandler(args: string[], errPrefix: string, asJson = true, withLock = false, key: string | null = null): Promise<string | object> {
    if (asJson) args.push('--json');

    try {
      const result = withLock
        ? await this.executeWithLock(key, args, this.execCommand)
        : await this.execCommand(args);
      return asJson ? this.safeJSONParse(result) : result;
    } catch (error) {
      this.log?.error(`${errPrefix}: ${error}`);
      throw error;
    }
  }
}
