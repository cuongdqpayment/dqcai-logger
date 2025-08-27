import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    typecheck: {
      tsconfig: './tsconfig.json',
    },
  },
  resolve: {
    alias: {
      '@dqcai/logger': resolve(__dirname, './src/index.ts'),
      '@dqcai/logger/': resolve(__dirname, './src/'),
    },
  },
  esbuild: {
    target: 'node18',
    format: 'esm',
  },
})