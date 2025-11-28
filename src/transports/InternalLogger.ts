/**
 * Internal logger for 
 * Sử dụng console trực tiếp để tránh circular dependency
 * Có thể bật/tắt qua config
 */
export class InternalLogger {
  private enabled: boolean;
  private prefix = '[InternalLogger]';

  constructor(enabled: boolean = false) {
    this.enabled = enabled;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `${timestamp} ${this.prefix} [${level}] ${message}${dataStr}`;
  }

  debug(message: string, data?: any): void {
    if (this.enabled) {
      console.debug(this.formatMessage('DEBUG', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.enabled) {
      console.info(this.formatMessage('INFO', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.enabled) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  error(message: string, error?: any): void {
    if (this.enabled) {
      const errorData = error instanceof Error 
        ? { message: error.message, stack: error.stack }
        : error;
      console.error(this.formatMessage('ERROR', message, errorData));
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}