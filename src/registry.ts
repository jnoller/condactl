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
  public registryPath: string;
  private condaInfo!: Collection;
  private environments!: Collection;

  constructor(registryPath: string, log?: Logger) {
    this.log = log;
    this.registryPath = registryPath;
    const adapter = new LokiFsAdapter();
    this.db = new Loki(this.registryPath, {
      adapter: adapter,
      autoload: true,
      autoloadCallback: this.setupDB,
      autosave: true,
      autosaveInterval: 5,
    });
  };

  private setupCollection(collectionName: string, options?: { autoupdate?: boolean, unique?: string[] }): Collection {
    let collection = this.db.getCollection(collectionName);
    if (!collection) {
      this.log?.debug(`setupCollection: collection ${collectionName} does not exist, creating...`);
      collection = this.db.addCollection(collectionName, options);
    } else {
      this.log?.debug(`setupCollection: collection ${collectionName} exists, loading...`);
    }
    return collection;
}

  private setupDB = (): void => {
    this.db.loadDatabase({}, () => {
      this.condaInfo = this.setupCollection('condaInfo', { autoupdate: true });
      this.environments = this.setupCollection('environments', { autoupdate: true, unique: ['name'] });
      this.log?.debug(`initcache: condaInfo: ${JSON.stringify(this.condaInfo)}`);
      this.log?.debug(`initcache: environments: ${JSON.stringify(this.environments)}`);
    });
  }


  public clearRegistry(): void {
    this.db.removeCollection('condaInfo');
    this.db.removeCollection('environments');
  }

  public doesEnvironmentExist(environmentName: string): boolean {
    const environment = this.environments.by('name', environmentName);
    return environment ? true : false;
  }

  public getEnvironment(environmentName: string) {
    const environment = this.environments.by('name', environmentName) as EnvironmentData;
    if (environment) {
      return environment;
    }
    throw new Error(`getEnvironment: '${environmentName}' not found.`);
  }

  public addEnvironment(environmentName: string, prefix: string, channels: string[]): boolean {
    if (this.doesEnvironmentExist(environmentName)) {
      throw new Error(`addEnvironment: '${environmentName}' already exists.`);
    }
    this.environments.insert({ name: environmentName, prefix: prefix, channels: channels, packages: [] });
    this.db.saveDatabase();
    return true;
  }

  public removeEnvironment(environmentName: string): boolean {
    const environment = this.environments.by('name', environmentName);
    if (environment) {
      this.environments.remove(environment);
      this.db.saveDatabase();
      return true;
    }
    throw new Error(`removeEnvironment: '${environmentName}' does not exist.`);
  }

  public getAllEnvironments(): EnvironmentData[] {
    const result = this.environments.chain().data() as EnvironmentData[];
    this.log?.debug(`getAllEnvironments: ${JSON.stringify(result)}`);
    return result;
  }

  public getEnvironmentPackages(environmentName: string): Package[] | null {
    const environment = this.getEnvironment(environmentName);
    return environment ? environment.packages : null;
  }

  public listAllEnvironments(): string[] {
    // replace usage of chain here
    if (!this.environments) {
      throw new Error('listAllEnvironments: environments collection not initialized.');
    }
    const environments = this.environments.find() as EnvironmentData[];
    this.log?.debug(`listEnvironments: ${JSON.stringify(environments)}`);
    return environments.map((env) => env.name);
  }

  public addEnvironmentPackages(environmentName: string, packages: Package[]): boolean {
    const environment = this.environments.by('name', environmentName);
    if (environment) {
      environment.packages = packages;
      this.environments.update(environment);
      this.db.saveDatabase();
      return true;
    }
    throw new Error(`addEnvironmentPackages: '${environmentName}' does not exist.`);
  }

  public removeEnvironmentPackages(environmentName: string): boolean {
    const environment = this.environments.by('name', environmentName);
    if (environment) {
      environment.packages = [];
      this.environments.update(environment);
      this.db.saveDatabase();
      return true;
    }
    throw new Error(`removeEnvironmentPackages: '${environmentName}' does not exist.`);
  }
}
