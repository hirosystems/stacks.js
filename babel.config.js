module.exports = function (api) {

  // TODO: Should cache on api.caller and api.env for faster build times.
  api.cache.invalidate(() => true);

  const isTestEnv = api.env("test");
  const isDevEnv = api.env("development");

  // Babel config for web browser lib dist with wide-spread browser support.
  let opts = {
    presets: [
      "@babel/preset-env",
      "@babel/preset-typescript"
    ],
    plugins: [
      "@babel/proposal-class-properties",
      "@babel/proposal-object-rest-spread"
    ]
  };

  if (isTestEnv) {
    // Configure options required for nyc/tape coverage reporting.
    // Use the same babel config for web browser.
    // See https://github.com/blockstack/blockstack.js/issues/534
    opts = configBrowserify;
    opts.sourceMaps = "inline";
    opts.plugins.push("istanbul");
  }

  // Use full source maps in development env.
  if (!opts.sourceMaps && isDevEnv) {
    opts.sourceMaps = "both";
  }

  return opts;
}
