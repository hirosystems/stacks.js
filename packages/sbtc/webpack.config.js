const config = require('../../configs/webpack.config.js');

config.output.library.name = 'StacksSbtc';

config.resolve.fallback = {};

module.exports = config;
