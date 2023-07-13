import fs from 'fs/promises';
import { RegistryManager } from '../../src/registry';

jest.mock('fs/promises');

describe('RegistryManager', () => {
  let registryManager: RegistryManager;

  beforeEach(() => {
    registryManager = new RegistryManager();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('loadRegistry', () => {
    it('should load registry from file', async () => {
      const registryData = JSON.stringify({ environment1: true, environment2: false });
      jest.spyOn(fs, 'readFile').mockResolvedValue(registryData);

      await registryManager.loadRegistry();

      expect(fs.readFile).toHaveBeenCalledWith(registryManager.registryPath, 'utf-8');
      expect(registryManager.getEnvironments()).toEqual({ environment1: true, environment2: false });
    });

    it('should handle error when loading registry', async () => {
      jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('Failed to read file'));

      await registryManager.loadRegistry();

      expect(fs.readFile).toHaveBeenCalledWith(registryManager.registryPath, 'utf-8');
      expect(registryManager.getEnvironments()).toEqual({});
    });
  });

  describe('saveRegistry', () => {
    it('should save registry to file', async () => {
      const registryData = JSON.stringify({ environment1: true, environment2: false });
      jest.spyOn(fs, 'writeFile').mockResolvedValue();

      await registryManager.saveRegistry();

      expect(fs.writeFile).toHaveBeenCalledWith(registryManager.registryPath, registryData, 'utf-8');
    });

    it('should handle error when saving registry', async () => {
      jest.spyOn(fs, 'writeFile').mockRejectedValue(new Error('Failed to write file'));

      await expect(registryManager.saveRegistry()).rejects.toThrow('Failed to write file');
    });
  });

  describe('isRegistryCreated', () => {
    it('should return true if registry file exists', async () => {
      jest.spyOn(fs, 'access').mockResolvedValue();

      const result = await registryManager.isRegistryCreated();

      expect(fs.access).toHaveBeenCalledWith(registryManager.registryPath);
      expect(result).toBe(true);
    });

    it('should return false if registry file does not exist', async () => {
      jest.spyOn(fs, 'access').mockRejectedValue(new Error('File not found'));

      const result = await registryManager.isRegistryCreated();

      expect(fs.access).toHaveBeenCalledWith(registryManager.registryPath);
      expect(result).toBe(false);
    });
  });

  describe('addEnvironment', () => {
    it('should add environment to registry and save', async () => {
      jest.spyOn(fs, 'writeFile').mockResolvedValue();

      await registryManager.addEnvironment('environment1');

      expect(registryManager.getEnvironments()).toEqual({ environment1: true });
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should handle error when adding environment', async () => {
      jest.spyOn(fs, 'writeFile').mockRejectedValue(new Error('Failed to write file'));

      await expect(registryManager.addEnvironment('environment1')).rejects.toThrow('Failed to write file');
    });
  });

  describe('removeEnvironment', () => {
    it('should remove environment from registry and save', async () => {
      jest.spyOn(fs, 'writeFile').mockResolvedValue();
      registryManager.addEnvironment('environment1');

      await registryManager.removeEnvironment('environment1');

      expect(registryManager.getEnvironments()).toEqual({});
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should handle error when removing environment', async () => {
      jest.spyOn(fs, 'writeFile').mockRejectedValue(new Error('Failed to write file'));
      registryManager.addEnvironment('environment1');

      await expect(registryManager.removeEnvironment('environment1')).rejects.toThrow('Failed to write file');
    });
  });
});
