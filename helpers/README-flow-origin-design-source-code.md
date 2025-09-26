# Version 3
```ts
// src/types/Logger.types.ts
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: any;
  metadata?: Record<string, any>;
  sessionId?: string;
}

export interface LoggerConfig {
  enabled: boolean;
  defaultLevel: LogLevel;
  modules: Record<string, ModuleConfig>;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface ModuleConfig {
  enabled: boolean;
  levels: LogLevel[];
  transports: string[];
}

// Transport Interface - User implementations
export interface ILogTransport {
  readonly name: string;
  log(entry: LogEntry): Promise<void> | void;
  flush?(): Promise<void> | void;
  cleanup?(): Promise<void> | void;
}

// Transport Factory Interface
export interface ITransportFactory {
  create(name: string, config: any): ILogTransport | null;
}

// =================================================================================
// src/core/Logger.ts - Core Logger Implementation

export class UniversalLogger {
  private config: LoggerConfig;
  private transports: Map<string, ILogTransport> = new Map();
  private transportFactory: ITransportFactory | null = null;
  private sessionId: string;

  constructor(config: LoggerConfig) {
    this.config = config;
    this.sessionId = config.sessionId || this.generateSessionId();
  }

  // Session Management
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public renewSession(): string {
    this.sessionId = this.generateSessionId();
    return this.sessionId;
  }

  // Transport Management
  public setTransportFactory(factory: ITransportFactory): void {
    this.transportFactory = factory;
  }

  public addTransport(transport: ILogTransport): void {
    this.transports.set(transport.name, transport);
  }

  public removeTransport(name: string): boolean {
    return this.transports.delete(name);
  }

  public getTransport(name: string): ILogTransport | undefined {
    return this.transports.get(name);
  }

  public listTransports(): string[] {
    return Array.from(this.transports.keys());
  }

  // Configuration Management
  public setModuleConfig(module: string, config: ModuleConfig): void {
    this.config.modules[module] = config;
  }

  public getModuleConfig(module: string): ModuleConfig | undefined {
    return this.config.modules[module];
  }

  public setGlobalEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  public isGlobalEnabled(): boolean {
    return this.config.enabled;
  }

  public setDefaultLevel(level: LogLevel): void {
    this.config.defaultLevel = level;
  }

  public getConfig(): Readonly<LoggerConfig> {
    return JSON.parse(JSON.stringify(this.config));
  }

  public setMetadata(metadata: Record<string, any>): void {
    this.config.metadata = { ...this.config.metadata, ...metadata };
  }

  // Logging Logic
  private shouldLog(module: string, level: LogLevel): boolean {
    if (!this.config.enabled) return false;

    const moduleConfig = this.config.modules[module];
    if (!moduleConfig) {
      // Default behavior if no module config
      return this.isLevelEnabled(level, this.config.defaultLevel);
    }

    return moduleConfig.enabled && moduleConfig.levels.includes(level);
  }

  private isLevelEnabled(level: LogLevel, threshold: LogLevel): boolean {
    const levels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error'];
    const levelIndex = levels.indexOf(level);
    const thresholdIndex = levels.indexOf(threshold);
    return levelIndex >= thresholdIndex;
  }

  private getTransportsForModule(module: string): ILogTransport[] {
    const moduleConfig = this.config.modules[module];
    const transportNames = moduleConfig?.transports || ['console'];

    return transportNames
      .map(name => this.transports.get(name))
      .filter((transport): transport is ILogTransport => transport !== undefined);
  }

  private async sendToTransports(entry: LogEntry, transports: ILogTransport[]): Promise<void> {
    if (transports.length === 0) return;

    const promises = transports.map(async (transport) => {
      try {
        await transport.log(entry);
      } catch (error) {
        // Fallback to console if transport fails
        console.error(`[UniversalLogger] Transport ${transport.name} failed:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  // Public Logging Methods
  public async log(module: string, level: LogLevel, message: string, data?: any): Promise<void> {
    if (!this.shouldLog(module, level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data,
      metadata: this.config.metadata,
      sessionId: this.sessionId,
    };

    const transports = this.getTransportsForModule(module);
    await this.sendToTransports(entry, transports);
  }

  public async trace(module: string, message: string, data?: any): Promise<void> {
    await this.log(module, 'trace', message, data);
  }

  public async debug(module: string, message: string, data?: any): Promise<void> {
    await this.log(module, 'debug', message, data);
  }

  public async info(module: string, message: string, data?: any): Promise<void> {
    await this.log(module, 'info', message, data);
  }

  public async warn(module: string, message: string, data?: any): Promise<void> {
    await this.log(module, 'warn', message, data);
  }

  public async error(module: string, message: string, data?: any): Promise<void> {
    await this.log(module, 'error', message, data);
  }

  // Utility Methods
  public async flush(): Promise<void> {
    const transports = Array.from(this.transports.values());
    const flushPromises = transports
      .filter(transport => typeof transport.flush === 'function')
      .map(transport => transport.flush!());

    await Promise.allSettled(flushPromises);
  }

  public async cleanup(): Promise<void> {
    const transports = Array.from(this.transports.values());
    const cleanupPromises = transports
      .filter(transport => typeof transport.cleanup === 'function')
      .map(transport => transport.cleanup!());

    await Promise.allSettled(cleanupPromises);
  }

  public createModuleLogger(module: string): ModuleLogger {
    return new ModuleLogger(module, this);
  }
}

