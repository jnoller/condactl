#!/usr/bin/env node

import { Command } from 'commander';
import { EnvironmentManager } from './environmentManager';
import createLogger from './logging';
//import { LOG_LEVEL } from './config';

const program = new Command();
const logger = createLogger('DEBUG');
const manager = EnvironmentManager.getInstance();

function terminateProgram(){
  process.exit(0);
}

program
  .command('create <name>')
  .description('create a new environment')
  .action(async (name) => {
    try {
      const environment = await manager.createEnvironment(name);
      logger.info(`Created environment: ${JSON.stringify(environment)}`);
    } catch (error) {
      logger.error(`Failed to create environment: ${error}`);
    }
    terminateProgram();
  });


program
  .command('discoverEnvironments')
  .option('-f, --force', 'force refresh')
  .action(async (options) => {
    const result = await manager.discoverEnvironments(options.force);
    logger.info(`Environments discovery was successful: ${result}`);
    terminateProgram();
  });

program
  .command('renameEnvironment')
  .argument('<oldName>', 'name of the environment to rename')
  .argument('<newName>', 'new name for the environment')
  .option('[dryRun]', 'perform a dry run', false)
  .description('rename an existing environment')
  .action(async (oldName, newName, options) => {
    const dryRun = options['dryRun'] || false;
    try {
      const newEnvironment = await manager.renameEnvironment(oldName, newName, dryRun);
      logger.info(`Renamed environment: ${JSON.stringify(newEnvironment)}`);
    } catch (error) {
      logger.error(`Failed to rename environment: ${error}`);
    }
    terminateProgram();
  });

  program
  .command('removeEnvironment <name>')
  .option('--json', 'Output as JSON')
  .action(async (name, cmd) => {
    try {
      const result = await manager.removeEnvironment(name, cmd.json);
      logger.info(`Removed environment: ${JSON.stringify(result)}`);
    } catch (error) {
      logger.error(`Failed to remove environment: ${error}`);
    }
    terminateProgram();
  });
/*
program
  .command('listEnvironments')
  .option('-f, --forceRefresh', 'Force Refresh', false)
  .option('--json', 'Output as JSON')
  .action(async (cmd) => {
    const environments = await manager.listEnvironments(cmd.forceRefresh, cmd.json);
    logger.info(`List of environments: ${JSON.stringify(environments)}`);
    terminateProgram();
  });
*/

program
  .command('listEnvironments')
  .action(async () => {
    const environments = await manager.listEnvironments();
    logger.info(`List of environments: ${JSON.stringify(environments)}`);
    terminateProgram();
  });

program
  .command('listPackages <environment>')
  .option('-f, --forceRefresh', 'Force Refresh', false)
  .option('--json', 'Output as JSON')
  .action(async (environment, cmd) => {
    const packages = await manager.listPackages(environment, cmd.json, cmd.forceRefresh);
    logger.info(`List of packages in environment: ${JSON.stringify(packages)}`);
    terminateProgram();
  });

program
  .command('updateEnvironmentPackages <name>')
  .option('--json', 'Output as JSON')
  .action(async (name, cmd) => {
    const packages = await manager.updateEnvironmentPackages(name, cmd.json);
    logger.info(`Updated environment packages: ${JSON.stringify(packages)}`);
    terminateProgram();
  });

program
  .command('installPackage <environment> <name>')
  .option('-v, --version [version]', 'Package Version')
  .option('--json', 'Output as JSON')
  .action(async (environment, name, cmd) => {
    const result = await manager.installPackage(environment, name, cmd.json, cmd.version);
    logger.info(`Installed package: ${JSON.stringify(result)}`);
    terminateProgram();
  });

program
  .command('uninstallPackage <environment> <name>')
  .option('--json', 'Output as JSON')
  .action(async (environment, name, cmd) => {
    const result = await manager.uninstallPackage(environment, name, cmd.json);
    logger.info(`Removed package: ${JSON.stringify(result)}`);
    terminateProgram();
  });

program
  .command('updatePackage <environment> <name>')
  .option('--json', 'Output as JSON')
  .action(async (environment, name, cmd) => {
    const result = await manager.updatePackage(environment, name, cmd.json);
    logger.info(`Updated package: ${JSON.stringify(result)}`);
    terminateProgram();
  });


  program
  .command('searchForPackage <name> [args]')
  .allowUnknownOption()
  .option('--json', 'Output as JSON')
  .action(async (name, cmd) => {
    const args = cmd.args.slice(1);
    const result = await manager.searchForPackage(name, cmd.json, args);
    logger.info(`Search Results: ${JSON.stringify(result)}`);
    terminateProgram();
  });

program
  .command('exportEnvironment <name>')
  .option('--json', 'Output as JSON')
  .action(async (name, cmd) => {
    const result = await manager.exportEnvironment(name, cmd.json);
    logger.info(`Environment export: ${JSON.stringify(result)}`);
    terminateProgram();
  });

program
  .command('getCondaVersion')
  .option('--json', 'Output as JSON')
  .action(async (cmd) => {
    const version = await manager.getCondaVersion(cmd.json);
    logger.info(`Conda version: ${JSON.stringify(version)}`);
    terminateProgram();
  });

program
  .command('condaInfo [args]')
  .allowUnknownOption()
  .option('--json', 'Output as JSON')
  .action(async (cmd) => {
    const args = cmd.args;
    const info = await manager.condaInfo(cmd.json, args);
    logger.info(`Conda Info: ${JSON.stringify(info)}`);
    terminateProgram();
  });

program
  .command('runCommand <environment> <command>')
  .action(async (environment, command) => {
    try {
      const result = await manager.runCommand(environment, command);
      logger.info(`Command Output: ${result}`);
    } catch (error) {
      logger.error(`Failed to run command: ${error}`);
    }
    terminateProgram();
  });

  program.command('*', { noHelp: true }).action(() => {
    program.outputHelp();
    terminateProgram();
  });

  program.parse(process.argv);
