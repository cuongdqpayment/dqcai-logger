// src/decorators/LogDecorators.ts - Fixed Logging Decorators
import { ModuleLogger } from '../core/Logger';
// Interface để đảm bảo type safety
interface LoggableObject {
  logger?: ModuleLogger;
  moduleName?: string;
}

/**
 * Decorator để log method calls với full error handling
 */
export function LogMethod(target: any, propertyName: string, descriptor: PropertyDescriptor): void {
  const method = descriptor.value;

  descriptor.value = async function (this: LoggableObject, ...args: any[]) {
    const moduleName = this.moduleName || this.constructor.name;
    const logger = this.logger;

    if (logger) {
      try {
        await logger.debug(`Calling method: ${propertyName}`, {
          args: args.length,
          argTypes: args.map(arg => typeof arg)
        });

        const start = Date.now();
        try {
          const result = await method.apply(this, args);
          const duration = Date.now() - start;
          await logger.debug(`Method ${propertyName} completed in ${duration}ms`);
          return result;
        } catch (error) {
          const duration = Date.now() - start;
          await logger.error(`Method ${propertyName} failed after ${duration}ms`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
          throw error;
        }
      } catch (logError) {
        // Nếu logging fail, không nên ảnh hưởng đến method chính
        console.warn(`[LogMethod] Logging failed for ${propertyName}:`, logError);
        return await method.apply(this, args);
      }
    } else {
      // Fallback nếu không có logger
      return await method.apply(this, args);
    }
  };
}

/**
 * Decorator để monitor performance với configurable threshold
 */
export function LogPerformance(threshold: number = 1000) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor): void {
    const method = descriptor.value;

    descriptor.value = async function (this: LoggableObject, ...args: any[]) {
      const start = Date.now();

      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - start;

        // Chỉ log nếu có logger và vượt threshold
        const logger = this.logger;
        if (logger && duration > threshold) {
          try {
            await logger.warn(`Slow method detected: ${propertyName} took ${duration}ms`, {
              threshold,
              duration,
              methodName: propertyName,
              className: this.constructor.name,
              args: args.length,
              timestamp: new Date().toISOString()
            });
          } catch (logError) {
            // Silent fail cho performance logging
            console.warn(`[LogPerformance] Logging failed for ${propertyName}:`, logError);
          }
        }

        return result;
      } catch (error) {
        const duration = Date.now() - start;

        // Log performance ngay cả khi method fail
        const logger = this.logger;
        if (logger) {
          try {
            await logger.error(`Method ${propertyName} failed after ${duration}ms`, {
              threshold,
              duration,
              methodName: propertyName,
              className: this.constructor.name,
              error: error instanceof Error ? error.message : String(error)
            });
          } catch (logError) {
            console.warn(`[LogPerformance] Logging failed for ${propertyName}:`, logError);
          }
        }

        throw error;
      }
    };
  };
}

/**
 * Decorator để log method entry và exit với detailed info
 */
export function LogMethodFlow(logLevel: 'trace' | 'debug' = 'debug') {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor): void {
    const method = descriptor.value;

    descriptor.value = async function (this: LoggableObject, ...args: any[]) {
      const logger = this.logger;
      const methodId = `${this.constructor.name}.${propertyName}`;

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

          const result = await method.apply(this, args);
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
        return await method.apply(this, args);
      }
    };
  };
}

/**
 * Decorator để cache kết quả và log cache hits/misses
 */
export function LogCache(ttlMs: number = 60000) {
  const cache = new Map<string, { value: any; expires: number }>();

  return function (target: any, propertyName: string, descriptor: PropertyDescriptor): void {
    const method = descriptor.value;

    descriptor.value = async function (this: LoggableObject, ...args: any[]) {
      const cacheKey = `${this.constructor.name}.${propertyName}.${JSON.stringify(args)}`;
      const now = Date.now();
      const cached = cache.get(cacheKey);

      const logger = this.logger;

      // Check cache
      if (cached && cached.expires > now) {
        if (logger) {
          try {
            await logger.debug(`Cache HIT for ${propertyName}`, { cacheKey });
          } catch (logError) {
            console.warn('[LogCache] Logging failed:', logError);
          }
        }
        return cached.value;
      }

      // Cache miss - execute method
      if (logger) {
        try {
          await logger.debug(`Cache MISS for ${propertyName}`, { cacheKey });
        } catch (logError) {
          console.warn('[LogCache] Logging failed:', logError);
        }
      }

      const result = await method.apply(this, args);

      // Store in cache
      cache.set(cacheKey, {
        value: result,
        expires: now + ttlMs
      });

      return result;
    };
  };
}

/**
 * Decorator để retry method với exponential backoff và logging
 */
export function LogRetry(maxRetries: number = 3, baseDelayMs: number = 1000) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor): void {
    const method = descriptor.value;

    descriptor.value = async function (this: LoggableObject, ...args: any[]) {
      const logger = this.logger;
      let lastError: any;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          if (logger && attempt > 1) {
            await logger.info(`Retry attempt ${attempt}/${maxRetries} for ${propertyName}`);
          }

          return await method.apply(this, args);
        } catch (error) {
          lastError = error;

          if (logger) {
            try {
              await logger.warn(`Attempt ${attempt}/${maxRetries} failed for ${propertyName}`, {
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
            const delay = baseDelayMs * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // All retries exhausted
      if (logger) {
        try {
          await logger.error(`All ${maxRetries} attempts failed for ${propertyName}`, {
            maxRetries,
            finalError: lastError instanceof Error ? lastError.message : String(lastError)
          });
        } catch (logError) {
          console.warn('[LogRetry] Final logging failed:', logError);
        }
      }

      throw lastError;
    };
  };
}


/**
 * Interface cho class có thể log
 */
interface LoggableClass {
  logger?: ModuleLogger;
  moduleName?: string;
}

/**
 * Class decorator để tự động setup logging cho tất cả methods
 */
export function EnableLogging<T extends { new(...args: any[]): {} }>(
  moduleName?: string,
  logLevel: 'trace' | 'debug' | 'info' = 'debug'
) {
  return function (constructor: T) {
    return class extends constructor implements LoggableClass {
      public logger?: ModuleLogger;
      public moduleName?: string;

      constructor(...args: any[]) {
        super(...args);

        // Auto-setup logging nếu có universal logger trong args
        const universalLogger = args.find(arg =>
          arg && typeof arg === 'object' && typeof arg.createModuleLogger === 'function'
        );

        if (universalLogger && !this.logger) {
          const name = moduleName || constructor.name;
          this.logger = universalLogger.createModuleLogger(name);
          this.moduleName = name;
        }
      }
    } as T & { new(...args: any[]): T & LoggableClass };
  };
}