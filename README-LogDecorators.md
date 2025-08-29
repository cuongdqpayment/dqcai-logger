# 🎨 Logger Decorators - Hướng dẫn sử dụng

## 📋 Tổng quan

Logger Decorators giúp bạn tự động log các hoạt động của function/method mà không cần viết code logging thủ công. Đây là giải pháp clean và maintainable để monitor performance, debug issues và track application flow.

## 🚀 Khởi tạo Logger

```javascript
const { createLogger, LoggerUtils } = require('../../lib');

// Tạo logger với config development
const logger = createLogger(LoggerUtils.createDevelopmentConfig());

// Hoặc tạo logger với config tùy chỉnh
const customConfig = {
  enabled: true,
  defaultLevel: 'debug',
  modules: {
    'DataProcessor': {
      enabled: true,
      levels: ['debug', 'info', 'warn', 'error'],
      transports: ['console']
    }
  }
};
const customLogger = createLogger(customConfig);
```

## 🎯 1. LogMethod Decorator - Basic Method Logging

### Cho function độc lập

```javascript
// Tạo module logger cho function
const dataLogger = logger.createModuleLogger('DataProcessor');

// Function gốc
async function importData(filePath, options = {}) {
  // Business logic ở đây
  await delay(100);
  return { imported: 150, errors: 0 };
}

// Áp dụng LogMethod decorator
const importDataWithLogging = applyLogMethod(importData, dataLogger, 'importData');

// Sử dụng
async function testImportData() {
  const result = await importDataWithLogging('/data/users.csv', { skipHeaders: true });
  console.log('Import result:', result);
}

// Helper function để áp dụng LogMethod
function applyLogMethod(originalFunction, logger, methodName) {
  return async function(...args) {
    if (!logger) return await originalFunction.apply(this, args);

    try {
      await logger.debug(`🚀 Calling ${methodName}`, {
        args: args.length,
        argTypes: args.map(arg => typeof arg)
      });

      const start = Date.now();
      try {
        const result = await originalFunction.apply(this, args);
        const duration = Date.now() - start;
        await logger.debug(`✅ ${methodName} completed in ${duration}ms`);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        await logger.error(`❌ ${methodName} failed after ${duration}ms`, {
          error: error.message,
          stack: error.stack
        });
        throw error;
      }
    } catch (logError) {
      console.warn(`[LogMethod] Logging failed for ${methodName}:`, logError);
      return await originalFunction.apply(this, args);
    }
  };
}
```

### Cho method trong class

```javascript
class DataProcessor {
  constructor(logger) {
    this.logger = logger.createModuleLogger('DataProcessor');
    
    // Áp dụng decorators cho các methods
    this.importData = this.applyLogMethod(this.importData.bind(this));
    this.processRecords = this.applyLogMethod(this.processRecords.bind(this));
  }

  // Method gốc
  async importData(filePath, options = {}) {
    await delay(100);
    return { imported: 150, errors: 0 };
  }

  async processRecords(records) {
    await delay(50);
    return records.map(r => ({ ...r, processed: true }));
  }

  // Helper method để áp dụng LogMethod
  applyLogMethod(method) {
    const self = this;
    const methodName = method.name;
    
    return async function(...args) {
      if (!self.logger) return await method.apply(self, args);

      try {
        await self.logger.debug(`🚀 Calling ${methodName}`, {
          args: args.length,
          argTypes: args.map(arg => typeof arg)
        });

        const start = Date.now();
        try {
          const result = await method.apply(self, args);
          const duration = Date.now() - start;
          await self.logger.debug(`✅ ${methodName} completed in ${duration}ms`);
          return result;
        } catch (error) {
          const duration = Date.now() - start;
          await self.logger.error(`❌ ${methodName} failed after ${duration}ms`, {
            error: error.message
          });
          throw error;
        }
      } catch (logError) {
        console.warn(`[LogMethod] Logging failed for ${methodName}:`, logError);
        return await method.apply(self, args);
      }
    };
  }
}

// Sử dụng
const processor = new DataProcessor(logger);
await processor.importData('/data/products.csv');
```

## ⏱️ 2. LogPerformance Decorator - Performance Monitoring

### Cho function độc lập

