import fs from 'fs/promises';
import path from 'path';

export class RegistryManager {
  private registryPath: string;
  private registry: { [key: string]: boolean };

  constructor() {
    this.registryPath = path.join(process.env.HOME ?? '', '.cope', 'registry.json');
    this.registry = {};
    this.loadRegistry();
  }

  public async loadRegistry(): Promise<void> {
    try {
      const registryData = await fs.readFile(this.registryPath, 'utf-8');
      this.registry = JSON.parse(registryData);
    } catch (error) {
      this.registry = {};
    }
  }

  public async saveRegistry(): Promise<void> {
    const registryData = JSON.stringify(this.registry, null, 2);
    await fs.writeFile(this.registryPath, registryData, 'utf-8');
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
