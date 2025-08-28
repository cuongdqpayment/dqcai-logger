import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: [
    // CommonJS cho Node.js và older bundlers
    {
      file: 'lib/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'auto'
    },
    // ES Modules cho modern bundlers
    {
      file: 'lib/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    // UMD cho browser trực tiếp
    {
      file: 'lib/index.umd.js',
      format: 'umd',
      name: '@dqcai/logger', // Tên global variable
      sourcemap: true,
    },
  ],
  plugins: [
    resolve({
      browser: true, // Hỗ trợ browser environment
      preferBuiltins: false,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
    }),
  ],
  // Không có external dependencies vì code thuần
};