```javascript
// Function xử lý file lớn
async function processLargeFile(filePath) {
  await delay(2000); // Simulate heavy processing
  return { processed: true, records: 10000 };
}

// Áp dụng performance monitoring (cảnh báo nếu > 1000ms)
const processLargeFileMonitored = applyLogPerformance(
  processLargeFile, 
  dataLogger, 
  'processLargeFile',
  1000 // threshold 1000ms
);

// Helper function
function applyLogPerformance(originalFunction, logger, methodName, threshold = 1000) {
  return async function(...args) {
    const start = Date.now();

    try {
      const result = await originalFunction.apply(this, args);
      const duration = Date.now() - start;

      if (logger && duration > threshold) {
        await logger.warn(`🐌 Slow method detected: ${methodName} took ${duration}ms`, {
          threshold,
          duration,
          methodName,
          args: args.length,
          timestamp: new Date().toISOString()
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      if (logger) {
        await logger.error(`❌ ${methodName} failed after ${duration}ms`, {
          threshold,
          duration,
          error: error.message
        });
      }
      throw error;
    }
  };
}
```

### Cho method trong class

```javascript
class DatabaseService {
  constructor(logger) {
    this.logger = logger.createModuleLogger('DatabaseService');
    
    // Áp dụng performance monitoring
    this.heavyQuery = this.applyLogPerformance(this.heavyQuery.bind(this), 2000);
    this.bulkInsert = this.applyLogPerformance(this.bulkInsert.bind(this), 5000);
  }

  async heavyQuery(sql) {
    await delay(3000); // Simulate slow query
    return { rows: 1000, time: '3000ms' };
  }

  async bulkInsert(records) {
    await delay(6000); // Simulate bulk operation
    return { inserted: records.length };
  }

  applyLogPerformance(method, threshold = 1000) {
    const self = this;
    const methodName = method.name;
    
    return async function(...args) {
      const start = Date.now();

      try {
        const result = await method.apply(self, args);
        const duration = Date.now() - start;

        if (self.logger && duration > threshold) {
          await self.logger.warn(`🐌 Slow method: ${methodName} took ${duration}ms`, {
            threshold,
            duration,
            methodName,
            className: self.constructor.name
          });
        }

        return result;
      } catch (error) {
        const duration = Date.now() - start;
        if (self.logger) {
          await self.logger.error(`❌ ${methodName} failed after ${duration}ms`, {
            threshold,
            duration,
            error: error.message
          });
        }
        throw error;
      }
    };
  }
}

// Sử dụng
const dbService = new DatabaseService(logger);
await dbService.heavyQuery('SELECT * FROM large_table');
```

## 💾 3. LogCache Decorator - Caching with Logging

### Cho function độc lập

```javascript
// Function tính toán phức tạp
async function calculateExpensiveResult(input) {
  await delay(1000); // Simulate heavy calculation
  return `Expensive result for: ${input}`;
}

// Áp dụng caching (TTL: 5 seconds)
const calculateExpensiveResultCached = applyLogCache(
  calculateExpensiveResult,
  dataLogger,
  'calculateExpensiveResult',
  5000
);

// Helper function
function applyLogCache(originalFunction, logger, methodName, ttlMs = 60000) {
  const cache = new Map();
  
  return async function(...args) {
    const cacheKey = `${methodName}.${JSON.stringify(args)}`;
    const now = Date.now();
    const cached = cache.get(cacheKey);

    // Check cache hit
    if (cached && cached.expires > now) {
      if (logger) {
        await logger.debug(`💾 Cache HIT for ${methodName}`, { cacheKey });
      }
      return cached.value;
    }

    // Cache miss - execute function
    if (logger) {
      await logger.debug(`🔍 Cache MISS for ${methodName}`, { cacheKey });
    }

    const result = await originalFunction.apply(this, args);

    // Store in cache
    cache.set(cacheKey, {
      value: result,
      expires: now + ttlMs
    });

    return result;
  };
}

// Test caching
console.log('First call (cache miss):');
await calculateExpensiveResultCached('test-data');

console.log('Second call (cache hit):');
await calculateExpensiveResultCached('test-data');
```

## 🔄 4. LogRetry Decorator - Retry with Exponential Backoff

### Cho function độc lập

```javascript
// Function không ổn định
let attemptCount = 0;
async function unstableApiCall(endpoint) {
  attemptCount++;
  
  // Fail first 2 times, succeed on 3rd
  if (attemptCount < 3) {
    throw new Error(`API error #${attemptCount}: Network timeout`);
  }
  
  attemptCount = 0; // Reset for next test
  return { status: 'success', data: `Data from ${endpoint}` };
}

// Áp dụng retry (max 3 retries, base delay 500ms)
const unstableApiCallWithRetry = applyLogRetry(
  unstableApiCall,
  dataLogger,
  'unstableApiCall',
  3,
  500
);

