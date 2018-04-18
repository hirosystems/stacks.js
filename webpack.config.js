const webpack = require('webpack');
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const ROOT = process.cwd();
const BUILD_PATH = path.join(ROOT, 'dist');

module.exports = {
  entry: {
    blockstack: path.resolve(__dirname, 'lib/index.js')
  },
  output: {
    library: 'blockstack',
    libraryTarget: 'commonjs-module',
    filename: '[name].js',
    path: BUILD_PATH
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          compress: {
            warnings: false,
            comparisons: false
          },
          mangle: {
            safari10: true,
            reserved: ['BigInteger', 'ECPair', 'Point']
          },
          output: {
            comments: false,
            ascii_only: true
          }
        },
        parallel: true,
        cache: true,
        sourceMap: true
      })
    ]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV)
      }
    })
  ]
};
