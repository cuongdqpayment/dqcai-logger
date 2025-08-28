import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.ts', // Điểm vào từ mã TypeScript. -- phương án build trong tham số lệnh
  external: [], // Không có external deps
  output: [
    {
      file: 'lib/index.js', // CommonJS
      format: 'cjs',
      sourcemap: true, // Tùy chọn: Thêm source map để debug
      exports: 'auto'
    },
    {
      file: 'lib/index.mjs', // ES Module
      format: 'esm',
      sourcemap: true,
    },
    {
      file: 'lib/index.umd.js', // UMD cho browser và hybrid
      format: 'umd',
      name: 'Logger', // Tên global variable cho browser
      sourcemap: true,
    },
  ],
  plugins: [
    nodeResolve(), // Giải quyết các phụ thuộc node_modules
    commonjs(), // Chuyển đổi CommonJS sang ESM nếu cần
    typescript({
      tsconfig: './tsconfig.json', declaration: true,
      declarationDir: 'lib',
      declarationMap: true, // Tạo .d.ts.map để debug
      rootDir: 'src'
    }), // Biên dịch TypeScript


  ],
  external: [], // Chỉ định các phụ thuộc bên ngoài nếu cần (ví dụ: không bundle tslib nếu dùng importHelpers)
};