import { Commander, ShellCommandError } from '../../src/commander';
import { ChildProcess } from 'child_process';
import { Readable, Writable } from 'stream';
import shelljs from 'shelljs';

const mockShellString = {
  code: 0,
  stdout: 'conda',
  stderr: ''
} as shelljs.ShellString;

const mockStdin = new Writable();
jest.spyOn(mockStdin, 'write');
jest.spyOn(mockStdin, 'end');

const mockChildProcess = {
  stdin: mockStdin,
  stdout: new Readable(),
  stderr: new Readable(),
  on: jest.fn((event, callback) => {
    if (event === 'exit') {
      callback(0);
    }
    return mockChildProcess;
  }),
  kill: jest.fn(),
} as unknown as ChildProcess;

jest.mock('shelljs', () => {
  const actualShelljs = jest.requireActual('shelljs');
  return {
    ...actualShelljs,
    config: {
      silent: false,
    },
    which: jest.fn(),
    exec: jest.fn(),
  };
});

jest.mock('shelljs-exec-proxy', () => {
  const actualShelljsExecProxy = jest.requireActual('shelljs-exec-proxy');
  return {
    ...actualShelljsExecProxy,
    // @ts-ignore
    exec: jest.fn().mockImplementation((command, options, callback) => {
      callback(0, 'output', '');
      return Promise.resolve(mockChildProcess);
    }),
  };
});

describe('Commander', () => {
  let commander: Commander;

  beforeEach(() => {
    commander = new Commander();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCmd', () => {
    it('should throw an error if conda is not available', () => {
      jest.requireMock('shelljs').which.mockReturnValueOnce(null);

      expect(() => {
        commander.validateCmd('env', 'cmd');
      }).toThrowError(ShellCommandError);
      expect(jest.requireMock('shelljs').which).toHaveBeenCalledWith('conda');
    });

    it('should validate command exists in the environment', async () => {
      jest.requireMock('shelljs').which.mockReturnValueOnce(mockShellString);

      await commander.validateCmd('env', 'cmd');

      expect(jest.requireMock('shelljs-exec-proxy').exec).toHaveBeenCalledWith('conda activate env && which cmd', expect.any(Object), expect.any(Function));
    });

    it('should validate command exists in the environment', async () => {
      jest.requireMock('shelljs').which.mockReturnValueOnce(mockShellString);

      await commander.validateCmd('env', 'cmd');

      expect(jest.requireMock('shelljs').which).toHaveBeenCalledWith('cmd');
    });
  });

  describe('exec', () => {
    it('should call execAsync', async () => {
      const execAsyncSpy = jest.spyOn(commander, 'execAsync');

      await commander.exec('env', 'cmd', ['arg1']);

      expect(execAsyncSpy).toHaveBeenCalledWith('env', 'cmd', ['arg1'], {});
    });
  });

  describe('execAsync', () => {
    it('should return a promise that resolves with the result of the command', async () => {
      jest.requireMock('shelljs').which.mockReturnValueOnce(mockShellString);

      const result = await commander.execAsync('', 'ls', []);

      expect(result).toEqual(mockChildProcess);
    });
  });
});
