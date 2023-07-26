#!/usr/bin/env node

import { Command } from 'commander';
import { EnvironmentManager } from './environmentManager';

const program = new Command();
const environmentManager = EnvironmentManager.getInstance();

program
  .version('0.0.1')
  .description('CLI for managing Conda environments');

program
  .command('discover')
  .description('Discover available environments')
  .action(async () => {
    console.log('Discovering environments...');
    try {
      const environments = await environmentManager.discoverEnvironments(true);
      console.log('Discovered environments:', environments);
    } catch (error) {
      console.error('Failed to discover environments:', error);
    }
  });

program
  .command('clean')
  .description('Clean all environments')
  .action(async () => {
    console.log('Cleaning all environments...');
    try {
      await environmentManager.cleanEnvironment();
      console.log('All environments cleaned.');
    } catch (error) {
      console.error('Failed to clean environments:', error);
    }
  });

program
  .command('create <name> [path]')
  .description('Create a new environment')
  .action(async (name, path) => {
    console.log(`Creating environment ${name}...`);
    try {
      await environmentManager.createEnvironment(name, path);
      console.log(`Environment ${name} created.`);
    } catch (error) {
      console.error(`Failed to create environment ${name}:`, error);
    }
  });

program
  .command('remove <nameOrPath>')
  .description('Remove an environment')
  .action(async (nameOrPath) => {
    console.log(`Removing environment ${nameOrPath}...`);
    try {
      await environmentManager.removeEnvironment(nameOrPath);
      console.log(`Environment ${nameOrPath} removed.`);
    } catch (error) {
      console.error(`Failed to remove environment ${nameOrPath}:`, error);
    }
  });

program
  .command('install <environment> <packageOrFile>')
  .description('Install a package in an environment')
  .action(async (environment, packageOrFile) => {
    console.log(`Installing package ${packageOrFile} in environment ${environment}...`);
    try {
      await environmentManager.installPackage(environment, packageOrFile);
      console.log(`Package ${packageOrFile} installed in environment ${environment}.`);
    } catch (error) {
      console.error(`Failed to install package ${packageOrFile} in environment ${environment}:`, error);
    }
  });

program
  .command('uninstall <environment> <packageName>')
  .description('Uninstall a package from an environment')
  .action(async (environment, packageName) => {
    console.log(`Uninstalling package ${packageName} from environment ${environment}...`);
    try {
      await environmentManager.uninstallPackage(environment, packageName);
      console.log(`Package ${packageName} uninstalled from environment ${environment}.`);
    } catch (error) {
      console.error(`Failed to uninstall package ${packageName} from environment ${environment}:`, error);
    }
  });

program
  .command('list-packages <name>')
  .description('List all packages in an environment')
  .action(async (name) => {
    console.log(`Listing packages in environment ${name}...`);
    try {
      const packages = await environmentManager.listPackages(name);
      console.log(`Packages in environment ${name}:`, packages);
    } catch (error) {
      console.error(`Failed to list packages in environment ${name}:`, error);
    }
  });

program
  .command('search <name>')
  .description('Search for a package')
  .action(async (name) => {
    console.log(`Searching for package ${name}...`);
    try {
      const result = await environmentManager.searchForPackage(name);
      console.log(`Search result for package ${name}:`, result);
    } catch (error) {
      console.error(`Failed to search for package ${name}:`, error);
    }
  });

program
  .command('version')
  .description('Get Conda version')
  .action(async () => {
    console.log('Getting Conda version...');
    try {
      const version = await environmentManager.getCondaVersion();
      console.log('Conda version:', version);
    } catch (error) {
      console.error('Failed to get Conda version:', error);
    }
  });

program
  .command('run <environment> <command>')
  .description('Run a command in a Conda environment')
  .action(async (environment, command) => {
    console.log(`Running command '${command}' in environment ${environment}...`);
    try {
      const result = await environmentManager.runCommand(environment, command);
      console.log(`Command result:`, result);
    } catch (error) {
      console.error(`Failed to run command '${command}' in environment ${environment}:`, error);
    }
  });

program.parse(process.argv);
