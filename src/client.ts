import { EnvironmentManager } from './EnvironmentManager';

export class Client {
  private environmentManager: EnvironmentManager;

  constructor() {
    this.environmentManager = new EnvironmentManager();
  }

  async initialize(options: Partial<ClientOptions>) {
    // Initialize the environment manager
  }

  async getApps(refresh_context?: AppLauncherActionContext): Promise<AppLauncher[] | Error> {
    // Implement the getApps method using the environment manager
  }

  async getInfo(): Promise<CondaInfoCliOutput> {
    // Implement the getInfo method using the environment manager
  }

  async changeEnvironment(input: string): Promise<void> {
    // Implement the changeEnvironment method using the environment manager
  }

  async installPackage(input: PackageCliInput): Promise<PackageCliOutput> {
    // Implement the installPackage method using the environment manager
  }

  async updatePackage(input: PackageCliInput): Promise<PackageCliOutput> {
    // Implement the updatePackage method using the environment manager
  }

  async removePackage(input: PackageCliInput): Promise<PackageCliOutput> {
    // Implement the removePackage method using the environment manager
  }

  async getActiveEnvironment(): Promise<CondaEnvironment> {
    // Implement the getActiveEnvironment method using the environment manager
  }

  async getEnvironmentList(): Promise<CondaEnvironment[]> {
    // Implement the getEnvironmentList method using the environment manager
  }

  async createEnvironment(params: CreateCliInput): Promise<CreateCliOutput> {
    // Implement the createEnvironment method using the environment manager
  }

  async cloneEnvironment(params: CloneEnvironmentInput): Promise<CloneEnvironmentOutput> {
    // Implement the cloneEnvironment method using the environment manager
  }

  async renameEnvironment(input: RenameEnvCliInput): Promise<RenameEnvCliOutput> {
    // Implement the renameEnvironment method using the environment manager
  }

  async removeEnvironment(params: EnvRemoveCliInput): Promise<EnvRemoveCliOutput> {
    // Implement the removeEnvironment method using the environment manager
  }

  async getAllInstalledPackages(): Promise<ListCliOutput> {
    // Implement the getAllInstalledPackages method using the environment manager
  }

  async getAllInstalledPackagesForActiveEnv(): Promise<ListCliOutput> {
    // Implement the getAllInstalledPackagesForActiveEnv method using the environment manager
  }

  async getInstalledPackages(params: Pick<CondaEnvironment, "name">): Promise<ListCliOutput> {
    // Implement the getInstalledPackages method using the environment manager
  }

  async searchPackage(packageName: string): Promise<InstallPackage[]> {
    // Implement the searchPackage method using the environment manager
  }

  async searchPackages(): Promise<any> {
    // Implement the searchPackages method using the environment manager
  }

  async versions(): Promise<LanguageVersions> {
    // Implement the versions method using the environment manager
  }

  async updateEnvironment(params: UpdateEnvCliInput): Promise<UpdateEnvCliOutput> {
    // Implement the updateEnvironment method using the environment manager
  }

  async backupEnvironmentLocally(params: ExportEnvCliInput): Promise<ExportEnvCliOutput> {
    // Implement the backupEnvironmentLocally method using the environment manager
  }

  async config(params: ConfigEnvCliInput): Promise<ConfigEnvCliOutput> {
    // Implement the config method using the environment manager
  }

  async writeFile(fileName: string, content: string): Promise<void> {
    // Implement the writeFile method using the environment manager
  }

  async readFile(fileName: string): Promise<string> {
    // Implement the readFile method using the environment manager
  }

  async readSettings(): Promise<AppSettings> {
    // Implement the readSettings method using the environment manager
  }

  async saveSettings(app: AppSettings): Promise<void> {
    // Implement the saveSettings method using the environment manager
  }

  async getOsInfo(): Promise<OsInfo> {
    // Implement the getOsInfo method using the environment manager
  }

  async runApplication(app: RunApplication): Promise<any> {
    // Implement the runApplication method using the environment manager
  }

  async runJupyterNotebookInstance(data: { environment?: string }): Promise<JupyterNotebookInstance[]> {
    // Implement the runJupyterNotebookInstance method using the environment manager
  }

  async stopJupyterNotebookService(input: StopNotebookService): Promise<any> {
    // Implement the stopJupyterNotebookService method using the environment manager
  }

  async getNotebookVersion(): Promise<any> {
    // Implement the getNotebookVersion method using the environment manager
  }

  async getNotebookInstances(): Promise<JupyterNotebookInstance[]> {
    // Implement the getNotebookInstances method using the environment manager
  }

  async startNewNotebook(input: NewNotebookInput): Promise<Notebook | undefined> {
    // Implement the startNewNotebook method using the environment manager
  }

  async scanNotebook(input: ScanNotebookInput): Promise<ScanNotebookOutput> {
    // Implement the scanNotebook method using the environment manager
  }

  async killProcess(processToKill: { pid: number }): Promise<any> {
    // Implement the killProcess method using the environment manager
  }

  async uninstallConda(): Promise<void> {
    // Implement the uninstallConda method using the environment manager
  }

  async installConda(installOptions: { url: string }): Promise<void> {
    // Implement the installConda method using the environment manager
  }

  async downloadFile(file: DownloadFile): Promise<void> {
    // Implement the downloadFile method using the environment manager
  }

  async isCondaCompatible(): Promise<boolean> {
    // Implement the isCondaCompatible method using the environment manager
  }

  async getInstallableCondaVersions(): Promise<InstallableConda[]> {
    // Implement the getInstallableCondaVersions method using the environment manager
  }

  async close(): Promise<void> {
    // Implement the close method using the environment manager
  }
}
