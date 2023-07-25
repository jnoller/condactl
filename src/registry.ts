import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { Logger } from "winston";

export class RegistryManager {
  public registryPath: string;
  public log: Logger | undefined;
  private registry: { [key: string]: boolean };

  constructor(registryPath?: string, log?: Logger) {
    this.registryPath = registryPath ?? path.join(os.homedir(), '.cope', 'registry.json');
    this.registry = {};
    this.log = log;
  }

  /**
   * Initializes the registry by checking if the registry file exists and loading its contents.
   * If the file does not exist, it will be created with an empty registry.
   */
  public async init(): Promise<void> {
    try {
      await fs.access(this.registryPath);
      if (this.log) {
        this.log.info(`Registry file exists: ${this.registryPath}`);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await this.saveRegistry();
        if (this.log) {
          this.log.info(`New registry file created: ${this.registryPath}`);
        }
      } else {
        throw error;
      }
    }

    await this.loadRegistry();
  }


  /**
   * Loads the registry from the registry file.
   * If the file does not exist or an error occurs while reading the file, an empty registry will be used.
   */
  private async loadRegistry(): Promise<void> {
    const registryData = await fs.readFile(this.registryPath, 'utf-8');
    this.registry = JSON.parse(registryData);
  }

  /**
   * Saves the registry to the registry file.
   * If an error occurs while writing the file, it will be logged and re-thrown.
   */
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

  /**
   * Removes the registry file.
   * If an error occurs while removing the file, it will be logged and re-thrown.
   */
  public async removeRegistryFile(): Promise<void> {
    try {
      await fs.remove(this.registryPath);
      this.log?.debug(`Registry file removed: ${this.registryPath}`);
      this.registry = {}; // Reset the in-memory registry to an empty object
      await this.saveRegistry(); // Save the empty registry to a new registry file
      if (this.log) {
        this.log.info(`Registry file reset`);
      }
    } catch (error) {
      console.error('Failed to remove registry file:', error);
      throw error;
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
    if (this.log) {
      this.log.info(`Environment added to registry: ${environment}`);
    }
  }

  /**
   * Removes an environment from the registry.
   * @param environment - The name of the environment to remove.
   */
  public async removeEnvironment(environment: string): Promise<void> {
    delete this.registry[environment];
    await this.saveRegistry();
    if (this.log) {
      this.log.info(`Environment removed from registry: ${environment}`);
    }
  }
}
