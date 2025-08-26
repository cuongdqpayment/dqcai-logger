import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    typecheck: {
      tsconfig: './tsconfig.json',
    },
  },
  resolve: {
    alias: {
      '@dqcai/logger': new URL('./src', import.meta.url).pathname,
    },
  },
  esbuild: {
    target: 'node18',
    format: 'esm',
  },
})