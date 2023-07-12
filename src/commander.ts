/**
 * The Commander class provides methods for executing commands in a specified environment.
 */
import shelljs, { ShellReturnValue } from 'shelljs';
import process from 'process';

export class Commander {

  /**
   * Validates the specified environment and command.
   * @param environment - The name of the environment.
   * @param cmd - The command to be validated.
   * @throws Error if the environment does not exist or the command does not exist.
   */
  private validateCmd(environment: string, cmd: string): void {

    // Activate the environment
    const activateCmd = `conda activate ${environment}`;
    const activateResult = shelljs.exec(activateCmd, { silent: true });
    if (activateResult.code !== 0) {
        throw new Error('Failed to activate environment');
    }

    // Check command existence
    const whichCmd = `conda activate ${environment} && which ${cmd}`;
    const whichResult = shelljs.exec(whichCmd, { silent: true });
    if (whichResult.code !== 0) {
        throw new Error('Command does not exist');
    }
  }

  /**
   * Executes a command synchronously in the specified environment.
   * @param environment - The name of the environment.
   * @param cmd - The command to be executed.
   * @param args - The arguments to be passed to the command.
   * @param options - Additional options for the command execution.
   * @returns The standard output and standard error of the command.
   * @throws Error if the command fails to execute.
   */
  public execSync(
    environment: string,
    cmd: string,
    args: string[],
    options: {
        captureOutput?: boolean,
        stdoutFile?: string,
        stderrFile?: string
    } = {}
  ): ShellReturnValue {
    this.validateCmd(environment, cmd);

    const command = `conda activate ${environment} && ${cmd} ${args.join(' ')}`;

    const result = shelljs.exec(command, { silent: true, ...options });

    if (result.code !== 0) {
        throw new Error(`Command failed: ${result.stderr}`);
    }

    return {
        code: result.code,
        stdout: options.captureOutput ? result.stdout : '',
        stderr: options.captureOutput ? '' : result.stderr,
    } as ShellReturnValue;
  }

  /**
   * Executes a command asynchronously in the specified environment.
   * @param environment - The name of the environment.
   * @param cmd - The command to be executed.
   * @param args - The arguments to be passed to the command.
   * @param options - Additional options for the command execution.
   * @returns A Promise that resolves with the standard output and standard error of the command.
   * @throws Error if the command fails to execute.
   */
  public execAsync(
    environment: string,
    cmd: string,
    args: string[],
    options: {
        captureOutput?: boolean,
        stdoutFile?: string,
        stderrFile?: string
    } = {}
  ): Promise<ShellReturnValue> {
    this.validateCmd(environment, cmd);

    const command = `conda activate ${environment} && ${cmd} ${args.join(' ')}`;

    return new Promise<ShellReturnValue>((resolve, reject) => {
        const childProcess = shelljs.exec(
            command,
            { async: true, silent: true, ...options },
            (code, stdout, stderr) => {
                if (code !== 0) {
                    reject(new Error(`Command failed: ${stderr}`));
                } else {
                    resolve({
                        code,
                        stdout: options.captureOutput ? stdout : '',
                        stderr: options.captureOutput ? '' : stderr,
                    } as ShellReturnValue);
                }
            }
        );

        process.on('exit', () => {
            childProcess.kill();
        });
    });
  }
}
