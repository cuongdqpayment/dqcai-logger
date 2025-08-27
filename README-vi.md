# @dqcai/logger

🚀 **Universal Logger Library** cho Web, Node.js, React Native - Thư viện log đa nền tảng, linh động và dễ cấu hình nhất hiện nay.

## ✨ Tính năng nổi bật

- 🌐 **Đa nền tảng**: Hỗ trợ Web, Node.js, React Native
- ⚙️ **Cấu hình linh động**: Bật/tắt log theo module, level, transport
- 🎯 **Module-based logging**: Quản lý log theo từng module riêng biệt
- 🚀 **Transport đa dạng**: Console, File, API, và tùy chỉnh
- 🔧 **Remote control**: Điều khiển log từ xa qua API
- 📦 **Zero dependencies**: Chỉ cần peer dependencies khi cần thiết
- 🎨 **TypeScript**: Hỗ trợ đầy đủ TypeScript với type safety

## 📦 Cài đặt

```bash
npm install @dqcai/logger
# hoặc
yarn add @dqcai/logger
# hoặc
pnpm add @dqcai/logger
```

### Dependencies tùy chọn

```bash
# Cho React Native file transport
npm install react-native-fs

# Cho API transport
npm install axios

# Cho Node.js file transport (tự động có sẵn)
# fs module built-in
```

## 🚀 Bắt đầu nhanh

### Basic Usage

```typescript
import { createLogger } from '@dqcai/logger';

const logger = createLogger();

// Sử dụng cơ bản
logger.info('MyModule', 'Ứng dụng đã khởi động');
logger.error('MyModule', 'Có lỗi xảy ra', { error: 'details' });
logger.debug('MyModule', 'Debug info', { userId: 123 });
```

### Với BaseModule Class

```typescript
import { BaseModule, createLogger } from '@dqcai/logger';

const logger = createLogger();

class DatabaseManager extends BaseModule {
  constructor() {
    super('DatabaseManager', logger);
  }

  async connect() {
    await this.logInfo('Đang kết nối database...');
    try {
      // Database connection logic
      await this.logDebug('Kết nối thành công');
    } catch (error) {
      await this.logError('Kết nối thất bại', { error });
    }
  }
}
```

## ⚙️ Cấu hình nâng cao

### 1. Cấu hình với ConfigBuilder

```typescript
import { LoggerConfigBuilder, createLogger } from '@dqcai/logger';

const config = new LoggerConfigBuilder()
  .setEnabled(true)
  .setDefaultLevel('info')
  .addModule('App', true, ['info','warn','error'], ['console'])
  .addModule('DatabaseManager', true, ['debug','info','warn','error'], ['console','file'])
  .addModule('ApiClient', false) // Tắt hoàn toàn
  .addModule('AuthService', true, ['error'], ['console','api'])
  .build();

const logger = createLogger(config);
```

### 2. Bật/tắt động trong runtime

```typescript
// Tắt log của một module
logger.setModuleConfig('DatabaseManager', {
  enabled: false,
  levels: [],
  transports: []
});

// Bật lại với cấu hình mới
logger.setModuleConfig('DatabaseManager', {
  enabled: true,
  levels: ['warn','error'],
  transports: ['console','file']
});
```

## 🌍 Sử dụng theo từng nền tảng

### React Native

```typescript
import { createLogger, ConsoleTransport } from '@dqcai/logger';
import { FileTransport } from '@dqcai/logger/rn';

const logger = createLogger();
logger.addTransport(new ConsoleTransport());
logger.addTransport(new FileTransport('app.log'));

// Sử dụng trong component
export default function App() {
  useEffect(() => {
    logger.info('App', 'React Native app started');
  }, []);

  return <YourComponent />;
}
```

### Web Browser

```typescript
import { createLogger, ConsoleTransport } from '@dqcai/logger';
import { FileTransport } from '@dqcai/logger/web';

const logger = createLogger();
logger.addTransport(new ConsoleTransport());
logger.addTransport(new FileTransport());

// Sử dụng trong web app
logger.info('WebApp', 'Web application loaded');
```

### Node.js

```typescript
import { createLogger, ConsoleTransport } from '@dqcai/logger';
import { FileTransport } from '@dqcai/logger/node';

const logger = createLogger();
logger.addTransport(new ConsoleTransport());
logger.addTransport(new FileTransport('./server.log'));

// Sử dụng trong server
logger.info('Server', 'Server started on port 3000');
```

## 🚛 Transport Options

### 1. Console Transport (Default)

