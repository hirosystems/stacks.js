const path = require('path')

module.exports = (env, args) => {
  const isDevMode = !args.mode || args.mode === 'development'
  const isBrowserTestsEnv = env === 'browsertests'

  const outputOpts = {
    filename: 'blockstack.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'blockstack'
  }
  
  if (isBrowserTestsEnv) {
    console.warn('[Webpack] Writing bundle.js to browser tests directory.')
    outputOpts.filename = 'bundle.js'
    outputOpts.path = path.resolve(__dirname, 'tests', 'browserTests')
  }
  
  return {
    devtool: (isDevMode | isBrowserTestsEnv) ? 'source-map' : false,
    entry: './src/index.js',
    output: outputOpts,
    devServer: {
      https: true,
      contentBase: path.join(__dirname, 'tests', 'browserTests'),
      filename: 'bundle.js'
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /(node_modules|bower_components)/,
          use: [
            {
              loader: 'babel-loader'
            }
          ]
        }
      ]
    }
  }
}
