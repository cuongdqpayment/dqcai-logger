// transports/ApiTransport.ts - API Transport với batching
import { ILogTransport, LogEntry } from "../types/Logger.types";
import { InternalLogger } from "./InternalLogger";

export interface ApiTransportConfig {
  baseURL: string;
  endpoint?: string;
  batchSize?: number;
  flushInterval?: number;
  maxRetries?: number;
  enableInternalLogging?: boolean;
}

export class ApiTransport implements ILogTransport {
  readonly name = "api";
  private endpoint: string;
  private batchSize: number;
  private flushInterval: number;
  private maxRetries: number;
  private buffer: LogEntry[] = [];
  private timer: NodeJS.Timeout | null = null;
  private axios: any = null;
  private logger: InternalLogger;

  /**
   * Khai báo cấu hình để truyền log lên API
   * @param config
   */
  constructor(private config: ApiTransportConfig) {
    this.endpoint = config.endpoint || "/logs";
    this.batchSize = config.batchSize || 10;
    this.flushInterval = config.flushInterval || 5000;
    this.maxRetries = config.maxRetries || 3;
    this.initAxios();

    // Internal logging mặc định bật, có thể tắt qua config
    this.logger = new InternalLogger(config.enableInternalLogging === true);
  }
  cleanup?(): Promise<void> | void {
    throw new Error("Method not implemented.");
  }

  private async initAxios(): Promise<void> {
    try {
      const axiosModule = await import("axios");
      this.axios = axiosModule.default.create({
        baseURL: this.config.baseURL,
        timeout: 10000,
      });
    } catch (err) {
      this.logger.error("[ApiTransport] Không thể load axios:", err);
    }
  }

  async log(entry: LogEntry): Promise<void> {
    this.buffer.push(entry);

    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.buffer.length === 0 || !this.axios) return;

    const batch = [...this.buffer];
    this.buffer = [];

    await this.sendWithRetry(batch);
  }

  private async sendWithRetry(
    batch: LogEntry[],
    attempt: number = 1
  ): Promise<void> {
    try {
      await this.axios.post(this.endpoint, { logs: batch });
    } catch (err) {
      if (attempt < this.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        await this.sendWithRetry(batch, attempt + 1);
      } else {
        this.logger.error("[ApiTransport] Gửi log thất bại sau", {
          max_retries: this.maxRetries,
          err,
        });
      }
    }
  }

  async destroy(): Promise<void> {
    await this.flush();
  }
}
