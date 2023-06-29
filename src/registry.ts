import fs from 'fs';
import path from 'path';

export class RegistryManager {
  private registryPath: string;
  private registry: { [key: string]: boolean };

  constructor() {
    this.registryPath = path.join(process.env.HOME ?? '', '.cope', 'registry.json');
    this.registry = this.loadRegistry();
  }

  loadRegistry(): { [key: string]: boolean } {
    if (this.isRegistryCreated()) {
      const registryData = fs.readFileSync(this.registryPath, 'utf-8');
      return JSON.parse(registryData);
    } else {
      return {};
    }
  }

  saveRegistry(): void {
    const registryData = JSON.stringify(this.registry, null, 2);
    fs.writeFileSync(this.registryPath, registryData, 'utf-8');
  }

  isRegistryCreated(): boolean {
    return fs.existsSync(this.registryPath);
  }

  getEnvironments(): { [key: string]: boolean } {
    return this.registry;
  }

  addEnvironment(id: string): void {
    this.registry[id] = true;
    this.saveRegistry();
  }

  removeEnvironment(id: string): void {
    delete this.registry[id];
    this.saveRegistry();
  }
}
