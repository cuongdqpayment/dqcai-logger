// test-decorators.js - Test file for logger decorators in plain JavaScript
const {
  createLogger,
  LoggerUtils,
  LogMethod,
  LogPerformance,
  LogMethodFlow,
  LogCache,
  LogRetry,
  EnableLogging,
  BaseModule
} = require('@dqcai/logger');

// Utility function to simulate async delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test class using decorators manually (since JS doesn't have native decorator support)
class TestService {
  constructor(logger) {
    this.logger = logger ? logger.createModuleLogger('TestService') : null;
    this.moduleName = 'TestService';
    this.callCount = 0;
    
    // Manually apply decorators to methods
    this.fastMethod = this.applyLogMethod(this.fastMethod.bind(this));
    this.slowMethod = this.applyLogPerformance(this.slowMethod.bind(this), 100);
    this.flowMethod = this.applyLogMethodFlow(this.flowMethod.bind(this));
    this.cachedMethod = this.applyLogCache(this.cachedMethod.bind(this), 5000);
    this.unreliableMethod = this.applyLogRetry(this.unreliableMethod.bind(this), 3, 500);
  }

  // Method that executes quickly
  async fastMethod(input) {
    await delay(50);
    return `Fast result: ${input}`;
  }

  // Method that takes longer (for performance testing)
  async slowMethod(input) {
    await delay(200); // Will trigger performance warning if threshold < 200ms
    return `Slow result: ${input}`;
  }

  // Method for testing flow logging
  async flowMethod(a, b) {
    await delay(100);
    const result = a + b;
    return result;
  }

  // Method for testing caching
  async cachedMethod(key) {
    await delay(100);
    return `Cached data for: ${key}`;
  }

  // Method that fails intermittently (for retry testing)
  async unreliableMethod(input) {
    this.callCount++;
    
    // Fail first 2 times, succeed on 3rd
    if (this.callCount < 3) {
      throw new Error(`Simulated failure #${this.callCount}`);
    }
    
    this.callCount = 0; // Reset for next test
    return `Success after retries: ${input}`;
  }

  // Manual decorator implementations (since JS doesn't have native decorators)
  
