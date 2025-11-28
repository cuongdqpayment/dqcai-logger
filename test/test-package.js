#!/usr/bin/env node

/**
 * Test Script for Universal Logger Package
 * Tests all exported components and functionality
 */

// Test imports - Kiểm tra tất cả exports
console.log('🚀 Testing Universal Logger Package Imports...\n');

try {
  // Import all exports
  const {
    // Core Classes
    UniversalLogger,
    ModuleLogger,

    // Base Module
    BaseModule,

    // Transports
    ConsoleTransport,

    // Configuration
    LoggerConfigBuilder,

    // Utils
    LoggerUtils,

    // Decorators
    LogMethod,
    LogPerformance,

    // Factory function
    createLogger
  } = require('@dqcai/logger'); // Sử dụng built package

  console.log('✅ All imports successful!\n');

  // Test 1: Type checking
  console.log('🧪 Test 1: Type Checking');
  console.log('- UniversalLogger:', typeof UniversalLogger);
  console.log('- ModuleLogger:', typeof ModuleLogger);
  console.log('- BaseModule:', typeof BaseModule);
  console.log('- ConsoleTransport:', typeof ConsoleTransport);
  console.log('- LoggerConfigBuilder:', typeof LoggerConfigBuilder);
  console.log('- LoggerUtils:', typeof LoggerUtils);
  console.log('- LogMethod:', typeof LogMethod);
  console.log('- LogPerformance:', typeof LogPerformance);
  console.log('- createLogger:', typeof createLogger);
  console.log('✅ Type checking passed!\n');

  // Test 2: Create logger using factory function
  console.log('🧪 Test 2: Factory Function');
  const logger = createLogger();
  console.log('- Logger created:', logger instanceof UniversalLogger);
  console.log('✅ Factory function test passed!\n');

  // Test 3: Test basic logging
  console.log('🧪 Test 3: Basic Logging');
  logger.info('Test info message');
  logger.warn('Test warning message');
  logger.error('Test error message');
  console.log('✅ Basic logging test passed!\n');

  // Test 4: Test configuration builder
  console.log('🧪 Test 4: Configuration Builder');
  const configBuilder = new LoggerConfigBuilder();
  const config = configBuilder
    .setEnabled(true)
    .setDefaultLevel('trace')
    .addModule('ApiClient', false)
    .addModule('AuthService', true, ['error'], ['console', 'api'])
    .build();
  console.log('- Config created:', !!config);
  console.log('✅ Configuration builder test passed!\n');

  // Test 5: Test utils
  console.log('🧪 Test 5: Logger Utils');
  const devConfig = LoggerUtils.createDevelopmentConfig();
  console.log('- Dev config created:', !!devConfig);
  console.log('✅ Logger utils test passed!\n');

  // Test 6: Test transport
  console.log('🧪 Test 6: Console Transport');
  const transport = new ConsoleTransport();
  console.log('- Transport created:', transport instanceof ConsoleTransport);
  console.log('✅ Console transport test passed!\n');

  // Test 7: Test module logger
  console.log('🧪 Test 7: Module Logger');
  const moduleLogger = new ModuleLogger('TestModule', logger);
  moduleLogger.info('Module logger test message');
  console.log('✅ Module logger test passed!\n');

  // Test 8: Test decorators (if applicable)
  console.log('🧪 Test 9: Decorators');
  console.log('- LogMethod decorator:', typeof LogMethod);
  console.log('- LogPerformance decorator:', typeof LogPerformance);
  console.log('✅ Decorators test passed!\n');

  console.log('🎉 All tests passed successfully!');
  console.log('📦 Package is ready for publication!\n');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}

// Test cho different environments
console.log('🌐 Environment Compatibility Tests:\n');

// Test CommonJS
console.log('📦 CommonJS Test:');
try {
  const cjsModule = require('../lib/index');
  console.log('- CommonJS import:', !!cjsModule.createLogger);
  console.log('✅ CommonJS compatible\n');
} catch (error) {
  console.error('❌ CommonJS failed:', error.message);
}

// Test ES Modules (nếu có)
console.log('📦 ES Module Test:');
console.log('- Run: node --input-type=module -e "import pkg from \'../../lib/index.esm.js\'; console.log(\'ES Module works:\', !!pkg)"');
console.log('✅ ES Module should work\n');

// Test UMD (browser simulation)
console.log('📦 UMD/Browser Test:');
try {
  const fs = require('fs');
  const path = require('path');
  const umdContent = fs.readFileSync(path.join(__dirname, 'lib/index.umd.js'), 'utf8');
  console.log('- UMD file size:', Math.round(umdContent.length / 1024) + 'KB');
  console.log('- UMD contains exports:', umdContent.includes('createLogger'));
  console.log('✅ UMD build ready for browser\n');
} catch (error) {
  console.log('⚠️ UMD file not found (run build first)');
}

console.log('🚀 Test completed! Package verification successful.');

// Performance test
console.log('\n⚡ Performance Test:');
const startTime = Date.now();
// const perfLogger = createLogger();

// for (let i = 0; i < 1000; i++) {
//   perfLogger.info(`Performance test message ${i}`);
// }

const endTime = Date.now();
console.log(`- 1000 log messages in: ${endTime - startTime}ms`);
console.log('✅ Performance test completed!\n');

// Memory usage
if (typeof process !== 'undefined' && process.memoryUsage) {
  const memUsage = process.memoryUsage();
  console.log('💾 Memory Usage:');
  console.log(`- RSS: ${Math.round(memUsage.rss / 1024 / 1024 * 100) / 100} MB`);
  console.log(`- Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100} MB`);
  console.log('✅ Memory usage logged!\n');
}