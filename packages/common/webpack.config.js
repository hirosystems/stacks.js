const config = require('../../configs/webpack.config.js');

config.output.library.name = 'StacksCommon';

config.resolve.fallback = {};

module.exports = config;
