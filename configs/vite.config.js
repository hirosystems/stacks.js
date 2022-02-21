import { defineConfig } from 'vite';
import typescript from '@rollup/plugin-typescript';
import autoExternal from 'rollup-plugin-auto-external';
import polyfill from 'rollup-plugin-node-polyfills';
import { babel, getBabelOutputPlugin } from '@rollup/plugin-babel';

import externals from 'rollup-plugin-node-externals';
import inject from '@rollup/plugin-inject';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';

import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

import path from 'path';

const customResolver = resolve({
  extensions: ['.js'],
  preferBuiltins: false,
});

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      fileName: () => 'vite.js',
      formats: ['es'],
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [/\@stacks\/.*/],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        // globals: {
        //   vue: 'Vue',
        // },
      },
    },
  },
  // esbuild: false,
  plugins: [
    alias({
      // customResolver,
      entries: [{ find: /inherits.*/, replacement: require.resolve('inherits/inherits_browser') }],
    }),
    resolve({ preferBuiltins: true }), // before commonjs

    polyfill({ crypto: true }),
    commonjs({}), // before babel
    typescript({
      tsconfig: './tsconfig.build.json',
    }),
    // inject({
    //   // Buffer: [require.resolve('./shim.js'), 'Buffer'],
    //   Buffer: ['buffer', 'Buffer'],
    //   // include: /.*\.js$/,
    // }),
    // babel({ babelHelpers: 'runtime' }),
    // getBabelOutputPlugin({
    //   presets: ['@babel/preset-env'],
    //   plugins: [['@babel/plugin-transform-runtime', { useESModules: true }]],
    // }),
  ],
  // resolve: {
  //   alias: {
  //     // process: 'process/browser',
  //     // stream: 'stream-browserify',
  //     // zlib: 'browserify-zlib',
  //     // util: 'util',
  //     inherits: 'inherits/inherits_browser',
  //   },
  // },
  optimizeDeps: {
    exclude: ['sha.js'],
  },
});
