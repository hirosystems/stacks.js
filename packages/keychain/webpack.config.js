const config = require('../../configs/webpack.config.js');

config.output.library.name = 'StacksKeychain';

config.resolve.fallback = {
  crypto: require.resolve('crypto-browserify'),
  stream: require.resolve('stream-browserify'),
  util: require.resolve('util/'),
};

module.exports = config;
