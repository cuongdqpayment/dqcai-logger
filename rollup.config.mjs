import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import esbuild from "rollup-plugin-esbuild";

// loại bỏ các thư viện phụ thuộc vào bundle để khi cần mới cài
const external = [
  "axios",
  "sqlite3",
  "better-sqlite3",
  "electron",
  "react-native-fs",
  "@dqcai/orm",
];

export default {
  input: "src/index.ts", // Điểm vào từ mã TypeScript. -- phương án build trong tham số lệnh
  external,
  output: [
    {
      file: "lib/index.js", // CommonJS use: import ... from '...';
      format: "cjs",
      sourcemap: true, // Tùy chọn: Thêm source map để debug
      inlineDynamicImports: true,
      exports: "auto",
    },
    {
      file: "lib/index.mjs", // ES Module: use = require('..');
      format: "esm",
      inlineDynamicImports: true,
      sourcemap: true,
    },
    {
      file: "lib/index.umd.js", // UMD cho browser và hybrid
      format: "umd",
      inlineDynamicImports: true,
      name: "Logger", // Tên global variable cho browser
      sourcemap: true,

    },
  ],
  plugins: [
    nodeResolve(), // Giải quyết các phụ thuộc node_modules
    commonjs(), // Chuyển đổi CommonJS sang ESM nếu cần
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,
      declarationDir: "lib",
      declarationMap: true, // Tạo .d.ts.map để debug
      rootDir: "src",
    }), // Biên dịch TypeScript
    esbuild({
      minify: true,
      target: "es2017", // Target ES version phù hợp: ES2017+ cho modern browsers // RN 0.60+
    }),
  ],
};
