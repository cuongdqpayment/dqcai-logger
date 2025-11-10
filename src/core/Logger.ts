import {
  LoggerConfig,
  LogEntry,
  LogLevel,
  ModuleConfig,
  ILogTransport,
  ITransportFactory,
} from "../types/Logger.types";

/**
 * Fix lỗi xử lý bigint trong lúc JSON.stringify
 * @param args 
 * @returns 
 */
const formatLogMessage = (...args: any[]): string => {
  return args
    .map((arg) => {
      // Handle BigInt directly
      if (typeof arg === "bigint") {
        return arg.toString();
      }

      // Handle objects with custom replacer
      if (typeof arg === "object" && arg !== null) {
        try {
          return JSON.stringify(
            arg,
            (key, value) => {
              // Handle BigInt in nested objects
              if (typeof value === "bigint") {
                return value.toString();
              }
              // Handle Date
              if (value instanceof Date) {
                return value.toISOString();
              }
              // Handle Buffer
              if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) {
                return `<Buffer ${value.length} bytes>`;
              }
              // Handle Function
              if (typeof value === "function") {
                return `<Function ${value.name || "anonymous"}>`;
              }
              return value;
            },
            2
          );
        } catch (error) {
          // Fallback nếu JSON.stringify fail
          return `<Error stringifying: ${(error as Error).message}>`;
        }
      }

      // Handle primitives
      return String(arg);
    })
    .join(" ");
};

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
    const levels: LogLevel[] = ["trace", "debug", "info", "warn", "error"];
    const levelIndex = levels.indexOf(level);
    const thresholdIndex = levels.indexOf(threshold);

    if (levelIndex === -1 || thresholdIndex === -1) {
      // If an unknown level is provided, default to not logging
      return false;
    }

    // Log if the level is at or above the threshold
    return levelIndex >= thresholdIndex;
  }

  private getTransportsForModule(module: string): ILogTransport[] {
    const moduleConfig = this.config.modules[module];
    const transportNames = moduleConfig?.transports || ["console"];

    return transportNames
      .map((name) => this.transports.get(name))
      .filter(
        (transport): transport is ILogTransport => transport !== undefined
      );
  }

  private async sendToTransports(
    entry: LogEntry,
    transports: ILogTransport[]
  ): Promise<void> {
    if (transports.length === 0) return;

    const promises = transports.map(async (transport) => {
      try {
        await transport.log(entry);
      } catch (error) {
        // Fallback to console if transport fails
        console.error(
          `[UniversalLogger] Transport ${transport.name} failed:`,
          error
        );
      }
    });

    await Promise.allSettled(promises);
  }

  // Public Logging Methods
  public async log(
    module: string,
    level: LogLevel,
    message: string,
    data?: any
  ): Promise<void> {
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

  public async trace(module: string, ...args: any[]): Promise<void> {
    const message = formatLogMessage(...args);
    await this.log(module, "trace", message);
  }

  public async debug(module: string, ...args: any[]): Promise<void> {
    const message = formatLogMessage(...args);
    await this.log(module, "debug", message);
  }

  public async info(module: string, ...args: any[]): Promise<void> {
    const message = formatLogMessage(...args);
    await this.log(module, "info", message);
  }

  public async warn(module: string, ...args: any[]): Promise<void> {
    const message = formatLogMessage(...args);
    await this.log(module, "warn", message);
  }

  public async error(module: string, ...args: any[]): Promise<void> {
    const message = formatLogMessage(...args);
    await this.log(module, "error", message);
  }

  // Utility Methods
  public async flush(): Promise<void> {
    const transports = Array.from(this.transports.values());
    const flushPromises = transports
      .filter((transport) => typeof transport.flush === "function")
      .map((transport) => transport.flush!());

    await Promise.allSettled(flushPromises);
  }

  public async cleanup(): Promise<void> {
    const transports = Array.from(this.transports.values());
    const cleanupPromises = transports
      .filter((transport) => typeof transport.cleanup === "function")
      .map((transport) => transport.cleanup!());

    await Promise.allSettled(cleanupPromises);
  }

  public createModuleLogger(module: string): ModuleLogger {
    return new ModuleLogger(module, this);
  }
}

export class ModuleLogger {
  private module: string;
  private logger: UniversalLogger;

  constructor(module: string, logger: UniversalLogger) {
    this.module = module;
    this.logger = logger;
  }

  public async flush(): Promise<void> {
    await this.logger.flush();
  }

  public async trace(...args: any[]): Promise<void> {
    const message = formatLogMessage(...args);
    await this.logger.trace(this.module, message);
  }

  public async debug(...args: any[]): Promise<void> {
    const message = formatLogMessage(...args);
    await this.logger.debug(this.module, message);
  }

  public async info(...args: any[]): Promise<void> {
    const message = formatLogMessage(...args);
    await this.logger.info(this.module, message);
  }

  public async warn(...args: any[]): Promise<void> {
    const message = formatLogMessage(...args);
    await this.logger.warn(this.module, message);
  }

  public async error(...args: any[]): Promise<void> {
    const message = formatLogMessage(...args);
    await this.logger.error(this.module, message);
  }

  public getModuleName(): string {
    return this.module;
  }
}
