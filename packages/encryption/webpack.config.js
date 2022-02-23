const config = require('../../configs/webpack.config.js');

config.output.library.name = 'StacksEncryption';

config.resolve.fallback = {
  crypto: require.resolve('crypto-browserify'),
  stream: require.resolve('stream-browserify'),
};

module.exports = config;
