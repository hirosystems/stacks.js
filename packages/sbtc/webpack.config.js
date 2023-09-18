const config = require('../../configs/webpack.config.js');

config.output.library.name = 'StacksStacking';

config.resolve.fallback = {};

module.exports = config;
