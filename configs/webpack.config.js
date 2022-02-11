const webpack = require('webpack');

// default webpack.config.js (missing `output`, `resolve`)
module.exports = {
  mode: 'production',
  entry: './src/index.ts',
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
