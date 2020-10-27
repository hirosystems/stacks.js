module.exports = {
  root: true,
  reportUnusedDisableDirectives: true,
  extends: ['@blockstack/eslint-config'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./packages/**/tsconfig.json', './tsconfig.json']
  }
};
