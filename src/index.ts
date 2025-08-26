// index.ts - Main Export
export {
  // Core Classes
  UniversalLogger,
  ModuleLogger,
} from './core/Logger';

export {
  BaseModule,
} from './core/BaseModule';

export {
  // Transports
  ConsoleTransport,
  type ConsoleTransportConfig,
} from './transports/ConsoleTransport';

export {
  DefaultTransportFactory,
} from './factories/DefaultTransportFactory';

export {
  // Configuration
  LoggerConfigBuilder,
} from './config/ConfigBuilder';

export {
  LoggerUtils,
} from './utils/LoggerUtils';

export {
  // Decorators
  LogMethod,
  LogPerformance,
} from './decorators/LogDecorators';

export {
  // Types
  type LogLevel,
  type LogEntry,
  type LoggerConfig,
  type ModuleConfig,
  type ILogTransport,
  type ITransportFactory,
} from './types/Logger.types';

// Default instance creator
import { UniversalLogger } from './core/Logger';
import { ConsoleTransport } from './transports/ConsoleTransport';
import { LoggerUtils } from './utils/LoggerUtils';
import { LoggerConfig } from './types/Logger.types';


// Factory mặc định
export * from './factories/DefaultTransportFactory';


export const createLogger = (config?: LoggerConfig): UniversalLogger => {
  const defaultConfig = config || LoggerUtils.createDevelopmentConfig();
  const logger = new UniversalLogger(defaultConfig);
  
  // Add default console transport
  logger.addTransport(new ConsoleTransport());
  
  return logger;
};