// ./test/logger.ts
import {
  CommonLoggerConfig,
  LoggerConfigBuilder,
  createModuleLogger,
  CommonModules,
} from "@dqcai/logger";

// ========== APP MODULES ==========
export const APPModules = {
  ...CommonModules,
  TEST_ORM: "Test-ORM",
  TEST_SUITE: "TestSuite",
};

// ========== CONFIGURE LOGGER FOR TEST ENVIRONMENT ==========
console.log("### -->Configuring logger for test environment...");

const testConfig = new LoggerConfigBuilder()
  .setEnabled(true)
  .setDefaultLevel("trace")  // ✅ Set trace for test
  .build();

// ✅ Update configuration BEFORE any imports
CommonLoggerConfig.updateConfiguration(testConfig);

console.log("### -->Logger configured for test!");
console.log("Test logger config:", CommonLoggerConfig.getCurrentConfig());

// Export configured logger utilities
export { CommonLoggerConfig, createModuleLogger };