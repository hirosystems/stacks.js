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
    sourcemap: true,
  },
  external: [/\@stacks\/.*/],
  plugins: [
    // IMPORTANT PLUGIN ORDER:
    // - alias > resolve
    // - commonjs > replace
    // - commonjs > typescript
    // - inject Buffer > typescript
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
    }),
    terser(),
  ],
};
