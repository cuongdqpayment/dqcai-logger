// transports/RNFileTransport.ts - React Native File Transport
import { ILogTransport, LogEntry } from "../types/Logger.types";
import { InternalLogger } from "./InternalLogger";

export interface RNFileTransportConfig {
  fileName?: string;
  maxFileSize?: number;
  maxFiles?: number;
  enableInternalLogging?: boolean;
}

export class RNFileTransport implements ILogTransport {
  readonly name = "rn-file";
  private fileName: string;
  private maxFileSize: number;
  private maxFiles: number;
  private RNFS: any = null;
  private initialized = false;
  private logger: InternalLogger;

  constructor(config: RNFileTransportConfig = {}) {
    this.fileName = config.fileName || "app.log";
    this.maxFileSize = config.maxFileSize || 5 * 1024 * 1024; // 5MB
    this.maxFiles = config.maxFiles || 3;
    this.initRNFS();

    // Internal logging mặc định bật, có thể tắt qua config
    this.logger = new InternalLogger(config.enableInternalLogging === true);
  }

  private async initRNFS(): Promise<void> {
    try {
      this.RNFS = (await import("react-native-fs")).default;
      this.initialized = true;
    } catch (err) {
      this.logger.error(
        "[RNFileTransport] Không thể load react-native-fs:",
        err
      );
    }
  }

  async log(entry: LogEntry): Promise<void> {
    if (!this.initialized || !this.RNFS) {
      await this.initRNFS();
      if (!this.RNFS) return;
    }

    try {
      const path = `${this.RNFS.DocumentDirectoryPath}/${this.fileName}`;
      const line = JSON.stringify(entry) + "\n";

      // Kiểm tra kích thước file
      const fileExists = await this.RNFS.exists(path);
      if (fileExists) {
        const stat = await this.RNFS.stat(path);
        if (stat.size >= this.maxFileSize) {
          await this.rotateFiles(path);
        }
      }

      await this.RNFS.appendFile(path, line, "utf8");
    } catch (err) {
      this.logger.error("[RNFileTransport] Ghi file thất bại:", err);
    }
  }

  private async rotateFiles(currentPath: string): Promise<void> {
    try {
      // Xóa file cũ nhất nếu đã đạt giới hạn
      const oldestFile = `${this.RNFS.DocumentDirectoryPath}/${this.fileName}.${this.maxFiles}`;
      if (await this.RNFS.exists(oldestFile)) {
        await this.RNFS.unlink(oldestFile);
      }

      // Đổi tên các file còn lại
      for (let i = this.maxFiles - 1; i >= 1; i--) {
        const from = `${this.RNFS.DocumentDirectoryPath}/${this.fileName}.${i}`;
        const to = `${this.RNFS.DocumentDirectoryPath}/${this.fileName}.${
          i + 1
        }`;
        if (await this.RNFS.exists(from)) {
          await this.RNFS.moveFile(from, to);
        }
      }

      // Đổi tên file hiện tại
      await this.RNFS.moveFile(
        currentPath,
        `${this.RNFS.DocumentDirectoryPath}/${this.fileName}.1`
      );
    } catch (err) {
      this.logger.error("[RNFileTransport] Rotate files thất bại:", err);
    }
  }

  async getLogs(): Promise<string[]> {
    if (!this.RNFS) return [];

    try {
      const logs: string[] = [];
      for (let i = 0; i <= this.maxFiles; i++) {
        const fileName = i === 0 ? this.fileName : `${this.fileName}.${i}`;
        const path = `${this.RNFS.DocumentDirectoryPath}/${fileName}`;

        if (await this.RNFS.exists(path)) {
          const content = await this.RNFS.readFile(path, "utf8");
          logs.push(content);
        }
      }
      return logs;
    } catch (err) {
      this.logger.error("[RNFileTransport] Đọc logs thất bại:", err);
      return [];
    }
  }

  async clearLogs(): Promise<void> {
    if (!this.RNFS) return;

    try {
      for (let i = 0; i <= this.maxFiles; i++) {
        const fileName = i === 0 ? this.fileName : `${this.fileName}.${i}`;
        const path = `${this.RNFS.DocumentDirectoryPath}/${fileName}`;

        if (await this.RNFS.exists(path)) {
          await this.RNFS.unlink(path);
        }
      }
    } catch (err) {
      this.logger.error("[RNFileTransport] Xóa logs thất bại:", err);
    }
  }
}
