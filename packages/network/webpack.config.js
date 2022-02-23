const config = require('../../configs/webpack.config.js');

config.output.library.name = 'StacksNetwork';

config.resolve.fallback = {};

module.exports = config;
