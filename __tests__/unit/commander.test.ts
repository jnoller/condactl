/* eslint-disable no-unused-vars */

import { Commander, ShellCommandError } from '../../src/commander';
import * as shelljs from 'shelljs';
import * as shelljsExecProxy from 'shelljs-exec-proxy';
import os from 'os';
import * as process from 'process';

jest.mock('shelljs', () => {
  return {
    which: jest.fn(),
    config: {
      silent: false,
    }
  };
});

jest.mock('shelljs-exec-proxy', () => {
  return {
    exec: jest.fn(),
  };
});

jest.mock('os', () => {
  return {
    platform: jest.fn(),
  };
});

jest.mock('process', () => {
  return {
    env: {},
    on: jest.fn(),
  };
});

describe('Commander', () => {
  let commander: Commander;

  beforeEach(() => {
    commander = new Commander();
  });

  afterEach(() => {
    (shelljs.which as jest.Mock).mockClear();
    (shelljsExecProxy.exec as jest.Mock).mockClear();
    (os.platform as jest.Mock).mockClear();
    (process.on as jest.Mock).mockClear();
  });

  describe('validateCmd', () => {
    // tests
  });

  describe('exec', () => {
    // tests
  });

  describe('execAsync', () => {
    it('should return a promise that resolves with the result of the command', async () => {
      (shelljs.which as jest.Mock).mockReturnValueOnce('conda');
      // @ts-ignore
      (shelljsExecProxy.exec as jest.Mock).mockImplementationOnce((...args) => {
        return Promise.resolve({ code: 0, stdout: 'output', stderr: '' });
      });

      const result = await commander.execAsync('base', 'python', ['arg1', 'arg2']);
      expect(result).toEqual({ code: 0, stdout: 'output', stderr: '' });
    });

    it('should return a promise that rejects with a ShellCommandError if the command fails', async () => {
      (shelljs.which as jest.Mock).mockReturnValueOnce('conda');
      // @ts-ignore
      (shelljsExecProxy.exec as jest.Mock).mockImplementationOnce((...args) => {
        return Promise.reject({ code: 1, stdout: '', stderr: 'error' });
      });

      await expect(commander.execAsync('base', 'python', ['arg1', 'arg2'])).rejects.toThrow(ShellCommandError);
    });
  });
});
