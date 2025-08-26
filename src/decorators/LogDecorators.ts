// decorators/LogDecorators.ts - Logging Decorators (Fixed)

// Interface để type-check các properties cần thiết
interface LoggableClass {
  moduleName?: string;
  logger?: {
    trace?: (message: string, data?: any) => Promise<void>;
    debug?: (message: string, data?: any) => Promise<void>;
    info?: (message: string, data?: any) => Promise<void>;
    warn?: (message: string, data?: any) => Promise<void>;
    error?: (message: string, data?: any) => Promise<void>;
  };
}

export function LogMethod(target: any, propertyName: string, descriptor: PropertyDescriptor): void {
  const method = descriptor.value;
  
  descriptor.value = async function (this: LoggableClass, ...args: any[]) {
    // Safely get module name với fallback
    const moduleName = this.moduleName || this.constructor?.name || 'UnknownModule';
    const logger = this.logger;

    // Kiểm tra logger tồn tại và có method debug
    if (logger && typeof logger.debug === 'function') {
      try {
        await logger.debug(`Calling method: ${propertyName}`, { 
          args: args.length,
          module: moduleName 
        });
        
        const start = Date.now();
        try {
          const result = await method.apply(this, args);
          const duration = Date.now() - start;
          await logger.debug(`Method ${propertyName} completed in ${duration}ms`, {
            module: moduleName,
            duration
          });
          return result;
        } catch (error) {
          const duration = Date.now() - start;
          if (typeof logger.error === 'function') {
            await logger.error(`Method ${propertyName} failed after ${duration}ms`, { 
              error: error instanceof Error ? error.message : String(error),
              module: moduleName,
              duration
            });
          }
          throw error;
        }
      } catch (logError) {
        // Nếu logging thất bại, vẫn tiếp tục thực hiện method
        console.warn(`[LogMethod] Logging failed for ${propertyName}:`, logError);
        return await method.apply(this, args);
      }
    } else {
      // Fallback: thực hiện method mà không logging
      return await method.apply(this, args);
    }
  };
}

export function LogPerformance(threshold: number = 1000) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor): void {
    const method = descriptor.value;
    
    descriptor.value = async function (this: LoggableClass, ...args: any[]) {
      const start = Date.now();
      
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - start;
        
        // Chỉ log nếu vượt quá threshold
        if (duration > threshold) {
          const logger = this.logger;
          const moduleName = this.moduleName || this.constructor?.name || 'UnknownModule';
          
          if (logger && typeof logger.warn === 'function') {
            try {
              await logger.warn(`Slow method detected: ${propertyName} took ${duration}ms`, {
                threshold,
                duration,
                args: args.length,
                module: moduleName,
              });
            } catch (logError) {
              // Fallback to console if logger fails
              console.warn(`[LogPerformance] Logging failed:`, logError);
              console.warn(`Slow method detected: ${propertyName} took ${duration}ms`);
            }
          } else {
            // Fallback to console if no logger
            console.warn(`Slow method detected: ${propertyName} took ${duration}ms (threshold: ${threshold}ms)`);
          }
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        const logger = this.logger;
        const moduleName = this.moduleName || this.constructor?.name || 'UnknownModule';
        
        // Log error nếu có logger
        if (logger && typeof logger.error === 'function') {
          try {
            await logger.error(`Method ${propertyName} failed after ${duration}ms`, {
              error: error instanceof Error ? error.message : String(error),
              module: moduleName,
              duration
            });
          } catch (logError) {
            console.error(`[LogPerformance] Error logging failed:`, logError);
          }
        }
        
        throw error;
      }
    };
  };
}

// Decorator bổ sung để log tự động khi method được gọi
export function AutoLog(level: 'trace' | 'debug' | 'info' | 'warn' | 'error' = 'debug') {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor): void {
    const method = descriptor.value;
    
    descriptor.value = async function (this: LoggableClass, ...args: any[]) {
      const logger = this.logger;
      const moduleName = this.moduleName || this.constructor?.name || 'UnknownModule';
      
      if (logger) {
        try {
          // Safely access logger method using bracket notation and type checking
          const logMethod = logger[level];
          if (typeof logMethod === 'function') {
            await logMethod(`[${level.toUpperCase()}] ${propertyName} called`, {
              module: moduleName,
              argsCount: args.length
            });
          }
        } catch (logError) {
          console.warn(`[AutoLog] Failed to log ${propertyName}:`, logError);
        }
      }
      
      return await method.apply(this, args);
    };
  };
}

// Type guard helper để kiểm tra object có logger không
export function hasLogger(obj: any): obj is LoggableClass & { logger: NonNullable<LoggableClass['logger']> } {
  return obj && 
         typeof obj === 'object' && 
         obj.logger && 
         typeof obj.logger === 'object';
}

// Helper để safely log từ bất kỳ object nào
export async function safeLog(
  obj: any, 
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error', 
  message: string, 
  data?: any
): Promise<void> {
  if (hasLogger(obj)) {
    try {
      const logMethod = obj.logger[level];
      if (typeof logMethod === 'function') {
        await logMethod(message, data);
      }
    } catch (error) {
      console.warn(`[safeLog] Failed to log at ${level} level:`, error);
    }
  }
}