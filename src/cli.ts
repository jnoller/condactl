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
  .command('create <name>')
  .description('Create a new environment')
  .action(async (name) => {
    console.log(`Creating environment ${name}...`);
    try {
      await environmentManager.createEnvironment(name);
      console.log(`Environment ${name} created.`);
    } catch (error) {
      console.error(`Failed to create environment ${name}:`, error);
    }
  });

program
  .command('clean <name>')
  .description('Clean an environment')
  .action(async (name) => {
    console.log(`Cleaning environment ${name}...`);
    try {
      await environmentManager.cleanEnvironment(name);
      console.log(`Environment ${name} cleaned.`);
    } catch (error) {
      console.error(`Failed to clean environment ${name}:`, error);
    }
  });

program
  .command('compare <env1> <env2>')
  .description('Compare two environments')
  .action(async (env1, env2) => {
    console.log(`Comparing environments ${env1} and ${env2}...`);
    try {
      const comparison = await environmentManager.compareEnvironments(env1, env2);
      console.log(comparison);
    } catch (error) {
      console.error(`Failed to compare environments ${env1} and ${env2}:`, error);
    }
  });

program
  .command('config <name> [value]')
  .description('Configure an environment')
  .action(async (name, value) => {
    console.log(`Configuring environment ${name}...`);
    try {
      await environmentManager.environmentConfig(name, value);
      console.log(`Environment ${name} configured.`);
    } catch (error) {
      console.error(`Failed to configure environment ${name}:`, error);
    }
  });

program
  .command('details <name>')
  .description('Get details of an environment')
  .action(async (name) => {
    console.log(`Getting details for environment ${name}...`);
    try {
      const details = await environmentManager.environmentDetails(name);
      console.log(`Details for environment ${name}:`, details);
    } catch (error) {
      console.error(`Failed to get details for environment ${name}:`, error);
    }
  });

program
  .command('rename <oldName> <newName>')
  .description('Rename an environment')
  .action(async (oldName, newName) => {
    console.log(`Renaming environment ${oldName} to ${newName}...`);
    try {
      await environmentManager.renameEnvironment(oldName, newName);
      console.log(`Environment ${oldName} renamed to ${newName}.`);
    } catch (error) {
      console.error(`Failed to rename environment ${oldName} to ${newName}:`, error);
    }
  });

program
  .command('update <name> [args...]')
  .description('Update an environment')
  .action(async (name, args) => {
    console.log(`Updating environment ${name}...`);
    try {
      await environmentManager.updateEnvironment(name, args);
      console.log(`Environment ${name} updated.`);
    } catch (error) {
      console.error(`Failed to update environment ${name}:`, error);
    }
  });

program
  .command('delete <name>')
  .description('Delete an environment')
  .action(async (name) => {
    console.log(`Deleting environment ${name}...`);
    try {
      await environmentManager.deleteEnvironment(name);
      console.log(`Environment ${name} deleted.`);
    } catch (error) {
      console.error(`Failed to delete environment ${name}:`, error);
    }
  });

program
  .command('install <environment> <packageName>')
  .description('Install a package in an environment')
  .action(async (environment, packageName) => {
    console.log(`Installing package ${packageName} in environment ${environment}...`);
    try {
      await environmentManager.installPackage(environment, packageName);
      console.log(`Package ${packageName} installed in environment ${environment}.`);
    } catch (error) {
      console.error(`Failed to install package ${packageName} in environment ${environment}:`, error);
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