```typescript
import { ConsoleTransport } from '@dqcai/logger';

logger.addTransport(new ConsoleTransport());
```

### 2. File Transport

#### React Native
```typescript
import { FileTransport } from '@dqcai/logger/rn';

logger.addTransport(new FileTransport('myapp.log'));
```

#### Node.js
```typescript
import { FileTransport } from '@dqcai/logger/node';

logger.addTransport(new FileTransport('./logs/server.log'));
```

#### Web
```typescript
import { FileTransport } from '@dqcai/logger/web';

logger.addTransport(new FileTransport()); // Sử dụng localStorage
```

### 3. API Transport

```typescript
import { ApiTransport } from '@dqcai/logger';

const apiTransport = new ApiTransport('https://your-api.com', '/logs');
logger.addTransport(apiTransport);
```

### 4. Custom Transport

```typescript
import { ILogTransport, LogEntry } from '@dqcai/logger';

class CustomTransport implements ILogTransport {
  readonly name = 'custom';

  async log(entry: LogEntry): Promise<void> {
    // Your custom logging logic
    console.log('Custom:', entry);
  }
}

logger.addTransport(new CustomTransport());
```

## 🎯 Ví dụ dự án hoàn chỉnh

### Cấu trúc dự án

```
src/
├── logger.config.ts     // Cấu hình logger toàn cục
├── services/
│   ├── BaseService.ts   // Service base class
│   ├── DatabaseManager.ts
│   └── ApiClient.ts
└── App.tsx             // Main app
```

### 1. logger.config.ts

```typescript
import { LoggerConfigBuilder, createLogger, ConsoleTransport } from '@dqcai/logger';
import { FileTransport } from '@dqcai/logger/rn'; // hoặc /node, /web
import { ApiTransport } from '@dqcai/logger';

// Cấu hình cho môi trường development/production
const isDev = process.env.NODE_ENV === 'development';

const config = new LoggerConfigBuilder()
  .setEnabled(true)
  .setDefaultLevel(isDev ? 'debug' : 'warn')
  .addModule('App', true, ['info','warn','error'], ['console','file'])
  .addModule('DatabaseManager', true, 
    isDev ? ['debug','info','warn','error'] : ['warn','error'], 
    ['console','file','api']
  )
  .addModule('ApiClient', true, ['info','warn','error'], ['console','api'])
  .addModule('BaseService', !isDev) // Chỉ bật ở dev
  .build();

export const logger = createLogger(config);

// Thêm transports
logger.addTransport(new ConsoleTransport());
logger.addTransport(new FileTransport('myapp.log'));
logger.addTransport(new ApiTransport('https://logging-api.com', '/api/logs'));
```

### 2. BaseService.ts

```typescript
import { BaseModule } from '@dqcai/logger';
import { logger } from '../logger.config';

export class BaseService extends BaseModule {
  constructor(moduleName: string = 'BaseService') {
    super(moduleName, logger);
  }

  protected async handleError(method: string, error: any) {
    await this.logError(`${method} failed`, { 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }

  protected async trackOperation(operation: string, data?: any) {
    await this.logInfo(`Operation: ${operation}`, data);
  }
}
```

### 3. DatabaseManager.ts

```typescript
import { BaseService } from './BaseService';

export class DatabaseManager extends BaseService {
  constructor() {
    super('DatabaseManager');
  }

  async connect(connectionString: string) {
    await this.logInfo('Attempting database connection', { 
      host: connectionString.split('@')[1] 
    });
    
    try {
      // Database connection logic
      await this.simulateConnection();
      await this.logDebug('Database connected successfully');
      return true;
    } catch (error) {
      await this.handleError('connect', error);
      return false;
    }
  }

  async query(sql: string, params?: any[]) {
    await this.logDebug('Executing query', { sql, paramCount: params?.length });
    
    try {
      // Query execution logic
      const result = await this.executeQuery(sql, params);
      await this.logDebug('Query executed', { rowCount: result.length });
      return result;
    } catch (error) {
      await this.handleError('query', error);
      throw error;
    }
  }

  private async simulateConnection() {
    // Simulate async connection
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async executeQuery(sql: string, params?: any[]) {
    // Simulate query execution
    return [{ id: 1, name: 'test' }];
  }
}
```

### 4. ApiClient.ts

