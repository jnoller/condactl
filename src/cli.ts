#!/usr/bin/env node
import { Command } from 'commander';
import { EnvironmentManager } from './environmentManager';
import { PackageManager } from './packageManager';
import { ScriptExecutor } from './scriptExecutor';

export class CLI {
    private environmentManager: EnvironmentManager;
    private packageManager: PackageManager;
    private scriptExecutor: ScriptExecutor;

    constructor() {
        this.environmentManager = new EnvironmentManager();
        this.packageManager = new PackageManager();
        this.scriptExecutor = new ScriptExecutor(this.environmentManager);
    }

    public registerCommands(): void {
        const program = new Command();

        program
            .command('environments')
            .description('List all Python virtual environments')
            .action(this.getEnvironments.bind(this));

        program
            .command('create <name> <manager>')
            .description('Create a new Python virtual environment')
            .action(this.createEnvironment.bind(this));

        program
            .command('remove <name> <manager>')
            .description('Remove a Python virtual environment')
            .action(this.removeEnvironment.bind(this));

        program
            .command('install <environment> <packageName> <manager>')
            .description('Install a package in a Python virtual environment')
            .action(this.installPackage.bind(this));

        program
            .command('uninstall <environment> <packageName> <manager>')
            .description('Uninstall a package from a Python virtual environment')
            .action(this.uninstallPackage.bind(this));

        program
            .command('start <environment> <command>')
            .description('Start a process in a Python virtual environment')
            .action(this.startProcess.bind(this));

        program
            .command('start-api <environment>')
            .description('Start the API server in a Python virtual environment')
            .action(this.startApiServer.bind(this));

        program.parse(process.argv);
    }

    private getEnvironments(): void {
        const environments = this.environmentManager.discoverEnvironments();
        console.log("List of Python virtual environments:");
        environments.forEach((environment) => {
            console.log(environment);
        });
    }

    private createEnvironment(environmentName: string, manager: string): void {
        this.environmentManager.createEnvironment(environmentName, manager);
        console.log(`Created virtual environment: ${environmentName}`);
    }

    private removeEnvironment(environmentName: string, manager: string): void {
        this.environmentManager.removeEnvironment(environmentName, manager);
        console.log(`Removed virtual environment: ${environmentName}`);
    }

    private installPackage(environmentName: string, packageName: string, manager: string): void {
        this.packageManager.installPackage(environmentName, packageName, manager);
        console.log(`Installed package '${packageName}' in environment: ${environmentName}`);
    }

    private uninstallPackage(environmentName: string, packageName: string, manager: string): void {
        this.packageManager.uninstallPackage(environmentName, packageName, manager);
        console.log(`Uninstalled package '${packageName}' from environment: ${environmentName}`);
    }

    private startProcess(environmentName: string, command: string): void {
        this.scriptExecutor.startProcess(environmentName, command);
    }

    private startApiServer(environmentName: string): void {
        const command = "python server.py";
        this.scriptExecutor.startProcess(environmentName, command);
    }
}

const cli = new CLI();
cli.registerCommands();
