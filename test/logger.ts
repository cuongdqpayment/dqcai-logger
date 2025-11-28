// ./test/logger.ts
import {
  CommonLoggerConfig,
  LoggerConfigBuilder,
  createModuleLogger,
  CommonModules,
} from "../src/index";

// ========== APP MODULES ==========
const APPModules = {
  ...CommonModules,
  TEST_NODEJS:"NODEJS-FILE"
};

// ========== CONFIGURE LOGGER FOR TEST ENVIRONMENT ==========
console.log("### -->Configuring logger for test environment...");

const testConfig = new LoggerConfigBuilder()
  .setEnabled(true)
  .setDefaultLevel("trace") 
  .build();

// ✅ Update configuration BEFORE any imports
CommonLoggerConfig.updateConfiguration(testConfig);

console.log("### -->Logger configured for test!");
console.log("Test logger config:", CommonLoggerConfig.getCurrentConfig());

// Export configured logger utilities
export { APPModules, createModuleLogger };