```typescript
import axios, { AxiosInstance } from 'axios';
import { BaseService } from './BaseService';

export class ApiClient extends BaseService {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    super('ApiClient');
    this.client = axios.create({ baseURL });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config) => {
        await this.logDebug('API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          headers: config.headers
        });
        return config;
      },
      async (error) => {
        await this.logError('API Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      async (response) => {
        await this.logDebug('API Response', {
          status: response.status,
          url: response.config.url,
          dataSize: JSON.stringify(response.data).length
        });
        return response;
      },
      async (error) => {
        await this.logError('API Response Error', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  async get(url: string, params?: any) {
    await this.trackOperation('GET', { url, params });
    return this.client.get(url, { params });
  }

  async post(url: string, data?: any) {
    await this.trackOperation('POST', { url, dataSize: JSON.stringify(data).length });
    return this.client.post(url, data);
  }
}
```

### 5. App.tsx (React Native example)

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { logger } from './logger.config';
import { DatabaseManager } from './services/DatabaseManager';
import { ApiClient } from './services/ApiClient';

export default function App() {
  const [dbManager] = useState(() => new DatabaseManager());
  const [apiClient] = useState(() => new ApiClient('https://jsonplaceholder.typicode.com'));

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    logger.info('App', '🚀 Application starting...', {
      version: '1.0.0',
      platform: 'react-native',
      timestamp: new Date().toISOString()
    });

    try {
      // Initialize database
      const dbConnected = await dbManager.connect('mongodb://localhost:27017/myapp');
      
      if (dbConnected) {
        await dbManager.query('SELECT * FROM users LIMIT 10');
      }

      // Test API
      await apiClient.get('/users/1');
      
      logger.info('App', '✅ Application initialized successfully');
    } catch (error) {
      logger.error('App', '❌ Application initialization failed', { error });
      Alert.alert('Error', 'Failed to initialize app');
    }
  };

  const testLogging = async () => {
    logger.info('App', '🧪 Testing different log levels');
    logger.debug('App', 'Debug message', { debugInfo: 'detailed info' });
    logger.warn('App', '⚠️ Warning message', { warningType: 'performance' });
    logger.error('App', '🚨 Error message', { errorCode: 'TEST_ERROR' });
  };

  const testApiCall = async () => {
    try {
      const response = await apiClient.get('/posts/1');
      Alert.alert('Success', `Post title: ${response.data.title}`);
    } catch (error) {
      Alert.alert('Error', 'API call failed');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, textAlign: 'center', marginBottom: 30 }}>
        @dqcai/logger Demo
      </Text>
      
      <Button title="Test Logging" onPress={testLogging} />
      <View style={{ height: 10 }} />
      <Button title="Test API Call" onPress={testApiCall} />
      <View style={{ height: 10 }} />
      <Button title="Reinitialize App" onPress={initializeApp} />
    </View>
  );
}
```

## 🔧 Remote Control - Điều khiển log từ xa

### 1. Tạo API endpoint cho config

```javascript
// Server endpoint: GET /api/logger-config
{
  "enabled": true,
  "defaultLevel": "info",
  "modules": {
    "App": { 
      "enabled": true, 
      "levels": ["info","warn","error"], 
      "transports": ["console","api"] 
    },
    "DatabaseManager": { 
      "enabled": true, 
      "levels": ["debug","info","warn","error"], 
      "transports": ["console","file","api"] 
    },
    "ApiClient": { 
      "enabled": false, 
      "levels": [], 
      "transports": [] 
    }
  }
}
```

### 2. Fetch config từ server

```typescript
// src/logger/RemoteConfig.ts
import axios from 'axios';
import { LoggerConfig } from '@dqcai/logger';

export class RemoteLoggerConfig {
  private configUrl: string;
  private fallbackConfig: LoggerConfig;

  constructor(configUrl: string, fallbackConfig: LoggerConfig) {
    this.configUrl = configUrl;
    this.fallbackConfig = fallbackConfig;
  }

  async fetchConfig(): Promise<LoggerConfig> {
    try {
      const response = await axios.get(this.configUrl, { timeout: 5000 });
      return response.data as LoggerConfig;
    } catch (error) {
      console.warn('[RemoteLoggerConfig] Failed to fetch remote config, using fallback');
      return this.fallbackConfig;
    }
  }

  async initializeWithRemoteConfig() {
    const config = await this.fetchConfig();
    return createLogger(config);
  }
}
```

### 3. Sử dụng remote config

```typescript
// src/logger.config.ts
import { LoggerUtils, createLogger } from '@dqcai/logger';
import { RemoteLoggerConfig } from './logger/RemoteConfig';

const remoteConfig = new RemoteLoggerConfig(
  'https://your-api.com/api/logger-config',
  LoggerUtils.createProductionConfig() // fallback config
);

