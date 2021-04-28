module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageDirectory: './coverage/',
  collectCoverage: true,
  moduleNameMapper: require('jest-module-name-mapper').default(),
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
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
