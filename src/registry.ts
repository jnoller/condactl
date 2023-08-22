import { Logger } from 'winston';
import Loki, { LokiFsAdapter, Collection } from 'lokijs';

export type Package = {
  base_url: string;
  build_number: number;
  build_string: string;
  channel: string;
  dist_name: string;
  name: string;
  platform: string;
  version: string;
};

export type EnvironmentData = {
  name: string;
  prefix: string | "";
  channels: string[];
  packages: Package[];
};

export type CondaInfo = {
  info: string;
  config: string;
  version: string;
}

export class RegistryManager {
  private db: Loki;
  private log?: Logger;
  private condaInfoCollection: Collection<CondaInfo>;
  public registryPath: string;

  constructor(registryPath: string, log?: Logger) {
    try{
      this.log = log;
      const adapter = new LokiFsAdapter();
      this.db = new Loki(registryPath, {
        adapter: adapter,
        autoload: true,
        autosave: true,
        autosaveInterval: 4000
      });

      this.condaInfoCollection = this.db.getCollection<CondaInfo>('condaInfo');
      if (!this.condaInfoCollection) {
        this.condaInfoCollection = this.db.addCollection('condaInfo');
      }
    } catch(err) {
      this.log?.error(`Error initializing RegistryManager: ${err}`);
      throw err;
    }
    this.registryPath = registryPath;
  }

  public getEnvironmentCollection(environmentName: string): Collection<EnvironmentData> {
    const envCollection = this.db.getCollection<EnvironmentData>(`env_${environmentName}`);
    if (!envCollection) {
      throw new Error(`getEnvironmentCollection: '${environmentName}' does not exist.`);
    }
    return envCollection;
  }

  public getEnvironment(environmentName: string): EnvironmentData {
    const envCollection = this.getEnvironmentCollection(environmentName);
    const data = envCollection.findOne({ name: environmentName });
    if (data) {
      this.log?.info(`Environment '${environmentName}' retrieved successfully.`);
      return data;
    }
    throw new Error(`getEnvironment: '${environmentName}' not found.`);
  }

  public getCondaInfo(): { info: CondaInfo, config: CondaInfo } | null {
    const storedData = this.condaInfoCollection.findOne({});
    if (storedData) {
      this.log?.info("Conda info retrieved successfully.");
      return {
        info: JSON.parse(storedData.info),
        config: JSON.parse(storedData.config)
      };
    }
    throw new Error("getCondaInfo: No conda info found in the collection.");
  }

  public getEnvironmentPackages(environmentName: string): Package[] | null {
    const envCollection = this.getEnvironmentCollection(environmentName);
    const data = envCollection.findOne({ name: environmentName });
    if (data && data.packages) {
      this.log?.info(`Packages for environment '${environmentName}' retrieved successfully.`);
      return data.packages;
    }
    this.log?.warn(`No packages found for environment '${environmentName}'.`);
    return null;
  }

  // ? on add and remove, should we trigger a re-discovery of the packages?
  public addEnvironmentPackages(environmentName: string, packages: Package[]): boolean {
    try {
        const envCollection = this.getEnvironmentCollection(environmentName);
        const existingData = envCollection.findOne({ name: environmentName });
        if (existingData) {
            existingData.packages = packages;
            envCollection.update(existingData);
            this.log?.info(`Packages for environment '${environmentName}' updated successfully.`);
        } else {
            throw new Error(`Environment '${environmentName}' does not exist.`);
        }
        return true;
    } catch (error) {
        const err = new Error(`Error adding packages for environment '${environmentName}': ${error}`);
        this.log?.error(err);
        return false;
    }
  }

  public removeEnvironmentPackages(environmentName: string): boolean {
    try {
      const envCollection = this.getEnvironmentCollection(environmentName);
      const existingData = envCollection.findOne({ name: environmentName });
      if (existingData) {
        existingData.packages = [];
        envCollection.update(existingData);
        this.log?.info(`Packages for environment '${environmentName}' removed successfully.`);
      } else {
        throw new Error(`Environment '${environmentName}' does not exist.`);
      }
      return true;
    } catch (error) {
      const err = new Error(`Error removing packages for environment '${environmentName}': ${error}`);
      this.log?.error(err);
      return false;
    }
  }

  public addEnvironment(name: string, prefix: string, channels: string[]): boolean {
    const envCollection = this.getEnvironmentCollection(name);
    if (envCollection.findOne({ name: name })) {
      this.log?.warn(`Environment '${name}' already exists.`);
      return false;
    } try {
      envCollection.insert({ name: name, prefix: prefix, channels: channels, packages: [] });
      this.log?.info(`Environment '${name}' added successfully.`);
      return true;
    } catch (e) {
      const err = new Error(`Error while adding environment '${name}': ${e}`);
      this.log?.error(err);
      throw err;
    }
  }

  public removeEnvironment(environmentName: string): boolean {
    try {
      this.db.removeCollection(`env_${environmentName}`);
      this.log?.info(`Environment '${environmentName}' removed successfully.`);
      return true;
    } catch (error) {
      const err = new Error(`Error while removing environment '${environmentName}': ${error}`);
      this.log?.error(err);
      return false;
    }
  }

  public listEnvironments(): string[] {
    const environments = this.db.listCollections().filter(col => col.name.startsWith('env_')).map(col => col.name.replace('env_', ''));
    if (environments.length) {
      this.log?.info(`listEnvironments found: ${environments.join(', ')}`);
    } else {
      this.log?.info(`listEnvironments found no environments, did you run discovery?`);
    }
    return environments;
  }

  public isEmpty(): boolean {
    const environments = this.listEnvironments();
    return environments.length === 0;
  }

  public clearRegistry(): boolean {
    try {
      this.db.removeCollection('condaInfo');
      this.db.listCollections().filter(col => col.name.startsWith('env_')).forEach(col => this.db.removeCollection(col.name));
      this.log?.info(`Registry cleared successfully.`);
      return true;
    } catch (e) {
      const err = new Error(`Error while clearing registry: ${e}`);
      this.log?.error(err);
      return false;
    }
  }
}
