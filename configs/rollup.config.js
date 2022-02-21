import commonjs from '@rollup/plugin-commonjs';
import inject from '@rollup/plugin-inject';
import polyfillLegacy from 'rollup-plugin-node-polyfills';
import polyfill from 'rollup-plugin-polyfill-node';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
// import globals from 'rollup-plugin-external-globals';
import esbuild from 'rollup-plugin-esbuild';
import replace from '@rollup/plugin-replace';
import alias from '@rollup/plugin-alias';

import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';

const tsResolver = resolve({
  extensions: ['.ts'],
});

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/rollup.js',
    format: 'esm',
    intro: 'window.global = window.self = window',
  },
  external: [/\@stacks\/.*/],
  plugins: [
    // IMPORT PLUGIN ORDER:
    // - alias > resolve
    // - cjs > ts
    // - inject 'Buffer' > ts

    alias({
      entries: [
        { find: 'fs', replacement: 'bro-fs' },
        { find: 'http', replacement: 'http-browserify' },
        { find: 'path', replacement: 'path-browserify' },
        { find: 'stream', replacement: 'vite-compatible-readable-stream' },
        { find: 'crypto', replacement: 'crypto-browserify' },
        { find: 'randombytes', replacement: 'randombytes/browser' },
        { find: 'inherits', replacement: 'inherits/inherits_browser' },
        { find: 'readable-stream', replacement: 'vite-compatible-readable-stream' },
        { find: 'url', replacement: require.resolve('url') },
        { find: 'util', replacement: require.resolve('util') },
        { find: 'brorand', replacement: require.resolve('./brorand.js') },
      ],
    }),
    resolve({
      // browser: true,
      // dedupe: ['readable-stream'],
      mainFields: ['browser', 'module', 'main', 'jsnext:main'],
      preferBuiltins: false,
    }),

    commonjs({
      ignoreTryCatch: false,
      // extensions: ['.js', '.ts'],
    }),
    // polyfillLegacy({ crypto: true }), // `des` error
    replace({
      //   delimiters: ['', ''],
      values: {
        // Get around circular dependency issues caused by readable-stream
        // "require('readable-stream/duplex')": 'require("vite-compatible-readable-stream").Duplex',
        // 'require("readable-stream/duplex")': 'require("vite-compatible-readable-stream").Duplex',
        // "require('readable-stream/passthrough')":
        //   'require("vite-compatible-readable-stream").PassThrough',
        // 'require("readable-stream/passthrough")':
        //   'require("vite-compatible-readable-stream").PassThrough',
        // "require('readable-stream/readable')":
        //   'require("vite-compatible-readable-stream").Readable',
        // 'require("readable-stream/readable")':
        //   'require("vite-compatible-readable-stream").Readable',
        // "require('readable-stream/transform')":
        //   'require("vite-compatible-readable-stream").Transform',
        // 'require("readable-stream/transform")':
        //   'require("vite-compatible-readable-stream").Transform',
        // "require('readable-stream/writable')":
        //   'require("vite-compatible-readable-stream").Writable',
        // 'require("readable-stream/writable")':
        //   'require("vite-compatible-readable-stream").Writable',
        // "require('readable-stream')": 'require("vite-compatible-readable-stream")',
        // 'require("readable-stream")': 'require("vite-compatible-readable-stream")',
        // custom
        'process.browser': true, // not needed when resolve browser true
        'process.env.NODE_ENV': false,
        'process.env.NODE_DEBUG': false,
        'process.env.READABLE_STREAM': false,
      },
    }),
    // polyfill(),

    // commonjs({
    //   ignoreTryCatch: false,
    //   // extensions: ['.js', '.ts'],
    // }),

    globals(),
    // builtins(),

    inject({
      Buffer: ['buffer', 'Buffer'],
    }),

    typescript({
      tsconfig: './tsconfig.build.json',
    }),

    json({ compact: true }), // todo: remove non-english wordlists

    // globals({
    //   global: 'window'
    // }),
  ],
};
