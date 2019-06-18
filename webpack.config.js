const path = require('path');
const fs = require('fs');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const WebpackAssetsManifest = require('webpack-assets-manifest');

/**
 * Generates markdown example for using the blockstack.js dist file with a CDN 
 * and Subresource Integrity. Uses the lib version specified in the package.json. 
 * Writes the output to `mdincludes/script-dist-file.md`.
 * @see https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
 * @param {string} sriHash The hash string used for the script `integrity` attribute.
 */
function writeDistFileDoc(sriHash) {
  const { version } = require(path.resolve(__dirname, 'package.json'));
  const cdnUrl = `https://unpkg.com/blockstack@${version}/dist/blockstack.js`;
  const scriptTag = `<script src="${cdnUrl}" integrity="${sriHash}" crossorigin="anonymous"></script>`;
  const docOutput = "```html\n" + scriptTag + "\n```";
  const outputDir = path.resolve(__dirname, 'mdincludes');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'script-dist-file.md'), docOutput)
}

module.exports = (env, argv) => {

  env = env || {};
  argv = argv || {};
  const isEnvAnalyze = process.env.ANALYZE || env.ANALYZE;
  const isEnvDev = [process.env, env.NODE_ENV, argv.mode].includes('development') || env.development;
  const isEnvTest = [process.env, env.NODE_ENV, argv.mode].includes('test') || env.test;
  const isEnvProd = [process.env, env.NODE_ENV, argv.mode].includes('production') || env.production;

  if (isEnvAnalyze) {
    console.log(`Webpack with 'ANALYZE' environment enabled`);
  }
  if (isEnvDev) {
    console.log(`Webpack with 'DEVELOPMENT' environment enabled`);
  }
  if (isEnvTest) {
    console.timeLog(`Webpack with 'TEST' environment enabled`);
  }

  const opts = {
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
    plugins: []
  }

  if (isEnvAnalyze) {
    opts.plugins.push(new BundleAnalyzerPlugin())
  }

  if (isEnvProd) {
    opts.plugins.push(new WebpackAssetsManifest({
      integrity: true, 
      integrityHashes: ['sha384'], 
      customize(entry, original, manifest, asset) {
        if (entry.value === 'blockstack.js') {
          writeDistFileDoc(asset.integrity);
          return { key: entry.value, value: asset.integrity };
        }
      }
    }))
  }

  return opts;
};
