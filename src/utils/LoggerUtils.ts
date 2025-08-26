// utils/LoggerUtils.ts - Utility Functions
import { LoggerConfig } from '../types/Logger.types';
import { LoggerConfigBuilder } from '../config/ConfigBuilder';

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
