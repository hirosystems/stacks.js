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
};
