const config = require('../../configs/webpack.config.js');

config.output.library.name = 'StacksStorage';

config.resolve.fallback = {
  stream: require.resolve('stream-browserify'),
};

module.exports = config;
