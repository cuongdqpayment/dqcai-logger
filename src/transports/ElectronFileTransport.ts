// transports/ElectronFileTransport.ts - Electron File Transport
import { ILogTransport, LogEntry } from "../types/Logger.types";
import { InternalLogger } from "./InternalLogger";

export interface ElectronFileTransportConfig {
  fileName?: string;
  maxFileSize?: number;
  maxFiles?: number;
  enableInternalLogging?: boolean;
}

export class ElectronFileTransport implements ILogTransport {
  readonly name = "electron-file";
  private fileName: string;
  private maxFileSize: number;
  private maxFiles: number;
  private fs: any = null;
  private path: any = null;
  private app: any = null;
  private logPath: string = "";
  private initialized = false;
  private logger: InternalLogger;

  constructor(config: ElectronFileTransportConfig = {}) {
    this.fileName = config.fileName || "app.log";
    this.maxFileSize = config.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = config.maxFiles || 5;
    this.initElectron();
    // Internal logging mặc định bật, có thể tắt qua config
    this.logger = new InternalLogger(config.enableInternalLogging === true);
  }

  private async initElectron(): Promise<void> {
    try {
      // Dynamic import cho Node.js fs và path
      this.fs = await import("fs").then((m) => m.promises);
      this.path = await import("path");

      // Lấy app từ electron
      const electron = await import("electron");
      this.app = electron.app;

      // Xác định đường dẫn log
      this.logPath = this.path.join(
        this.app.getPath("userData"),
        "logs",
        this.fileName
      );

      // Tạo thư mục logs nếu chưa tồn tại
      const logDir = this.path.dirname(this.logPath);
      await this.fs.mkdir(logDir, { recursive: true });

      this.initialized = true;
    } catch (err) {
      this.logger.error("[ElectronFileTransport] Không thể khởi tạo:", err);
    }
  }

  async log(entry: LogEntry): Promise<void> {
    if (!this.initialized) {
      await this.initElectron();
      if (!this.initialized) return;
    }

    try {
      const line = JSON.stringify(entry) + "\n";

      // Kiểm tra kích thước file
      try {
        const stats = await this.fs.stat(this.logPath);
        if (stats.size >= this.maxFileSize) {
          await this.rotateFiles();
        }
      } catch (err) {
        // File chưa tồn tại, bỏ qua
      }

      await this.fs.appendFile(this.logPath, line, "utf8");
    } catch (err) {
      this.logger.error("[ElectronFileTransport] Ghi file thất bại:", err);
    }
  }

  private async rotateFiles(): Promise<void> {
    try {
      const dir = this.path.dirname(this.logPath);
      const baseName = this.path.basename(this.logPath, ".log");

      // Xóa file cũ nhất
      const oldestFile = this.path.join(
        dir,
        `${baseName}.${this.maxFiles}.log`
      );
      try {
        await this.fs.unlink(oldestFile);
      } catch {
        // File không tồn tại
      }

      // Đổi tên các file
      for (let i = this.maxFiles - 1; i >= 1; i--) {
        const from = this.path.join(dir, `${baseName}.${i}.log`);
        const to = this.path.join(dir, `${baseName}.${i + 1}.log`);
        try {
          await this.fs.rename(from, to);
        } catch {
          // File không tồn tại
        }
      }

      // Đổi tên file hiện tại
      const backupPath = this.path.join(dir, `${baseName}.1.log`);
      await this.fs.rename(this.logPath, backupPath);
    } catch (err) {
      this.logger.error("[ElectronFileTransport] Rotate files thất bại:", err);
    }
  }

  async getLogs(): Promise<string[]> {
    if (!this.initialized) return [];

    try {
      const logs: string[] = [];
      const dir = this.path.dirname(this.logPath);
      const baseName = this.path.basename(this.logPath, ".log");

      // Đọc file hiện tại
      try {
        const content = await this.fs.readFile(this.logPath, "utf8");
        logs.push(content);
      } catch {
        // File không tồn tại
      }

      // Đọc các file backup
      for (let i = 1; i <= this.maxFiles; i++) {
        const filePath = this.path.join(dir, `${baseName}.${i}.log`);
        try {
          const content = await this.fs.readFile(filePath, "utf8");
          logs.push(content);
        } catch {
          // File không tồn tại
        }
      }

      return logs;
    } catch (err) {
      this.logger.error("[ElectronFileTransport] Đọc logs thất bại:", err);
      return [];
    }
  }

  async clearLogs(): Promise<void> {
    if (!this.initialized) return;

    try {
      const dir = this.path.dirname(this.logPath);
      const baseName = this.path.basename(this.logPath, ".log");

      // Xóa file hiện tại
      try {
        await this.fs.unlink(this.logPath);
      } catch {
        // File không tồn tại
      }

      // Xóa các file backup
      for (let i = 1; i <= this.maxFiles; i++) {
        const filePath = this.path.join(dir, `${baseName}.${i}.log`);
        try {
          await this.fs.unlink(filePath);
        } catch {
          // File không tồn tại
        }
      }
    } catch (err) {
      this.logger.error("[ElectronFileTransport] Xóa logs thất bại:", err);
    }
  }
}
