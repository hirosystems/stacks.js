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
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 10000,
};
