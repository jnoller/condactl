
import shelljs from 'shelljs';
import * as shelljsExecProxy from 'shelljs-exec-proxy';

const mockShellString = {
  code: 0,
  stdout: 'conda',
  stderr: ''
} as shelljs.ShellString;

const mockChildProcess = {
  kill: jest.fn(),
};

jest.mock('shelljs', () => {
  return {
    config: {
      silent: false,
    },
    which: jest.fn(),
    exec: jest.fn(),
  };
});

const mockShelljs = jest.mocked(shelljs, true);

jest.mock('shelljs-exec-proxy', () => {
  return {
    exec: jest.fn().mockImplementation((command, options, callback) => {
      callback(0, 'output', 'error');
      return mockChildProcess;
    }),
  };
});

const mockShelljsExecProxy = jest.mocked(shelljsExecProxy, true);

mockShelljs.which.mockReturnValue(mockShellString);

export {
  mockShelljs,
  mockShellString,
  mockShelljsExecProxy
};
