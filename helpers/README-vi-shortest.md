# @dqcai/logger Usage Guide

Hướng dẫn sử dụng thư viện logging đơn giản với console output.

## Cài đặt

```bash
npm install @dqcai/logger
```

## Sử dụng

### 1. Cấu hình logger (`./src/configs/logger.ts`)

```typescript
import {
  LoggerConfigBuilder,
  CommonLoggerConfig,
  CommonModules,
  createModuleLogger,
} from "@dqcai/logger";

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
  .addModule(AppModules.AUTH, true, ["info", "error"], ["console"])
  .build();

CommonLoggerConfig.updateConfiguration(config);

export { createModuleLogger, AppModules };
```

### 2. Sử dụng trong ứng dụng (`./src/app.ts`)

```typescript
import { createModuleLogger, AppModules } from "@/configs/logger";

const logger = createModuleLogger(AppModules.AUTH);

logger.info("User login attempt", { email: "demo@example.com" });
logger.error("Login failed", { error: "Invalid password" });
```

## Tính năng

- ✅ Module-based logging
- ✅ Configurable log levels  
- ✅ Structured logging với metadata
- ✅ TypeScript support