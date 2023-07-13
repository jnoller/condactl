import fs from 'fs';
import path from 'path';

/**
 * Manages a registry of environments.
 */
export class RegistryManager {
  private registryPath: string;
  private registry: { [key: string]: boolean };

  /**
   * Initialize a new instance of the RegistryManager class.
   */
  constructor() {
    // Set the path to the registry file
    this.registryPath = path.join(process.env.HOME ?? '', '.cope', 'registry.json');
    // Load the registry from the file or create a new one if it doesn't exist
    this.registry = this.loadRegistry();
  }

  /**
   * Load the registry from the file.
   * @returns The loaded registry.
   */
  loadRegistry(): { [key: string]: boolean } {
    if (this.isRegistryCreated()) {
      const registryData = fs.readFileSync(this.registryPath, 'utf-8');
      return JSON.parse(registryData);
    } else {
      return {};
    }
  }

  /**
   * Save the registry to the file.
   */
  saveRegistry(): void {
    const registryData = JSON.stringify(this.registry, null, 2);
    fs.writeFileSync(this.registryPath, registryData, 'utf-8');
  }

  /**
   * Check if the registry file exists.
   * @returns True if the registry file exists, false otherwise.
   */
  isRegistryCreated(): boolean {
    return fs.existsSync(this.registryPath);
  }

  /**
   * Get the current registry of environments.
   * @returns The current registry.
   */
  getEnvironments(): { [key: string]: boolean } {
    return this.registry;
  }

  /**
   * Add an environment to the registry.
   * @param id The ID of the environment to add.
   */
  addEnvironment(id: string): void {
    this.registry[id] = true;
    this.saveRegistry();
  }

  /**
   * Remove an environment from the registry.
   * @param id The ID of the environment to remove.
   */
  removeEnvironment(id: string): void {
    delete this.registry[id];
    this.saveRegistry();
  }
}
