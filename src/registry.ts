import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class RegistryManager {
  public registryPath: string;
  private registry: { [key: string]: boolean };

  constructor(registryPath?: string) {
    this.registryPath = registryPath ?? path.join(os.homedir(), '.cope', 'registry.json');
    this.registry = {};
  }

  /**
   * Initializes the registry by checking if the registry file exists and loading its contents.
   * If the file does not exist, it will be created with an empty registry.
   */
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

  /**
   * Loads the registry from the registry file.
   * If the file does not exist or an error occurs while reading the file, an empty registry will be used.
   */
  private async loadRegistry(): Promise<void> {
    try {
      const registryData = await fs.readFile(this.registryPath, 'utf-8');
      this.registry = JSON.parse(registryData);
    } catch (error) {
      this.registry = {};
    }
  }

  /**
   * Saves the registry to the registry file.
   * If an error occurs while writing the file, it will be logged and re-thrown.
   */
  private async saveRegistry(): Promise<void> {
    try {
      const registryData = JSON.stringify(this.registry, null, 2);
      await fs.writeFile(this.registryPath, registryData, 'utf-8');
    } catch (error) {
      console.error('Failed to write file:', error);
      throw error; // Re-throw the error after logging it
    }
  }

  /**
   * Checks if the registry file exists.
   * @returns {Promise<boolean>} - True if the registry file exists, false otherwise.
   */
  public async isRegistryCreated(): Promise<boolean> {
    try {
      await fs.access(this.registryPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Retrieves the environments from the registry.
   * @returns {Object} - The registry object containing the environments.
   */
  public getEnvironments(): { [key: string]: boolean } {
    return this.registry;
  }

  /**
   * Adds an environment to the registry.
   * @param environment - The name of the environment to add.
   */
  public async addEnvironment(environment: string): Promise<void> {
    this.registry[environment] = true;
    await this.saveRegistry();
  }

  /**
   * Removes an environment from the registry.
   * @param environment - The name of the environment to remove.
   */
  public async removeEnvironment(environment: string): Promise<void> {
    delete this.registry[environment];
    await this.saveRegistry();
  }
}
