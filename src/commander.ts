import shelljs, { ShellString } from 'shelljs';
import { Logger } from "winston";
import shescape from 'shescape';

/**
 * Class representing a command executor.
 */
export class Commander {
  private shell: string;
  private log?: Logger;

  /**
   * Create a new commander.
   * @param {string|null} shell - The shell to use for commands. Falls back to environment vars or "/bin/bash".
   * @param {Logger} log - A Winston logger instance.
   */
  constructor(shell?: string | null, log?: Logger) {
    this.shell = shell || process.env.SHELL || process.env.ComSpec || "/bin/bash";
    this.log = log;
  }

  /**
   * Sanitize a string by escaping shell-specific special characters.
   * @param {string} str - The string to sanitize.
   * @return {string} The sanitized string.
   */
  private sanitizeStr(str: string): string {
    this.log?.debug(`Sanitizing string: ${str}`);
    return shescape.quote(str);
  }

  /**
   * Sanitize an array of strings by escaping shell-specific special characters in each string.
   * @param {string[]} args - The array of strings to sanitize.
   * @return {string[]} The array of sanitized strings.
   */
  private sanitizeArray(args: string[] = []): string[] {
    this.log?.debug(`Sanitizing array: ${args}`);
    return shescape.quoteAll(args);
  }

  /**
   * Resolve a binary command in the given environment.
   * @param {string|null} environment - The environment where to look for the command.
   * @param {string} cmd - The command to resolve.
   * @return {string} The resolved command.
   * @throws Will throw an error if Conda/command is not installed or the command is not found in the environment.
   */
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

  /**
   * Build a shell command.
   * @param {string|null} environment - The environment where to run the command.
   * @param {string} cmd - The command to run.
   * @param {string[]} args - The arguments for the command.
   * @return {string} The full shell command.
   */
  private buildCommand(environment: string | null, cmd: string, args: string[] = []): string {
    const sanitizedEnv = environment ? this.sanitizeStr(environment) : null;
    const resolvedBin = this.resolveBin(sanitizedEnv, cmd);
    const finalCmd = `${resolvedBin} ${this.sanitizeArray(args).join(' ')}`;
    return finalCmd;
  }

  /**
   * Execute a shell command.
   * @param {string|null} environment - The environment where to run the command.
   * @param {string} cmd - The command to run.
   * @param {string[]} args - The arguments for the command.
   * @return {ShellString} The ShellString object representing the result of the command.
   * @throws Will throw a ShellCommandError if the command returns a non-zero exit code.
   */

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


/**
 * Class representing an error that occurs when executing a shell command.
 */
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
