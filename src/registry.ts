import fs from 'fs/promises';
import path from 'path';

export class RegistryManager {
  public registryPath: string;
  private registry: { [key: string]: boolean };

  constructor(registryPath?: string) {
    this.registryPath = registryPath ?? path.join(process.env.HOME ?? '', '.cope', 'registry.json');
    this.registry = {};
  }

  public async init(): Promise<void> {
    try {
      await fs.access(this.registryPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await this.saveRegistry(); // This will create the file with the initial state of the registry
      } else {
        throw error; // If the error is not 'ENOENT', rethrow it
      }
    }
    await this.loadRegistry();
  }

  private async loadRegistry(): Promise<void> {
    try {
      const registryData = await fs.readFile(this.registryPath, 'utf-8');
      this.registry = JSON.parse(registryData);
    } catch (error) {
      this.registry = {};
    }
  }

  private async saveRegistry(): Promise<void> {
    try {
      const registryData = JSON.stringify(this.registry, null, 2);
      await fs.writeFile(this.registryPath, registryData, 'utf-8');
    } catch (error) {
      console.error('Failed to write file:', error);
      throw error; // Re-throw the error after logging it
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
  }

  public async removeEnvironment(environment: string): Promise<void> {
    delete this.registry[environment];
    await this.saveRegistry();
  }
}