// =================================================================================
// src/core/ModuleLogger.ts - Module-specific Logger

export class ModuleLogger {
  private module: string;
  private logger: UniversalLogger;

  constructor(module: string, logger: UniversalLogger) {
    this.module = module;
    this.logger = logger;
  }

  public async trace(message: string, data?: any): Promise<void> {
    await this.logger.trace(this.module, message, data);
  }

  public async debug(message: string, data?: any): Promise<void> {
    await this.logger.debug(this.module, message, data);
  }

  public async info(message: string, data?: any): Promise<void> {
    await this.logger.info(this.module, message, data);
  }

  public async warn(message: string, data?: any): Promise<void> {
    await this.logger.warn(this.module, message, data);
  }

  public async error(message: string, data?: any): Promise<void> {
    await this.logger.error(this.module, message, data);
  }

  public getModuleName(): string {
    return this.module;
  }
}

// =================================================================================
// src/core/BaseModule.ts - Base class for modules with logging

export abstract class BaseModule {
  protected readonly moduleName: string;
  protected readonly logger: ModuleLogger;

  constructor(moduleName: string, universalLogger: UniversalLogger) {
    this.moduleName = moduleName;
    this.logger = universalLogger.createModuleLogger(moduleName);
    this.logger.info(`${moduleName} initialized`);
  }

  protected async logTrace(message: string, data?: any): Promise<void> {
    await this.logger.trace(message, data);
  }

  protected async logDebug(message: string, data?: any): Promise<void> {
    await this.logger.debug(message, data);
  }

  protected async logInfo(message: string, data?: any): Promise<void> {
    await this.logger.info(message, data);
  }

  protected async logWarn(message: string, data?: any): Promise<void> {
    await this.logger.warn(message, data);
  }

  protected async logError(message: string, data?: any): Promise<void> {
    await this.logger.error(message, data);
  }

  protected getModuleName(): string {
    return this.moduleName;
  }
}

// =================================================================================
// src/transports/ConsoleTransport.ts - Built-in Console Transport

export interface ConsoleTransportConfig {
  colorize?: boolean;
  timestamp?: boolean;
  prefix?: string;
}

export class ConsoleTransport implements ILogTransport {
  public readonly name = 'console';
  private config: ConsoleTransportConfig;