let logger = createLogger(LoggerUtils.createDevelopmentConfig()); // temporary

export async function initializeLogger(): Promise<void> {
  try {
    logger = await remoteConfig.initializeWithRemoteConfig();
    console.log('✅ Logger initialized with remote config');
  } catch (error) {
    console.error('❌ Failed to initialize logger with remote config:', error);
  }
}

export function getLogger() {
  return logger;
}

// Auto refresh config every 10 minutes
setInterval(async () => {
  await initializeLogger();
}, 10 * 60 * 1000);
```

## 📊 Best Practices

### 1. Cấu hình theo môi trường

```typescript
const getLoggerConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'development':
      return new LoggerConfigBuilder()
        .setEnabled(true)
        .setDefaultLevel('debug')
        .build();
    
    case 'production':
      return new LoggerConfigBuilder()
        .setEnabled(true)
        .setDefaultLevel('warn')
        .addModule('critical', true, ['error'], ['console','api'])
        .build();
    
    case 'test':
      return new LoggerConfigBuilder()
        .setEnabled(false)
        .build();
    
    default:
      return LoggerUtils.createDevelopmentConfig();
  }
};
```

### 2. Structured logging

```typescript
// Good: Structured data
logger.info('UserService', 'User login', {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString(),
  userAgent: req.headers['user-agent'],
  ip: req.ip
});

// Avoid: String concatenation
logger.info('UserService', `User ${user.email} logged in at ${new Date()}`);
```

### 3. Error handling

```typescript
class ServiceBase extends BaseModule {
  protected async safeExecute<T>(
    operation: string, 
    fn: () => Promise<T>
  ): Promise<T | null> {
    try {
      await this.logDebug(`Starting ${operation}`);
      const result = await fn();
      await this.logDebug(`Completed ${operation}`, { success: true });
      return result;
    } catch (error) {
      await this.logError(`Failed ${operation}`, {
        error: error.message,
        stack: error.stack,
        operation
      });
      return null;
    }
  }
}
```

### 4. Performance monitoring

```typescript
class PerformanceLogger extends BaseModule {
  async measureTime<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    await this.logDebug(`Starting ${operation}`);
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      
      await this.logInfo(`Completed ${operation}`, {
        duration: `${duration}ms`,
        success: true
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      await this.logError(`Failed ${operation}`, {
        duration: `${duration}ms`,
        error: error.message
      });
      
      throw error;
    }
  }
}
```

## 📋 Migration Guide

### Từ console.log

```typescript
// Before
console.log('User logged in:', user);
console.error('API Error:', error);

// After
logger.info('AuthService', 'User logged in', { user });
logger.error('ApiService', 'API request failed', { error });
```

### Từ other logging libraries

```typescript
// From winston
// winston.info('message', { meta });

// To @dqcai/logger
logger.info('ModuleName', 'message', { meta });

// From react-native-logs
// const log = logger.createLogger();
// log.debug('message');

// To @dqcai/logger
const logger = createLogger();
logger.debug('ModuleName', 'message');
```

## 🤝 Contributing

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng đọc [CONTRIBUTING.md](CONTRIBUTING.md) để biết thêm chi tiết.

## 📄 License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 🆘 Support

- 📖 [Documentation](https://mypos.ddns.net/logger)
- 🐛 [Issues](https://github.com/cuongdqpayment/dqcai-logger/issues)
- 💬 [Discussions](https://github.com/cuongdqpayment/dqcai-logger/discussions)
- 📧 Email: cuongdq3500888@gmail.com

---

**@dqcai/logger** - Giải pháp logging đa nền tảng hoàn hảo cho mọi dự án JavaScript/TypeScript! 🚀

# DQCAI LOGGER - PROJECT COMMANDS REFERENCE

## 🏗️ BUILD & DEVELOPMENT COMMANDS

```sh
### Clean & Build
npm run clean                    # Xóa thư mục dist
npm run build                    # Build thư viện (tạo cả CommonJS và ESM)
npm run clean && npm run build   # Clean build hoàn toàn

### Obfuscation (Bảo mật code)
npm run obfuscate               # Obfuscate code đã build

### Type Checking
npm run typecheck               # Kiểm tra TypeScript types mà không build

## 🧪 TESTING COMMANDS

### Basic Testing
npm run test                    # Chạy tất cả tests một lần
npm test                        # Alias cho npm run test

### Watch Mode Testing
npm run test:watch              # Chạy tests ở chế độ watch (tự động chạy lại khi có thay đổi)

