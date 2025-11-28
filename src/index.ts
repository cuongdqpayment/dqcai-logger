// index.ts - Main Export
export {
  // Core Classes
  UniversalLogger,
  ModuleLogger,
} from "./core/Logger";

// Liệt kê tất cả transport và type của nó ra đây
export {
  TransportFactory,
  ApiTransport,
  ElectronFileTransport,
  NodeFileTransport,
  RNFileTransport,
} from "./transports";

export type {
  TransportFactoryConfig,
  ApiTransportConfig,
  ElectronFileTransportConfig,
  NodeFileTransportConfig,
  RNFileTransportConfig,
} from "./transports";

export { BaseModule } from "./core/BaseModule";

export {
  // Transports
  ConsoleTransport,
  type ConsoleTransportConfig,
} from "./transports/ConsoleTransport";

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

// LoggerTools
export {
  createLogger,
  CommonLoggerConfig,
  CommonModules,
  createModuleLogger,
} from "./config/logger-config";
