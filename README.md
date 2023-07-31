# Conda Control (condactl)

Conda Control (condactl) is a Node/TypeScript package that provides a consistent interface for managing conda environments. It's designed to be easily integrated into projects that need to work with and manage conda environments. Conda Control can also be run in HTTP API and CLI modes, providing the same commands, arguments, and structure across all modes.

Installation
To install Conda Control, follow these steps:

Clone the repository from https://github.com/jnoller/condactl
Run yarn build to build the project
Run yarn install to install the project, or yarn link to link it for development
Usage
The main class in Conda Control is EnvironmentManager. This class provides methods for managing conda environments, such as creating, deleting, and updating environments, installing and uninstalling packages, and more.

Here's an example of how to use the EnvironmentManager class inside of your application:

import { EnvironmentManager } from 'condactl';

const manager = EnvironmentManager.getInstance();

// Create a new environment
await manager.createEnvironment('myenv');

// Install a package
await manager.installPackage('myenv', 'numpy');

// List packages in the environment
const packages = await manager.listPackages('myenv');
console.log(packages);

// Delete the environment
await manager.deleteEnvironment('myenv');

The same command structure and inteface is also exposed when running condactl in cli mode:

```
> yarn build && yarn link
yarn run v1.22.19
$ tsc -p tsconfig.json && yarn postinstall
$ chmod +x ./dist/tsc/cli.js
✨  Done in 0.94s.
yarn link v1.22.19
success Registered "condactl".
info You can now run `yarn link "condactl"` in the projects where you want to use this package and it will be used instead.
✨  Done in 0.02s.
> condactl discover
Discovering environments...
...
Discovered environments: [
  '/opt/homebrew/anaconda3',
  '/opt/homebrew/anaconda3/envs/bacon',
  '/opt/homebrew/anaconda3/envs/epoc',
  '/opt/homebrew/anaconda3/envs/huggingf'
]
```



### Electron-IPC example
For electron usage, expose a back-end IPC service in your `main` directory (usually preload.js) like the following:
```
const { ipcMain } = require('electron');
const { EnvironmentManager } = require('./path-to-environment-manager');

const envManager = new EnvironmentManager();

// Listen for a 'createEnvironment' message from the renderer process (front-end)
ipcMain.handle('createEnvironment', async (event, name) => {
  try {
    await envManager.createEnvironment(name);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Similarly, you can expose other methods of the EnvironmentManager
ipcMain.handle('deleteEnvironment', async (event, name) => {
  try {
    await envManager.deleteEnvironment(name);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// And so on for other methods...
```
And in the renderer process / `renderer` directory, you can send / recieve messages to the main process:

```
const { ipcRenderer } = require('electron');

async function createEnvironment(name) {
  const result = await ipcRenderer.invoke('createEnvironment', name);
  if (result.success) {
    console.log('Environment created successfully');
  } else {
    console.error('Failed to create environment:', result.error);
  }
}
```

As environment manager and the other condactl functionality is designed for composability it omits more complex buisness or application dependent logic. For example an application may want to support a `migrate` operation. It may require a clean, rename or other operations as well as maybe custom cloud/disk/whatever code. Your `migrate` operation might look like this:

```
public migrate() {
  confirm the operation
  use condactl to lock and clean the environment
  $your custom compression/cross-machine logic
  use condactl to confirm/compare the migration
}
```

## Environment Manager

The `EnvironmentManager` class in condactl provides the following methods for managing conda environments:

- `createEnvironment(name: string): Promise<void>`: Creates a new environment with the given name.
- `deleteEnvironment(name: string): Promise<void>`: Deletes the environment with the given name.
- `updateEnvironment(name: string, args: string[]): Promise<void>`: Updates the environment with the given name using the provided arguments.
- `installPackage(environment: string, packageName: string): Promise<void>`: Installs the specified package in the given environment.
- `uninstallPackage(environment: string, packageName: string): Promise<void>`: Uninstalls the specified package from the given environment.
- `listPackages(name: string): Promise<string>`: Lists all packages in the environment with the given name.
- `searchForPackage(name: string): Promise<string>`: Searches for a package with the given name.
- `getCondaVersion(): Promise<string>`: Returns the version of conda being used.
- `runCommand(environment: string | null, command: string): Promise<string>`: Runs a command in the specified environment.
- `renameEnvironment(oldName: string, newName: string): Promise<void>`: Renames an environment.
- `environmentDetails(name: string): Promise<string>`: Returns details about the specified environment.
- `environmentConfig(name: string, value?: string): Promise<void>`: Configures the specified environment.
- `compareEnvironments(env1: string, env2: string): Promise<string>`: Compares two environments.
- `cleanEnvironment(name: string): Promise<void>`: Cleans the specified environment.
- `discoverEnvironments(forceRefresh = true): Promise<string[]>`: Discovers all environments, with an option to force a refresh.
- `listEnvironments(name: string): Promise<void>`: Lists all environments.

