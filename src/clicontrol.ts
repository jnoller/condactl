import shelljs, { ShellString } from 'shelljs';
import { Logger } from "winston";
import shescape from 'shescape';
import { DEFAULT_SHELL } from './config';



export class CLIControl {
  private shell: string;
  private log?: Logger;


  constructor(shell?: string | null, log?: Logger) {
    this.shell = shell || DEFAULT_SHELL;
    this.log = log;
  }

  private sanitizeStr(str: string): string {
    this.log?.debug(`Sanitizing string: ${str}`);
    return shescape.quote(str);
  }

  private sanitizeArray(args: string[] = []): string[] {
    this.log?.debug(`Sanitizing array: ${args}`);
    return shescape.quoteAll(args);
  }

  private resolveBin(environment: string | null, cmd: string): string {
    this.log?.debug(`Resolving binary: ${cmd}`);
    const resolvedConda = shelljs.which("conda");
    const cmdPath = shelljs.which(cmd);

    if (environment && resolvedConda && cmdPath) {
      return `${resolvedConda} activate ${environment} && ${cmdPath}`;
    }

    if (!environment && cmdPath) {
      return cmdPath;
    }

    throw new ShellCommandError(`Cannot load command environment: Conda/command is not available in the current shell or Command '${cmd}' not found in environment or Unsupported condition`, 1);
  }

  private buildCommand(environment: string | null, cmd: string, args: string[] = []): string {
    const sanitizedEnv = environment ? this.sanitizeStr(environment) : null;
    const resolvedBin = this.resolveBin(sanitizedEnv, cmd);
    const finalCmd = `${resolvedBin} ${this.sanitizeArray(args).join(' ')}`;
    return finalCmd;
  }

  public async exec(environment: string | null, cmd: string, args: string[] = []): Promise<ShellString> {
    const finalCmd = this.buildCommand(environment, cmd, args);
    this.log?.info(`Executing command: ${finalCmd}`);
    shelljs.config.verbose = this.log?.level === "debug";
    this.log?.debug(`shelljs configuration: ${JSON.stringify(shelljs.config)}`);

    return new Promise((resolve, reject) => {
      shelljs.exec(finalCmd, { async: true, shell: this.shell, silent: !shelljs.config.verbose }, (code, stdout, stderr) => {
        if (code !== 0) {
          reject(new ShellCommandError(stderr, code));
        } else {
          const shellString = new ShellString(stdout);
          shellString.stderr = stderr;
          shellString.code = code;
          resolve(shellString);
        }
      });
    });
  }
}


export class ShellCommandError extends Error {
  public code: number;

  /**
   * Create a new ShellCommandError.
   * @param {string} message - The error message.
   * @param {number} code - The command exit code.
   */
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
    this.name = 'ShellCommandError';
  }
}
