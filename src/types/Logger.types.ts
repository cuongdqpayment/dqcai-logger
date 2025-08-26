// types/Logger.types.ts
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: any;
  metadata?: Record<string, any>;
  sessionId?: string;
}

export interface LoggerConfig {
  enabled: boolean;
  defaultLevel: LogLevel;
  modules: Record<string, ModuleConfig>;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface ModuleConfig {
  enabled: boolean;
  levels: LogLevel[];
  transports: string[];
}

// Transport Interface - User implementations
export interface ILogTransport {
  readonly name: string;
  log(entry: LogEntry): Promise<void> | void;
  flush?(): Promise<void> | void;
  cleanup?(): Promise<void> | void;
}

// Transport Factory Interface
export interface ITransportFactory {
  create(name: string, config: any): ILogTransport | null;
}
