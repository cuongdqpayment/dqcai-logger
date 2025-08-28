import {
  UniversalLogger,
  ModuleLogger,
  createLogger,
  LoggerUtils
} from '../../lib/index.esm.js';

console.log('🧪 ES Module Test Starting...');

try {
  // Test imports
  console.log('✅ ES Module imports successful');
  
  // Test functionality
  const logger = createLogger();
  logger.info('ES Module test message');
  
  // Test module logger
  const moduleLogger = new ModuleLogger('ESTest', logger);
  moduleLogger.info('Module logger from ES import');
  
  console.log('🎉 ES Module test passed!');
} catch (error) {
  console.error('❌ ES Module test failed:', error);
  process.exit(1);
}