COPE



EnvironmentManager example usage:

```
import { EnvironmentManager } from './EnvironmentManager';

const envManager = new EnvironmentManager();

// Example 1: Discovering environments
envManager.discoverEnvironments().then(environments => {
  console.log('Discovered environments:', environments);
}).catch(error => {
  console.error('Failed to discover environments:', error);
});

// Example 2: Creating a new environment
envManager.createEnvironment('myenv').then(() => {
  console.log('Environment created successfully');
}).catch(error => {
  console.error('Failed to create environment:', error);
});

// Example 3: Cleaning an environment
envManager.cleanEnvironment('myenv').then(() => {
  console.log('Environment cleaned successfully');
}).catch(error => {
  console.error('Failed to clean environment:', error);
});

// Example 4: Comparing two environments
envManager.compareEnvironments('env1', 'env2').then(result => {
  console.log('Comparison result:', result);
}).catch(error => {
  console.error('Failed to compare environments:', error);
});

// Example 5: Configuring an environment
envManager.environmentConfig('myenv', 'prompt_value').then(() => {
  console.log('Environment configured successfully');
}).catch(error => {
  console.error('Failed to configure environment:', error);
});

```
