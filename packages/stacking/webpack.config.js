const config = require('../../configs/webpack.config.js');

config.output.library.name = 'StacksStacking';

config.resolve.fallback = {
  stream: require.resolve('stream-browserify'),
};

module.exports = config;