// Helper function
function applyLogRetry(originalFunction, logger, methodName, maxRetries = 3, baseDelayMs = 1000) {
  return async function(...args) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (logger && attempt > 1) {
          await logger.info(`🔄 Retry attempt ${attempt}/${maxRetries} for ${methodName}`);
        }

        return await originalFunction.apply(this, args);
      } catch (error) {
        lastError = error;

        if (logger) {
          await logger.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed for ${methodName}`, {
            attempt,
            maxRetries,
            error: error.message,
            willRetry: attempt < maxRetries
          });
        }

        // Exponential backoff delay
        if (attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries exhausted
    if (logger) {
      await logger.error(`💥 All ${maxRetries} attempts failed for ${methodName}`, {
        maxRetries,
        finalError: lastError.message
      });
    }

    throw lastError;
  };
}

// Test retry
try {
  const result = await unstableApiCallWithRetry('/api/users');
  console.log('Success:', result);
} catch (error) {
  console.log('Final failure:', error.message);
}
```

## 🏗️ 5. Sử dụng với BaseModule (Recommended)

```javascript
const { BaseModule } = require('../../lib');

class FileProcessor extends BaseModule {
  constructor(logger) {
    super('FileProcessor', logger);
    
    // Áp dụng decorators
    this.importData = this.applyMultipleDecorators(
      this.importData.bind(this),
      ['method', 'performance:2000', 'cache:10000']
    );
  }

  async importData(filePath) {
    await this.logInfo('Starting data import', { filePath });
    
    // Simulate processing
    await delay(1500);
    
    const result = { imported: 100, errors: 2 };
    await this.logInfo('Import completed', result);
    
    return result;
  }

  // Helper để áp dụng nhiều decorators
  applyMultipleDecorators(method, decorators) {
    let decoratedMethod = method;
    
    for (const decorator of decorators) {
      if (decorator === 'method') {
        decoratedMethod = this.applyMethodLogging(decoratedMethod);
      } else if (decorator.startsWith('performance:')) {
        const threshold = parseInt(decorator.split(':')[1]);
        decoratedMethod = this.applyPerformanceLogging(decoratedMethod, threshold);
      } else if (decorator.startsWith('cache:')) {
        const ttl = parseInt(decorator.split(':')[1]);
        decoratedMethod = this.applyCaching(decoratedMethod, ttl);
      }
    }
    
    return decoratedMethod;
  }

  applyMethodLogging(method) {
    const self = this;
    return async function(...args) {
      await self.logDebug(`🚀 Calling ${method.name}`, { args: args.length });
      
      const start = Date.now();
      try {
        const result = await method.apply(self, args);
        const duration = Date.now() - start;
        await self.logDebug(`✅ ${method.name} completed in ${duration}ms`);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        await self.logError(`❌ ${method.name} failed after ${duration}ms`, { error: error.message });
        throw error;
      }
    };
  }

  applyPerformanceLogging(method, threshold) {
    const self = this;
    return async function(...args) {
      const start = Date.now();
      const result = await method.apply(self, args);
      const duration = Date.now() - start;
      
      if (duration > threshold) {
        await self.logWarn(`🐌 Slow method: ${method.name} took ${duration}ms`, { threshold, duration });
      }
      
      return result;
    };
  }

  applyCaching(method, ttlMs) {
    const cache = new Map();
    const self = this;
    
    return async function(...args) {
      const cacheKey = `${method.name}.${JSON.stringify(args)}`;
      const cached = cache.get(cacheKey);
      
      if (cached && cached.expires > Date.now()) {
        await self.logDebug(`💾 Cache HIT for ${method.name}`);
        return cached.value;
      }
      
      await self.logDebug(`🔍 Cache MISS for ${method.name}`);
      const result = await method.apply(self, args);
      
      cache.set(cacheKey, {
        value: result,
        expires: Date.now() + ttlMs
      });
      
      return result;
    };
  }
}

// Sử dụng
const processor = new FileProcessor(logger);
await processor.importData('/data/large-file.csv');
```

## 📊 6. Ví dụ thực tế - API Service

```javascript
class UserService extends BaseModule {
  constructor(logger, httpClient) {
    super('UserService', logger);
    this.httpClient = httpClient;
    
    // Setup decorators cho tất cả API methods
    this.getUser = this.applyApiDecorators(this.getUser.bind(this));
    this.createUser = this.applyApiDecorators(this.createUser.bind(this));
    this.updateUser = this.applyApiDecorators(this.updateUser.bind(this));
  }

  async getUser(userId) {
    await this.logDebug('Fetching user', { userId });
    
    const response = await this.httpClient.get(`/users/${userId}`);
    
    await this.logInfo('User fetched successfully', { 
      userId, 
      hasData: !!response.data 
    });
    
    return response.data;
  }

  async createUser(userData) {
    await this.logInfo('Creating new user', { 
      email: userData.email 
    });
    
    const response = await this.httpClient.post('/users', userData);
    
    await this.logInfo('User created successfully', { 
      userId: response.data.id,
      email: response.data.email 
    });
    
    return response.data;
  }

  async updateUser(userId, userData) {
    await this.logInfo('Updating user', { userId });
    
    const response = await this.httpClient.put(`/users/${userId}`, userData);
    
    await this.logInfo('User updated successfully', { userId });
    
    return response.data;
  }

  // Combined decorators cho API methods
  applyApiDecorators(method) {
    // 1. Method logging
    let decorated = this.applyMethodLogging(method);
    
    // 2. Performance monitoring (warn if > 3 seconds)
    decorated = this.applyPerformanceLogging(decorated, 3000);
    
    // 3. Retry mechanism (3 retries for network issues)
    decorated = this.applyRetryLogging(decorated, 3, 1000);
    
    return decorated;
  }

  // ... (include helper methods from previous examples)
}

// Sử dụng
const userService = new UserService(logger, httpClient);

// Tất cả methods đều có logging, performance monitoring, và retry
const user = await userService.getUser('123');
const newUser = await userService.createUser({ 
  name: 'John Doe', 
  email: 'john@example.com' 
});
```

## 🔧 7. Utility Functions

```javascript
// Utility functions để tái sử dụng
class DecoratorUtils {
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static createCombinedDecorator(logger, options = {}) {
    const {
      enableMethod = true,
      performanceThreshold = 1000,
      cacheEnabled = false,
      cacheTTL = 60000,
      retryEnabled = false,
      maxRetries = 3,
      retryDelay = 1000
    } = options;

    return function(originalFunction, functionName) {
      let decorated = originalFunction;

      if (enableMethod) {
        decorated = DecoratorUtils.applyMethodLogging(decorated, logger, functionName);
      }

      if (performanceThreshold > 0) {
        decorated = DecoratorUtils.applyPerformanceLogging(decorated, logger, functionName, performanceThreshold);
      }

      if (cacheEnabled) {
        decorated = DecoratorUtils.applyCaching(decorated, logger, functionName, cacheTTL);
      }

      if (retryEnabled) {
        decorated = DecoratorUtils.applyRetry(decorated, logger, functionName, maxRetries, retryDelay);
      }

      return decorated;
    };
  }

  // Include all helper methods here...
}

// Sử dụng combined decorator
const combinedDecorator = DecoratorUtils.createCombinedDecorator(logger, {
  enableMethod: true,
  performanceThreshold: 2000,
  cacheEnabled: true,
  cacheTTL: 30000,
  retryEnabled: true,
  maxRetries: 2
});

const optimizedImportData = combinedDecorator(importData, 'importData');
```

## 💡 Best Practices

### 1. **Module Organization**
```javascript
// Tạo logger cho từng module riêng biệt
const dbLogger = logger.createModuleLogger('Database');
const apiLogger = logger.createModuleLogger('ApiClient'); 
const fileLogger = logger.createModuleLogger('FileProcessor');
```

### 2. **Performance Thresholds**
```javascript
// Đặt threshold phù hợp với từng loại operation
const decorators = {
  database: { threshold: 1000 },    // DB queries
  api: { threshold: 3000 },         // API calls  
  file: { threshold: 5000 },        // File operations
  calculation: { threshold: 500 }   // In-memory calculations
};
```

### 3. **Error Handling**
```javascript
// Luôn có fallback khi logging fail
function safeApplyDecorator(method, decorator) {
  try {
    return decorator(method);
  } catch (error) {
    console.warn('Decorator failed, using original method:', error);
    return method;
  }
}
```

### 4. **Environment-based Configuration**
```javascript
// Chỉ enable decorators trong development/staging
const shouldEnableDecorators = process.env.NODE_ENV !== 'production';

if (shouldEnableDecorators) {
  this.importData = applyLogMethod(this.importData.bind(this));
}
```

## 🎯 Tóm tắt

Decorators giúp bạn:
- ✅ **Monitor performance** tự động
- ✅ **Debug issues** dễ dàng hơn  
- ✅ **Track method calls** và flow
- ✅ **Cache results** để tối ưu performance
- ✅ **Retry failed operations** tự động
- ✅ **Maintain clean code** không bị "ô nhiễm" bởi logging code

Hãy bắt đầu từ **LogMethod** cho basic logging, sau đó dần dần thêm các decorators khác khi cần thiết!