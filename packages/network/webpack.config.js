const config = require('../../configs/webpack.config.js');

config.output.library.name = 'StacksNetwork';

config.resolve = {
  extensions: ['.ts', '.js'],
  fallback: {},
};

module.exports = config;