  applyLogMethod(method) {
    const self = this;
    return async function(...args) {
      const logger = self.logger;
      if (!logger) return await method.apply(self, args);

      try {
        await logger.debug(`Calling method: ${method.name}`, {
          args: args.length,
          argTypes: args.map(arg => typeof arg)
        });

        const start = Date.now();
        try {
          const result = await method.apply(self, args);
          const duration = Date.now() - start;
          await logger.debug(`Method ${method.name} completed in ${duration}ms`);
          return result;
        } catch (error) {
          const duration = Date.now() - start;
          await logger.error(`Method ${method.name} failed after ${duration}ms`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
          throw error;
        }
      } catch (logError) {
        console.warn(`[LogMethod] Logging failed for ${method.name}:`, logError);
        return await method.apply(self, args);
      }
    };
  }

  applyLogPerformance(method, threshold = 1000) {
    const self = this;
    return async function(...args) {
      const start = Date.now();

      try {
        const result = await method.apply(self, args);
        const duration = Date.now() - start;

        const logger = self.logger;
        if (logger && duration > threshold) {
          try {
            await logger.warn(`Slow method detected: ${method.name} took ${duration}ms`, {
              threshold,
              duration,
              methodName: method.name,
              className: self.constructor.name,
              args: args.length,
              timestamp: new Date().toISOString()
            });
          } catch (logError) {
            console.warn(`[LogPerformance] Logging failed for ${method.name}:`, logError);
          }
        }

        return result;
      } catch (error) {
        const duration = Date.now() - start;

        const logger = self.logger;
        if (logger) {
          try {
            await logger.error(`Method ${method.name} failed after ${duration}ms`, {
              threshold,
              duration,
              methodName: method.name,
              className: self.constructor.name,
              error: error instanceof Error ? error.message : String(error)
            });
          } catch (logError) {
            console.warn(`[LogPerformance] Logging failed for ${method.name}:`, logError);
          }
        }

        throw error;
      }
    };
  }

  applyLogMethodFlow(method, logLevel = 'debug') {
    const self = this;
    return async function(...args) {
      const logger = self.logger;
      const methodId = `${self.constructor.name}.${method.name}`;

      if (logger) {
        const start = Date.now();
        try {
          // Entry log
          await logger[logLevel](`→ Entering ${methodId}`, {
            args: args.map((arg, index) => ({
              index,
              type: typeof arg,
              value: typeof arg === 'object' ? '[Object]' : String(arg).slice(0, 100)
            }))
          });

          const result = await method.apply(self, args);
          const duration = Date.now() - start;

          // Exit log
          await logger[logLevel](`← Exiting ${methodId} (${duration}ms)`, {
            duration,
            resultType: typeof result,
            hasResult: result !== undefined
          });

          return result;
        } catch (error) {
          const duration = Date.now() - start;
          await logger.error(`✗ ${methodId} threw error (${duration}ms)`, {
            duration,
            error: error instanceof Error ? error.message : String(error)
          });
          throw error;
        }
      } else {
        return await method.apply(self, args);
      }
    };
  }

  applyLogCache(method, ttlMs = 60000) {
    const cache = new Map();
    const self = this;
    
    return async function(...args) {
      const cacheKey = `${self.constructor.name}.${method.name}.${JSON.stringify(args)}`;
      const now = Date.now();
      const cached = cache.get(cacheKey);

      const logger = self.logger;

      // Check cache
      if (cached && cached.expires > now) {
        if (logger) {
          try {
            await logger.debug(`Cache HIT for ${method.name}`, { cacheKey });
          } catch (logError) {
            console.warn('[LogCache] Logging failed:', logError);
          }
        }
        return cached.value;
      }

      // Cache miss - execute method
      if (logger) {
        try {
          await logger.debug(`Cache MISS for ${method.name}`, { cacheKey });
        } catch (logError) {
          console.warn('[LogCache] Logging failed:', logError);
        }
      }

      const result = await method.apply(self, args);

      // Store in cache
      cache.set(cacheKey, {
        value: result,
        expires: now + ttlMs
      });

      return result;
    };
  }

  applyLogRetry(method, maxRetries = 3, baseDelayMs = 1000) {
    const self = this;
    return async function(...args) {
      const logger = self.logger;
      let lastError;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          if (logger && attempt > 1) {
            await logger.info(`Retry attempt ${attempt}/${maxRetries} for ${method.name}`);
          }

          return await method.apply(self, args);
        } catch (error) {
          lastError = error;

          if (logger) {
            try {
              await logger.warn(`Attempt ${attempt}/${maxRetries} failed for ${method.name}`, {
                attempt,
                maxRetries,
                error: error instanceof Error ? error.message : String(error),
                willRetry: attempt < maxRetries
              });
            } catch (logError) {
              console.warn('[LogRetry] Logging failed:', logError);
            }
          }

          // Don't delay after last attempt
          if (attempt < maxRetries) {
            const delayTime = baseDelayMs * Math.pow(2, attempt - 1);
            await delay(delayTime);
          }
        }
      }

      // All retries exhausted
      if (logger) {
        try {
          await logger.error(`All ${maxRetries} attempts failed for ${method.name}`, {
            maxRetries,
            finalError: lastError instanceof Error ? lastError.message : String(lastError)
          });
        } catch (logError) {
          console.warn('[LogRetry] Final logging failed:', logError);
        }
      }

      throw lastError;
    };
  }
}

// Test class extending BaseModule
class DatabaseService extends BaseModule {
  constructor(logger) {
    super('DatabaseService', logger);
    this.connectionPool = [];
  }

  async connect() {
    await this.logInfo('Attempting database connection...');
    await delay(100);
    
    this.connectionPool.push({ id: Date.now(), status: 'connected' });
    await this.logInfo('Database connection established', { 
      poolSize: this.connectionPool.length 
    });
    
    return true;
  }

  async query(sql) {
    await this.logDebug('Executing query', { sql: sql.substring(0, 50) + '...' });
    await delay(50);
    
    const result = { rows: 5, time: '12ms' };
    await this.logDebug('Query completed', result);
    
    return result;
  }

  async disconnect() {
    await this.logWarn('Disconnecting from database...');
    this.connectionPool = [];
    await this.logInfo('Database disconnected');
  }
}

