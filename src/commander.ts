import shelljs, { ShellString } from 'shelljs';
import process from 'process';
import os from 'os';
import shelljsExecProxy from 'shelljs-exec-proxy';

export class Commander {
  private shell: string;

  constructor() {
    if (os.platform() === 'win32') {
      this.shell = process.env.COMSPEC || "";
    } else {
      this.shell = process.env.SHELL || "";
    }
  }

  /**
   * Validates the specified environment and command.
   * @param environment - The name of the environment.
   * @param cmd - The command to be validated.
   * @throws ShellCommandError if the environment does not exist or the command does not exist.
   */
  private validateCmd(environment: string, cmd: string): void {
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
   * Checks if the given path is an absolute path.
   * @param path - The path to check.
   * @returns True if the path is an absolute path, false otherwise.
   */
  private isAbsolutePath(path: string): boolean {
    if (os.platform() === 'win32') {
      return /^[a-zA-Z]:\\/.test(path) || /^\\\\/.test(path);
    } else {
      return path.startsWith('/');
    }
  }

  /**
   * Executes a command synchronously in the specified environment.
   * @param environment - The name of the environment.
   * @param cmd - The command to be executed.
   * @param args - The arguments to be passed to the command.
   * @param options - Additional options for the command execution.
   * @returns The standard output and standard error of the command.
   * @throws ShellCommandError if the command fails to execute.
   */
  public execSync(
    environment: string,
    cmd: string,
    args: string[],
    options: {
      captureOutput?: boolean,
    } = {}
  ): ShellString {
    this.validateCmd(environment, cmd);

    const command = this.buildCommand(environment, cmd, args);

    if (!options.captureOutput) {
      shelljs.config.silent = true;
    }
 av
    const result: ShellString = shelljsExecProxy.exec(command, { shell: this.shell });

    shelljs.config.silent = true;

    if (result.code !== 0) {
      throw new ShellCommandError(`Command failed: ${result.stderr}`, result.code);
    }

    return result;
  }

  /**
   * Executes a command asynchronously in the specified environment.
   * @param environment - The name of the environment.
   * @param cmd - The command to be executed.
   * @param args - The arguments to be passed to the command.
   * @param options - Additional options for the command execution.
   * @returns A Promise that resolves with the standard output and standard error of the command.
   * @throws ShellCommandError if the command fails to execute.
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

    if (!options.captureOutput) {
      shelljs.config.silent = true;
    }

    return new Promise<ShellString>((resolve, reject) => {
      const childProcess = shelljsExecProxy.exec(
        command,
        { async: true, shell: this.shell },
        (code, stdout, stderr) => {
          if (code !== 0) {
            reject(new ShellCommandError(`Command failed: ${stderr}`, code));
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
    });
  }

  /**
   * Builds the command to be executed.
   * @param environment - The name of the environment.
   * @param cmd - The command to be executed.
   * @param args - The arguments to be passed to the command.
   * @returns The constructed command.
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
