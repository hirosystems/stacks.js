const config = require('../../configs/webpack.config.js');

config.output.library.name = 'StacksAuth';

config.resolve.fallback = {
  stream: require.resolve('stream-browserify'),
};

module.exports = config;