  constructor(config: ConsoleTransportConfig = {}) {
    this.config = {
      colorize: true,
      timestamp: true,
      prefix: '',
      ...config,
    };
  }

  public log(entry: LogEntry): void {
    const parts: string[] = [];
    
    if (this.config.timestamp) {
      parts.push(`[${entry.timestamp}]`);
    }
    
    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`);
    }
    
    parts.push(`[${entry.module}]`, `[${entry.level.toUpperCase()}]`, entry.message);
    
    const message = parts.join(' ');
    const data = entry.data ? [entry.data] : [];

    if (this.config.colorize) {
      this.logWithColor(entry.level, message, data);
    } else {
      this.logWithoutColor(entry.level, message, data);
    }
  }

  private logWithColor(level: LogLevel, message: string, data: any[]): void {
    const colors = {
      trace: '#999999',
      debug: '#0066cc',
      info: '#00cc66',
      warn: '#ff9900',
      error: '#cc0000',
    };

    const color = colors[level];
    console.log(`%c${message}`, `color: ${color}`, ...data);
  }

  private logWithoutColor(level: LogLevel, message: string, data: any[]): void {
    switch (level) {
      case 'error':
        console.error(message, ...data);
        break;
      case 'warn':
        console.warn(message, ...data);
        break;
      case 'info':
        console.info(message, ...data);
        break;
      default:
        console.log(message, ...data);
    }
  }
}

// =================================================================================
// src/factories/DefaultTransportFactory.ts - Default Transport Factory

export class DefaultTransportFactory implements ITransportFactory {
  private transportCreators: Map<string, (config: any) => ILogTransport> = new Map();

  constructor() {
    // Register built-in transports
    this.registerTransport('console', (config) => new ConsoleTransport(config));
  }

  public registerTransport(name: string, creator: (config: any) => ILogTransport): void {
    this.transportCreators.set(name, creator);
  }

  public create(name: string, config: any): ILogTransport | null {
    const creator = this.transportCreators.get(name);
    return creator ? creator(config) : null;
  }

  public getAvailableTransports(): string[] {
    return Array.from(this.transportCreators.keys());
  }
}

// =================================================================================
// src/config/ConfigBuilder.ts - Configuration Builder

export class LoggerConfigBuilder {
  private config: LoggerConfig;

  constructor() {
    this.config = {
      enabled: true,
      defaultLevel: 'info',
      modules: {},
    };
  }

  public setEnabled(enabled: boolean): LoggerConfigBuilder {
    this.config.enabled = enabled;
    return this;
  }

  public setDefaultLevel(level: LogLevel): LoggerConfigBuilder {
    this.config.defaultLevel = level;
    return this;
  }

  public setSessionId(sessionId: string): LoggerConfigBuilder {
    this.config.sessionId = sessionId;
    return this;
  }

  public setMetadata(metadata: Record<string, any>): LoggerConfigBuilder {
    this.config.metadata = metadata;
    return this;
  }

  public addModule(
    name: string, 
    enabled: boolean = true, 
    levels: LogLevel[] = ['info', 'warn', 'error'],
    transports: string[] = ['console']
  ): LoggerConfigBuilder {
    this.config.modules[name] = {
      enabled,
      levels,
      transports,
    };
    return this;
  }

  public build(): LoggerConfig {
    return JSON.parse(JSON.stringify(this.config));
  }
}

// =================================================================================
// src/utils/LoggerUtils.ts - Utility Functions

export class LoggerUtils {
  public static createDevelopmentConfig(): LoggerConfig {
    return new LoggerConfigBuilder()
      .setEnabled(true)
      .setDefaultLevel('debug')
      .addModule('DatabaseManager', true, ['debug', 'info', 'warn', 'error'], ['console'])
      .addModule('ApiClient', true, ['info', 'warn', 'error'], ['console'])
      .addModule('Cache', true, ['debug', 'info', 'warn', 'error'], ['console'])
      .build();
  }

  public static createProductionConfig(): LoggerConfig {
    return new LoggerConfigBuilder()
      .setEnabled(true)
      .setDefaultLevel('warn')
      .addModule('DatabaseManager', true, ['error'], ['console'])
      .addModule('ApiClient', true, ['warn', 'error'], ['console'])
      .addModule('Cache', false, [], [])
      .build();
  }

  public static createCustomConfig(isDev: boolean = false): LoggerConfig {
    return isDev 
      ? LoggerUtils.createDevelopmentConfig()
      : LoggerUtils.createProductionConfig();
  }
}

// =================================================================================
// src/decorators/LogDecorators.ts - Logging Decorators

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

// =================================================================================
// src/index.ts - Main Export

export {
  // Core Classes
  UniversalLogger,
  ModuleLogger,
  BaseModule,
  
  // Transports
  ConsoleTransport,
  DefaultTransportFactory,
  
  // Configuration
  LoggerConfigBuilder,
  LoggerUtils,
  
  // Decorators
  LogMethod,
  LogPerformance,
  
  // Types
  type LogLevel,
  type LogEntry,
  type LoggerConfig,
  type ModuleConfig,
  type ILogTransport,
  type ITransportFactory,
  type ConsoleTransportConfig,
};

// Default instance for quick usage
export const createLogger = (config?: LoggerConfig): UniversalLogger => {
  const defaultConfig = config || LoggerUtils.createDevelopmentConfig();
  const logger = new UniversalLogger(defaultConfig);
  
  // Add default console transport
  logger.addTransport(new ConsoleTransport());
  
  return logger;
};
```
// =================================================================================
// Example Usage Documentation

/*

## 📦 Installation Guide

1. Copy the logger files to your project:
   src/
   ├── logger/
   │   ├── types/
   │   ├── core/
   │   ├── transports/
   │   ├── factories/
   │   ├── config/
   │   ├── utils/
   │   ├── decorators/
   │   └── index.ts

2. Create your custom transports by implementing ILogTransport

3. Initialize in your app entry point

## 🚀 Quick Start

### Basic Usage:
```typescript
import { createLogger } from './logger';

// Create logger with default config
const logger = createLogger();

// Use directly
await logger.info('MyModule', 'Application started');
await logger.error('ApiClient', 'Request failed', { url: '/api/data' });

// Or create module-specific loggers
const dbLogger = logger.createModuleLogger('Database');
await dbLogger.debug('Connection established');
```

### Class Integration:
```typescript
import { BaseModule, UniversalLogger } from './logger';

class DatabaseManager extends BaseModule {
  constructor(logger: UniversalLogger) {
    super('DatabaseManager', logger);
  }
  
  async connect() {
    await this.logInfo('Attempting connection...');
    // Replace all console.log with this.logInfo/logDebug/etc
  }
}
```

### Replace Console.log Pattern:
```typescript
// Before:
console.log('Database connected');
console.error('Connection failed:', error);

// After:
await this.logInfo('Database connected');
await this.logError('Connection failed', { error });
```

## 🔧 Custom Transport Example

```typescript
// Your custom file transport
class FileTransport implements ILogTransport {
  name = 'file';
  
  constructor(private fileManager: YourFileManager) {}
  
  async log(entry: LogEntry): Promise<void> {
    await this.fileManager.writeLog(JSON.stringify(entry));
  }
}

// Register and use
logger.addTransport(new FileTransport(yourFileManager));
```

## Tôi đã tạo một thư viện logging hoàn toàn độc lập và có thể tích hợp vào bất kỳ dự án nào. Đây là hướng dẫn tích hợp chi tiết:
📁 Cấu trúc thư mục logger:
src/logger/
├── types/Logger.types.ts      # Định nghĩa types
├── core/Logger.ts            # Core logger engine
├── core/ModuleLogger.ts      # Module-specific logger
├── core/BaseModule.ts        # Base class cho modules
├── transports/ConsoleTransport.ts  # Built-in console transport
├── factories/DefaultTransportFactory.ts
├── config/ConfigBuilder.ts   # Configuration builder
├── utils/LoggerUtils.ts      # Utility functions
├── decorators/LogDecorators.ts # Performance decorators
└── index.ts                  # Main exports
🚀 Cách tích hợp vào dự án hiện tại:
Bước 1: Copy files vào project
bash# Copy toàn bộ thư mục logger vào src/
cp -r logger/ src/
Bước 2: Khởi tạo logger trong app entry point
typescript// App.tsx hoặc index.js
import { createLogger, LoggerUtils } from './src/logger';

// Tạo logger với config tự động
const isDev = __DEV__ || process.env.NODE_ENV === 'development';
const logger = createLogger(LoggerUtils.createCustomConfig(isDev));

// Export để dùng toàn app
export { logger };
Bước 3: Thay thế console.log trong các class hiện tại
Cách 1: Kế thừa BaseModule (Khuyên dùng)
typescriptimport { BaseModule } from './src/logger';
import { logger } from './App';

// BEFORE:
class DatabaseManager {
  connect() {
    console.log('Connecting to database...');
    console.error('Connection failed:', error);
  }
}

// AFTER:
class DatabaseManager extends BaseModule {
  constructor() {
    super('DatabaseManager', logger);
  }
  
  async connect() {
    await this.logInfo('Connecting to database...');
    // await this.logError('Connection failed', { error });
  }
}
Cách 2: Inject ModuleLogger
typescriptimport { ModuleLogger } from './src/logger';
import { logger } from './App';

class ApiClient {
  private logger: ModuleLogger;
  
  constructor() {
    this.logger = logger.createModuleLogger('ApiClient');
  }
  
  async request(url: string) {
    await this.logger.debug('Making request', { url });
    // Replace all console.log with this.logger.info/debug/error
  }
}
Cách 3: Direct usage
typescriptimport { logger } from './App';

// Anywhere in your code
await logger.info('MyModule', 'Operation completed');
await logger.error('MyModule', 'Something went wrong', { details });
🔧 Tạo Custom Transports:
File Transport với thư viện của bạn:
typescriptimport { ILogTransport, LogEntry } from './src/logger';

class MyFileTransport implements ILogTransport {
  readonly name = 'myFile';
  
  constructor(private yourFileManager: any) {}
  
  async log(entry: LogEntry): Promise<void> {
    // Sử dụng file manager của bạn
    const logLine = JSON.stringify(entry);
    await this.yourFileManager.appendToFile('app.log', logLine);
  }
  
  async flush(): Promise<void> {
    await this.yourFileManager.flush();
  }
}

// Đăng ký transport
logger.addTransport(new MyFileTransport(yourFileManager));
Database Transport với SQLite của bạn:
typescriptclass MyDatabaseTransport implements ILogTransport {
  readonly name = 'myDatabase';
  
  constructor(private yourDB: any) {}
  
  async log(entry: LogEntry): Promise<void> {
    await this.yourDB.insert('logs', {
      timestamp: entry.timestamp,
      level: entry.level,
      module: entry.module,
      message: entry.message,
      data: JSON.stringify(entry.data),
    });
  }
  
  async cleanup(): Promise<void> {
    // Xóa logs cũ hơn 30 ngày
    await this.yourDB.delete('logs', 'timestamp < ?', [
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    ]);
  }
}
API Transport với HTTP client của bạn:
typescriptclass MyApiTransport implements ILogTransport {
  readonly name = 'myApi';
  private buffer: LogEntry[] = [];
  
  constructor(private httpClient: any, private apiEndpoint: string) {}
  
  async log(entry: LogEntry): Promise<void> {
    this.buffer.push(entry);
    
    // Batch gửi khi đủ 50 logs
    if (this.buffer.length >= 50) {
      await this.flush();
    }
  }
  
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    const logs = [...this.buffer];
    this.buffer = [];
    
    try {
      await this.httpClient.post(this.apiEndpoint, { logs });
    } catch (error) {
      // Retry logic hoặc fallback
      console.warn('Failed to send logs to API:', error);
    }
  }
}
⚙️ Configuration linh hoạt:
Development setup:
typescript// logger.config.ts
import { LoggerConfigBuilder } from './src/logger';

export const createDevConfig = () => {
  return new LoggerConfigBuilder()
    .setEnabled(true)
    .setDefaultLevel('debug')
    .setMetadata({
      environment: 'development',
      version: '1.0.0',
    })
    // Database module: log mọi thứ ra console + file + database
    .addModule('DatabaseManager', true, 
      ['trace', 'debug', 'info', 'warn', 'error'], 
      ['console', 'myFile', 'myDatabase']
    )
    // API module: chỉ log info trở lên
    .addModule('ApiClient', true, 
      ['info', 'warn', 'error'], 
      ['console', 'myFile']
    )
    // QueryBuilder: tắt hoàn toàn
    .addModule('QueryBuilder', false, [], [])
    .build();
};
Production setup:
typescriptexport const createProdConfig = () => {
  return new LoggerConfigBuilder()
    .setEnabled(true)
    .setDefaultLevel('warn')
    // Chỉ log errors ra API + database
    .addModule('DatabaseManager', true, ['error'], ['myApi', 'myDatabase'])
    .addModule('ApiClient', true, ['warn', 'error'], ['myApi'])
    .addModule('QueryBuilder', false, [], []) // Tắt hết
    .build();
};
🎯 Migration Pattern - Thay thế từng bước:
Phase 1: Setup logger
typescript// 1. Khởi tạo logger
const logger = createLogger();

// 2. Register custom transports
logger.addTransport(new MyFileTransport(fileManager));
logger.addTransport(new MyDatabaseTransport(database));
Phase 2: Convert critical modules
typescript// Ưu tiên convert các module quan trọng trước
class DatabaseManager extends BaseModule {
  constructor() {
    super('DatabaseManager', logger);
  }
  
  // Chuyển tất cả console.log thành this.logXXX
}
Phase 3: Convert remaining modules
typescript// Dần dần chuyển các module khác
// Có thể để song song console.log và logger trong thời gian chuyển đổi
Phase 4: Cleanup
typescript// Xóa tất cả console.log còn lại
// Tối ưu configuration cho production
✨ Advanced Features:
Performance monitoring:
typescriptimport { LogPerformance } from './src/logger';

class DatabaseManager extends BaseModule {
  @LogPerformance(2000) // Cảnh báo nếu > 2 giây
  async heavyQuery(): Promise<any> {
    // Method sẽ tự động log nếu chạy lâu
  }
}
Runtime configuration:
typescript// Có thể thay đổi config khi app chạy
logger.setModuleConfig('QueryBuilder', {
  enabled: true,
  levels: ['debug'],
  transports: ['console']
});

// Tắt logging toàn bộ
logger.setGlobalEnabled(false);
Module-specific loggers:
typescript// Tạo logger riêng cho component
const componentLogger = logger.createModuleLogger('MyComponent');

const MyComponent = () => {
  useEffect(() => {
    componentLogger.info('Component mounted');
  }, []);
};
Ưu điểm của thiết kế này:

✅ Zero dependency: Không phụ thuộc thư viện ngoài
✅ Pluggable: Dễ dàng thêm transport tùy chỉnh
✅ Backward compatible: Có thể migrate từ từ
✅ Type-safe: Full TypeScript support
✅ Performance: Async logging, không block UI
✅ Flexible: Config runtime, per-module control

Bạn có muốn tôi tạo thêm ví dụ cụ thể cho transport nào đó hoặc hướng dẫn migration chi tiết hơn không?