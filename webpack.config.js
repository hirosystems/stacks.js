const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const WebpackAssetsManifest = require('webpack-assets-manifest');
const semver = require('semver');

/**
 * Generates markdown example for using the blockstack.js dist file with a CDN 
 * and Subresource Integrity. Uses the lib version specified in the package.json. 
 * Writes the output to a template string defined in `README.md`.
 * If the version has a prerelease tag, then no changes are written. 
 * @see https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
 * @param {string} sriHash The hash string used for the script `integrity` attribute.
 */
function writeDistFileDoc(sriHash) {
  const { version } = require(path.resolve(__dirname, 'package.json'));
  if (semver.prerelease(version)) {
    console.warn(`Version ${version} has a prerelease tag, the CDN readme snippet will not be updated`);
    return;
  }
  console.warn(`Updating the CDN readme snippet for version ${version}`);
  const cdnTemplate = '\n```html\n' + 
    `<script src="https://unpkg.com/blockstack@${version}/dist/blockstack.js" integrity="${sriHash}" crossorigin="anonymous"></script>` +
    "\n```\n";
  const readmePath = path.resolve(__dirname, 'README.md');
  const readmeContent = fs.readFileSync(readmePath, { encoding: 'utf8' });
  const replaceRegex = /(<!-- cdn -->)([^]*)(<!-- cdnstop -->)/gi;
  const updatedReadmeContent = readmeContent.replace(replaceRegex, (...args) => `${args[1]}${cdnTemplate}${args[3]}`);
  fs.writeFileSync(readmePath, updatedReadmeContent, { encoding: 'utf8' });
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
    externals: {
      
    },
    plugins: [
      // BIP39 includes ~240KB of non-english json that we don't currently use.
      new webpack.IgnorePlugin(/\.\/wordlists\/(?!english\.json)/),

      // Ignore require('crypto') because it has browser implementations.
      new webpack.IgnorePlugin(/^crypto$/),

      // Ignore require('url') because it is only needed in node.js.
      new webpack.IgnorePlugin(/^url$/)
    ]
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
