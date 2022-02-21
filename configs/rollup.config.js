import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import inject from '@rollup/plugin-inject';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import globals from 'rollup-plugin-node-globals';

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
        { find: 'stream', replacement: 'vite-compatible-readable-stream' },
        { find: 'crypto', replacement: 'crypto-browserify' },
        { find: 'readable-stream', replacement: 'vite-compatible-readable-stream' },
        { find: 'brorand', replacement: require.resolve('./brorand.js') },
      ],
    }),
    resolve({
      mainFields: ['browser', 'module', 'main', 'jsnext:main'],
      preferBuiltins: false,
    }),
    commonjs({
      ignoreTryCatch: false,
    }),
    replace({
      values: {
        'process.browser': true, // not needed when resolve browser true
        'process.env.NODE_ENV': false,
        'process.env.NODE_DEBUG': false,
      },
    }),
    globals(),
    inject({
      Buffer: ['buffer', 'Buffer'],
    }),
    typescript({
      tsconfig: './tsconfig.build.json',
    }),
    json({ compact: true }), // todo: remove non-english wordlists
  ],
};
