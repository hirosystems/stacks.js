const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (env, argv) => {

  env = env || {};
  argv = argv || {};
  const isEnvAnalyze = process.env.ANALYZE || env.ANALYZE;
  const isEnvDev = [process.env, env.NODE_ENV, argv.mode].includes('development') || env.development;
  const isEnvTest = [process.env, env.NODE_ENV, argv.mode].includes('test') || env.test;

  if (isEnvAnalyze) {
    console.log(`Webpack with 'ANALYZE' environment enabled`);
  }
  if (isEnvDev) {
    console.log(`Webpack with 'DEVELOPMENT' environment enabled`);
  }
  if (isEnvTest) {
    console.timeLog(`Webpack with 'TEST' environment enabled`);
  }
  
  return {
    entry: './src/index.ts',
    devtool: "source-map",
    module: {
      rules: [
        {
          test: /\.ts?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: "tsconfig.browser.json"
              }
            }
          ]
        },
        {
          test: /\.js$/,
          use: {
            loader: 'babel-loader'
          }
        }
      ].concat((isEnvDev || isEnvTest) ? {
        test: /\.js$/,
        use: ["source-map-loader"],
        enforce: "pre"
      } : [])
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    output: {
      filename: 'blockstack.js',
      path: path.resolve(__dirname, 'dist'),
      library: 'blockstack',
      libraryTarget: 'umd',
      globalObject: 'this'
    },
    plugins: [].concat(isEnvAnalyze ? new BundleAnalyzerPlugin() : [])
  }
};
