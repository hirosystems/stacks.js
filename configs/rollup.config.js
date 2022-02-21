import commonjs from '@rollup/plugin-commonjs';
import inject from '@rollup/plugin-inject';
import polyfillLegacy from 'rollup-plugin-node-polyfills';
import polyfill from 'rollup-plugin-polyfill-node';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import globals from 'rollup-plugin-external-globals';
import esbuild from 'rollup-plugin-esbuild';
import replace from '@rollup/plugin-replace';
import alias from '@rollup/plugin-alias';

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
    alias({
      entries: [
        { find: 'crypto', replacement: 'crypto-browserify' },
        { find: 'stream', replacement: 'stream-browserify' },
        { find: 'randombytes', replacement: 'randombytes/browser' },
        { find: 'inherits', replacement: 'inherits/inherits_browser' },
        // {
        //   find: './wordlists/english.json',
        //   replacement: 'node_modules/bip39/src/wordlists/english.json',
        // },
      ],
    }),
    resolve({ browser: true, preferBuiltins: false }),
    // polyfillLegacy({ crypto: true }), // `des` error
    polyfill(),
    commonjs({
      ignoreTryCatch: false,
      // transformMixedEsModules: true,
      // extensions: ['.js', '.ts'],
      // dynamicRequireTargets: ['node_modules/bip39/src/wordlists/english.json'],
    }),

    replace({
      // 'process.browser': true, // not needed when resolve browser true
      'process.env.NODE_ENV': false,
      'process.env.NODE_DEBUG': false,
      // "require('./wordlists/english.json')": require('bip39/src/wordlists/english.json'),
    }),

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
