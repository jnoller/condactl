#!/usr/bin/env node

import { Command } from 'commander';
import { EnvironmentManager } from './EnvironmentManager';

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

// Add more commands for other methods in the EnvironmentManager class.
// Check ngn usage doc

program.parse(process.argv);
