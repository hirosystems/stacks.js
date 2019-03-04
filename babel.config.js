module.exports = function (api) {

  // TODO: Should cache on api.caller and api.env for faster build times.
  api.cache.invalidate(() => true);


  const isBrowserify = api.caller(caller => caller && caller.name === "babelify");
  const isTestEnv = api.env("test");
  const isDevEnv = api.env("development");


  // Babel config for web browser lib dist with wide-spread browser support.
  let configBrowserify = {
    presets: [
      "@babel/preset-flow",
      "@babel/preset-env"
    ],
    plugins: [
      "@babel/plugin-proposal-class-properties",
      "@babel/plugin-transform-runtime"
    ]
  };

  // Babel config to compile as a Node.js lib with only the transforms needed for Node LTS.
  // In this case we only need to strip Flow syntax and translate es6 modules to commonJS modules.
  let configNodeLibDist = {
    presets: [
      "@babel/preset-flow"
    ],
    plugins: [
      [
        "@babel/plugin-transform-modules-commonjs", {
          "loose": true
        }
      ]
    ]
  };


  let opts;
  if (isBrowserify) {
    // Web browser config.
    opts = configBrowserify;
  }
  else if (isTestEnv) {
    // Configure options required for nyc/tape coverage reporting.
    // Use the same babel config for web browser.
    // See https://github.com/blockstack/blockstack.js/issues/534
    opts = configBrowserify;
    opts.sourceMaps = "inline";
    opts.plugins.push("istanbul");
  }
  else {
    // Node.js lib dist config.
    opts = configNodeLibDist;
  }

  // Use full source maps in development env.
  if (!opts.sourceMaps && isDevEnv) {
    opts.sourceMaps = "both";
  }

  return opts;
}
