import fs from 'fs-extra';
import { Logger } from "winston";
import { REGISTRY_PATH } from './config';

export class RegistryManager {
  public registryPath: string;
  public log: Logger | undefined;
  private registry: { [key: string]: boolean };

  constructor(registryPath?: string, log?: Logger) {
    this.registryPath = registryPath ?? REGISTRY_PATH;
    this.registry = {};
    this.log = log;
  }

  public async init(): Promise<void> {
    try {
      await fs.access(this.registryPath);
      this.log?.info(`Registry file exists: ${this.registryPath}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await this.saveRegistry();
        this.log?.info(`No registry file, creating: ${this.registryPath}`);
      } else {
        throw error;
      }
    }

    await this.loadRegistry();
  }

  private async loadRegistry(): Promise<void> {
    const registryData = await fs.readFile(this.registryPath, 'utf-8');
    this.registry = JSON.parse(registryData);
  }

  private async saveRegistry(): Promise<void> {
    try {
      const registryData = JSON.stringify(this.registry, null, 2);
      await fs.outputFile(this.registryPath, registryData, 'utf-8');
      this.log?.debug(`Registry file saved to: ${this.registryPath}`);
    } catch (error) {
      console.error('Failed to write registry file:', error);
      throw error;
    }
  }

  public async purgeRegistry(): Promise<void> {
    try {
      await fs.remove(this.registryPath);
      this.log?.debug(`Registry file removed: ${this.registryPath}`);
      this.registry = {};
      this.log?.info(`Registry file reset`);
    } catch (error) {
      console.error('Failed to remove registry file:', error);
      throw error;
    }
  }

  public async isRegistryCreated(): Promise<boolean> {
    try {
      await fs.access(this.registryPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  public getEnvironments(): { [key: string]: boolean } {
    return this.registry;
  }

  public async addEnvironment(environment: string): Promise<void> {
    this.registry[environment] = true;
    await this.saveRegistry();
    this.log?.info(`Environment added to registry: ${environment}`);
  }

  public async removeEnvironment(environment: string): Promise<void> {
    delete this.registry[environment];
    await this.saveRegistry();
    this.log?.info(`Environment removed from registry: ${environment}`);
  }
}
