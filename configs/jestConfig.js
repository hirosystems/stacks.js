const path = require('path');

if (process.env.SKIP_TESTS) {
  console.log('Skipping tests...');
  process.exit(0);
}

module.exports = packageDirname => {
  return {
    rootDir: packageDirname,
    preset: 'ts-jest',
    testEnvironment: 'node',
    coverageDirectory: './coverage/',
    collectCoverage: true,
    moduleNameMapper: require('jest-module-name-mapper').default(
      path.resolve(packageDirname, 'tsconfig.json')
    ),
    globals: {
      'ts-jest': {
        tsconfig: path.resolve(packageDirname, 'tsconfig.json'),
        diagnostics: {
          ignoreCodes: ['TS151001'],
        },
      },
    },
    moduleFileExtensions: ['js', 'ts', 'd.ts'],
    setupFilesAfterEnv: [path.resolve(__dirname, 'jestSetup.js')],
    testTimeout: 10_000,
  };
};
