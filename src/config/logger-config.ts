// ./src/config/logger-config.ts
import { LoggerConfig } from "../types/Logger.types";
import { UniversalLogger } from "../core/Logger";
import { LoggerConfigBuilder } from "../config/ConfigBuilder";
import { ConsoleTransport } from "../transports/ConsoleTransport";
import { LoggerUtils } from "../utils/LoggerUtils";

export const createLogger = (config?: LoggerConfig): UniversalLogger => {
  const defaultConfig = config || LoggerUtils.createDevelopmentConfig();
  const logger = new UniversalLogger(defaultConfig);
  logger.addTransport(new ConsoleTransport());
  return logger;
};

export const CommonModules = {
  APP: "App",
  CONFIG: "Config",
  AUTH: "Auth",
  API: "API",
  DATABASE: "Database",
  MIDDLEWARE: "Middleware",
  UTILS: "Utils",
  SECURITY: "Security",
  VALIDATION: "Validation",
  CACHE: "Cache",
  FILE_SYSTEM: "FileSystem",
  NETWORK: "Network",
  SCHEDULER: "Scheduler",
  ERROR_HANDLER: "ErrorHandler",
};

interface ModuleLogger {
  trace: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

/**
 * Logger Proxy - always delegates to current logger instance
 */
class LoggerProxy implements ModuleLogger {
  constructor(private moduleName: string) {}

  trace(message: string, ...args: any[]): void {
    CommonLoggerConfig.getInstance().trace(this.moduleName, message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    CommonLoggerConfig.getInstance().debug(this.moduleName, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    CommonLoggerConfig.getInstance().info(this.moduleName, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    CommonLoggerConfig.getInstance().warn(this.moduleName, message, ...args);
  }

  error(message: string, ...args: any[]): void {
    CommonLoggerConfig.getInstance().error(this.moduleName, message, ...args);
  }
}

/**
 * Enhanced Common Logger Configuration with automatic update support
 */
export class CommonLoggerConfig {
  private static instance: UniversalLogger | null = null;
  private static currentConfig: any = null;
  // Track proxy instances for debugging
  public static proxyInstances: Map<string, LoggerProxy> = new Map();

  static createDefaultConfig() {
    return new LoggerConfigBuilder()
      .setEnabled(true)
      .setDefaultLevel("warn")
      .build();
  }

  static initialize(customConfig?: any): UniversalLogger {
    const config = customConfig || CommonLoggerConfig.createDefaultConfig();
    CommonLoggerConfig.currentConfig = config;

    CommonLoggerConfig.instance = createLogger(config);
    return CommonLoggerConfig.instance;
  }

  static getInstance(): UniversalLogger {
    if (!CommonLoggerConfig.instance) {
      return CommonLoggerConfig.initialize();
    }
    return CommonLoggerConfig.instance;
  }

  /**
   * Update configuration - proxy pattern automatically handles updates
   */
  static updateConfiguration(newConfig: any): void {
    CommonLoggerConfig.currentConfig = newConfig;
    CommonLoggerConfig.instance = createLogger(newConfig);
  }

  static setEnabled(enabled: boolean): void {
    if (CommonLoggerConfig.currentConfig) {
      CommonLoggerConfig.currentConfig.enabled = enabled;
      CommonLoggerConfig.updateConfiguration(CommonLoggerConfig.currentConfig);
    }
  }

  static enableModule(
    moduleName: string,
    levels?: string[],
    appenders?: string[]
  ): void {
    if (
      CommonLoggerConfig.currentConfig &&
      CommonLoggerConfig.currentConfig.modules
    ) {
      CommonLoggerConfig.currentConfig.modules[moduleName] = {
        enabled: true,
        levels: levels || ["debug", "info", "warn", "error"],
        appenders: appenders || ["console"],
      };
      CommonLoggerConfig.updateConfiguration(CommonLoggerConfig.currentConfig);
    }
  }

  static disableModule(moduleName: string): void {
    if (
      CommonLoggerConfig.currentConfig &&
      CommonLoggerConfig.currentConfig.modules
    ) {
      CommonLoggerConfig.currentConfig.modules[moduleName] = {
        enabled: false,
      };
      CommonLoggerConfig.updateConfiguration(CommonLoggerConfig.currentConfig);
    }
  }

  static createDebugConfig() {
    return new LoggerConfigBuilder()
      .setEnabled(true)
      .setDefaultLevel("trace")
      .build();
  }

  static createProductionConfig() {
    return new LoggerConfigBuilder()
      .setEnabled(true)
      .setDefaultLevel("warn")
      .build();
  }

  static reset(): UniversalLogger {
    return CommonLoggerConfig.initialize();
  }

  /**
   * Get active proxy modules
   */
  static getActiveProxyModules(): string[] {
    return Array.from(CommonLoggerConfig.proxyInstances.keys());
  }

  /**
   * Get current configuration (for debugging)
   */
  static getCurrentConfig(): any {
    return CommonLoggerConfig.currentConfig
      ? { ...CommonLoggerConfig.currentConfig }
      : null;
  }
}

export const CommonLogger = CommonLoggerConfig.getInstance();

/**
 * Create module logger using proxy pattern - automatically updates when configuration changes
 */
export const createModuleLogger = (moduleName: string): ModuleLogger => {
  // Check if proxy already exists for this module
  if (CommonLoggerConfig.proxyInstances.has(moduleName)) {
    return CommonLoggerConfig.proxyInstances.get(moduleName)!;
  }

  // Create new proxy
  const proxy = new LoggerProxy(moduleName);
  CommonLoggerConfig.proxyInstances.set(moduleName, proxy);

  return proxy;
};

/**
 * Utility functions for testing and debugging
 */
export const LoggerDebugs = {
  /**
   * Test if a module logger responds to configuration changes
   */
  testDynamicUpdate: (moduleName: string): void => {
    const logger = createModuleLogger(moduleName);

    console.log(`\n=== Testing ${moduleName} Logger Dynamic Updates ===`);

    // Test with debug config
    console.log("1. Setting debug configuration...");
    CommonLoggerConfig.updateConfiguration(
      CommonLoggerConfig.createDebugConfig()
    );
    logger.debug("This DEBUG message should be visible");
    logger.info("This INFO message should be visible");

    // Test with production config
    console.log("2. Setting production configuration...");
    CommonLoggerConfig.updateConfiguration(
      CommonLoggerConfig.createProductionConfig()
    );
    logger.debug("This DEBUG message should be HIDDEN");
    logger.info("This INFO message should be HIDDEN");
    logger.error("This ERROR message should be visible");

    // Test module disable
    console.log("3. Disabling specific module...");
    CommonLoggerConfig.disableModule(moduleName);
    logger.error("This ERROR message should be HIDDEN (module disabled)");

    // Test module re-enable
    console.log("4. Re-enabling specific module...");
    CommonLoggerConfig.enableModule(moduleName);
    logger.error("This ERROR message should be visible again");

    console.log(`=== End test for ${moduleName} ===\n`);
  },

  /**
   * Show current logger statistics
   */
  showStats: (): void => {
    console.log("\n=== Logger Statistics ===");
    console.log(
      `Active proxy modules: ${
        CommonLoggerConfig.getActiveProxyModules().length
      }`
    );
    console.log(`Proxy modules:`, CommonLoggerConfig.getActiveProxyModules());
    console.log(
      `Current config enabled:`,
      CommonLoggerConfig.getCurrentConfig()?.enabled
    );
    console.log(
      `Current default level:`,
      CommonLoggerConfig.getCurrentConfig()?.defaultLevel
    );
    console.log("========================\n");
  },
};
