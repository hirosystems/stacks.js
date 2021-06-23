const path = require('path');
const webpack = require('webpack');
module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  output: {
    library: 'StacksWalletSdk',
    libraryTarget: 'umd',
    filename: 'index.umd.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      crypto: false,
      events: false,
      stream: false,
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              configFile: 'tsconfig.build.json',
            },
          },
        ],
      },
    ],
  },
};
