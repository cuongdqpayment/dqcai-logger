// config/ConfigBuilder.ts - Improved Configuration Builder
import { LoggerConfig, LogLevel } from '../types/Logger.types';

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

  /**
   * Add a module with configuration
   */
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

  /**
   * ✨ NEW: Add multiple modules at once
   */
  public addModules(
    modules: Array<{
      name: string;
      enabled?: boolean;
      levels?: LogLevel[];
      transports?: string[];
    }>
  ): LoggerConfigBuilder {
    modules.forEach(module => {
      this.addModule(
        module.name,
        module.enabled ?? true,
        module.levels ?? ['info', 'warn', 'error'],
        module.transports ?? ['console']
      );
    });
    return this;
  }

  /**
   * ✨ NEW: Configure module to use specific transports
   */
  public setModuleTransports(
    moduleName: string,
    transports: string[]
  ): LoggerConfigBuilder {
    if (!this.config.modules[moduleName]) {
      this.config.modules[moduleName] = {
        enabled: true,
        levels: ['info', 'warn', 'error'],
        transports,
      };
    } else {
      this.config.modules[moduleName].transports = transports;
    }
    return this;
  }

  /**
   * ✨ NEW: Enable all log levels for a module
   */
  public enableAllLevelsForModule(moduleName: string): LoggerConfigBuilder {
    if (!this.config.modules[moduleName]) {
      this.config.modules[moduleName] = {
        enabled: true,
        levels: ['trace', 'debug', 'info', 'warn', 'error'],
        transports: ['console'],
      };
    } else {
      this.config.modules[moduleName].levels = ['trace', 'debug', 'info', 'warn', 'error'];
    }
    return this;
  }

  /**
   * ✨ NEW: Quick preset for development
   */
  public useDevelopmentPreset(): LoggerConfigBuilder {
    this.config.enabled = true;
    this.config.defaultLevel = 'debug';
    return this;
  }

  /**
   * ✨ NEW: Quick preset for production
   */
  public useProductionPreset(): LoggerConfigBuilder {
    this.config.enabled = true;
    this.config.defaultLevel = 'warn';
    return this;
  }

  /**
   * ✨ NEW: Quick preset for testing
   */
  public useTestingPreset(): LoggerConfigBuilder {
    this.config.enabled = true;
    this.config.defaultLevel = 'trace';
    return this;
  }

  public build(): LoggerConfig {
    return JSON.parse(JSON.stringify(this.config));
  }
}