These methods can be used to perform a wide range of tasks, from basic environment management to package installation and configuration.

## Registry Manager & Caching

The `RegistryManager` class in condactl provides functionality for managing a registry of conda environments. This registry is stored in a JSON file and can be used to cache information about environments, improving the performance of operations that need to access this information.

Methods provided by the `RegistryManager` class:

- `init(): Promise<void>`: Initializes the registry. If the registry file does not exist, it is created.
- `loadRegistry(): Promise<void>`: Loads the registry from the registry file.
- `saveRegistry(): Promise<void>`: Saves the current state of the registry to the registry file.
- `purgeRegistry(): Promise<void>`: Deletes the registry file and resets the registry.
- `isRegistryCreated(): Promise<boolean>`: Checks if the registry file exists.
- `getEnvironments(): { [key: string]: boolean }`: Returns the current state of the registry.
- `addEnvironment(environment: string): Promise<void>`: Adds an environment to the registry.
- `removeEnvironment(environment: string): Promise<void>`: Removes an environment from the registry.

The registry is stored in a file located at `~/.condactl/registry.json` by default, but a different location can be specified when creating a `RegistryManager` instance.

## Commander

Commander is the foundation of condactl, providing the ability to execute shell commands cleanly.

Methods provided by the `Commander` class:

- `sanitizeStr(str: string): string`: Sanitizes a string to make it safe to use in a shell command.
- `sanitizeArray(args: string[]): string[]`: Sanitizes an array of strings to make them safe to use in a shell command.
- `resolveBin(environment: string | null, cmd: string): string`: Resolves the path to a command binary. If an
  environment is specified, the command is resolved in that environment.
- `buildCommand(environment: string | null, cmd: string, args: string[]): string`: Builds a shell command to execute.
  If an environment is specified, the command is run in that environment.
- `exec(environment: string | null, cmd: string, args: string[]): Promise<ShellString>`: Executes a shell command. If
  an environment is specified, the command is run in that environment. The returned `ShellString` object contains the
  output of the command (`stdout`), any error message (`stderr`), and the exit code (`code`).

The `Commander` class also includes a `ShellCommandError` class, which is used to represent errors that occur when
executing shell commands.

The `Commander` class uses the `shelljs` package to execute commands, and the `shescape` package to sanitize command
arguments. This ensures that commands are executed safely and correctly, regardless of the platform or shell being used.

## Complete/Outstanding functionality

* :white_check_mark: Environment discovery / `condactl discover`
* :white_check_mark: Create environment / `condactl create $name`
* :white_check_mark: Delete Environment / `condactl delete $name`
* :white_check_mark: Environment list caching/update logic
* :white_check_mark: Command and argument escape/quoting
* :white_check_mark: CLI mode (`yarn link && condactl`)
* :white_check_mark: Centralized logger / winston configuration
* :white_check_mark: Operation locking per-environment
* :white_check_mark: Return Shelljs `ShellString` types from exec() for string/grep/cat methods

TODO:

* Rename filename to match typescript standards
* Update tests to latest changes
* Compare and other environmentManager methods
* runCommand/run inside of activate environment for command
* Large operation (list) caching
* Environment variable or configuration file support (eg logging, registry location)
* A fully-async exec() that passes the ChildProcess object back from shelljs
* Enforcing --json on all commands


## Tests

To run the Jest tests, use the command `yarn test`. The tests are located in the `__tests__` directory.

## License

condactl is distributed under the BSD 3-Clause License.
