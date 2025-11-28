// transports/DBTransport.ts - Database Transport using @dqcai/orm
import { ILogTransport, LogEntry } from "../types/Logger.types";
import { InternalLogger } from "./InternalLogger";

export interface DBTransportConfig {
  databaseType?: "sqlite" | "postgresql" | "mysql" | "mariadb";
  database?: string;
  dbDirectory?: string;
  filename?: string;
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  tableName?: string;
  batchSize?: number;
  flushInterval?: number;
  enableStatistics?: boolean;
  enableErrorTable?: boolean;
  enableInternalLogging?: boolean;
}

export class DBTransport implements ILogTransport {
  readonly name = "db";

  private config: DBTransportConfig;
  private logger: InternalLogger;
  private initialized = false;
  private initializing = false;
  private initPromise: Promise<void> | null = null;

  // Dynamic imports
  private DatabaseManager: any = null;
  private BaseService: any = null;
  private loggerSchema: any = null;

  // Services
  private logService: any = null;
  private errorLogService: any = null;
  private statisticsService: any = null;
  private sessionService: any = null;

  // Batching
  private buffer: LogEntry[] = [];
  private timer: NodeJS.Timeout | null = null;
  private batchSize: number;
  private flushInterval: number;

  // Session tracking
  private currentSessionId: string | null = null;

  private retryCount = 0;
  private maxRetries = 5;

  constructor(config: DBTransportConfig = {}) {
    this.config = {
      databaseType: "sqlite",
      database: "logger",
      dbDirectory: "./logs",
      tableName: "logs",
      batchSize: 100,
      flushInterval: 5000,
      enableStatistics: true,
      enableErrorTable: true,
      enableInternalLogging: true,
      ...config,
    };

    this.batchSize = this.config.batchSize!;
    this.flushInterval = this.config.flushInterval!;
    this.logger = new InternalLogger(this.config.enableInternalLogging);

    this.initDatabase();
  }

