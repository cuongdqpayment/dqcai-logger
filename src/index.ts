// index.ts - Main Export
export {
  // Core Classes
  UniversalLogger,
  ModuleLogger,
} from "./core/Logger";

export { BaseModule } from "./core/BaseModule";

export {
  // Transports
  ConsoleTransport,
  type ConsoleTransportConfig,
} from "./transports/ConsoleTransport";

export { DefaultTransportFactory } from "./factories/DefaultTransportFactory";

export {
  // Configuration
  LoggerConfigBuilder,
} from "./config/ConfigBuilder";

export { LoggerUtils } from "./utils/LoggerUtils";

export {
  // Decorators
  LogMethod,
  LogPerformance,
  LogMethodFlow,
  LogCache,
  LogRetry,
  EnableLogging,
} from "./decorators/LogDecorators";

export {
  // Types
  type LogLevel,
  type LogEntry,
  type LoggerConfig,
  type ModuleConfig,
  type ILogTransport,
  type ITransportFactory,
} from "./types/Logger.types";

// Factory mặc định
export * from "./factories/DefaultTransportFactory";

// LoggerTools
export {
  createLogger,
  CommonLoggerConfig,
  CommonModules,
  createModuleLogger,
} from "./config/logger-config";
