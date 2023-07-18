import fs from 'fs/promises';
import { RegistryManager } from '../../src/registry';

jest.mock('fs/promises'); // Mock the fs/promises module

describe('RegistryManager', () => {
  let registryManager: RegistryManager;

  beforeEach(() => {
    registryManager = new RegistryManager();
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restore the mocked functions after each test
  });

  describe('init', () => {
    it('should create the registry file if it does not exist', async () => {
      jest.spyOn(fs, 'access').mockRejectedValueOnce({ code: 'ENOENT' }); // Mock the fs.access function to throw an error with code 'ENOENT'
      jest.spyOn(fs, 'writeFile').mockResolvedValueOnce(); // Mock the fs.writeFile function to resolve successfully

      await registryManager.init();

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'utf-8'
      );
    });

    it('should load the registry from the registry file', async () => {
      jest.spyOn(fs, 'access').mockResolvedValueOnce(); // Mock the fs.access function to resolve successfully
      jest.spyOn(fs, 'readFile').mockResolvedValueOnce(JSON.stringify({ environment: true })); // Mock the fs.readFile function to return a JSON string

      await registryManager.init();

      expect(fs.readFile).toHaveBeenCalledWith(
        expect.any(String),
        'utf-8'
      );
      expect(registryManager.getEnvironments()).toEqual({ environment: true });
    });

    it('should throw an error if an error occurs while accessing the registry file', async () => {
      const error = new Error('Access error');
      jest.spyOn(fs, 'access').mockRejectedValueOnce(error); // Mock the fs.access function to throw an error

      await expect(registryManager.init()).rejects.toThrow(error);
    });

    it('should throw an error if an error occurs while reading the registry file', async () => {
      const error = new Error('Read error');
      jest.spyOn(fs, 'access').mockResolvedValueOnce(); // Mock the fs.access function to resolve successfully
      jest.spyOn(fs, 'readFile').mockRejectedValueOnce(error); // Mock the fs.readFile function to throw an error

      await expect(registryManager.init()).rejects.toThrow(error);
    });
  });

  describe('isRegistryCreated', () => {
    it('should return true if the registry file exists', async () => {
      jest.spyOn(fs, 'access').mockResolvedValueOnce(); // Mock the fs.access function to resolve successfully

      const result = await registryManager.isRegistryCreated();

      expect(result).toBe(true);
    });

    it('should return false if the registry file does not exist', async () => {
      const error = new Error('Access error');
      jest.spyOn(fs, 'access').mockRejectedValueOnce(error); // Mock the fs.access function to throw an error

      const result = await registryManager.isRegistryCreated();

      expect(result).toBe(false);
    });
  });

  describe('addEnvironment', () => {
    it('should add an environment to the registry', async () => {
      jest.spyOn(fs, 'writeFile').mockResolvedValueOnce(); // Mock the fs.writeFile function to resolve successfully

      await registryManager.addEnvironment('test');

      expect(registryManager.getEnvironments()).toEqual({ test: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'utf-8'
      );
    });
  });

  describe('removeEnvironment', () => {
    it('should remove an environment from the registry', async () => {
      registryManager = new RegistryManager();
      registryManager['registry'] = { test: true };

      jest.spyOn(fs, 'writeFile').mockResolvedValueOnce(); // Mock the fs.writeFile function to resolve successfully

      await registryManager.removeEnvironment('test');

      expect(registryManager.getEnvironments()).toEqual({});
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'utf-8'
      );
    });
  });
});
