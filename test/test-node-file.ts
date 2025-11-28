// test/test-node-file.ts - Test Node.js File Transport với Logger Integration
import {
  NodeFileTransport,
  NodeFileTransportConfig,
} from "../src/transports/NodeFileTransport";
import { 
  CommonLoggerConfig, 
  createModuleLogger,
  LoggerDebugs 
} from "../src/config/logger-config";
import { LoggerConfigBuilder } from "../src/config/ConfigBuilder";

// Define test modules
export const APPModules = {
  TEST_NODEJS: "TEST_NODEJS",
  FILE_TRANSPORT: "FILE_TRANSPORT",
  STRESS_TEST: "STRESS_TEST",
  PARSE_TEST: "PARSE_TEST",
};

/**
 * Setup logger với file transport
 */
async function setupLoggerWithFileTransport(
  config: NodeFileTransportConfig
): Promise<NodeFileTransport> {
  // Tạo file transport
  const fileTransport = new NodeFileTransport(config);

  // Thêm transport vào CommonLoggerConfig
  CommonLoggerConfig.addTransport(fileTransport);

  // Cấu hình logger với tất cả log levels
  const loggerConfig = new LoggerConfigBuilder()
    .useTestingPreset() // trace level cho testing
    .addModule(APPModules.TEST_NODEJS, true, 
      ['trace', 'debug', 'info', 'warn', 'error'], 
      ['console', 'node-file'])
    .addModule(APPModules.FILE_TRANSPORT, true,
      ['trace', 'debug', 'info', 'warn', 'error'],
      ['console', 'node-file'])
    .build();

  CommonLoggerConfig.updateConfiguration(loggerConfig);

  console.log("✓ Logger configured with transports:", CommonLoggerConfig.listTransports());

  return fileTransport;
}

/**
 * Test 1: Khởi tạo và ghi logs cơ bản
 */
async function test1_BasicLogging() {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║   Test 1: Basic Logging with File Transport   ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  const fileTransport = await setupLoggerWithFileTransport({
    filePath: "./logs/test-basic.log",
    maxFileSize: 1024 * 10, // 10KB
    maxFiles: 3,
    enableInternalLogging: false
  });

  const logger = createModuleLogger(APPModules.TEST_NODEJS);

  // Ghi các loại log khác nhau
  logger.trace("Trace message - very detailed");
  logger.debug("Debug info", { userId: 123, action: "login" });
  logger.info("Ứng dụng đã khởi động");
  logger.warn("Cảnh báo: Bộ nhớ sắp đầy", { memory: "85%" });
  logger.error("Lỗi kết nối database", { error: "ECONNREFUSED", code: 500 });

  // Chờ logs được ghi
  await CommonLoggerConfig.flush();
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Đọc logs từ file
  const logs = await fileTransport.getLogs();
  console.log(`✓ Đã ghi ${logs.length} file log`);
  
  if (logs.length > 0) {
    const lines = logs[0].split('\n').filter(l => l.trim());
    console.log(`✓ Số dòng trong file: ${lines.length}`);
    console.log(`✓ Dòng đầu tiên:`, lines[0]?.substring(0, 100) + '...');
  }

  return fileTransport;
}

/**
 * Test 2: Test file rotation khi đạt dung lượng
 */
