import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import inject from '@rollup/plugin-inject';
import pkg from './package.json';

export default [
  {
    input: 'src/index.ts',
    external: [...Object.keys(pkg.dependencies || {})],
    output: [
      {
        dir: 'dist',
        format: 'cjs',
        entryFileNames: '[name].js',
        sourcemap: true,
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
      {
        dir: 'dist/esm',
        format: 'esm',
        entryFileNames: '[name].js',
        sourcemap: true,
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    ],
    plugins: [
      typescript({ tsconfig: 'tsconfig.build.json' }),
      json(),
      inject({ Buffer: ['buffer', 'Buffer'] }),
      nodeResolve({ preferBuiltins: false }),
      commonjs(),
    ],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.umd.js',
        format: 'umd',
        name: 'StacksTransactions',
        sourcemap: true,
        preserveModulesRoot: 'src',
      },
    ],
    plugins: [
      typescript({ tsconfig: 'tsconfig.build.json' }),
      json(),
      nodeResolve({ preferBuiltins: false }),
      commonjs(),
    ],
  },
];
