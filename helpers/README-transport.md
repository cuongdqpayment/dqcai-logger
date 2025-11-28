# Hướng dẫn sử dụng Transport với Logger

## Các cải tiến đã thực hiện

### 1. **CommonLoggerConfig** - Thêm transport management methods

```typescript
// Thêm transport trước khi khởi tạo logger
CommonLoggerConfig.addTransport(transport);

// Thêm nhiều transports cùng lúc
CommonLoggerConfig.setTransports([transport1, transport2]);

// Xóa transport
CommonLoggerConfig.removeTransport('transport-name');

// Liệt kê transports đang active
const transports = CommonLoggerConfig.listTransports();

// Flush tất cả transports
await CommonLoggerConfig.flush();

// Cleanup tất cả transports
await CommonLoggerConfig.cleanup();
```

### 2. **LoggerConfigBuilder** - Thêm helper methods

```typescript
const config = new LoggerConfigBuilder()
  .useTestingPreset() // or .useDevelopmentPreset() or .useProductionPreset()
  .addModule('MyModule', true, ['trace', 'debug', 'info', 'warn', 'error'], ['console', 'node-file'])
  .setModuleTransports('MyModule', ['console', 'node-file', 'api'])
  .enableAllLevelsForModule('MyModule')
  .build();
```

## Cách sử dụng trong Test

### Phương pháp 1: Sử dụng CommonLoggerConfig (Recommended)

```typescript
import { CommonLoggerConfig, createModuleLogger } from '@dqcai/logger';
import { NodeFileTransport } from '@dqcai/logger/transports';

// 1. Tạo file transport
const fileTransport = new NodeFileTransport({
  filePath: './logs/app.log',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5
});

// 2. Thêm transport vào CommonLoggerConfig
CommonLoggerConfig.addTransport(fileTransport);

// 3. Cấu hình modules sử dụng transport
const config = new LoggerConfigBuilder()
  .useTestingPreset()
  .addModule('TEST_MODULE', true, 
    ['trace', 'debug', 'info', 'warn', 'error'], 
    ['console', 'node-file']) // ← tên transport
  .build();

CommonLoggerConfig.updateConfiguration(config);

// 4. Sử dụng logger
const logger = createModuleLogger('TEST_MODULE');
logger.info('This will be logged to both console and file');

// 5. Flush logs
await CommonLoggerConfig.flush();
```

### Phương pháp 2: Sử dụng UniversalLogger trực tiếp

```typescript
import { UniversalLogger, LoggerConfigBuilder } from '@dqcai/logger';
import { NodeFileTransport, ConsoleTransport } from '@dqcai/logger/transports';

// 1. Tạo config
const config = new LoggerConfigBuilder()
  .setEnabled(true)
  .setDefaultLevel('debug')
  .addModule('MyModule', true, ['debug', 'info', 'warn', 'error'], ['console', 'file'])
  .build();

// 2. Tạo logger instance
const logger = new UniversalLogger(config);

// 3. Thêm transports
logger.addTransport(new ConsoleTransport());
logger.addTransport(new NodeFileTransport({
  filePath: './logs/app.log'
}));

// 4. Sử dụng
await logger.info('MyModule', 'Hello from module');

// 5. Tạo module logger
const moduleLogger = logger.createModuleLogger('MyModule');
await moduleLogger.info('This is easier');

// 6. Cleanup
await logger.flush();
await logger.cleanup();
```

## Các Transport khả dụng

### 1. ConsoleTransport (Built-in)
```typescript
import { ConsoleTransport } from '@dqcai/logger/transports';

const consoleTransport = new ConsoleTransport({
  colorize: true,
  timestamp: true,
  prefix: 'MyApp'
});
```

### 2. NodeFileTransport (Node.js)
```typescript
import { NodeFileTransport } from '@dqcai/logger/transports';

const fileTransport = new NodeFileTransport({
  filePath: './logs/app.log',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5
});
```

