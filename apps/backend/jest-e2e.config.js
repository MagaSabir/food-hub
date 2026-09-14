module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.e2e-spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  globalSetup: '<rootDir>/../e2e-global-setup.ts',
  testTimeout: 60_000,
  maxWorkers: 1,
};
