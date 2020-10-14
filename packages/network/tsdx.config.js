module.exports = {
  rollup(config, options) {
    if (options.format === 'esm') {
      config.output = {
        ...config.output,
        dir: 'dist/',
        entryFileNames: '[name].esm.js',
        preserveModules: true,
        preserveModulesRoot: 'src',
      };
      delete config.output.file;
    }
    return config;
  },
};