### Testing UI
npm run test:ui                 # Mở Vitest UI để xem kết quả test trong browser

### Specific Test Files
npx vitest run src/logger.test.ts        # Chạy một file test cụ thể
npx vitest run --reporter=verbose        # Chạy test với output chi tiết
npx vitest run --coverage               # Chạy test với coverage report

## 📦 PUBLISHING COMMANDS

### Automatic Publishing (Recommended)
npm run release:patch           # Tăng patch version (1.0.3 -> 1.0.4) và publish
npm run release:minor           # Tăng minor version (1.0.3 -> 1.1.0) và publish  
npm run release:major           # Tăng major version (1.0.3 -> 2.0.0) và publish

### Manual Publishing Steps
npm run preversion              # Chạy tests trước khi version
npm version patch               # Tăng patch version và commit
npm version minor               # Tăng minor version và commit
npm version major               # Tăng major version và commit
npm run prepublishOnly          # Build và obfuscate trước khi publish
npm run release                 # Publish lên NPM registry

### Git Operations (Automatic với version commands)
npm run version                 # Build, obfuscate và add files to git
npm run postversion            # Push tags lên Git sau khi version

## 🔍 DEBUGGING & DEVELOPMENT

### Development Watch
npx tsup --watch                # Watch mode cho build
npx vitest --reporter=verbose   # Test với output chi tiết

### Check Build Output
ls -la dist/                    # Xem các file đã build
ls -la dist/react-native/       # Xem React Native build
cat dist/index.d.ts             # Xem TypeScript definitions

### Package Analysis
npm pack --dry-run              # Xem files sẽ được publish mà không thực sự pack
npm pack                        # Tạo .tgz file để test local install
tar -tzf *.tgz                  # Xem nội dung của package file
```

## 🏃‍♂️ QUICK WORKFLOWS

### Development Workflow
1. npm run clean
2. npm run build
3. npm run test
4. npm run typecheck

### Pre-commit Workflow  
```sh
npm run preversion              # Này sẽ chạy test tự động
```
### Release Workflow (Complete)
1. npm run test                 # Ensure tests pass
2. npm run typecheck            # Check types
3. npm run clean                # Clean old builds  
4. npm run build                # Fresh build
5. npm run release:patch        # Version + publish

### Local Testing Workflow
1. npm pack                     # Tạo package file
2. cd /path/to/test/project     # Chuyển đến project test
3. npm install /path/to/your/dqcai-logger-1.0.3.tgz  # Install local package

### React Native Testing Workflow
1. npm run build
2. cd react-native-test-app
3. npm install file:../path/to/dqcai-logger
4. npx react-native start
5. npx react-native run-android  # hoặc run-ios

## 🛠️ UTILITY COMMANDS

```sh
### Node Modules Management
npm ci                          # Clean install (production-like)
npm install                     # Install dependencies
npm audit                       # Check security vulnerabilities
npm audit fix                   # Auto-fix vulnerabilities

### Git Helpers
git tag                         # Xem tất cả tags
git push --tags                 # Push tags manually nếu cần
git log --oneline -10           # Xem commit history

### Package Info
npm view @dqcai/logger          # Xem thông tin package trên NPM
npm view @dqcai/logger versions --json  # Xem tất cả versions đã publish

## 🚨 TROUBLESHOOTING COMMANDS

### When Tests Fail
npm run clean                   # Clean first
rm -rf node_modules package-lock.json  # Nuclear option
npm install                     # Reinstall
npm run test                    # Try again

### When Build Fails
npm run clean
rm -rf dist
npm run typecheck              # Check for type errors first
npm run build
```

### When React Native White Screen
1. Check Metro bundler logs
2. npm run build                # Ensure fresh build
3. cd react-native-project && npx react-native start --reset-cache
4. Check import paths in your RN code

### Publishing Issues
```sh
npm whoami                      # Check if logged in
npm login                       # Login if needed
npm run clean && npm run build  # Fresh build
npm run release                 # Try publishing again

## 📋 ENVIRONMENT CHECKS

### Prerequisites Check
node --version                  # Should be >= 18.17.0
npm --version                   # Should be >= 8.0.0
npx tsc --version              # Check TypeScript version

### Project Health Check
npm run typecheck              # TypeScript OK?
npm run test                   # Tests passing?
npm run build                  # Build successful?
ls -la dist/                   # Files generated?
```
---
💡 TIP: Always run tests before publishing!
💡 TIP: Use semantic versioning (patch/minor/major) appropriately
💡 TIP: Test your package locally before publishing with `npm pack`