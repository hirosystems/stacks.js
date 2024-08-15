const config = require('../../configs/webpack.config.js');

config.output.library.name = 'StacksRpcClient';

config.resolve.fallback = {};

module.exports = config;
