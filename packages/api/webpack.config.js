const config = require('../../configs/webpack.config.js');

config.output.library.name = 'StacksApi';

config.resolve.fallback = {};

module.exports = config;
