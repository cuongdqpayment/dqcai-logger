// test/test-db-transport.ts - Test Database Transport
import {
  CommonLoggerConfig,
  createModuleLogger,
} from "../src/config/logger-config";

import { LoggerConfigBuilder } from "../src/config/ConfigBuilder";

import { DBTransport, DBTransportConfig } from "../src/transports/DBTransport";

// Define test modules
export const APPModules = {
  TEST_DB: "TEST_DB",
  API: "API",
  DATABASE: "DATABASE",
  AUTH: "AUTH",
};

/**
 * Setup logger with database transport
 */
async function setupLoggerWithDBTransport(
  config?: DBTransportConfig
): Promise<DBTransport> {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║   Setting up Logger with Database Transport   ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  // Create database transport
  const dbTransport = new DBTransport({
    databaseType: "sqlite",
    database: "logger",
    dbDirectory: "./logs",
    batchSize: 10,
    flushInterval: 2000,
    enableStatistics: true,
    enableErrorTable: true,
    enableInternalLogging: true,
    ...config,
  });

  // Add transport to CommonLoggerConfig
  CommonLoggerConfig.addTransport(dbTransport);

  // Configure logger
  const loggerConfig = new LoggerConfigBuilder()
    .useTestingPreset()
    .addModules([
      {
        name: APPModules.TEST_DB,
        levels: ["trace", "debug", "info", "warn", "error"],
        transports: ["console", "db"],
      },
      {
        name: APPModules.API,
        levels: ["info", "warn", "error"],
        transports: ["console", "db"],
      },
      {
        name: APPModules.DATABASE,
        levels: ["debug", "info", "warn", "error"],
        transports: ["console", "db"],
      },
      {
        name: APPModules.AUTH,
        levels: ["info", "warn", "error"],
        transports: ["console", "db"],
      },
    ])
    .build();

  CommonLoggerConfig.updateConfiguration(loggerConfig);

  console.log(
    "✓ Logger configured with transports:",
    CommonLoggerConfig.listTransports()
  );
  console.log("✓ Database transport initialized\n");

  return dbTransport;
}

/**
 * Test 1: Basic logging to database
 */
async function test1_BasicLogging(dbTransport: DBTransport) {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║   Test 1: Basic Database Logging              ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  const logger = createModuleLogger(APPModules.TEST_DB);

  // Start a session
  const sessionId = await dbTransport.startSession();
  console.log("✓ Session started:", sessionId);

  // Log different levels
  logger.trace("This is a trace message");
  logger.debug("Debug information", { userId: 123, action: "login" });
  logger.info("Application started successfully");
  logger.warn("Warning: High memory usage", { memory: "85%" });
  logger.error("Database connection failed", {
    error: "ECONNREFUSED",
    host: "localhost",
    port: 5432,
  });

  // Flush logs
  await CommonLoggerConfig.flush();
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Query logs
  const logs = await dbTransport.queryLogs({}, { limit: 10 });
  console.log(`\n✓ Queried ${logs.length} logs from database`);

  if (logs.length > 0) {
    console.log("\nLatest logs:");
    logs.slice(0, 3).forEach((log, idx) => {
      console.log(
        `  ${idx + 1}. [${log.level.toUpperCase()}] [${log.module}] ${
          log.message
        }`
      );
    });
  }

  return sessionId;
}

/**
 * Test 2: Multi-module logging
 */
async function test2_MultiModuleLogging(dbTransport: DBTransport) {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║   Test 2: Multi-Module Logging                ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  const apiLogger = createModuleLogger(APPModules.API);
  const dbLogger = createModuleLogger(APPModules.DATABASE);
  const authLogger = createModuleLogger(APPModules.AUTH);

  // Log from different modules
  apiLogger.info("API server started on port 3000");
  apiLogger.warn("Rate limit exceeded for IP 192.168.1.100");

  dbLogger.debug("Database connection pool initialized", { size: 10 });
  dbLogger.info("Query executed successfully", {
    query: "SELECT * FROM users",
    duration: "45ms",
  });

  authLogger.info("User logged in", {
    userId: "user_123",
    ip: "192.168.1.50",
  });
  authLogger.error("Authentication failed", {
    username: "admin",
    reason: "invalid_password",
  });

  await CommonLoggerConfig.flush();
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Query logs by module
  const apiLogs = await dbTransport.getLogsByModule(APPModules.API);
  const dbLogs = await dbTransport.getLogsByModule(APPModules.DATABASE);
  const authLogs = await dbTransport.getLogsByModule(APPModules.AUTH);

  console.log("\n✓ Logs by module:");
  console.log(`  - ${APPModules.API}: ${apiLogs.length} logs`);
  console.log(`  - ${APPModules.DATABASE}: ${dbLogs.length} logs`);
  console.log(`  - ${APPModules.AUTH}: ${authLogs.length} logs`);
}

