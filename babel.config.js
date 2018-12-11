module.exports = (api) => {
  // TODO: Should cache on api.caller and api.env for faster build times.
  api.cache.invalidate(() => true)

  const isBrowserify = api.caller(caller => caller && caller.name === 'babelify')
  const isWebpack = api.caller(caller => caller && caller.name === 'babel-loader')
  const isTestEnv = api.env('test')
  const isDevEnv = api.env('development')

  console.log(`[Babel] Running for env: ${api.env()}`)
  
  // Called by browserify - using babel config for web browser lib dist with wide-spread browser support.
  const configBrowserify = {
    presets: [
      '@babel/preset-flow',
      [
        '@babel/preset-env',
        {
          useBuiltIns: 'usage'
        }
      ]
    ],
    plugins: [
      '@babel/plugin-proposal-class-properties',
      [
        '@babel/plugin-transform-runtime',
        {
          helpers: false
        }
      ]
    ]
  }


  // Called by webpack - using babel config for web browser lib dist with wide-spread browser support.
  const configWebpack = {
    presets: [
      '@babel/preset-flow',
      [
        '@babel/preset-env',
        {
          useBuiltIns: 'usage'
        }
      ]
    ],
    plugins: [
      '@babel/plugin-proposal-class-properties',
      [
        '@babel/plugin-transform-runtime',
        {
          helpers: false
        }
      ]
    ]
  }

  // Babel config to compile as a Node.js lib with only the transforms needed for Node LTS.
  // In this case we only need to strip Flow syntax and translate es6 modules to commonJS modules.
  const configNodeLibDist = {
    presets: [
      '@babel/preset-flow'
    ],
    plugins: [
      [
        '@babel/plugin-transform-modules-commonjs', {
          loose: true
        }
      ]
    ]
  }

  let opts
  
  if (isBrowserify || isWebpack) {
    console.log('[Babel] Performing transform for web browser target via webpack.')
    opts = configBrowserify
  } else if (isWebpack) {
    console.log('[Babel] Performing transform for web browser target via browserify.')
    opts = configWebpack
  } else if (isTestEnv) {
    // Configure options required for nyc/tape coverage reporting.
    // Use the same babel config for web browser.
    // See https://github.com/blockstack/blockstack.js/issues/534
    console.log('[Babel] Performing transform for web browser target with code coverage options enabled.')
    opts = configBrowserify
    opts.sourceMaps = 'inline'
    opts.plugins.push('istanbul')
  } else {
    // Node.js lib dist config.
    console.log('[Babel] Performing transform for Node.js library target.')
    opts = configNodeLibDist
    // Use full source maps in development env.
    if (isDevEnv) {
      console.warn('[Babel] Enabling full debug source maps because of ENV dev param.')
      opts.sourceMaps = 'both'
    }
  }

  return opts
}
