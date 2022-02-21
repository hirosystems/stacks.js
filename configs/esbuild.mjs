import { build } from 'esbuild';

import NodeGlobalsPolyfillPlugin from '@esbuild-plugins/node-globals-polyfill';
import NodeModulesPolyfillPlugin from '@esbuild-plugins/node-modules-polyfill';
import NodeResolvePlugin from '@esbuild-plugins/node-resolve';
import CommonjsPlugin from '@chialab/esbuild-plugin-commonjs';

build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  tsconfig: './tsconfig.build.json',
  outfile: 'dist/esbuild.js',
  define: {
    global: 'globalThis',
    this: 'globalThis',
  },
  plugins: [
    NodeGlobalsPolyfillPlugin.NodeGlobalsPolyfillPlugin({
      buffer: true,
    }),
    NodeModulesPolyfillPlugin.NodeModulesPolyfillPlugin(),
    NodeResolvePlugin.NodeResolvePlugin({
      extensions: ['.ts', '.js'],
      onResolved: resolved => {
        if (resolved.includes('node_modules')) {
          return {
            external: true,
          };
        }
        return resolved;
      },
    }),
    CommonjsPlugin(),
  ],
}).catch(() => process.exit(1));
