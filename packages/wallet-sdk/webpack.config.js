const config = require('../../configs/webpack.config');
const path = require('path');

module.exports = {
  ...config,
  output: {
    library: 'StacksWalletSdk',
    libraryTarget: 'umd',
    filename: 'index.umd.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      assert: require.resolve('assert/'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
    },
  },
};
