import fs from 'fs/promises';
import { RegistryManager } from '../../src/registry';

let tempDir: string;
let registryManager: RegistryManager;
const registryFileName = 'registry.json';

beforeEach(async () => {
  tempDir = await fs.mkdtemp('/tmp/registry-test-');
  registryManager = new RegistryManager(`${tempDir}/${registryFileName}`);
  await registryManager.init();
});

afterEach(async () => {
  try {
    await fs.unlink(`${tempDir}/${registryFileName}`);
  } catch (error) {
    // Ignore error if file does not exist
  }
  await fs.rmdir(tempDir);
});

describe('isRegistryCreated', () => {
  it('should return true if registry file exists', async () => {
    jest.spyOn(fs, 'access').mockResolvedValueOnce();

    const result = await registryManager.isRegistryCreated();

    expect(fs.access).toHaveBeenCalledWith(registryManager['registryPath']);
    expect(result).toBe(true);
  });

  it('should return false if registry file does not exist', async () => {
    jest.spyOn(fs, 'access').mockImplementationOnce(() => Promise.reject(new Error('File does not exist')));

    const result = await registryManager.isRegistryCreated();

    expect(fs.access).toHaveBeenCalledWith(registryManager['registryPath']);
    expect(result).toBe(false);
  });
});

describe('addEnvironment', () => {
  it('should add environment to registry and save', async () => {
    jest.spyOn(fs, 'writeFile').mockResolvedValueOnce();

    await expect(registryManager.addEnvironment('environment1')).resolves.toBeUndefined();

    expect(registryManager.getEnvironments()).toEqual({ environment1: true });
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it('should handle error when adding environment', async () => {
    jest.spyOn(fs, 'writeFile').mockImplementationOnce(() => Promise.reject(new Error('Failed to write file')));

    await expect(registryManager.addEnvironment('environment1')).rejects.toThrow('Failed to write file');
  });
});

describe('removeEnvironment', () => {
  it('should remove environment from registry and save', async () => {
    jest.spyOn(fs, 'writeFile').mockResolvedValueOnce();
    await registryManager.addEnvironment('environment1');

    await expect(registryManager.removeEnvironment('environment1')).resolves.toBeUndefined();

    expect(registryManager.getEnvironments()).toEqual({});
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it('should handle error when removing environment', async () => {
    await registryManager.addEnvironment('environment1');
    jest.spyOn(fs, 'writeFile').mockImplementationOnce(() => Promise.reject(new Error('Failed to write file')));

    await expect(registryManager.removeEnvironment('environment1')).rejects.toThrow('Failed to write file');
  });
});

describe('getEnvironments', () => {
  it('should return the environments from the registry', () => {
    registryManager.addEnvironment('environment1');
    registryManager.addEnvironment('environment2');

    const environments = registryManager.getEnvironments();

    expect(environments).toEqual({ environment1: true, environment2: true });
  });
});
