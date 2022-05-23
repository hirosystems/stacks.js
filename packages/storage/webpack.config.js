const config = require('../../configs/webpack.config.js');

config.output.library.name = 'StacksStorage';

config.resolve.fallback = {};

module.exports = config;
