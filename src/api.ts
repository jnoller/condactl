import express, { Request, Response } from 'express';
import { EnvironmentManager } from './environmentManager';
import { PackageManager } from './packageManager';
import { ScriptExecutor } from './scriptExecutor';

export class API {
    private environmentManager: EnvironmentManager;
    private packageManager: PackageManager;
    private scriptExecutor: ScriptExecutor;

    constructor() {
        this.environmentManager = new EnvironmentManager();
        this.packageManager = new PackageManager();
        this.scriptExecutor = new ScriptExecutor(this.environmentManager); // Pass environmentManager as an argument
    }

    public registerRoutes(app: express.Application): void {
        app.get('/environments', this.getEnvironments.bind(this));
        app.post('/environments', this.createEnvironment.bind(this));
        app.delete('/environments/:name', this.removeEnvironment.bind(this));
        app.post('/packages/install', this.installPackage.bind(this));
        app.post('/packages/uninstall', this.uninstallPackage.bind(this));
        app.get('/packages', this.listPackages.bind(this));
        app.post('/scripts/startProcess', this.startProcess.bind(this)); // Changed route to /scripts/startProcess
    }

    private getEnvironments(res: Response): void {
        const environments = this.environmentManager.discoverEnvironments();
        res.json(environments);
    }

    private createEnvironment(req: Request, res: Response): void {
        const { name, manager } = req.body;
        this.environmentManager.createEnvironment(name, manager);
        res.sendStatus(201);
    }

    private removeEnvironment(req: Request, res: Response): void {
        const { name, manager } = req.params;
        this.environmentManager.removeEnvironment(name, manager);
        res.sendStatus(204);
    }

    private installPackage(req: Request, res: Response): void {
        const { environment, packageName, manager } = req.body;
        this.packageManager.installPackage(environment, packageName, manager);
        res.sendStatus(201);
    }

    private uninstallPackage(req: Request, res: Response): void {
        const { environment, packageName, manager } = req.body;
        this.packageManager.uninstallPackage(environment, packageName, manager);
        res.sendStatus(204);
    }

    private listPackages(req: Request, res: Response): void {
        const environment = req.query.environment as string;
        const manager = req.query.manager as string;
        const packages = this.packageManager.listPackages(environment, manager);
        res.json(packages);
    }

    private startProcess(req: Request, res: Response): void {
      const { environment, command } = req.body;
      this.scriptExecutor.startProcess(environment, command);
      res.sendStatus(200);
  }
}
