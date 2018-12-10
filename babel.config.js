module.exports = function (api) {

  // TODO: Should cache on api.caller and api.env for faster build times.
  api.cache.invalidate(() => true);

  let opts;

  const isBrowserify = api.caller(caller => caller && caller.name === "babelify");
  if (isBrowserify) {
    // Configure babel to compile for wide-spread web browser support.
    opts = {
      presets: [
        "@babel/preset-flow",
        [
          "@babel/preset-env",
          {
            "useBuiltIns": "usage"
          }
        ]
      ],
      plugins: [
        "@babel/plugin-proposal-class-properties",
        [
          "@babel/plugin-transform-runtime",
          {
            "helpers": false
          }
        ]
      ]
    };
  }
  else {
    // Configure babel to compile as a Node.js lib with only the transforms needed for Node LTS.
    // In this case we only need to strip Flow syntax and translate es6 modules to commonJS modules.
    opts = {
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
  }

  const isDevEnv = api.env(["development", "test"]);
  if (isDevEnv) {
    opts.sourceMaps = "both";
  }

  return opts;
}
