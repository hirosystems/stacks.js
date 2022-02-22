const webpack = require('webpack');
const path = require('path');

// Run with ANALYZE ENV to show bundle size (only works with cjs)
// e.g.: ANALYZE=true lerna run --scope @stacks/wallet-sdk build
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const NODE_ENV_PRODUCTION = 'production';
const NODE_ENV_DEVELOPMENT = 'development';

const isAnalyze = !!process.env.ANALYZE;
const isProduction = process.env.NODE_ENV === NODE_ENV_PRODUCTION;

module.exports = {
  mode: isProduction ? NODE_ENV_PRODUCTION : NODE_ENV_DEVELOPMENT,
  entry: ['./src/index.ts'],
  output: {
    library: {
      // name: is set in package config
      type: isAnalyze ? 'commonjs' : 'umd',
    },
    filename: 'index.js',
    path: path.resolve(process.cwd(), 'dist/umd'),
    globalObject: 'this', // recommended for umd bundles in webpack
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: require.resolve('process/browser'), // unclear which @stacks package dependencies introduce this (not common, not network)
    }),
    isAnalyze && new BundleAnalyzerPlugin(),
  ].filter(Boolean),
  optimization: {
    minimize: isProduction,
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'esbuild-loader',
            options: {
              loader: 'tsx',
              target: 'es2017',
              tsconfigRaw: require(path.resolve(process.cwd(), 'tsconfig.build.json')),
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@stacks/auth': '@stacks/auth/dist/umd',
      '@stacks/bns': '@stacks/bns/dist/umd',
      '@stacks/common': '@stacks/common/dist/umd',
      '@stacks/encryption': '@stacks/encryption/dist/umd',
      '@stacks/keychain': '@stacks/keychain/dist/umd',
      '@stacks/network': '@stacks/network/dist/umd',
      '@stacks/profile': '@stacks/profile/dist/umd',
      '@stacks/stacking': '@stacks/stacking/dist/umd',
      '@stacks/storage': '@stacks/storage/dist/umd',
      '@stacks/transactions': '@stacks/transactions/dist/umd',
      '@stacks/wallet-sdk': '@stacks/wallet-sdk/dist/umd',
    },
    // fallback: is set in package config
  },
};
