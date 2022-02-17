const config = require('../../configs/webpack.config.js');

config.output.library.name = 'StacksWalletSdk';

config.resolve = {
  extensions: ['.ts', '.js'],
  fallback: {
    assert: require.resolve('assert/'),
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
  },
};

module.exports = config;
