// Mock object
class MockClient {
  constructor() {}

  initialize() {}

  getApps() {
    return Promise.resolve([]);
  }

  getInfo() {
    return Promise.resolve({});
  }

  getActiveEnvironment() {
    return Promise.resolve({});
  }

  createEnvironment() {
    return Promise.resolve({});
  }

  removeEnvironment() {
    return Promise.resolve({});
  }

  installPackage() {
    return Promise.resolve({});
  }

  updatePackage() {
    return Promise.resolve({});
  }

  removePackage() {
    return Promise.resolve({});
  }

  getAllInstalledPackages() {
    return Promise.resolve([]);
  }

  searchPackage() {
    return Promise.resolve([]);
  }

  downloadFile() {
    return Promise.resolve({});
  }

  readFile() {
    return Promise.resolve("");
  }

  writeFile() {
    return Promise.resolve({});
  }

  close() {}
}
