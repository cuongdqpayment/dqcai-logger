import { UniversalLogger, ModuleLogger } from './Logger';

// Utility function to format multiple arguments into a single message
const formatLogMessage = (...args: any[]): string => {
  return args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
};

export abstract class BaseModule {
  protected readonly moduleName: string;
  protected readonly logger: ModuleLogger;

  constructor(moduleName: string, universalLogger: UniversalLogger) {
    this.moduleName = moduleName;
    this.logger = universalLogger.createModuleLogger(moduleName);
    
    // Fire-and-forget initialization log
    this.logger.info(`${moduleName} initialized`).catch(error => {
      console.error(`Failed to log initialization for ${moduleName}:`, error);
    });
  }

  // Synchronous logging methods using fire-and-forget pattern
  protected logTrace(...args: any[]): void {
    const message = formatLogMessage(...args);
    this.logger.trace(message).catch(error => {
      console.error(`Failed to log trace [${this.moduleName}]:`, error);
    });
  }

  protected logDebug(...args: any[]): void {
    const message = formatLogMessage(...args);
    this.logger.debug(message).catch(error => {
      console.error(`Failed to log debug [${this.moduleName}]:`, error);
    });
  }

  protected logInfo(...args: any[]): void {
    const message = formatLogMessage(...args);
    this.logger.info(message).catch(error => {
      console.error(`Failed to log info [${this.moduleName}]:`, error);
    });
  }

  protected logWarn(...args: any[]): void {
    const message = formatLogMessage(...args);
    this.logger.warn(message).catch(error => {
      console.error(`Failed to log warn [${this.moduleName}]:`, error);
    });
  }

  protected logError(...args: any[]): void {
    const message = formatLogMessage(...args);
    this.logger.error(message).catch(error => {
      console.error(`Failed to log error [${this.moduleName}]:`, error);
    });
  }

  // Async logging methods for special cases
  protected async logTraceAsync(...args: any[]): Promise<void> {
    const message = formatLogMessage(...args);
    await this.logger.trace(message);
  }

  protected async logDebugAsync(...args: any[]): Promise<void> {
    const message = formatLogMessage(...args);
    await this.logger.debug(message);
  }

  protected async logInfoAsync(...args: any[]): Promise<void> {
    const message = formatLogMessage(...args);
    await this.logger.info(message);
  }

  protected async logWarnAsync(...args: any[]): Promise<void> {
    const message = formatLogMessage(...args);
    await this.logger.warn(message);
  }

  protected async logErrorAsync(...args: any[]): Promise<void> {
    const message = formatLogMessage(...args);
    await this.logger.error(message);
  }

  // Utility method to flush all pending logs
  protected async flushLogs(): Promise<void> {
    if (typeof this.logger.flush === 'function') {
      await this.logger.flush();
    }
  }

  protected getModuleName(): string {
    return this.moduleName;
  }
}