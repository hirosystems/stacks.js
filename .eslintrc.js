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
    '@typescript-eslint/explicit-module-boundary-types': [0],
    '@typescript-eslint/prefer-regexp-exec': [0],
    '@typescript-eslint/ban-ts-comment': [0],
    '@typescript-eslint/restrict-template-expressions': [0],
    '@typescript-eslint/no-inferrable-types': [0],
    '@typescript-eslint/no-unnecessary-type-assertion': [0],

    // TODO: enable the `no-unsafe-*` rules
    '@typescript-eslint/no-unsafe-argument': [0],
    '@typescript-eslint/no-unsafe-assignment': [0],
    '@typescript-eslint/no-unsafe-call': [0],
    '@typescript-eslint/no-unsafe-return': [0],
    '@typescript-eslint/no-unsafe-member-access': [0],
    '@typescript-eslint/no-non-null-assertion': [0],

    'import/no-extraneous-dependencies': ['error'],
  },
};
