const path = require('path');
if (process.env.SKIP_TESTS) {
  console.log('Skipping tests...');
  process.exit(0);
}
module.exports = {
  rootDir: __dirname,
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageDirectory: './coverage/',
  collectCoverage: true,
  moduleNameMapper: require('jest-module-name-mapper').default(
    path.resolve(__dirname, 'tsconfig.json')
  ),
  globals: {
    'ts-jest': {
      tsconfig: path.resolve(__dirname, 'tsconfig.json'),
      diagnostics: {
        ignoreCodes: ['TS151001'],
      },
    },
  },
  moduleFileExtensions: ['js', 'ts', 'd.ts'],
  setupFiles: ['./tests/global-setup.ts'],
  setupFilesAfterEnv: ['./tests/setup.ts'],
  testTimeout: 10000,
};
