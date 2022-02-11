const config = require('../../configs/webpack.config');
const path = require('path');

module.exports = {
  ...config,
  output: {
    library: 'StacksNetwork',
    libraryTarget: 'umd',
    filename: 'index.umd.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {},
  },
};