  private scheduleRetry(delay: number) {
    if (this.retryCount >= this.maxRetries) return;
    this.retryCount++;
    this.timer = setTimeout(() => {
      this.retryCount = 0;
      this.flush().catch(() => {});
    }, delay);
  }
  /**
   * Initialize database with dynamic imports
   */
  private async initDatabase(): Promise<void> {
    if (this.initialized || this.initializing) {
      return this.initPromise || Promise.resolve();
    }

    this.initializing = true;
    this.initPromise = (async () => {
      try {
        this.logger.debug("Initializing database transport...");

        // Dynamic import @dqcai/orm
        const ormModule = await import("@dqcai/orm");
        this.DatabaseManager = ormModule.DatabaseManager;
        this.BaseService = ormModule.BaseService;

        this.logger.debug("ORM module loaded successfully");

        // Dynamic import logger schema
        const schemaModule = await import("./schemas/loggerSchema");
        this.loggerSchema = schemaModule.loggerSchema;
        const LOGGER_SCHEMA_NAME = schemaModule.LOGGER_SCHEMA_NAME;

        this.logger.debug("Logger schema loaded successfully");

        // Register schema
        this.DatabaseManager.registerSchemas({
          [LOGGER_SCHEMA_NAME]: this.loggerSchema,
        });

        this.logger.debug("Schema registered");

        // Build database config
        const dbConfig = this.buildDbConfig();

        // Initialize database
        await this.DatabaseManager.initializeSchema(LOGGER_SCHEMA_NAME, {
          dbConfig,
          validateVersion: false,
        });

        this.logger.info("Database initialized successfully", {
          type: this.config.databaseType,
          database: this.config.database,
        });

        // Initialize services
        await this.initializeServices(LOGGER_SCHEMA_NAME);

        this.initialized = true;
        this.logger.info("DBTransport initialized successfully");
      } catch (err) {
        this.logger.error("Failed to initialize DBTransport", err);
        throw err;
      } finally {
        this.initializing = false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Build database configuration
   */
  private buildDbConfig(): any {
    const baseConfig: any = {
      databaseType: this.config.databaseType,
      database: this.config.database,
    };

    switch (this.config.databaseType) {
      case "sqlite":
        baseConfig.dbDirectory = this.config.dbDirectory;
        if (this.config.filename) {
          baseConfig.filename = this.config.filename;
        }
        baseConfig.pragma = {
          journal_mode: "WAL",
          synchronous: "NORMAL",
          foreign_keys: true,
        };
        break;

      case "postgresql":
      case "mysql":
      case "mariadb":
        if (this.config.connectionString) {
          baseConfig.connectionString = this.config.connectionString;
        } else {
          baseConfig.host = this.config.host || "localhost";
          baseConfig.port = this.config.port;
          baseConfig.user = this.config.user;
          baseConfig.password = this.config.password;
        }
        break;
    }

    return baseConfig;
  }

  /**
   * Initialize services
   */
  private async initializeServices(schemaName: string): Promise<void> {
    this.logger.debug("Initializing services...");

    // Create service classes dynamically
    class LogService extends this.BaseService {
      constructor() {
        super(schemaName, "logs");
      }
    }

    class ErrorLogService extends this.BaseService {
      constructor() {
        super(schemaName, "error_logs");
      }
    }

    class StatisticsService extends this.BaseService {
      constructor() {
        super(schemaName, "log_statistics");
      }
    }

    class SessionService extends this.BaseService {
      constructor() {
        super(schemaName, "log_sessions");
      }
    }

    // Initialize services
    this.logService = new LogService();
    await this.logService.initialize();

    if (this.config.enableErrorTable) {
      this.errorLogService = new ErrorLogService();
      await this.errorLogService.initialize();
    }

    if (this.config.enableStatistics) {
      this.statisticsService = new StatisticsService();
      await this.statisticsService.initialize();

      this.sessionService = new SessionService();
      await this.sessionService.initialize();
    }

    this.logger.info("Services initialized successfully");
  }

  /**
   * Log entry to database
   */
  async log(entry: LogEntry): Promise<void> {
    if (!this.initialized) {
      await this.initDatabase();
      if (!this.initialized) {
        this.logger.error("Cannot log: Transport not initialized");
        return;
      }
    }

    // Add to buffer
    this.buffer.push(entry);

    // Check if should flush
    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.buffer.length === 0) return;

    // Đảm bảo đã init xong
    if (!this.initialized) {
      await this.initDatabase();
    }

    const batch = [...this.buffer];
    this.buffer = []; // clear sớm để tránh duplicate

    try {
      // === KHÔNG DÙNG withTransaction NỮA ===
      // Vì bulkUpsert đã tự chạy trong transaction rồi!
      // Ghi log chính
      const logRecords = batch.map((entry) => this.mapToLogRecord(entry));
      await this.logService.bulkUpsert(logRecords);

      // Ghi error_logs (nếu bật)
      if (this.config.enableErrorTable && this.errorLogService) {
        const errorLogs = batch
          .filter((e) => e.level === "error")
          .map((entry) => this.mapToErrorRecord(entry));
        if (errorLogs.length > 0) {
          await this.errorLogService.bulkUpsert(errorLogs);
        }
      }

      // Cập nhật thống kê (cũng dùng bulkUpsert → đã atomic)
      if (this.config.enableStatistics && this.statisticsService) {
        await this.updateStatisticsInTransaction(batch);
      }

      this.logger.debug(
        `Successfully flushed ${batch.length} logs to database`
      );
    } catch (err: any) {
      // Nếu lỗi → đưa lại toàn bộ batch để retry
      this.buffer.unshift(...batch);
      this.logger.error("Failed to flush logs to database", {
        message: err.message,
        stack: err.stack,
        batchSize: batch.length,
      });

      // Retry sau 1-3s (jitter để tránh thundering herd)
      const delay = 1000 + Math.random() * 2000;
      this.timer = setTimeout(() => this.flush(), delay);
    }
  }

  private mapToLogRecord(entry: LogEntry) {
    return {
      timestamp: entry.timestamp,
      level: entry.level,
      module: entry.module,
      message: entry.message,
      data: entry.data ? JSON.stringify(entry.data) : null,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      session_id: entry.sessionId || this.currentSessionId,
    };
  }

  private mapToErrorRecord(entry: LogEntry) {
    return {
      timestamp: entry.timestamp,
      module: entry.module,
      message: entry.message,
      stack_trace:
        (entry.data as any)?.stack ||
        (entry.data as any)?.error?.stack ||
        String(entry.data),
      data: entry.data ? JSON.stringify(entry.data) : null,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      session_id: entry.sessionId || this.currentSessionId,
    };
  }

  private async updateStatisticsInTransaction(
    entries: LogEntry[]
  ): Promise<void> {
    if (!this.statisticsService) return;

    const today = new Date().toISOString().split("T")[0];
    const stats = new Map<string, number>();

    for (const entry of entries) {
      const key = `${entry.module}:${entry.level}`;
      stats.set(key, (stats.get(key) || 0) + 1);
    }

    for (const [key, count] of stats) {
      const [module, level] = key.split(":");
      await this.statisticsService.upsert(
        { date: today, module, level, count },
        ["date", "module", "level"]
      );
    }
  }

  /**
   * Update log statistics
   */
  private async updateStatistics(entries: LogEntry[]): Promise<void> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const stats: Record<string, number> = {};

      // Count logs by module and level
      entries.forEach((entry) => {
        const key = `${entry.module}:${entry.level}`;
        stats[key] = (stats[key] || 0) + 1;
      });

      // Update statistics
      for (const [key, count] of Object.entries(stats)) {
        const [module, level] = key.split(":");

        await this.statisticsService.upsert(
          {
            date: today,
            module,
            level,
            count,
          },
          ["date", "module", "level"]
        );
      }
    } catch (err) {
      this.logger.error("Failed to update statistics", err);
    }
  }

  /**
   * Start a new session
   */
  async startSession(sessionId?: string): Promise<string> {
    if (!this.initialized) {
      await this.initDatabase();
    }

    this.currentSessionId =
      sessionId ||
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (this.config.enableStatistics && this.sessionService) {
      try {
        await this.sessionService.upsert({
          session_id: this.currentSessionId,
          started_at: new Date().toISOString(),
          status: "active",
        });

        this.logger.info("Session started", {
          sessionId: this.currentSessionId,
        });
      } catch (err) {
        this.logger.error("Failed to start session", err);
      }
    }

    return this.currentSessionId;
  }

  /**
   * End current session
   */
  async endSession(): Promise<void> {
    if (!this.currentSessionId || !this.sessionService) return;

    try {
      await this.sessionService.update(
        { session_id: this.currentSessionId },
        {
          ended_at: new Date().toISOString(),
          status: "ended",
        }
      );

      this.logger.info("Session ended", { sessionId: this.currentSessionId });
      this.currentSessionId = null;
    } catch (err) {
      this.logger.error("Failed to end session", err);
    }
  }

  /**
   * Query logs from database
   */
  async queryLogs(filter: any = {}, options: any = {}): Promise<any[]> {
    if (!this.initialized) {
      await this.initDatabase();
    }

    try {
      const logs = await this.logService.find(filter, {
        ...options,
        orderBy: { timestamp: "DESC" },
      });

      // Parse JSON fields
      return logs.map((log: any) => ({
        ...log,
        data: log.data ? JSON.parse(log.data) : null,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      }));
    } catch (err) {
      this.logger.error("Failed to query logs", err);
      return [];
    }
  }

  /**
   * Get logs by level
   */
  async getLogsByLevel(level: string, limit: number = 100): Promise<any[]> {
    return this.queryLogs({ level }, { limit });
  }

  /**
   * Get logs by module
   */
  async getLogsByModule(module: string, limit: number = 100): Promise<any[]> {
    return this.queryLogs({ module }, { limit });
  }

  /**
   * Get logs by session
   */
  async getLogsBySession(
    sessionId: string,
    limit: number = 100
  ): Promise<any[]> {
    return this.queryLogs({ session_id: sessionId }, { limit });
  }

  /**
   * Get statistics
   */
  async getStatistics(filter: any = {}): Promise<any[]> {
    if (!this.initialized || !this.statisticsService) return [];

    try {
      return await this.statisticsService.find(filter, {
        orderBy: { date: "DESC" },
      });
    } catch (err) {
      this.logger.error("Failed to get statistics", err);
      return [];
    }
  }

  /**
   * Clear old logs
   */
  async clearOldLogs(daysToKeep: number = 30): Promise<number> {
    if (!this.initialized) return 0;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoff = cutoffDate.toISOString();

      const result = await this.logService.delete({
        timestamp: { $lt: cutoff },
      });

      this.logger.info(`Cleared ${result.deletedCount} old logs`);
      return result.deletedCount || 0;
    } catch (err) {
      this.logger.error("Failed to clear old logs", err);
      return 0;
    }
  }

  /**
   * Get transport statistics
   */
  async getTransportStats(): Promise<any> {
    if (!this.initialized) return null;

    try {
      const totalLogs = await this.logService.count();
      const errorCount = await this.logService.count({ level: "error" });

      const levelCounts: any = {};
      for (const level of ["trace", "debug", "info", "warn", "error"]) {
        levelCounts[level] = await this.logService.count({ level });
      }

      return {
        totalLogs,
        errorCount,
        levelCounts,
        bufferSize: this.buffer.length,
        initialized: this.initialized,
        currentSession: this.currentSessionId,
      };
    } catch (err) {
      this.logger.error("Failed to get transport stats", err);
      return null;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.logger.info("Cleaning up DBTransport...");

    await this.flush();

    if (this.currentSessionId) {
      await this.endSession();
    }

    if (this.DatabaseManager) {
      await this.DatabaseManager.closeAll();
    }

    this.logger.info("DBTransport cleanup completed");
  }

  /**
   * Enable/disable internal logging
   */
  setInternalLogging(enabled: boolean): void {
    this.logger.setEnabled(enabled);
  }
}
