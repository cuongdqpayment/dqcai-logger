// transports/ConsoleTransport.ts - Built-in Console Transport
import { ILogTransport, LogEntry, LogLevel } from '../types/Logger.types';

export interface ConsoleTransportConfig {
  colorize?: boolean;
  timestamp?: boolean;
  prefix?: string;
}

export class ConsoleTransport implements ILogTransport {
  public readonly name = 'console';
  private config: ConsoleTransportConfig;

  constructor(config: ConsoleTransportConfig = {}) {
    this.config = {
      colorize: true,
      timestamp: true,
      prefix: '',
      ...config,
    };
  }

  public log(entry: LogEntry): void {
    const parts: string[] = [];
    
    if (this.config.timestamp) {
      parts.push(`[${entry.timestamp}]`);
    }
    
    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`);
    }
    
    parts.push(`[${entry.module}]`, `[${entry.level.toUpperCase()}]`, entry.message);
    
    const message = parts.join(' ');
    const data = entry.data ? [entry.data] : [];

    if (this.config.colorize) {
      this.logWithColor(entry.level, message, data);
    } else {
      this.logWithoutColor(entry.level, message, data);
    }
  }

  private logWithColor(level: LogLevel, message: string, data: any[]): void {
    const colors = {
      trace: '#999999',
      debug: '#0066cc',
      info: '#00cc66',
      warn: '#ff9900',
      error: '#cc0000',
    };

    const color = colors[level];
    console.log(`%c${message}`, `color: ${color}`, ...data);
  }

  private logWithoutColor(level: LogLevel, message: string, data: any[]): void {
    switch (level) {
      case 'error':
        console.error(message, ...data);
        break;
      case 'warn':
        console.warn(message, ...data);
        break;
      case 'info':
        console.info(message, ...data);
        break;
      default:
        console.log(message, ...data);
    }
  }
}