// Main test function
async function runDecoratorTests() {
  console.log('🧪 Starting Logger Decorator Tests...\n');

  try {
    // Initialize logger
    const config = LoggerUtils.createDevelopmentConfig();
    const logger = createLogger(config);
    
    console.log('✅ Logger initialized successfully');

    // Test 1: Basic method logging
    console.log('\n📝 Test 1: Basic Method Logging');
    const testService = new TestService(logger);
    
    const result1 = await testService.fastMethod('test data');
    console.log('Result:', result1);

    // Test 2: Performance monitoring
    console.log('\n⏱️ Test 2: Performance Monitoring');
    const result2 = await testService.slowMethod('performance test');
    console.log('Result:', result2);

    // Test 3: Method flow tracking
    console.log('\n🔄 Test 3: Method Flow Tracking');
    const result3 = await testService.flowMethod(10, 20);
    console.log('Result:', result3);

    // Test 4: Caching decorator
    console.log('\n💾 Test 4: Caching Decorator');
    console.log('First call (cache miss):');
    const result4a = await testService.cachedMethod('user123');
    console.log('Result:', result4a);
    
    console.log('Second call (cache hit):');
    const result4b = await testService.cachedMethod('user123');
    console.log('Result:', result4b);

    // Test 5: Retry decorator
    console.log('\n🔄 Test 5: Retry Decorator');
    try {
      const result5 = await testService.unreliableMethod('retry test');
      console.log('Result:', result5);
    } catch (error) {
      console.log('Final error:', error.message);
    }

    // Test 6: BaseModule extension
    console.log('\n🏗️ Test 6: BaseModule Extension');
    const dbService = new DatabaseService(logger);
    
    await dbService.connect();
    await dbService.query('SELECT * FROM users WHERE active = 1');
    await dbService.disconnect();

    // Test 7: Error handling
    console.log('\n❌ Test 7: Error Handling');
    const testServiceNoLogger = new TestService(null);
    try {
      await testServiceNoLogger.fastMethod('no logger test');
      console.log('✅ No-logger scenario handled gracefully');
    } catch (error) {
      console.log('❌ Unexpected error:', error.message);
    }

    // Test 8: Session management
    console.log('\n🔑 Test 8: Session Management');
    const sessionId1 = logger.getSessionId();
    console.log('Current session:', sessionId1);
    
    const sessionId2 = logger.renewSession();
    console.log('New session:', sessionId2);
    console.log('Sessions different:', sessionId1 !== sessionId2);

    // Test 9: Configuration changes
    console.log('\n⚙️ Test 9: Runtime Configuration');
    logger.setModuleConfig('TestService', {
      enabled: false,
      levels: [],
      transports: []
    });
    
    console.log('Logging disabled for TestService:');
    await testService.fastMethod('should not log');
    
    // Re-enable
    logger.setModuleConfig('TestService', {
      enabled: true,
      levels: ['debug', 'info', 'warn', 'error'],
      transports: ['console']
    });
    
    console.log('Logging re-enabled for TestService:');
    await testService.fastMethod('should log again');

    // Test 10: Multiple transports (if custom transports are available)
    console.log('\n🚀 Test 10: Transport Management');
    const transportList = logger.listTransports();
    console.log('Available transports:', transportList);
    
    // Cleanup
    console.log('\n🧹 Cleanup');
    await logger.flush();
    await logger.cleanup();

    console.log('\n✅ All decorator tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Performance benchmark test
async function runPerformanceBenchmark() {
  console.log('\n🏃‍♂️ Running Performance Benchmark...');
  
  const logger = createLogger(LoggerUtils.createDevelopmentConfig());
  const testService = new TestService(logger);
  
  const iterations = 100;
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    await testService.fastMethod(`iteration-${i}`);
  }
  
  const duration = Date.now() - startTime;
  const avgTime = duration / iterations;
  
  console.log(`📊 Benchmark Results:`);
  console.log(`   Total time: ${duration}ms`);
  console.log(`   Iterations: ${iterations}`);
  console.log(`   Average per call: ${avgTime.toFixed(2)}ms`);
  console.log(`   Calls per second: ${(1000 / avgTime).toFixed(2)}`);
}

// Memory usage test
async function runMemoryTest() {
  console.log('\n🧠 Running Memory Test...');
  
  const logger = createLogger(LoggerUtils.createDevelopmentConfig());
  const testService = new TestService(logger);
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  const initialMemory = process.memoryUsage();
  console.log('Initial memory:', Math.round(initialMemory.heapUsed / 1024 / 1024), 'MB');
  
  // Generate many log entries
  for (let i = 0; i < 1000; i++) {
    await testService.cachedMethod(`memory-test-${i % 10}`); // Reuse some keys for cache testing
  }
  
  const finalMemory = process.memoryUsage();
  console.log('Final memory:', Math.round(finalMemory.heapUsed / 1024 / 1024), 'MB');
  console.log('Memory increase:', Math.round((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024), 'MB');
}

// Export test functions for external use
module.exports = {
  runDecoratorTests,
  runPerformanceBenchmark,
  runMemoryTest,
  TestService,
  DatabaseService
};

// Run tests if this file is executed directly
if (require.main === module) {
  (async () => {
    await runDecoratorTests();
    await runPerformanceBenchmark();
    await runMemoryTest();
  })();
}