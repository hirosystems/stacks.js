#!/usr/bin/env node

require('ts-node').register({ dir: __dirname, transpileOnly: true });
require('./src/index.ts');