### 3. RNFileTransport (React Native)
```typescript
import { RNFileTransport } from '@dqcai/logger/transports';

const rnTransport = new RNFileTransport({
  fileName: 'app.log',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 3
});
```

### 4. ElectronFileTransport (Electron)
```typescript
import { ElectronFileTransport } from '@dqcai/logger/transports';

const electronTransport = new ElectronFileTransport({
  fileName: 'app.log',
  maxFileSize: 10 * 1024 * 1024,
  maxFiles: 5
});
```

### 5. ApiTransport (HTTP API)
```typescript
import { ApiTransport } from '@dqcai/logger/transports';

const apiTransport = new ApiTransport({
  baseURL: 'https://logs.myapp.com',
  endpoint: '/logs',
  batchSize: 20,
  flushInterval: 10000,
  maxRetries: 3
});
```

## Best Practices

### 1. Module Configuration
```typescript
// Cấu hình module để sử dụng nhiều transports
const config = new LoggerConfigBuilder()
  .addModule('API', true, ['info', 'warn', 'error'], ['console', 'file', 'api'])
  .addModule('Database', true, ['error'], ['console', 'file'])
  .addModule('Debug', true, ['trace', 'debug'], ['console'])
  .build();
```

### 2. Environment-specific Setup
```typescript
// Development
if (process.env.NODE_ENV === 'development') {
  CommonLoggerConfig.addTransport(new ConsoleTransport({ colorize: true }));
  CommonLoggerConfig.updateConfiguration(
    new LoggerConfigBuilder().useDevelopmentPreset().build()
  );
}

// Production
if (process.env.NODE_ENV === 'production') {
  CommonLoggerConfig.addTransport(new NodeFileTransport({
    filePath: '/var/log/myapp/app.log',
    maxFileSize: 50 * 1024 * 1024
  }));
  CommonLoggerConfig.addTransport(new ApiTransport({
    baseURL: process.env.LOG_API_URL
  }));
  CommonLoggerConfig.updateConfiguration(
    new LoggerConfigBuilder().useProductionPreset().build()
  );
}
```

### 3. Graceful Shutdown
```typescript
process.on('SIGTERM', async () => {
  console.log('Flushing logs before shutdown...');
  await CommonLoggerConfig.flush();
  await CommonLoggerConfig.cleanup();
  process.exit(0);
});
```

### 4. Error Handling
```typescript
try {
  // Your code
} catch (error) {
  logger.error('Operation failed', { 
    error: error.message,
    stack: error.stack 
  });
  await CommonLoggerConfig.flush(); // Ensure error is written
}
```

## Debugging

### Show Logger Statistics
```typescript
import { LoggerDebugs } from '@dqcai/logger';

// Show current statistics
LoggerDebugs.showStats();

// Test dynamic configuration update
LoggerDebugs.testDynamicUpdate('MyModule');
```

### Check Active Transports
```typescript
console.log('Active transports:', CommonLoggerConfig.listTransports());
console.log('Active modules:', CommonLoggerConfig.getActiveProxyModules());
console.log('Current config:', CommonLoggerConfig.getCurrentConfig());
```

## Troubleshooting

### Logs không xuất hiện trong file?
1. Kiểm tra transport đã được thêm: `CommonLoggerConfig.listTransports()`
2. Kiểm tra module config có transport name đúng không
3. Gọi `await CommonLoggerConfig.flush()` để đảm bảo logs được ghi
4. Kiểm tra quyền ghi file

### Transport báo lỗi?
1. Kiểm tra dependencies đã cài (axios, react-native-fs, etc.)
2. Kiểm tra platform có phù hợp không (Node.js, React Native, Electron)
3. Xem error logs trong console

### Performance issues?
1. Giảm `batchSize` của ApiTransport
2. Tăng `flushInterval` để giảm số lần ghi file
3. Tắt console transport trong production
4. Sử dụng `fire-and-forget` pattern (không await logger calls)