// config/logger-config.ts - Improved version
import { LoggerConfig, ILogTransport } from "../types/Logger.types";
import { UniversalLogger } from "../core/Logger";
import { LoggerConfigBuilder } from "../config/ConfigBuilder";
import { ConsoleTransport } from "../transports/ConsoleTransport";
import { LoggerUtils } from "../utils/LoggerUtils";

export const createLogger = (
  config?: LoggerConfig,
  transports?: ILogTransport[]
): UniversalLogger => {
  const defaultConfig = config || LoggerUtils.createDevelopmentConfig();
  const logger = new UniversalLogger(defaultConfig);

  // Add default console transport
  logger.addTransport(new ConsoleTransport());

  // Add custom transports if provided
  if (transports && transports.length > 0) {
    transports.forEach(transport => {
      logger.addTransport(transport);
    });
  }

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
  private static customTransports: ILogTransport[] = [];
  private static isInitializing = false;
  public static proxyInstances: Map<string, LoggerProxy> = new Map();

  static createDefaultConfig() {
    return new LoggerConfigBuilder()
      .setEnabled(true)
      .setDefaultLevel("warn")
      .build();
  }

  /**
   * ✨ NEW: Set custom transports before initialization
   */
  static setTransports(transports: ILogTransport[]): void {
    CommonLoggerConfig.customTransports = transports;
    
    // If logger already exists, add transports to it
    if (CommonLoggerConfig.instance) {
      transports.forEach(transport => {
        CommonLoggerConfig.instance!.addTransport(transport);
      });
    }
  }

  /**
   * ✨ NEW: Add a single transport (can be called anytime)
   */
  static addTransport(transport: ILogTransport): void {
    CommonLoggerConfig.customTransports.push(transport);
    
    if (CommonLoggerConfig.instance) {
      CommonLoggerConfig.instance.addTransport(transport);
    }
  }

  /**
   * ✨ NEW: Remove a transport by name
   */
  static removeTransport(name: string): boolean {
    CommonLoggerConfig.customTransports = CommonLoggerConfig.customTransports.filter(
      t => t.name !== name
    );
    
    if (CommonLoggerConfig.instance) {
      return CommonLoggerConfig.instance.removeTransport(name);
    }
    return false;
  }

  /**
   * ✨ NEW: Get list of active transports
   */
  static listTransports(): string[] {
    if (CommonLoggerConfig.instance) {
      return CommonLoggerConfig.instance.listTransports();
    }
    return CommonLoggerConfig.customTransports.map(t => t.name);
  }

  static initialize(customConfig?: any, transports?: ILogTransport[]): UniversalLogger {
    if (CommonLoggerConfig.isInitializing) {
      while (CommonLoggerConfig.isInitializing) {
        // Wait
      }
      return CommonLoggerConfig.instance!;
    }

    if (CommonLoggerConfig.instance && !customConfig && !transports) {
      return CommonLoggerConfig.instance;
    }

    CommonLoggerConfig.isInitializing = true;

    const config = customConfig || CommonLoggerConfig.createDefaultConfig();
    const allTransports = [
      ...CommonLoggerConfig.customTransports,
      ...(transports || [])
    ];

    CommonLoggerConfig.currentConfig = config;
    CommonLoggerConfig.instance = createLogger(config, allTransports);

    CommonLoggerConfig.isInitializing = false;

    return CommonLoggerConfig.instance;
  }

  static getInstance(): UniversalLogger {
    if (!CommonLoggerConfig.instance) {
      return CommonLoggerConfig.initialize();
    }
    return CommonLoggerConfig.instance;
  }

  static updateConfiguration(newConfig: any): void {
    const current = CommonLoggerConfig.currentConfig;
    if (
      current &&
      current.enabled === newConfig.enabled &&
      current.defaultLevel === newConfig.defaultLevel &&
      JSON.stringify(current.modules) === JSON.stringify(newConfig.modules)
    ) {
      return;
    }

    CommonLoggerConfig.currentConfig = newConfig;
    
    // Preserve transports when updating config
    CommonLoggerConfig.instance = createLogger(
      newConfig,
      CommonLoggerConfig.customTransports
    );
  }

  /**
   * ✨ NEW: Flush all transports
   */
  static async flush(): Promise<void> {
    if (CommonLoggerConfig.instance) {
      await CommonLoggerConfig.instance.flush();
    }
  }

  /**
   * ✨ NEW: Cleanup all transports
   */
  static async cleanup(): Promise<void> {
    if (CommonLoggerConfig.instance) {
      await CommonLoggerConfig.instance.cleanup();
    }
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
    transports?: string[]
  ): void {
    if (
      CommonLoggerConfig.currentConfig &&
      CommonLoggerConfig.currentConfig.modules
    ) {
      CommonLoggerConfig.currentConfig.modules[moduleName] = {
        enabled: true,
        levels: levels || ["debug", "info", "warn", "error"],
        transports: transports || ["console"],
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
        levels: [],
        transports: [],
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
    CommonLoggerConfig.customTransports = [];
    return CommonLoggerConfig.initialize();
  }

  static getActiveProxyModules(): string[] {
    return Array.from(CommonLoggerConfig.proxyInstances.keys());
  }

  static getCurrentConfig(): any {
    return CommonLoggerConfig.currentConfig
      ? { ...CommonLoggerConfig.currentConfig }
      : null;
  }
}

export const getCommonLogger = (): UniversalLogger => {
  return CommonLoggerConfig.getInstance();
};

/**
 * Create module logger using proxy pattern
 */
export const createModuleLogger = (moduleName: string): ModuleLogger => {
  if (CommonLoggerConfig.proxyInstances.has(moduleName)) {
    return CommonLoggerConfig.proxyInstances.get(moduleName)!;
  }

  const proxy = new LoggerProxy(moduleName);
  CommonLoggerConfig.proxyInstances.set(moduleName, proxy);

  return proxy;
};

/**
 * Utility functions for testing and debugging
 */
export const LoggerDebugs = {
  testDynamicUpdate: (moduleName: string): void => {
    const logger = createModuleLogger(moduleName);

    console.log(`\n=== Testing ${moduleName} Logger Dynamic Updates ===`);

    console.log("1. Setting debug configuration...");
    CommonLoggerConfig.updateConfiguration(
      CommonLoggerConfig.createDebugConfig()
    );
    logger.debug("This DEBUG message should be visible");
    logger.info("This INFO message should be visible");

    console.log("2. Setting production configuration...");
    CommonLoggerConfig.updateConfiguration(
      CommonLoggerConfig.createProductionConfig()
    );
    logger.debug("This DEBUG message should be HIDDEN");
    logger.info("This INFO message should be HIDDEN");
    logger.error("This ERROR message should be visible");

    console.log("3. Disabling specific module...");
    CommonLoggerConfig.disableModule(moduleName);
    logger.error("This ERROR message should be HIDDEN (module disabled)");

    console.log("4. Re-enabling specific module...");
    CommonLoggerConfig.enableModule(moduleName);
    logger.error("This ERROR message should be visible again");

    console.log(`=== End test for ${moduleName} ===\n`);
  },

  showStats: (): void => {
    console.log("\n=== Logger Statistics ===");
    console.log(
      `Active proxy modules: ${
        CommonLoggerConfig.getActiveProxyModules().length
      }`
    );
    console.log(`Proxy modules:`, CommonLoggerConfig.getActiveProxyModules());
    console.log(`Active transports:`, CommonLoggerConfig.listTransports());
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