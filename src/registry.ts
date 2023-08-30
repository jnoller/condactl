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
    });
    this.db.loadDatabase();
    this.databaseInitialize();
  }

  private databaseInitialize = () => {
    this.condaInfo = this.db.getCollection('condaInfo');
    this.environments = this.db.getCollection('environments');
    this.log?.debug(`initcache: condaInfo: ${this.condaInfo}`);
    this.log?.debug(`initcache: environments: ${JSON.stringify(this.environments)}`);
    if (!this.condaInfo) {
      this.log?.debug(`initcache: creating condaInfo collection`);
      this.condaInfo = this.db.addCollection('condaInfo', {autoupdate: true});
    }
    if (!this.environments) {
      this.log?.debug(`initcache: creating environments collection`);
      this.environments = this.db.addCollection('environments', { autoupdate: true, unique: ['name'] });
    }
  };

  public clearRegistry(): void {
    this.db.removeCollection('condaInfo');
    this.db.removeCollection('environments');
    this.db.saveDatabase();
    this.databaseInitialize();
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
    const environments = this.environments.chain().data() as EnvironmentData[];
    this.log?.debug(`listAllEnvironments: ${JSON.stringify(environments)}`);
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