async function test2_FileRotation() {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║   Test 2: File Rotation                        ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  // Reset logger config
  CommonLoggerConfig.setTransports([]);
  
  const fileTransport = await setupLoggerWithFileTransport({
    filePath: "./logs/test-rotation.log",
    maxFileSize: 500, // 500 bytes - rất nhỏ để test rotation
    maxFiles: 5,
    enableInternalLogging: false
  });

  const logger = createModuleLogger(APPModules.FILE_TRANSPORT);

  // Ghi nhiều logs để trigger rotation
  console.log("Đang ghi logs để test rotation...");
  for (let i = 1; i <= 20; i++) {
    logger.info(`Log entry số ${i}`, {
      index: i,
      data: 'x'.repeat(50), // Tăng kích thước
      timestamp: Date.now()
    });
    
    if (i % 5 === 0) {
      await CommonLoggerConfig.flush();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Đợi logs được ghi xong
  await CommonLoggerConfig.flush();
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Kiểm tra số file đã rotate
  const logs = await fileTransport.getLogs();
  console.log(`✓ Số file sau rotation: ${logs.length}`);
  
  logs.forEach((content, idx) => {
    const lines = content.split('\n').filter(l => l.trim());
    console.log(`  - File ${idx}: ${lines.length} dòng, ${content.length} bytes`);
  });

  return fileTransport;
}

/**
 * Test 3: Ghi logs từ nhiều modules
 */
async function test3_MultiModuleLogging() {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║   Test 3: Multi-Module Logging                 ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  CommonLoggerConfig.setTransports([]);
  
  const fileTransport = await setupLoggerWithFileTransport({
    filePath: "./logs/test-multi-module.log",
    maxFileSize: 5 * 1024, // 5KB
    maxFiles: 3,
    enableInternalLogging: false
  });

  // Cấu hình nhiều modules
  const config = new LoggerConfigBuilder()
    .useTestingPreset()
    .addModules([
      {
        name: APPModules.TEST_NODEJS,
        levels: ['trace', 'debug', 'info', 'warn', 'error'],
        transports: ['console', 'node-file']
      },
      {
        name: APPModules.FILE_TRANSPORT,
        levels: ['debug', 'info', 'warn', 'error'],
        transports: ['console', 'node-file']
      },
      {
        name: APPModules.STRESS_TEST,
        levels: ['info', 'warn', 'error'],
        transports: ['console', 'node-file']
      }
    ])
    .build();

  CommonLoggerConfig.updateConfiguration(config);

  // Ghi logs từ các modules khác nhau
  const logger1 = createModuleLogger(APPModules.TEST_NODEJS);
  const logger2 = createModuleLogger(APPModules.FILE_TRANSPORT);
  const logger3 = createModuleLogger(APPModules.STRESS_TEST);

  logger1.info("Message from TEST_NODEJS module");
  logger2.debug("Message from FILE_TRANSPORT module");
  logger3.warn("Message from STRESS_TEST module");

  logger1.error("Error in TEST_NODEJS", { code: 'ERR_001' });
  logger2.info("Info from FILE_TRANSPORT", { status: 'ok' });
  logger3.error("Critical error in STRESS_TEST", { severity: 'high' });

  await CommonLoggerConfig.flush();
  await new Promise(resolve => setTimeout(resolve, 500));

  // Đọc và phân tích logs
  const logs = await fileTransport.getLogs();
  const allLines = logs.flatMap(content => 
    content.split('\n').filter(l => l.trim())
  );

  console.log(`✓ Tổng số logs: ${allLines.length}`);
  
  // Đếm logs theo module
  const moduleCount: Record<string, number> = {};
  allLines.forEach(line => {
    try {
      const entry = JSON.parse(line);
      moduleCount[entry.module] = (moduleCount[entry.module] || 0) + 1;
    } catch {}
  });

  console.log("✓ Logs theo module:");
  Object.entries(moduleCount).forEach(([module, count]) => {
    console.log(`  - ${module}: ${count} logs`);
  });

  return fileTransport;
}

/**
 * Test 4: Stress test với nhiều logs
 */
async function test4_StressTest() {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║   Test 4: Stress Test                          ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  CommonLoggerConfig.setTransports([]);
  
  const fileTransport = await setupLoggerWithFileTransport({
    filePath: "./logs/test-stress.log",
    maxFileSize: 10 * 1024, // 10KB
    maxFiles: 3,
    enableInternalLogging: false
  });

  const logger = createModuleLogger(APPModules.STRESS_TEST);
  const startTime = Date.now();
  const totalLogs = 100;

  console.log(`Đang ghi ${totalLogs} logs...`);

  for (let i = 0; i < totalLogs; i++) {
    const level = i % 4 === 0 ? 'error' : i % 3 === 0 ? 'warn' : 'info';
    
    if (level === 'error') {
      logger.error(`Stress test error ${i}`, { iteration: i });
    } else if (level === 'warn') {
      logger.warn(`Stress test warning ${i}`, { iteration: i });
    } else {
      logger.info(`Stress test info ${i}`, { iteration: i });
    }

    // Flush mỗi 25 logs
    if (i % 25 === 0) {
      await CommonLoggerConfig.flush();
    }
  }

  await CommonLoggerConfig.flush();
  const duration = Date.now() - startTime;

  console.log(`✓ Ghi ${totalLogs} logs trong ${duration}ms`);
  console.log(`✓ Tốc độ: ${(totalLogs / duration * 1000).toFixed(2)} logs/giây`);

  await new Promise(resolve => setTimeout(resolve, 500));
  
  const logs = await fileTransport.getLogs();
  const totalLines = logs.reduce((sum, content) => {
    return sum + content.split('\n').filter(l => l.trim()).length;
  }, 0);
  
  console.log(`✓ Tổng số dòng đã ghi: ${totalLines}`);

  return fileTransport;
}

/**
 * Test 5: Đọc và parse logs
 */
async function test5_ReadAndParseLogs() {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║   Test 5: Read and Parse Logs                  ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  CommonLoggerConfig.setTransports([]);
  
  const fileTransport = await setupLoggerWithFileTransport({
    filePath: "./logs/test-parse.log",
    maxFileSize: 10 * 1024,
    maxFiles: 2,
    enableInternalLogging: false
  });

  const logger = createModuleLogger(APPModules.PARSE_TEST);

  // Ghi một số logs với data phức tạp
  logger.info("User logged in", { 
    userId: 'user123', 
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0'
  });
  
  logger.warn("High memory usage", { 
    memory: '85%',
    threshold: '80%',
    action: 'cleanup_required'
  });
  
  logger.error("API timeout", { 
    endpoint: '/api/users',
    timeout: 5000,
    retries: 3
  });
  
  logger.debug("Cache hit", { 
    key: 'user:123',
    ttl: 3600,
    hitRate: 0.85
  });

  await CommonLoggerConfig.flush();
  await new Promise(resolve => setTimeout(resolve, 500));

  // Đọc và parse logs
  const logs = await fileTransport.getLogs();
  console.log(`✓ Đọc được ${logs.length} file(s)\n`);

  logs.forEach((content, fileIdx) => {
    const lines = content.split('\n').filter(l => l.trim());
    console.log(`File ${fileIdx + 1} (${lines.length} logs):`);
    
    lines.slice(0, 5).forEach((line, idx) => {
      try {
        const entry = JSON.parse(line);
        console.log(`  ${idx + 1}. [${entry.level.toUpperCase()}] [${entry.module}] ${entry.message}`);
        if (entry.data) {
          console.log(`     → Data:`, JSON.stringify(entry.data, null, 2).split('\n').map(l => '       ' + l).join('\n').trim());
        }
      } catch (err) {
        console.log(`  ${idx + 1}. [PARSE ERROR]`);
      }
    });
    
    if (lines.length > 5) {
      console.log(`  ... and ${lines.length - 5} more logs`);
    }
    console.log();
  });

  return fileTransport;
}

/**
 * Test 6: Test transport statistics
 */
async function test6_TransportStatistics() {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║   Test 6: Transport Statistics                 ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  // Show logger statistics
  LoggerDebugs.showStats();

  // List all transports
  console.log("Active transports:", CommonLoggerConfig.listTransports());
  
  // Show config
  const config = CommonLoggerConfig.getCurrentConfig();
  console.log("\nCurrent configuration:");
  console.log("- Enabled:", config?.enabled);
  console.log("- Default level:", config?.defaultLevel);
  console.log("- Modules:", Object.keys(config?.modules || {}));
}

/**
 * Test 7: Cleanup và clear logs
 */
async function test7_Cleanup() {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║   Test 7: Cleanup and Clear Logs              ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  const fileTransport = new NodeFileTransport({
    filePath: "./logs/test-cleanup.log",
  });

  // Ghi một số logs
  const logger = createModuleLogger(APPModules.TEST_NODEJS);
  for (let i = 0; i < 5; i++) {
    logger.info(`Cleanup test log ${i}`);
  }

  await CommonLoggerConfig.flush();
  await new Promise(resolve => setTimeout(resolve, 500));

  let logs = await fileTransport.getLogs();
  console.log(`✓ Logs trước khi xóa: ${logs.length} file(s)`);

  // Clear logs
  await fileTransport.clearLogs();
  console.log(`✓ Đã thực hiện clearLogs()`);

  await new Promise(resolve => setTimeout(resolve, 500));
  logs = await fileTransport.getLogs();
  console.log(`✓ Logs sau khi xóa: ${logs.length} file(s)`);

  // Cleanup transports
  await CommonLoggerConfig.cleanup();
  console.log(`✓ Đã cleanup all transports`);
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║                                                ║");
  console.log("║   Node.js File Transport Test Suite           ║");
  console.log("║   với Logger Integration                       ║");
  console.log("║                                                ║");
  console.log("╚════════════════════════════════════════════════╝");

  try {
    await test1_BasicLogging();
    await test2_FileRotation();
    await test3_MultiModuleLogging();
    await test4_StressTest();
    await test5_ReadAndParseLogs();
    await test6_TransportStatistics();
    await test7_Cleanup();

    console.log("\n╔════════════════════════════════════════════════╗");
    console.log("║                                                ║");
    console.log("║   ✓ All Tests Completed Successfully!         ║");
    console.log("║                                                ║");
    console.log("╚════════════════════════════════════════════════╝\n");

    process.exit(0);
  } catch (error) {
    console.error("\n✗ Test failed:", error);
    process.exit(1);
  }
}

// Chạy tests nếu file được execute trực tiếp
if (require.main === module) {
  runAllTests().catch(console.error);
}

// Export để có thể import và chạy từng test riêng
export {
  setupLoggerWithFileTransport,
  test1_BasicLogging,
  test2_FileRotation,
  test3_MultiModuleLogging,
  test4_StressTest,
  test5_ReadAndParseLogs,
  test6_TransportStatistics,
  test7_Cleanup,
  runAllTests,
};