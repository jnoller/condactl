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
    const environments = await environmentManager.discoverEnvironments();
    console.log(environments);
  });

program
  .command('create <name>')
  .description('Create a new environment')
  .action(async (name) => {
    await environmentManager.createEnvironment(name);
    console.log(`Environment ${name} created.`);
  });

program
  .command('clean <name>')
  .description('Clean an environment')
  .action(async (name) => {
    await environmentManager.cleanEnvironment(name);
    console.log(`Environment ${name} cleaned.`);
  });

program
  .command('compare <env1> <env2>')
  .description('Compare two environments')
  .action(async (env1, env2) => {
    const comparison = await environmentManager.compareEnvironments(env1, env2);
    console.log(comparison);
  });

program
  .command('config <name> [value]')
  .description('Configure an environment')
  .action(async (name, value) => {
    await environmentManager.environmentConfig(name, value);
    console.log(`Environment ${name} configured.`);
  });

// Add more commands for other methods in the EnvironmentManager class.
// Check ngn usage doc

program.parse(process.argv);
