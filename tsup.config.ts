import { defineConfig } from 'tsup'

export default defineConfig([
  // Main build
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    minify: true,
    outDir: 'dist',
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.cjs' : '.js',
      }
    },
  },
  // Environment-specific transports
  {
    entry: {
      'rn/FileTransport': 'src/transports/rn/FileTransport.ts',
      'web/FileTransport': 'src/transports/web/FileTransport.ts', 
      'node/FileTransport': 'src/transports/node/FileTransport.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false, // Don't clean since main build already did
    minify: true,
    outDir: 'dist',
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.cjs' : '.js',
      }
    },
  }
])