# Version 1
```ts
// types/DebugLogger.types.ts
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface DebugConfig {
  global: boolean;
  [moduleName: string]: boolean;
}

export interface ModuleConfig {
  enabled: boolean;
  levels?: LogLevel[];
}

export interface AdvancedDebugConfig {
  global: boolean;
  modules: Record<string, ModuleConfig>;
}

export interface IDebugLogger {
  setDebug(module: string, enabled: boolean): void;
  setGlobalDebug(enabled: boolean): void;
  log(module: string, level: LogLevel, ...args: any[]): void;
  info(module: string, ...args: any[]): void;
  error(module: string, ...args: any[]): void;
  warn(module: string, ...args: any[]): void;
  debug(module: string, ...args: any[]): void;
  getConfig(): DebugConfig;
  resetConfig(): void;
}

// DebugLogger.ts - Hệ thống quản lý debug logging
class DebugLogger implements IDebugLogger {
  private debugConfig: DebugConfig;

  constructor() {
    // Cấu hình debug cho từng module/class
    this.debugConfig = {
      // Tắt/bật toàn bộ debug
      global: true,
      
      // Cấu hình cho từng class/module cụ thể
      DatabaseManager: true,
      QueryBuilder: false,
      ConnectionPool: true,
      Migration: false,
      Transaction: true,
    };
  }

  // Phương thức để bật/tắt debug cho module cụ thể
  public setDebug(module: string, enabled: boolean): void {
    this.debugConfig[module] = enabled;
  }

  // Phương thức để bật/tắt debug toàn cục
  public setGlobalDebug(enabled: boolean): void {
    this.debugConfig.global = enabled;
  }

  // Phương thức logging chính
  public log(module: string, level: LogLevel = 'info', ...args: any[]): void {
    // Kiểm tra debug có được bật không
    if (!this.debugConfig.global || !this.debugConfig[module]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${module}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'error':
        console.error(prefix, ...args);
        break;
      case 'warn':
        console.warn(prefix, ...args);
        break;
      case 'info':
        console.info(prefix, ...args);
        break;
      case 'debug':
        console.log(prefix, ...args);
        break;
      default:
        console.log(prefix, ...args);
    }
  }

  // Các phương thức tiện ích
  public info(module: string, ...args: any[]): void {
    this.log(module, 'info', ...args);
  }

  public error(module: string, ...args: any[]): void {
    this.log(module, 'error', ...args);
  }

  public warn(module: string, ...args: any[]): void {
    this.log(module, 'warn', ...args);
  }

  public debug(module: string, ...args: any[]): void {
    this.log(module, 'debug', ...args);
  }

  // Lấy cấu hình hiện tại
  public getConfig(): DebugConfig {
    return { ...this.debugConfig };
  }

  // Reset về cấu hình mặc định
  public resetConfig(): void {
    Object.keys(this.debugConfig).forEach(key => {
      if (key !== 'global') {
        this.debugConfig[key] = true;
      }
    });
  }
}

// Tạo instance singleton
const logger: DebugLogger = new DebugLogger();

export default logger;

// =================================================================================
// Base class cho các module có logging

export abstract class BaseModule {
  protected readonly moduleName: string;

  constructor(moduleName: string) {
    this.moduleName = moduleName;
    logger.info(this.moduleName, `${moduleName} initialized`);
  }

  protected logInfo(...args: any[]): void {
    logger.info(this.moduleName, ...args);
  }

  protected logError(...args: any[]): void {
    logger.error(this.moduleName, ...args);
  }

  protected logWarn(...args: any[]): void {
    logger.warn(this.moduleName, ...args);
  }

  protected logDebug(...args: any[]): void {
    logger.debug(this.moduleName, ...args);
  }
}

// =================================================================================
// Ví dụ sử dụng trong các class

// DatabaseManager.ts
interface DatabaseConnection {
  id: string;
  isConnected: boolean;
}

interface QueryResult {
  rows: any[];
  changes: number;
}

class DatabaseManager extends BaseModule {
  private connection: DatabaseConnection | null = null;

  constructor() {
    super('DatabaseManager');
  }

  public async connect(): Promise<void> {
    this.logDebug('Attempting to connect to database...');
    
    try {
      // Code kết nối database
      this.connection = {
        id: `conn_${Date.now()}`,
        isConnected: true
      };
      
      this.logInfo('Successfully connected to database');
    } catch (error) {
      this.logError('Failed to connect:', error);
      throw error;
    }
  }

  public async executeQuery(query: string, params: any[] = []): Promise<QueryResult> {
    this.logDebug('Executing query:', query, 'with params:', params);
    
    if (!this.connection?.isConnected) {
      const error = new Error('Database not connected');
      this.logError('Query execution failed:', error);
      throw error;
    }

    try {
      // Code thực thi query
      const result: QueryResult = { rows: [], changes: 0 }; // Giả lập kết quả
      this.logInfo(`Query executed successfully. Affected rows: ${result.changes}`);
      return result;
    } catch (error) {
      this.logError('Query execution failed:', error);
      throw error;
    }
  }

  public disconnect(): void {
    if (this.connection) {
      this.connection.isConnected = false;
      this.connection = null;
      this.logInfo('Database disconnected');
    }
  }
}

// QueryBuilder.ts
class QueryBuilder extends BaseModule {
  private query: string = '';
  private _fields: string[] = [];
  private _table: string = '';
  private _conditions: string[] = [];

  constructor() {
    super('QueryBuilder');
    this.logDebug('QueryBuilder instance created');
  }

  public select(fields: string[]): QueryBuilder {
    this.logDebug('Building SELECT with fields:', fields);
    this._fields = fields;
    this.query = `SELECT ${fields.join(', ')}`;
    return this;
  }

  public from(table: string): QueryBuilder {
    this.logDebug('Adding FROM clause:', table);
    this._table = table;
    this.query += ` FROM ${table}`;
    return this;
  }

  public where(condition: string): QueryBuilder {
    this.logDebug('Adding WHERE clause:', condition);
    this._conditions.push(condition);
    this.query += ` WHERE ${condition}`;
    return this;
  }

  public build(): string {
    this.logInfo('Final query built:', this.query);
    return this.query;
  }

  public reset(): QueryBuilder {
    this.query = '';
    this._fields = [];
    this._table = '';
    this._conditions = [];
    this.logDebug('QueryBuilder reset');
    return this;
  }
}

// ConnectionPool.ts
interface PoolConnection {
  id: string;
  createdAt: Date;
  lastUsed: Date;
  isActive: boolean;
}

class ConnectionPool extends BaseModule {
  private readonly maxConnections: number;
  private activeConnections: number = 0;
  private connections: Map<string, PoolConnection> = new Map();

  constructor(maxConnections: number = 10) {
    super('ConnectionPool');
    this.maxConnections = maxConnections;
    this.logInfo(`ConnectionPool initialized with max connections: ${maxConnections}`);
  }

  public async getConnection(): Promise<PoolConnection> {
    this.logDebug(`Getting connection. Active: ${this.activeConnections}/${this.maxConnections}`);
    
    if (this.activeConnections >= this.maxConnections) {
      this.logWarn('Connection pool is full, waiting...');
      // Logic chờ connection
      await this.waitForConnection();
    }

    const connection: PoolConnection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      lastUsed: new Date(),
      isActive: true
    };

    this.connections.set(connection.id, connection);
    this.activeConnections++;
    this.logInfo(`Connection acquired. Active connections: ${this.activeConnections}`);
    
    return connection;
  }

  public releaseConnection(connection: PoolConnection): void {
    if (this.connections.has(connection.id)) {
      this.connections.delete(connection.id);
      this.activeConnections--;
      this.logDebug(`Connection ${connection.id} released. Active: ${this.activeConnections}`);
    } else {
      this.logWarn(`Attempted to release unknown connection: ${connection.id}`);
    }
  }

  private async waitForConnection(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.activeConnections < this.maxConnections) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  public getStats(): { active: number; max: number; total: number } {
    const stats = {
      active: this.activeConnections,
      max: this.maxConnections,
      total: this.connections.size
    };
    this.logDebug('Connection pool stats:', stats);
    return stats;
  }
}

// =================================================================================
// Cách sử dụng và cấu hình

// App.ts hoặc file khởi tạo
declare const __DEV__: boolean; // React Native global

// Cấu hình debug khi khởi động ứng dụng
export const configureDebug = (): void => {
  // Tắt debug cho production
  if (!__DEV__) {
    logger.setGlobalDebug(false);
    return;
  }

  // Cấu hình chi tiết cho development
  logger.setDebug('DatabaseManager', true);    // Bật debug cho DatabaseManager
  logger.setDebug('QueryBuilder', false);      // Tắt debug cho QueryBuilder
  logger.setDebug('ConnectionPool', true);     // Bật debug cho ConnectionPool
  logger.setDebug('Migration', false);         // Tắt debug cho Migration
  logger.setDebug('Transaction', true);        // Bật debug cho Transaction

  console.log('Debug configuration:', logger.getConfig());
};

// =================================================================================
// Phiên bản nâng cao với cấu hình từ file JSON

// debugConfig.json
const debugConfigFromFile: AdvancedDebugConfig = {
  "global": true,
  "modules": {
    "DatabaseManager": {
      "enabled": true,
      "levels": ["info", "error", "warn"]
    },
    "QueryBuilder": {
      "enabled": false,
      "levels": ["error"]
    },
    "ConnectionPool": {
      "enabled": true,
      "levels": ["info", "error", "warn", "debug"]
    }
  }
};

// AdvancedDebugLogger.ts
class AdvancedDebugLogger extends DebugLogger {
  private levelConfig: Record<string, LogLevel[]> = {};

  public loadConfigFromFile(config: AdvancedDebugConfig): void {
    this.debugConfig = { global: config.global };
    
    Object.entries(config.modules).forEach(([module, moduleConfig]) => {
      this.debugConfig[module] = moduleConfig.enabled;
      if (moduleConfig.levels) {
        this.levelConfig[module] = moduleConfig.levels;
      }
    });
  }

  // Override log method để hỗ trợ levels
  public log(module: string, level: LogLevel = 'info', ...args: any[]): void {
    if (!this.debugConfig.global || !this.debugConfig[module]) {
      return;
    }

    // Kiểm tra level có được phép không
    const allowedLevels = this.levelConfig[module];
    if (allowedLevels && !allowedLevels.includes(level)) {
      return;
    }

    super.log(module, level, ...args);
  }

  public setModuleLevels(module: string, levels: LogLevel[]): void {
    this.levelConfig[module] = levels;
  }

  public getModuleLevels(module: string): LogLevel[] | undefined {
    return this.levelConfig[module];
  }
}

// Tạo instance advanced logger
const advancedLogger = new AdvancedDebugLogger();

// =================================================================================
// Utility functions và decorators

// Decorator cho logging method calls
export function LogMethodCall(target: any, propertyName: string, descriptor: PropertyDescriptor): void {
  const method = descriptor.value;
  
  descriptor.value = function (...args: any[]) {
    if (this.moduleName && logger) {
      logger.debug(this.moduleName, `Calling method: ${propertyName}`, args);
    }
    
    const result = method.apply(this, args);
    
    if (this.moduleName && logger) {
      logger.debug(this.moduleName, `Method ${propertyName} completed`);
    }
    
    return result;
  };
}

// Helper function để tạo logger cho functional components
export const createModuleLogger = (moduleName: string) => ({
  info: (...args: any[]) => logger.info(moduleName, ...args),
  error: (...args: any[]) => logger.error(moduleName, ...args),
  warn: (...args: any[]) => logger.warn(moduleName, ...args),
  debug: (...args: any[]) => logger.debug(moduleName, ...args),
});

// =================================================================================
// Export tất cả
export {
  DebugLogger,
  AdvancedDebugLogger,
  BaseModule,
  DatabaseManager,
  QueryBuilder,
  ConnectionPool,
  advancedLogger,
  configureDebug
};
```

