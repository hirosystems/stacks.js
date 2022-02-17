const config = require('../../configs/webpack.config.js');

config.output.library.name = 'StacksStorage';

config.resolve = {
  extensions: ['.ts', '.js'],
  fallback: {
    stream: require.resolve('stream-browserify'),
  },
};

module.exports = config;
