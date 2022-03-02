const config = require('../../configs/webpack.config.js');

config.output.library.name = 'StacksBns';

config.resolve.fallback = {};

module.exports = config;
