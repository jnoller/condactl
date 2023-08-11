import Loki from 'lokijs';
import { Logger } from 'winston';

export class RegistryManager {

  private db: Loki;
  private environments: Loki.Collection<Environment>;
  private responses: Loki.Collection<Response>;
  private log?: Logger;

  constructor(registryPath?: string, log?: Logger) {
    this.db = new Loki(registryPath || 'registry.db');
    this.environments = this.db.addCollection('environments');
    this.responses = this.db.addCollection('responses');
    this.loadFromDisk();
    this.log = log;
  }

  public getEnvironments(): Environment[] {
    return this.environments.find();
  }

  public async addEnvironment(name: string): Promise<void> {
    const env = { name };
    this.environments.insert(env);
    this.cacheResponse('environments', this.getEnvironments());
    this.saveToDisk();
    this.log?.debug(`RegistryManager: added environment ${name} to registry.`);
  }

  public async removeEnvironment(name: string): Promise<void> {
    const env = this.environments.findOne({name});
    if (env) {
      this.environments.remove(env);
    }
    this.clearResponseCache('environments');
    this.saveToDisk();
    this.log?.debug(`RegistryManager: removed environment ${name} from registry.`);
  }

  public cacheResponse(key: string, response: any, env?: string): void {
    const cached: Response = {key, response};
    if (env) {
      cached.env = env;
    }
    this.responses.insert(cached);
    this.log?.debug(`RegistryManager: cached response for ${key} in registry.`);
  }

  public getCachedResponse(key: string, env?: string): any {
    if (env) {
      return this.responses.findOne({key, env});
    }
    return this.responses.findOne({key});
  }

  public clearResponseCache(key: string, env?: string): void {
    if (env) {
      this.responses.removeWhere(r => r.key === key && r.env === env);
    } else {
      this.responses.removeWhere(r => r.key === key);
    }
    this.log?.debug(`RegistryManager: cleared response cache for ${key} in registry.`);
  }

  public async purgeRegistry(): Promise<void> {
    this.clearCache();
    this.saveToDisk();
    this.log?.debug(`RegistryManager: purged registry.`);
  }

  private clearCache() {
    this.environments.clear();
    this.responses.clear();
    this.log?.debug(`RegistryManager: cleared cache in registry.`);
  }

  private async loadFromDisk() {
    // load data from file if exists
  }

  private async saveToDisk() {
    // save data to file
  }

}

interface Environment {
  name: string;
}

interface Response {
  key: string;
  response: any;
  env?: string;
}

export default RegistryManager;