# Version 2

```ts
// types/Logger.types.ts
import { LogLevel } from 'react-native-logs';

export type CustomLogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LogEntry {
  timestamp: string;
  level: CustomLogLevel;
  module: string;
  message: string;
  data?: any;
  deviceInfo?: DeviceInfo;
  sessionId?: string;
}

export interface DeviceInfo {
  platform: string;
  version: string;
  deviceId: string;
  appVersion: string;
  buildNumber: string;
}

export interface TransportConfig {
  console?: ConsoleTransportConfig;
  file?: FileTransportConfig;
  api?: ApiTransportConfig;
  database?: DatabaseTransportConfig;
}

export interface ConsoleTransportConfig {
  enabled: boolean;
  colorize: boolean;
  timestamp: boolean;
}

export interface FileTransportConfig {
  enabled: boolean;
  maxFiles: number;
  maxFileSize: number; // MB
  directory: string;
  fileName: string;
  compress: boolean;
}

export interface ApiTransportConfig {
  enabled: boolean;
  endpoint: string;
  batchSize: number;
  flushInterval: number; // seconds
  retryAttempts: number;
  headers?: Record<string, string>;
  timeout: number; // ms
}

export interface DatabaseTransportConfig {
  enabled: boolean;
  maxRecords: number;
  tableName: string;
  cleanupInterval: number; // hours
}

export interface ModuleConfig {
  enabled: boolean;
  levels: CustomLogLevel[];
  transports: string[]; // ['console', 'file', 'api', 'database']
}

export interface LoggerConfig {
  global: boolean;
  defaultLevel: CustomLogLevel;
  transports: TransportConfig;
  modules: Record<string, ModuleConfig>;
  deviceInfo: DeviceInfo;
  sessionId: string;
}

// =================================================================================
// Transport interfaces

export interface ILogTransport {
  name: string;
  log(entry: LogEntry): Promise<void>;
  flush?(): Promise<void>;
  cleanup?(): Promise<void>;
}

// =================================================================================
// Console Transport

export class ConsoleTransport implements ILogTransport {
  public readonly name = 'console';
  private config: ConsoleTransportConfig;

  constructor(config: ConsoleTransportConfig) {
    this.config = config;
  }

  public async log(entry: LogEntry): Promise<void> {
    if (!this.config.enabled) return;

    const timestamp = this.config.timestamp ? entry.timestamp : '';
    const prefix = `${timestamp} [${entry.module}] [${entry.level.toUpperCase()}]`;
    
    const message = `${prefix} ${entry.message}`;
    const data = entry.data ? [entry.data] : [];

    // Colorize for development
    if (this.config.colorize && __DEV__) {
      switch (entry.level) {
        case 'error':
          console.error(`%c${message}`, 'color: #ff6b6b', ...data);
          break;
        case 'warn':
          console.warn(`%c${message}`, 'color: #feca57', ...data);
          break;
        case 'info':
          console.info(`%c${message}`, 'color: #48dbfb', ...data);
          break;
        case 'debug':
          console.log(`%c${message}`, 'color: #ff9ff3', ...data);
          break;
        case 'trace':
          console.log(`%c${message}`, 'color: #54a0ff', ...data);
          break;
        default:
          console.log(message, ...data);
      }
    } else {
      // Standard console output
      switch (entry.level) {
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
}

// =================================================================================
// File Transport (React Native FS)

import RNFS from 'react-native-fs';

export class FileTransport implements ILogTransport {
  public readonly name = 'file';
  private config: FileTransportConfig;
  private currentFileSize: number = 0;
  private currentFileName: string = '';

  constructor(config: FileTransportConfig) {
    this.config = config;
    this.initializeFile();
  }

  private async initializeFile(): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];
    this.currentFileName = `${this.config.fileName}_${timestamp}.log`;
    
    // Ensure directory exists
    const dirPath = `${RNFS.DocumentDirectoryPath}/${this.config.directory}`;
    
    try {
      await RNFS.mkdir(dirPath);
    } catch (error) {
      // Directory might already exist
    }

    // Get current file size
    const filePath = `${dirPath}/${this.currentFileName}`;
    try {
      const stat = await RNFS.stat(filePath);
      this.currentFileSize = stat.size;
    } catch {
      this.currentFileSize = 0;
    }
  }

  public async log(entry: LogEntry): Promise<void> {
    if (!this.config.enabled) return;

    const logLine = JSON.stringify(entry) + '\n';
    const dirPath = `${RNFS.DocumentDirectoryPath}/${this.config.directory}`;
    const filePath = `${dirPath}/${this.currentFileName}`;

    // Check if we need to rotate the file
    if (this.currentFileSize + logLine.length > this.config.maxFileSize * 1024 * 1024) {
      await this.rotateFile();
    }

    try {
      await RNFS.appendFile(filePath, logLine, 'utf8');
      this.currentFileSize += logLine.length;
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private async rotateFile(): Promise<void> {
    const dirPath = `${RNFS.DocumentDirectoryPath}/${this.config.directory}`;
    
    try {
      // List all log files
      const files = await RNFS.readDir(dirPath);
      const logFiles = files
        .filter(file => file.name.startsWith(this.config.fileName) && file.name.endsWith('.log'))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Delete old files if we exceed maxFiles
      if (logFiles.length >= this.config.maxFiles) {
        const filesToDelete = logFiles.slice(this.config.maxFiles - 1);
        for (const file of filesToDelete) {
          await RNFS.unlink(file.path);
        }
      }

      // Compress current file if enabled
      if (this.config.compress) {
        // Implementation for compression (could use react-native-zip-archive)
        // await this.compressFile(filePath);
      }

      // Create new file
      await this.initializeFile();
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  public async flush(): Promise<void> {
    // Files are written immediately, no buffering
  }

  public async cleanup(): Promise<void> {
    const dirPath = `${RNFS.DocumentDirectoryPath}/${this.config.directory}`;
    
    try {
      const files = await RNFS.readDir(dirPath);
      const now = new Date().getTime();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

      for (const file of files) {
        if (now - file.mtime.getTime() > maxAge) {
          await RNFS.unlink(file.path);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old log files:', error);
    }
  }
}

// =================================================================================
// API Transport

export class ApiTransport implements ILogTransport {
  public readonly name = 'api';
  private config: ApiTransportConfig;
  private buffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;

  constructor(config: ApiTransportConfig) {
    this.config = config;
    this.setupFlushTimer();
    this.setupNetworkListener();
  }

  private setupFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval * 1000);
  }

  private setupNetworkListener(): void {
    // Use @react-native-community/netinfo
    import('@react-native-community/netinfo').then(NetInfo => {
      NetInfo.addEventListener(state => {
        this.isOnline = state.isConnected ?? false;
        if (this.isOnline && this.buffer.length > 0) {
          this.flush();
        }
      });
    });
  }

  public async log(entry: LogEntry): Promise<void> {
    if (!this.config.enabled) return;

    this.buffer.push(entry);

    // Flush immediately if buffer is full
    if (this.buffer.length >= this.config.batchSize) {
      await this.flush();
    }
  }

  public async flush(): Promise<void> {
    if (this.buffer.length === 0 || !this.isOnline) return;

    const logs = [...this.buffer];
    this.buffer = [];

    let attempt = 0;
    while (attempt < this.config.retryAttempts) {
      try {
        const response = await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.config.headers,
          },
          body: JSON.stringify({ logs }),
          timeout: this.config.timeout,
        });

        if (response.ok) {
          return; // Success
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        attempt++;
        console.warn(`Failed to send logs to API (attempt ${attempt}):`, error);
        
        if (attempt < this.config.retryAttempts) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // If all attempts failed, put logs back in buffer
    this.buffer.unshift(...logs);
  }
}

// =================================================================================
// Database Transport (SQLite)

import SQLite from 'react-native-sqlite-storage';

export class DatabaseTransport implements ILogTransport {
  public readonly name = 'database';
  private config: DatabaseTransportConfig;
  private db: SQLite.SQLiteDatabase | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: DatabaseTransportConfig) {
    this.config = config;
    this.initializeDatabase();
    this.setupCleanupTimer();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabase({
        name: 'logs.db',
        location: 'default',
      });

      // Create logs table
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS ${this.config.tableName} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp TEXT NOT NULL,
          level TEXT NOT NULL,
          module TEXT NOT NULL,
          message TEXT NOT NULL,
          data TEXT,
          device_info TEXT,
          session_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create index for better performance
      await this.db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_${this.config.tableName}_timestamp 
        ON ${this.config.tableName} (timestamp)
      `);

    } catch (error) {
      console.error('Failed to initialize log database:', error);
    }
  }

  private setupCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval * 60 * 60 * 1000); // Convert hours to milliseconds
  }

  public async log(entry: LogEntry): Promise<void> {
    if (!this.config.enabled || !this.db) return;

    try {
      await this.db.executeSql(
        `INSERT INTO ${this.config.tableName} 
         (timestamp, level, module, message, data, device_info, session_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.timestamp,
          entry.level,
          entry.module,
          entry.message,
          entry.data ? JSON.stringify(entry.data) : null,
          entry.deviceInfo ? JSON.stringify(entry.deviceInfo) : null,
          entry.sessionId || null,
        ]
      );
    } catch (error) {
      console.error('Failed to insert log into database:', error);
    }
  }

  public async flush(): Promise<void> {
    // Database writes are immediate, no buffering needed
  }

  public async cleanup(): Promise<void> {
    if (!this.db) return;

    try {
      // Get current record count
      const [result] = await this.db.executeSql(
        `SELECT COUNT(*) as count FROM ${this.config.tableName}`
      );
      
      const recordCount = result.rows.item(0).count;

      if (recordCount > this.config.maxRecords) {
        // Delete oldest records
        const recordsToDelete = recordCount - this.config.maxRecords;
        
        await this.db.executeSql(`
          DELETE FROM ${this.config.tableName} 
          WHERE id IN (
            SELECT id FROM ${this.config.tableName} 
            ORDER BY created_at ASC 
            LIMIT ?
          )
        `, [recordsToDelete]);

        console.info(`Cleaned up ${recordsToDelete} old log records`);
      }
    } catch (error) {
      console.error('Failed to cleanup old log records:', error);
    }
  }

  public async getLogs(limit: number = 100, level?: CustomLogLevel, module?: string): Promise<LogEntry[]> {
    if (!this.db) return [];

    try {
      let query = `SELECT * FROM ${this.config.tableName} WHERE 1=1`;
      const params: any[] = [];

      if (level) {
        query += ` AND level = ?`;
        params.push(level);
      }

      if (module) {
        query += ` AND module = ?`;
        params.push(module);
      }

      query += ` ORDER BY created_at DESC LIMIT ?`;
      params.push(limit);

      const [result] = await this.db.executeSql(query, params);
      const logs: LogEntry[] = [];

      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        logs.push({
          timestamp: row.timestamp,
          level: row.level,
          module: row.module,
          message: row.message,
          data: row.data ? JSON.parse(row.data) : undefined,
          deviceInfo: row.device_info ? JSON.parse(row.device_info) : undefined,
          sessionId: row.session_id,
        });
      }

      return logs;
    } catch (error) {
      console.error('Failed to retrieve logs from database:', error);
      return [];
    }
  }
}

// =================================================================================
// Main Professional Logger

export class ProfessionalLogger {
  private config: LoggerConfig;
  private transports: Map<string, ILogTransport> = new Map();
  private deviceInfo: DeviceInfo;
  private sessionId: string;

  constructor(config: LoggerConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.deviceInfo = this.collectDeviceInfo();
    this.initializeTransports();
    this.setupGlobalErrorHandler();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private collectDeviceInfo(): DeviceInfo {
    // Use react-native-device-info
    return {
      platform: 'unknown', // DeviceInfo.getSystemName()
      version: 'unknown',   // DeviceInfo.getSystemVersion()
      deviceId: 'unknown',  // DeviceInfo.getUniqueId()
      appVersion: 'unknown', // DeviceInfo.getVersion()
      buildNumber: 'unknown', // DeviceInfo.getBuildNumber()
    };
  }

  private initializeTransports(): void {
    const { transports } = this.config;

    // Initialize Console Transport
    if (transports.console) {
      this.transports.set('console', new ConsoleTransport(transports.console));
    }

    // Initialize File Transport
    if (transports.file) {
      this.transports.set('file', new FileTransport(transports.file));
    }

    // Initialize API Transport
    if (transports.api) {
      this.transports.set('api', new ApiTransport(transports.api));
    }

    // Initialize Database Transport
    if (transports.database) {
      this.transports.set('database', new DatabaseTransport(transports.database));
    }
  }

  private setupGlobalErrorHandler(): void {
    // Catch unhandled errors
    global.ErrorUtils?.setGlobalHandler((error, isFatal) => {
      this.error('GlobalErrorHandler', 'Unhandled error', { 
        error: error.message, 
        stack: error.stack, 
        isFatal 
      });
    });
  }

  public setModuleConfig(module: string, config: ModuleConfig): void {
    this.config.modules[module] = config;
  }

  public setGlobalEnabled(enabled: boolean): void {
    this.config.global = enabled;
  }

  private shouldLog(module: string, level: CustomLogLevel): boolean {
    if (!this.config.global) return false;

    const moduleConfig = this.config.modules[module];
    if (!moduleConfig) return true; // Default to enabled if no config

    return moduleConfig.enabled && moduleConfig.levels.includes(level);
  }

  private getTransportsForModule(module: string): ILogTransport[] {
    const moduleConfig = this.config.modules[module];
    const transportNames = moduleConfig?.transports || ['console'];

    return transportNames
      .map(name => this.transports.get(name))
      .filter((transport): transport is ILogTransport => transport !== undefined);
  }

  private async logToTransports(entry: LogEntry, transports: ILogTransport[]): Promise<void> {
    const promises = transports.map(transport => 
      transport.log(entry).catch(error => 
        console.error(`Transport ${transport.name} failed:`, error)
      )
    );

    await Promise.allSettled(promises);
  }

  // Public logging methods
  public async log(module: string, level: CustomLogLevel, message: string, data?: any): Promise<void> {
    if (!this.shouldLog(module, level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data,
      deviceInfo: this.deviceInfo,
      sessionId: this.sessionId,
    };

    const transports = this.getTransportsForModule(module);
    await this.logToTransports(entry, transports);
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

  // Utility methods
  public async flush(): Promise<void> {
    const flushPromises = Array.from(this.transports.values())
      .filter(transport => transport.flush)
      .map(transport => transport.flush!());

    await Promise.allSettled(flushPromises);
  }

  public async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.transports.values())
      .filter(transport => transport.cleanup)
      .map(transport => transport.cleanup!());

    await Promise.allSettled(cleanupPromises);
  }

  public getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // Get logs from database transport
  public async getLogs(limit?: number, level?: CustomLogLevel, module?: string): Promise<LogEntry[]> {
    const dbTransport = this.transports.get('database') as DatabaseTransport;
    if (dbTransport && dbTransport.getLogs) {
      return dbTransport.getLogs(limit, level, module);
    }
    return [];
  }
}

// =================================================================================
// Enhanced Base Module with Professional Logger

export abstract class BaseModule {
  protected readonly moduleName: string;
  protected logger: ProfessionalLogger;

  constructor(moduleName: string, logger: ProfessionalLogger) {
    this.moduleName = moduleName;
    this.logger = logger;
    this.logger.info(this.moduleName, `${moduleName} initialized`);
  }

  protected async logTrace(...args: any[]): Promise<void> {
    await this.logger.trace(this.moduleName, ...args);
  }

  protected async logDebug(...args: any[]): Promise<void> {
    await this.logger.debug(this.moduleName, ...args);
  }

  protected async logInfo(...args: any[]): Promise<void> {
    await this.logger.info(this.moduleName, ...args);
  }

  protected async logWarn(...args: any[]): Promise<void> {
    await this.logger.warn(this.moduleName, ...args);
  }

  protected async logError(...args: any[]): Promise<void> {
    await this.logger.error(this.moduleName, ...args);
  }
}

// =================================================================================
// Configuration Factory

export class LoggerConfigFactory {
  public static createDevelopmentConfig(): LoggerConfig {
    return {
      global: true,
      defaultLevel: 'debug',
      transports: {
        console: {
          enabled: true,
          colorize: true,
          timestamp: true,
        },
        file: {
          enabled: true,
          maxFiles: 5,
          maxFileSize: 10, // MB
          directory: 'logs',
          fileName: 'app',
          compress: false,
        },
        database: {
          enabled: true,
          maxRecords: 10000,
          tableName: 'app_logs',
          cleanupInterval: 24, // hours
        },
        api: {
          enabled: false, // Disabled in development
          endpoint: '',
          batchSize: 50,
          flushInterval: 30,
          retryAttempts: 3,
          timeout: 5000,
        },
      },
      modules: {
        DatabaseManager: {
          enabled: true,
          levels: ['debug', 'info', 'warn', 'error'],
          transports: ['console', 'file', 'database'],
        },
        QueryBuilder: {
          enabled: true,
          levels: ['info', 'warn', 'error'],
          transports: ['console', 'database'],
        },
        ConnectionPool: {
          enabled: true,
          levels: ['debug', 'info', 'warn', 'error'],
          transports: ['console', 'file', 'database'],
        },
      },
      deviceInfo: {
        platform: 'unknown',
        version: 'unknown',
        deviceId: 'unknown',
        appVersion: 'unknown',
        buildNumber: 'unknown',
      },
      sessionId: '',
    };
  }

  public static createProductionConfig(): LoggerConfig {
    const config = this.createDevelopmentConfig();
    
    return {
      ...config,
      defaultLevel: 'warn',
      transports: {
        ...config.transports,
        console: {
          ...config.transports.console!,
          enabled: false, // Disable console in production
        },
        api: {
          ...config.transports.api!,
          enabled: true, // Enable API logging in production
          endpoint: 'https://your-api.com/logs',
          headers: {
            'Authorization': 'Bearer your-token',
            'X-App-Version': '1.0.0',
          },
        },
        file: {
          ...config.transports.file!,
          maxFiles: 3,
          maxFileSize: 5,
        },
      },
      modules: {
        DatabaseManager: {
          enabled: true,
          levels: ['warn', 'error'],
          transports: ['api', 'database'],
        },
        QueryBuilder: {
          enabled: true,
          levels: ['error'],
          transports: ['api', 'database'],
        },
        ConnectionPool: {
          enabled: true,
          levels: ['warn', 'error'],
          transports: ['api', 'file', 'database'],
        },
      },
    };
  }
}

// =================================================================================
// Usage Example

// Initialize logger
const loggerConfig = __DEV__ 
  ? LoggerConfigFactory.createDevelopmentConfig()
  : LoggerConfigFactory.createProductionConfig();

export const professionalLogger = new ProfessionalLogger(loggerConfig);

// Example usage in classes
class DatabaseManager extends BaseModule {
  constructor() {
    super('DatabaseManager', professionalLogger);
  }

  async connect() {
    await this.logDebug('Attempting to connect to database...');
    try {
      // Connection logic
      await this.logInfo('Successfully connected to database');
    } catch (error) {
      await this.logError('Failed to connect:', { error });
      throw error;
    }
  }
}

// Example usage in functional components
export const createComponentLogger = (componentName: string) => ({
  trace: (message: string, data?: any) => professionalLogger.trace(componentName, message, data),
  debug: (message: string, data?: any) => professionalLogger.debug(componentName, message, data),
  info: (message: string, data?: any) => professionalLogger.info(componentName, message, data),
  warn: (message: string, data?: any) => professionalLogger.warn(componentName, message, data),
  error: (message: string, data?: any) => professionalLogger.error(componentName, message, data),
});

// React Hook for logging
export const useLogger = (componentName: string) => {
  return createComponentLogger(componentName);
};

export default professionalLogger;

```