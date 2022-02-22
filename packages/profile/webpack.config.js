const config = require('../../configs/webpack.config.js');

config.output.library.name = 'StacksProfile';

config.resolve.fallback = {};

module.exports = config;
