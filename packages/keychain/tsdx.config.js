const emptyFile = 'export default {}';
const emptyFileName = '\0empty_module';

function ignore(list) {
  return {
    resolveId(importee) {
      return (
        list.some(function(regex) {
          return regex.test(importee);
        }) && emptyFileName
      );
    },
    load(id) {
      return id === emptyFileName ? emptyFile : null;
    },
  };
}

module.exports = {
  rollup(config, options) {
    config.plugins.push(ignore([/\.\/wordlists\/(?!english\.json)/]));
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
