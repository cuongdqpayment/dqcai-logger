// transports/NodeFileTransport.ts - Node.js File Transport với internal logging
import { ILogTransport, LogEntry } from "../types/Logger.types";
import { InternalLogger } from "./InternalLogger";

export interface NodeFileTransportConfig {
  filePath?: string;
  maxFileSize?: number;
  maxFiles?: number;
  enableInternalLogging?: boolean;
}

export class NodeFileTransport implements ILogTransport {
  readonly name = "node-file";
  private filePath: string;
  private maxFileSize: number;
  private maxFiles: number;
  private fs: any = null;
  private path: any = null;
  private initialized = false;
  private initializing = false;
  private initPromise: Promise<void> | null = null;
  private logger: InternalLogger;
  private rotating = false;

  constructor(config: NodeFileTransportConfig = {}) {
    this.filePath = config.filePath || "./logs/app.log";
    this.maxFileSize = config.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = config.maxFiles || 5;

    // Internal logging mặc định bật, có thể tắt qua config
    this.logger = new InternalLogger(config.enableInternalLogging === true);

    this.initNodeFS();
  }

  /**
   * Khởi tạo Node.js fs và path modules
   */
  private async initNodeFS(): Promise<void> {
    // Tránh khởi tạo nhiều lần
    if (this.initialized || this.initializing) {
      return this.initPromise || Promise.resolve();
    }

    this.initializing = true;
    this.initPromise = (async () => {
      try {
        this.logger.debug("Initializing Node.js file system modules...");

        // Dynamic import cho Node.js fs và path
        this.fs = await import("fs").then((m) => m.promises);
        const fsSync = await import("fs");
        this.path = await import("path");

        this.logger.debug("File system modules loaded successfully");

        // Tạo thư mục logs nếu chưa tồn tại
        const logDir = this.path.dirname(this.filePath);
        if (!fsSync.existsSync(logDir)) {
          this.logger.info("Creating log directory", { path: logDir });
          await this.fs.mkdir(logDir, { recursive: true });
          this.logger.info("Log directory created successfully");
        } else {
          this.logger.debug("Log directory already exists", { path: logDir });
        }

        this.initialized = true;
        this.logger.info("NodeFileTransport initialized successfully", {
          filePath: this.filePath,
          maxFileSize: this.maxFileSize,
          maxFiles: this.maxFiles,
        });
      } catch (err) {
        this.logger.error("Failed to initialize NodeFileTransport", err);
        throw err;
      } finally {
        this.initializing = false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Ghi log entry vào file
   */
  async log(entry: LogEntry): Promise<void> {
    if (!this.initialized) {
      await this.initNodeFS();
      if (!this.initialized) {
        this.logger.error("Cannot log: Transport not initialized");
        return;
      }
    }

    try {
      const line = JSON.stringify(entry) + "\n";

      // Kiểm tra kích thước file và rotate nếu cần
      try {
        const stats = await this.fs.stat(this.filePath);
        if (stats.size >= this.maxFileSize) {
          this.logger.info("File size limit reached, rotating files", {
            currentSize: stats.size,
            maxSize: this.maxFileSize,
          });
          await this.rotateFiles();
        }
      } catch (err) {
        // File chưa tồn tại, bỏ qua
        this.logger.debug("Log file does not exist yet, will be created");
      }

      await this.fs.appendFile(this.filePath, line, "utf8");
    } catch (err) {
      this.logger.error("Failed to write log to file", {
        filePath: this.filePath,
        error: err,
      });
    }
  }

  /**
   * Rotate log files khi đạt dung lượng
   */
  // Sửa hàm rotateFiles() để có lock
  private async rotateFiles(): Promise<void> {
    if (this.rotating) {
      this.logger.debug("Rotation already in progress, skipping...");
      return;
    }

    this.rotating = true;
    try {
      this.logger.debug("Starting file rotation...");

      const dir = this.path.dirname(this.filePath);
      const ext = this.path.extname(this.filePath);
      const baseName = this.path.basename(this.filePath, ext);

      // Xóa file cũ nhất nếu vượt quá maxFiles
      const oldestFile = this.path.join(
        dir,
        `${baseName}.${this.maxFiles}${ext}`
      );
      try {
        await this.fs.unlink(oldestFile);
        this.logger.debug("Deleted oldest log file", { file: oldestFile });
      } catch {
        // OK if not exist
      }

      // Di chuyển từ mới → cũ
      for (let i = this.maxFiles - 1; i >= 1; i--) {
        const from = this.path.join(dir, `${baseName}.${i}${ext}`);
        const to = this.path.join(dir, `${baseName}.${i + 1}${ext}`);
        try {
          await this.fs.rename(from, to);
        } catch {
          // Ignore missing files
        }
      }

      // Rename file hiện tại → .1
      const backupPath = this.path.join(dir, `${baseName}.1${ext}`);
      try {
        await this.fs.rename(this.filePath, backupPath);
        this.logger.info("File rotation completed", {
          currentFile: this.filePath,
          backupFile: backupPath,
        });
      } catch (err: any) {
        if (err.code === "ENOENT") {
          this.logger.warn(
            "Current log file disappeared during rotation (race condition avoided)"
          );
        } else {
          this.logger.error("File rotation failed", err);
          // Không throw để không làm hỏng toàn bộ logging
        }
      }
    } catch (err) {
      this.logger.error("Unexpected error during rotation", err);
    } finally {
      this.rotating = false;
    }
  }

  /**
   * Đọc tất cả log files (current + backups)
   */
  async getLogs(): Promise<string[]> {
    if (!this.initialized) {
      this.logger.warn("Cannot get logs: Transport not initialized");
      return [];
    }

    try {
      this.logger.debug("Reading log files...");

      const logs: string[] = [];
      const dir = this.path.dirname(this.filePath);
      const ext = this.path.extname(this.filePath);
      const baseName = this.path.basename(this.filePath, ext);

      // Đọc file hiện tại
      try {
        const content = await this.fs.readFile(this.filePath, "utf8");
        logs.push(content);
        this.logger.debug("Read current log file", {
          file: this.filePath,
          size: content.length,
        });
      } catch {
        this.logger.debug("Current log file does not exist");
      }

      // Đọc các file backup
      for (let i = 1; i <= this.maxFiles; i++) {
        const filePath = this.path.join(dir, `${baseName}.${i}${ext}`);
        try {
          const content = await this.fs.readFile(filePath, "utf8");
          logs.push(content);
          this.logger.debug("Read backup log file", {
            file: filePath,
            size: content.length,
          });
        } catch {
          // File không tồn tại, dừng đọc
          break;
        }
      }

      this.logger.info("Successfully read log files", {
        totalFiles: logs.length,
      });
      return logs;
    } catch (err) {
      this.logger.error("Failed to read log files", err);
      return [];
    }
  }

  enableInternalLogging(enabled: boolean): void {
    this.logger.setEnabled(enabled);
  }
  /**
   * Xóa tất cả log files
   */
  async clearLogs(): Promise<void> {
    if (!this.initialized) {
      this.logger.warn("Cannot clear logs: Transport not initialized");
      return;
    }

    try {
      this.logger.info("Clearing all log files...");

      const dir = this.path.dirname(this.filePath);
      const ext = this.path.extname(this.filePath);
      const baseName = this.path.basename(this.filePath, ext);

      let deletedCount = 0;

      // Xóa file hiện tại
      try {
        await this.fs.unlink(this.filePath);
        deletedCount++;
        this.logger.debug("Deleted current log file", { file: this.filePath });
      } catch {
        this.logger.debug("Current log file does not exist");
      }

      // Xóa các file backup
      for (let i = 1; i <= this.maxFiles; i++) {
        const filePath = this.path.join(dir, `${baseName}.${i}${ext}`);
        try {
          await this.fs.unlink(filePath);
          deletedCount++;
          this.logger.debug("Deleted backup log file", { file: filePath });
        } catch {
          // File không tồn tại, dừng xóa
          break;
        }
      }

      this.logger.info("Successfully cleared log files", {
        deletedFiles: deletedCount,
      });
    } catch (err) {
      this.logger.error("Failed to clear log files", err);
    }
  }

  /**
   * Flush - không cần thiết cho file I/O (auto flush)
   */
  async flush(): Promise<void> {
    // File I/O trong Node.js tự động flush
    // Method này để tương thích với ILogTransport interface
    this.logger.debug("Flush called (no-op for file transport)");
  }

  /**
   * Cleanup - đóng resources nếu cần
   */
  async cleanup(): Promise<void> {
    this.logger.info("Cleaning up NodeFileTransport...");
    // Không có resources cần cleanup cho file transport
    // Nhưng có thể thêm logic nếu cần (e.g., flush pending writes)
    this.logger.info("NodeFileTransport cleanup completed");
  }

  /**
   * Get transport statistics
   */
  async getStats(): Promise<{
    filePath: string;
    maxFileSize: number;
    maxFiles: number;
    initialized: boolean;
    currentFileSize?: number;
    totalFiles?: number;
  }> {
    const stats: any = {
      filePath: this.filePath,
      maxFileSize: this.maxFileSize,
      maxFiles: this.maxFiles,
      initialized: this.initialized,
    };

    if (this.initialized) {
      try {
        const fileStats = await this.fs.stat(this.filePath);
        stats.currentFileSize = fileStats.size;
      } catch {
        stats.currentFileSize = 0;
      }

      const logs = await this.getLogs();
      stats.totalFiles = logs.length;
    }

    return stats;
  }

  /**
   * Enable/disable internal logging
   */
  setInternalLogging(enabled: boolean): void {
    this.logger.setEnabled(enabled);
    this.logger.info(`Internal logging ${enabled ? "enabled" : "disabled"}`);
  }
}
