const config = require('../../configs/webpack.config.js');

config.output.library.name = 'StacksEncryption';

config.resolve.fallback = {
  crypto: false,
};

module.exports = config;
