import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import inject from '@rollup/plugin-inject';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import globals from 'rollup-plugin-node-globals';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/polyfill/index.js',
    format: 'esm',
    intro: 'window.global = window',
  },
  external: [/\@stacks\/.*\/dist\/polyfill/],
  plugins: [
    // IMPORTANT PLUGIN ORDER:
    // - alias > resolve
    // - commonjs > replace
    // - commonjs > typescript
    // - inject Buffer > typescript
    alias({
      entries: [
        // polyfills
        { find: 'stream', replacement: 'vite-compatible-readable-stream' },
        { find: 'crypto', replacement: 'crypto-browserify' },
        { find: 'readable-stream', replacement: 'vite-compatible-readable-stream' },
        { find: 'brorand', replacement: require.resolve('./polyfills/brorand.js') },

        // replace @stacks with their polyfill versions
        { find: '@stacks/auth', replacement: '@stacks/auth/dist/polyfill' },
        { find: '@stacks/bns', replacement: '@stacks/bns/dist/polyfill' },
        { find: '@stacks/common', replacement: '@stacks/common/dist/polyfill' },
        { find: '@stacks/encryption', replacement: '@stacks/encryption/dist/polyfill' },
        { find: '@stacks/keychain', replacement: '@stacks/keychain/dist/polyfill' },
        { find: '@stacks/network', replacement: '@stacks/network/dist/polyfill' },
        { find: '@stacks/profile', replacement: '@stacks/profile/dist/polyfill' },
        { find: '@stacks/stacking', replacement: '@stacks/stacking/dist/polyfill' },
        { find: '@stacks/storage', replacement: '@stacks/storage/dist/polyfill' },
        { find: '@stacks/transactions', replacement: '@stacks/transactions/dist/polyfill' },
        { find: '@stacks/wallet-sdk', replacement: '@stacks/wallet-sdk/dist/polyfill' },
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
        'process.browser': true,
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
      // todo: disable declaration dist building
    }),
    json({
      compact: true,
      // todo: ignore non-english wordlists (currently causes commonjs to ignore needed deps)
      // proposed regex: include: /^(?!.*wordlist(?!.*english)).*/,
    }),
    terser(),
  ],
};
