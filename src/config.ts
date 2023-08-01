import dotenv from 'dotenv';
import os from 'os';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

const defaultRootPath = path.join(os.homedir(), '.condactl');
const defaultShell = process.env.SHELL || process.env.ComSpec || "/bin/bash";

export const CONDA_COMMAND = process.env.CONDA_COMMAND || 'conda';
export const ENABLE_LOGGING = true;
export const LOG_LEVEL = process.env.LOG_LEVEL || 'debug';
export const REGISTRY_PATH = process.env.REGISTRY_PATH || path.join(defaultRootPath, 'registry');
export const LOG_DIRECTORY = process.env.LOG_DIRECTORY || path.join(defaultRootPath, 'logs');
export const DEFAULT_SHELL = defaultShell;

