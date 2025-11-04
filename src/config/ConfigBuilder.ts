// config/ConfigBuilder.ts - Configuration Builder
import { LoggerConfig, LogLevel } from '@/types/Logger.types';

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
