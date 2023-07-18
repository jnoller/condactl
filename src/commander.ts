import shelljs, { ShellString } from 'shelljs';
import process from 'process';
import os from 'os';
import shelljsExecProxy from 'shelljs-exec-proxy';

/**
 * Commander class for executing shell commands.
 */
export class Commander {
  private shell: string;

  constructor() {
    if (os.platform() === 'win32') {
      this.shell = process.env.COMSPEC || "cmd";
    } else {
      this.shell = process.env.SHELL || "/bin/bash"; //todo: check if this works on macos / zsh as a fallback
    }
  }

  /**
   * Validates the command and environment.
   * @param environment - The conda environment.
   * @param cmd - The command to validate.
   * @throws {ShellCommandError} - If conda is not available or the command does not exist.
   */
  private validateCmd(environment: string, cmd: string): void {
    const condaCheck = shelljs.which('conda');
    if (!condaCheck) {
      throw new ShellCommandError(`Conda is not available in the current shell`, 1);
    }

    let finalCmd: string;
    if (environment) {
      finalCmd = `conda activate ${environment} && which ${cmd}`;
    } else {
      finalCmd = `which ${cmd}`;
    }

    const whichResult = shelljsExecProxy.exec(finalCmd, { shell: this.shell });

    if (whichResult.code !== 0) {
      const fallbackCmdResult = shelljs.which(cmd);
      if (!fallbackCmdResult && !this.isAbsolutePath(cmd)) {
        throw new ShellCommandError(`Command '${cmd}' does not exist in environment '${environment}'`, whichResult.code);
      }
    }
  }

  /**
   * Checks if the path is an absolute path.
   * @param path - The path to check.
   * @returns {boolean} - True if the path is an absolute path, false otherwise.
   */
  private isAbsolutePath(path: string): boolean {
    if (os.platform() === 'win32') {
      return /^[a-zA-Z]:\\/.test(path) || /^\\\\/.test(path);
    } else {
      return path.startsWith('/');
    }
  }

  /**
   * Executes a shell command asynchronously.
   * @param environment - The conda environment.
   * @param cmd - The command to execute.
   * @param args - The arguments for the command.
   * @param options - Additional options for the command.
   * @returns {Promise<ShellString>} - A promise that resolves with the result of the command.
   * @throws {ShellCommandError} - If the command fails.
   */
  public exec(
    environment: string,
    cmd: string,
    args: string[],
    options: {
      captureOutput?: boolean,
    } = {}
  ): Promise<ShellString> {
    return this.execAsync(environment, cmd, args, options);
  }

  /**
   * Executes a shell command asynchronously.
   * @param environment - The conda environment.
   * @param cmd - The command to execute.
   * @param args - The arguments for the command.
   * @param options - Additional options for the command.
   * @returns {Promise<ShellString>} - A promise that resolves with the result of the command.
   * @throws {ShellCommandError} - If the command fails.
   */
  public execAsync(
    environment: string,
    cmd: string,
    args: string[],
    options: {
      captureOutput?: boolean,
    } = {}
  ): Promise<ShellString> {
    this.validateCmd(environment, cmd);

    const command = this.buildCommand(environment, cmd, args);

    const originalSilent = shelljs.config.silent;
    if (!options.captureOutput) {
      shelljs.config.silent = true;
    }

    return new Promise<ShellString>((resolve, reject) => {
      const childProcess = shelljsExecProxy.exec(
        command,
        { async: true, shell: this.shell },
        (code, stdout, stderr) => {
          shelljs.config.silent = originalSilent;
          if (code !== 0) {
            reject(new ShellCommandError(`Command '${command}' failed: ${stderr}`, code));
          } else {
            resolve({ code, stdout, stderr } as ShellString);
          }
        }
      );

      const cleanup = () => {
        childProcess.kill();
      };

      process.on('exit', cleanup);
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
      process.on('uncaughtException', cleanup);
    });
  }

  /**
   * Builds the command to execute.
   * @param environment - The conda environment.
   * @param cmd - The command to execute.
   * @param args - The arguments for the command.
   * @returns {string} - The built command.
   */
  private buildCommand(environment: string, cmd: string, args: string[]): string {
    if (environment) {
      return `conda run -n ${environment} ${cmd} ${args.join(' ')}`;
    } else {
      return `${cmd} ${args.join(' ')}`;
    }
  }
}

/**
 * Custom error class for shell command errors.
 */
export class ShellCommandError extends Error {
  public code: number;

  constructor(message: string, code: number) {
    super(message);
    this.code = code;
    this.name = 'ShellCommandError';
  }
}
