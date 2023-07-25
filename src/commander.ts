import process from 'process';
import os from 'os';
import shelljs from 'shelljs';
import { Logger } from "winston";
import { ShellString } from 'shelljs';
import shescape from 'shescape';

/**
 * Commander class for executing shell commands.
 */
export class Commander {
  private shell: string;
  private log?: Logger;

  constructor(log?: Logger) {
    if (os.platform() === 'win32') {
      this.shell = process.env.COMSPEC || "cmd";
    } else {
      this.shell = process.env.SHELL || "/bin/bash"; //todo: check if this works on macos / zsh as a fallback or let shelljs handle fallback
    }
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
    let finalcmd = cmd;
    if (environment && !shelljs.which('conda')) {
      throw new ShellCommandError(`Cannot load command environment: Conda is not available in the current shell or $PATH`, 1);
    } else if (!environment && !shelljs.which(cmd)) {
      throw new ShellCommandError(`Command '${cmd}' does not exist in the current environment, shell, or $PATH`, 1);
    } else if (environment) {
      finalcmd = `conda activate ${environment} && ${cmd}`;
    } else {
      finalcmd = shelljs.which(cmd)?.toString() || cmd;
    }
    this.log?.debug(`Resolved to: ${finalcmd}`);
    return finalcmd;
  }

  private buildCommand(environment: string | null, cmd: string, args: string[] = []): string {
    let sanitizedEnv: string | null;
    if (environment) {
      sanitizedEnv = environment ? this.sanitizeStr(environment) ?? null : null;
    } else {
      sanitizedEnv = null;
    }
    const sanitizedCmd = this.sanitizeStr(cmd);
    const resolvedBin = this.resolveBin(sanitizedEnv, sanitizedCmd);
    const sanitizedArgs = this.sanitizeArray(args);
    const finalCmd = `${resolvedBin} ${sanitizedArgs.join(' ')}`;
    return finalCmd;
  }

  public exec(
    environment: string | null,
    cmd: string,
    args: string[] = []
    ): Promise<ShellString> {
    const silent = Boolean (this.log?.level === "debug");
    const finalCmd = this.buildCommand(environment, cmd, args);
    this.log?.info(`Executing command: ${finalCmd}`);
    if (this.log?.level === "debug") {
      shelljs.config.verbose = true;
    } else {
      shelljs.config.verbose = false;
    }
    this.log?.debug(`shelljs configuration: ${JSON.stringify(shelljs.config)}`);
    return new Promise((resolve, reject) => {
      const shelljsExecResult = shelljs.exec(finalCmd, { shell: this.shell, async: false, silent: silent });
      if (shelljsExecResult.code !== 0) {
        reject(shelljsExecResult);
      } else {
        resolve(shelljsExecResult);
      }
    });
  }
}

export class ShellCommandError extends Error {
  public code: number;

  constructor(message: string, code: number) {
    super(message);
    this.code = code;
    this.name = 'ShellCommandError';
  }
}
