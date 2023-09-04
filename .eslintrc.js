module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  reportUnusedDisableDirectives: true,
  extends: ['@stacks/eslint-config', 'plugin:import/typescript'],
  plugins: ['@typescript-eslint', 'node', 'import'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./packages/**/tsconfig.json', './tsconfig.json'],
  },
  settings: {
    node: {
      tryExtensions: ['.ts'],
    },
  },
  ignorePatterns: ['**/*.js'],
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': ['off'],
    '@typescript-eslint/prefer-regexp-exec': ['off'],
    '@typescript-eslint/ban-ts-comment': ['off'],
    '@typescript-eslint/restrict-template-expressions': ['off'],
    '@typescript-eslint/no-inferrable-types': ['off'],
    '@typescript-eslint/no-unnecessary-type-assertion': ['off'],

    // TODO: enable the `no-unsafe-*` rules
    '@typescript-eslint/no-unsafe-argument': ['off'],
    '@typescript-eslint/no-unsafe-assignment': ['off'],
    '@typescript-eslint/no-unsafe-call': ['off'],
    '@typescript-eslint/no-unsafe-return': ['off'],
    '@typescript-eslint/no-unsafe-member-access': ['off'],
    '@typescript-eslint/no-unsafe-enum-comparison': ['off'],
    '@typescript-eslint/no-non-null-assertion': ['off'],

    'import/no-extraneous-dependencies': ['error'],
    'no-new-wrappers': ['error'],
  },
};
