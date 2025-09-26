# @dqcai/logger Usage Guide

Hướng dẫn sử dụng thư viện logging với tính năng transport tùy chỉnh và batch processing.

## Cài đặt

```bash
npm install @dqcai/logger
```

## Quy trình sử dụng

### 1. Tạo file cấu hình logger

Tạo file `./src/configs/logger.ts` để định nghĩa cấu hình toàn cục:

```typescript
import {
  LoggerConfigBuilder,
  CommonLoggerConfig,
  CommonModules,
  createModuleLogger,
  ILogTransport,
  LogEntry,
} from "@dqcai/logger";
import axios from "axios";

// Tạo custom transport với batch và retry
class ApiTransport implements ILogTransport {
  readonly name = "api";
  private queue: LogEntry[] = [];
  private timer: NodeJS.Timeout | null = null;
  
  constructor(
    private endpoint: string,
    private batchSize: number = 10,
    private batchTimeout: number = 5000,
    private maxRetries: number = 3
  ) {}

  async log(entry: LogEntry): Promise<void> {
    this.queue.push(entry);
    if (this.queue.length >= this.batchSize) {
      await this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.batchTimeout);
    }
  }

  private async flush(attempt = 1): Promise<void> {
    if (this.queue.length === 0) return;
    const logsToSend = [...this.queue];
    this.queue = [];
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    try {
      await axios.post(this.endpoint, { logs: logsToSend });
    } catch (err) {
      console.error(`[ApiTransport] Send failed (attempt ${attempt})`, err.message);
      if (attempt < this.maxRetries) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        setTimeout(() => this.flush(attempt + 1), delay);
      } else {
        console.error("[ApiTransport] All retries failed, logs dropped");
      }
    }
  }
}

// Định nghĩa modules
const AppModules = {
  ...CommonModules,
  AUTH: "Authentication",
  DATABASE: "Database",
  MIDDLEWARE: "Middleware",
};

// Cấu hình toàn cục
const config = new LoggerConfigBuilder()
  .setEnabled(true)
  .setDefaultLevel("info")
  .addModule(AppModules.AUTH, true, ["info", "error"], ["console", "api"])
  .addTransport(new ApiTransport("https://api.example.com/logs", 5, 3000, 3))
  .build();

CommonLoggerConfig.updateConfiguration(config);

export { createModuleLogger, AppModules };
```

### 2. Sử dụng logger trong ứng dụng

Trong file `./src/app.ts` hoặc bất kỳ file nào khác:

```typescript
import { createModuleLogger, AppModules } from "@/configs/logger";

const logger = createModuleLogger(AppModules.AUTH);

// Các log sẽ được gom lại và gửi theo batch
logger.info("User login attempt", { email: "demo@example.com" });
logger.error("Login failed", { error: "Invalid password" });
```

## Các thành phần chính

### LoggerConfigBuilder
- **setEnabled(boolean)**: Bật/tắt logging
- **setDefaultLevel(level)**: Đặt level mặc định
- **addModule(name, enabled, levels, transports)**: Thêm module với cấu hình riêng
- **addTransport(transport)**: Thêm transport tùy chỉnh

### Custom Transport
- Implement interface `ILogTransport`
- Có thể tùy chỉnh batch size, timeout, retry logic
- Hỗ trợ gửi logs đến API, database, file, v.v.

### Module Logger
- Tạo logger cho từng module cụ thể
- Mỗi module có thể có cấu hình level và transport riêng
- Hỗ trợ structured logging với metadata

## Tính năng

- ✅ Batch processing để tối ưu hiệu suất
- ✅ Retry mechanism với exponential backoff
- ✅ Module-based logging
- ✅ Multiple transport support
- ✅ Structured logging với metadata
- ✅ Configurable log levels
- ✅ TypeScript support