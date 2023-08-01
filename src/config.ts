import dotenv from 'dotenv';
import os from 'os';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env file
dotenv.config();

const defaultRootPath = path.join(os.homedir(), '.condactl');
const defaultShell = process.env.SHELL || process.env.ComSpec || "/bin/bash";

// If FULL_DEBUG is true, we enable blocked-at support, shelljs verbose mode and debug level logging
export const FULL_DEBUG = process.env.FULL_DEBUG || false;
// BLOCK_TIME - The time in milliseconds to wait for a call to finish in the event loop before throwing an error. Only takes effect in FULL_DEBUG.
export const BLOCK_TIME = Number(process.env.BLOCK_TIME) || 10000;
if (FULL_DEBUG === 'true') {
  process.env.SHELLJS_VERBOSE = 'true';
  process.env.LOG_LEVEL = 'debug';
  process.env.ENABLE_LOGGING = 'true';

  // Check if blocked-at is installed
  if (fs.existsSync('node_modules/blocked-at')) {
    import('blocked-at').then(blocked => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      blocked.default((time: number, stack: any) => {
        console.debug(`Event loop blocked for ${time}ms, operation started here:`, stack);
      }, { threshold: BLOCK_TIME });
    }).catch(err => {
      console.warn('Failed to load blocked-at module:', err);
    });
  }
}
export const ENABLE_LOGGING = process.env.ENABLE_LOGGING || true;
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

export const CONDA_COMMAND = process.env.CONDA_COMMAND || 'conda';
export const REGISTRY_PATH = process.env.REGISTRY_PATH || path.join(defaultRootPath, 'registry');
export const LOG_DIRECTORY = process.env.LOG_DIRECTORY || path.join(defaultRootPath, 'logs');
export const DEFAULT_SHELL = defaultShell;
