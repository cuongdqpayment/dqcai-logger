import { defineConfig } from 'tsup'

export default defineConfig([
  // Main build for Node.js and Web
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    minify: false, // Disable minification for better debugging
    outDir: 'dist',
    target: 'es2020',
    platform: 'neutral',
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.cjs' : '.js',
      }
    },
    esbuildOptions(options) {
      options.conditions = ['import', 'module', 'default']
    },
  },
  
  // React Native specific build
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    minify: false,
    outDir: 'dist/react-native',
    target: 'es2019', // React Native compatible target
    platform: 'neutral',
    define: {
      'process.env.PLATFORM': '"react-native"',
    },
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.cjs' : '.js',
      }
    },
    esbuildOptions(options) {
      options.conditions = ['react-native', 'import', 'module', 'default']
      options.mainFields = ['react-native', 'module', 'main']
    },
  },

  // Web-specific transports
  {
    entry: {
      'web/FileTransport': 'src/transports/web/FileTransport.ts'      
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    minify: false,
    outDir: 'dist',
    target: 'es2020',
    platform: 'browser',
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.cjs' : '.js',
      }
    },
  }
])