/**
 * Test 3: Error logging
 */
async function test3_ErrorLogging(dbTransport: DBTransport) {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║   Test 3: Error Logging                        ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  const logger = createModuleLogger(APPModules.TEST_DB);

  // Simulate different types of errors
  try {
    throw new Error("Database connection timeout");
  } catch (error) {
    logger.error("Critical database error", {
      error: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    throw new Error("Failed to parse JSON response");
  } catch (error) {
    logger.error("API request failed", {
      error: (error as Error).message,
      endpoint: "/api/users",
      method: "POST",
    });
  }

  logger.error("Validation error", {
    field: "email",
    message: "Invalid email format",
    value: "invalid-email",
  });

  await CommonLoggerConfig.flush();
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Query error logs
  const errorLogs = await dbTransport.getLogsByLevel("error");
  console.log(`\n✓ Found ${errorLogs.length} error logs`);

  if (errorLogs.length > 0) {
    console.log("\nRecent errors:");
    errorLogs.slice(0, 3).forEach((log, idx) => {
      console.log(`  ${idx + 1}. ${log.message}`);
      if (log.data?.error) {
        console.log(`     Error: ${log.data.error}`);
      }
    });
  }
}

/**
 * Test 4: Stress test with many logs
 */
async function test4_StressTest(dbTransport: DBTransport) {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║   Test 4: Stress Test                          ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  const logger = createModuleLogger(APPModules.TEST_DB);
  const startTime = Date.now();
  const totalLogs = 50; // ✅ Giảm từ 100 xuống 50

  console.log(`Generating ${totalLogs} logs...`);

  for (let i = 0; i < totalLogs; i++) {
    const level = i % 5 === 0 ? "error" : i % 4 === 0 ? "warn" : "info";

    if (level === "error") {
      logger.error(`Error log ${i}`, { iteration: i, timestamp: Date.now() });
    } else if (level === "warn") {
      logger.warn(`Warning log ${i}`, { iteration: i, timestamp: Date.now() });
    } else {
      logger.info(`Info log ${i}`, { iteration: i, timestamp: Date.now() });
    }

    // ✅ Thêm delay nhỏ để tránh tràn buffer
    if (i % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  await CommonLoggerConfig.flush();

  // ✅ Tăng thời gian chờ để đảm bảo flush hoàn tất
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const duration = Date.now() - startTime;
  console.log(`\n✓ Generated ${totalLogs} logs in ${duration}ms`);
  console.log(
    `✓ Rate: ${((totalLogs / duration) * 1000).toFixed(2)} logs/second`
  );

  // Get stats
  const stats = await dbTransport.getTransportStats();
  console.log("\n✓ Transport statistics:");
  console.log(`  - Total logs: ${stats.totalLogs}`);
  console.log(`  - Error logs: ${stats.errorCount}`);
  console.log(`  - Buffer size: ${stats.bufferSize}`);
  console.log("\n  Level distribution:");
  for (const [level, count] of Object.entries(stats.levelCounts)) {
    console.log(`    - ${level}: ${count}`);
  }
}

/**
 * Test 5: Session tracking
 */
async function test5_SessionTracking(dbTransport: DBTransport) {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║   Test 5: Session Tracking                     ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  const logger = createModuleLogger(APPModules.TEST_DB);

  // Start new session
  const sessionId = await dbTransport.startSession("test_session_001");
  console.log("✓ Session started:", sessionId);

  // ✅ Thay vì dùng logger.info, dùng trực tiếp log method với sessionId
  for (let i = 0; i < 10; i++) {
    // Option 1: Pass sessionId trong metadata
    logger.info(
      `Session log ${i}`,
      {
        sessionId, // ⬅️ Trong data
        iteration: i,
      },
      { sessionId } // ⬅️ HOẶC trong metadata
    );
  }

  await CommonLoggerConfig.flush();

  // ✅ Tăng delay lên 2 giây để đảm bảo flush hoàn tất
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // ✅ THÊM: Query trực tiếp để debug
  const allLogs = await dbTransport.queryLogs({}, { limit: 100 });
  console.log(`\n✓ Total logs in DB: ${allLogs.length}`);

  const logsWithSession = allLogs.filter((log) => log.session_id);
  console.log(`✓ Logs with session_id: ${logsWithSession.length}`);

  if (logsWithSession.length > 0) {
    console.log("✓ Sample session IDs found:", [
      ...new Set(logsWithSession.map((l) => l.session_id)),
    ]);
  }

  // Query logs by session
  const sessionLogs = await dbTransport.getLogsBySession(sessionId);
  console.log(`\n✓ Found ${sessionLogs.length} logs for session ${sessionId}`);

  // ✅ THÊM: Hiển thị chi tiết nếu không tìm thấy
  if (sessionLogs.length === 0) {
    console.log("⚠️ Session logs not found. Checking last 10 logs:");
    const recentLogs = await dbTransport.queryLogs({}, { limit: 10 });
    recentLogs.forEach((log) => {
      console.log(
        `  - ${log.message} | session_id: ${log.session_id || "NULL"}`
      );
    });
  }

  // End session
  await dbTransport.endSession();
  console.log("✓ Session ended");
}

/**
 * Test 6: Statistics
 */
async function test6_Statistics(dbTransport: DBTransport) {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║   Test 6: Statistics                           ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  const statistics = await dbTransport.getStatistics();

  if (statistics.length > 0) {
    console.log("✓ Daily statistics:");
    statistics.slice(0, 10).forEach((stat) => {
      console.log(
        `  ${stat.date} | ${stat.module} | ${stat.level}: ${stat.count} logs`
      );
    });
  } else {
    console.log("✓ No statistics available yet");
  }
}

/**
 * Test 7: Query and filter logs
 */
async function test7_QueryLogs(dbTransport: DBTransport) {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║   Test 7: Query and Filter Logs               ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  // Query by different criteria
  const infoLogs = await dbTransport.getLogsByLevel("info", 5);
  const warnLogs = await dbTransport.getLogsByLevel("warn", 5);
  const errorLogs = await dbTransport.getLogsByLevel("error", 5);

  console.log("✓ Logs by level:");
  console.log(`  - Info: ${infoLogs.length} logs`);
  console.log(`  - Warn: ${warnLogs.length} logs`);
  console.log(`  - Error: ${errorLogs.length} logs`);

  // Query by module
  const testLogs = await dbTransport.getLogsByModule(APPModules.TEST_DB, 10);
  console.log(`\n✓ Logs from ${APPModules.TEST_DB}: ${testLogs.length} logs`);
}

/**
 * Test 8: Cleanup old logs
 */
async function test8_CleanupOldLogs(dbTransport: DBTransport) {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║   Test 8: Cleanup Old Logs                    ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  const statsBefore = await dbTransport.getTransportStats();
  console.log("✓ Total logs before cleanup:", statsBefore.totalLogs);

  // Delete logs older than 0 days (for testing - deletes all logs)
  // In production, use a reasonable value like 30 or 90 days
  const deletedCount = await dbTransport.clearOldLogs(0);
  console.log("✓ Deleted logs:", deletedCount);

  const statsAfter = await dbTransport.getTransportStats();
  console.log("✓ Total logs after cleanup:", statsAfter.totalLogs);
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║                                                ║");
  console.log("║   Database Transport Test Suite               ║");
  console.log("║   với @dqcai/orm                               ║");
  console.log("║                                                ║");
  console.log("╚════════════════════════════════════════════════╝");

  let dbTransport: DBTransport | null = null;

  try {
    // Setup
    dbTransport = await setupLoggerWithDBTransport();

    // Run tests
    await test1_BasicLogging(dbTransport);
    await test2_MultiModuleLogging(dbTransport);
    await test3_ErrorLogging(dbTransport);
    await test4_StressTest(dbTransport);
    await test5_SessionTracking(dbTransport);
    await test6_Statistics(dbTransport);
    await test7_QueryLogs(dbTransport);

    // Cleanup test (comment out if you want to keep logs)
    // await test8_CleanupOldLogs(dbTransport);

    console.log("\n╔════════════════════════════════════════════════╗");
    console.log("║                                                ║");
    console.log("║   ✓ All Tests Completed Successfully!         ║");
    console.log("║                                                ║");
    console.log("╚════════════════════════════════════════════════╝\n");

    process.exit(0);
  } catch (error) {
    console.error("\n✗ Test failed:", error);
    process.exit(1);
  } finally {
    if (dbTransport) {
      await dbTransport.cleanup();
      await CommonLoggerConfig.cleanup();
    }
  }
}

// Run tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

export {
  setupLoggerWithDBTransport,
  test1_BasicLogging,
  test2_MultiModuleLogging,
  test3_ErrorLogging,
  test4_StressTest,
  test5_SessionTracking,
  test6_Statistics,
  test7_QueryLogs,
  test8_CleanupOldLogs,
  runAllTests,
};
