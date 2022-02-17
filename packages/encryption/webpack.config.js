const config = require('../../configs/webpack.config');
const path = require('path');

module.exports = {
  ...config,
  output: {
    library: {
      name: 'StacksEncryption',
      type: 'umd',
    },
    filename: 'index.umd.js',
    path: path.resolve(__dirname, 'dist'),
    globalObject: 'this',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      // global: require.resolve('../../configs/polyfillGlobal.js'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
    },
  },
};
