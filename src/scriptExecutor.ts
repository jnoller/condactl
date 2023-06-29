import shelljs from 'shelljs';
import { EnvironmentManager } from './environmentManager';

export class ScriptExecutor {
  private environmentManager: EnvironmentManager;

  constructor(environmentManager: EnvironmentManager) {
    this.environmentManager = environmentManager;
  }

  public startProcess(environmentName: string, command: string): void {
    const { manager, scriptPath } = this.environmentManager.getEnvironmentDetails(environmentName);

    switch (manager) {
      case 'conda':
        shelljs.exec(`source ${scriptPath} && conda activate ${environmentName} && ${command}`, { silent: true });
        break;
      case 'pyenv':
        shelljs.exec(`source ${scriptPath} && pyenv activate ${environmentName} && ${command}`, { silent: true });
        break;
      case 'virtualenvwrapper':
        shelljs.exec(`source ${scriptPath} && workon ${environmentName} && ${command}`, { silent: true });
        break;
      default:
        console.error(`Unsupported environment manager: ${manager}`);
        break;
    }
  }
}
