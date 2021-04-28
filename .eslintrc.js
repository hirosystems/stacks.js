module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  reportUnusedDisableDirectives: true,
  extends: '@stacks/eslint-config',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./packages/**/tsconfig.json', './tsconfig.json'],
  },
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': [0],
    '@typescript-eslint/prefer-regexp-exec': [0],
    '@typescript-eslint/ban-ts-comment': [0],
    '@typescript-eslint/restrict-template-expressions': [0],
    '@typescript-eslint/no-inferrable-types': [0],
    // TODO: enable the `no-unsafe-*` rules
    '@typescript-eslint/no-unsafe-assignment': [0],
    '@typescript-eslint/no-unsafe-call': [0],
    '@typescript-eslint/no-unsafe-return': [0],
    '@typescript-eslint/no-unsafe-member-access': [0],
    '@typescript-eslint/no-non-null-assertion': [0],
  },
};
