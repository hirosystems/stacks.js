const config = require('../../configs/webpack.config.js');

config.output.library.name = 'StacksWalletSdk';

config.resolve.fallback = {
  util: require.resolve('util/'),
};

module.exports = config;
