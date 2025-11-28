// transports/TransportFactory.ts - Factory để tạo transport động
import { ILogTransport } from '../types/Logger.types';

export type PlatformType = 'web' | 'react-native' | 'electron' | 'node';

export interface TransportFactoryConfig {
  console?: {
    colorize?: boolean;
    timestamp?: boolean;
    prefix?: string;
  };
  api?: {
    baseURL: string;
    endpoint?: string;
    batchSize?: number;
    flushInterval?: number;
    maxRetries?: number;
  };
  file?: {
    fileName?: string;
    filePath?: string;
    maxFileSize?: number;
    maxFiles?: number;
  };
}

export class TransportFactory {
  /**
   * Phát hiện platform hiện tại
   */
  static detectPlatform(): PlatformType {
    // Check React Native
    if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      return 'react-native';
    }

    // Check Electron
    if (typeof process !== 'undefined' && process.versions?.electron) {
      return 'electron';
    }

    // Check Node.js
    if (typeof process !== 'undefined' && process.versions?.node && typeof window === 'undefined') {
      return 'node';
    }

    // Default to web
    return 'web';
  }

  /**
   * Tạo Console Transport
   */
  static async createConsoleTransport(config?: TransportFactoryConfig['console']): Promise<ILogTransport> {
    const { ConsoleTransport } = await import('./ConsoleTransport');
    return new ConsoleTransport(config || {});
  }

  /**
   * Tạo API Transport
   */
  static async createApiTransport(config: TransportFactoryConfig['api']): Promise<ILogTransport> {
    const { ApiTransport } = await import('./ApiTransport');
    return new ApiTransport(config as any);
  }

  /**
   * Tạo File Transport dựa trên platform
   */
  static async createFileTransport(
    platform?: PlatformType,
    config?: TransportFactoryConfig['file']
  ): Promise<ILogTransport | null> {
    const detectedPlatform = platform || this.detectPlatform();

    try {
      switch (detectedPlatform) {
        case 'react-native': {
          const { RNFileTransport } = await import('./RNFileTransport');
          return new RNFileTransport(config || {});
        }

        case 'electron': {
          const { ElectronFileTransport } = await import('./ElectronFileTransport');
          return new ElectronFileTransport(config || {});
        }

        case 'node': {
          const { NodeFileTransport } = await import('./NodeFileTransport');
          return new NodeFileTransport(config || {});
        }

        case 'web':
          console.warn('[TransportFactory] File transport không khả dụng trên web browser');
          return null;

        default:
          console.warn('[TransportFactory] Platform không được hỗ trợ:', detectedPlatform);
          return null;
      }
    } catch (err) {
      console.error('[TransportFactory] Không thể tạo file transport:', err);
      return null;
    }
  }

  /**
   * Tạo tất cả transports phù hợp cho platform hiện tại
   */
  static async createDefaultTransports(
    config?: TransportFactoryConfig
  ): Promise<ILogTransport[]> {
    const transports: ILogTransport[] = [];
    const platform = this.detectPlatform();

    // Console transport (luôn có)
    transports.push(await this.createConsoleTransport(config?.console));

    // API transport (nếu được cấu hình)
    if (config?.api) {
      transports.push(await this.createApiTransport(config.api));
    }

    // File transport (tùy platform)
    if (platform !== 'web') {
      const fileTransport = await this.createFileTransport(platform, config?.file);
      if (fileTransport) {
        transports.push(fileTransport);
      }
    }

    return transports;
  }
}