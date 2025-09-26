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

## 📈 So sánh với các thư viện khác

| Feature | @dqcai/logger | winston | pino | react-native-logs | tslog |
|---------|---------------|---------|------|-------------------|--------|
| **Platform Support** | | | | | |
| Node.js | ✅ | ✅ | ✅ | ❌ | ✅ |
| Web Browser | ✅ | ⚠️ | ⚠️ | ✅ | ✅ |
| React Native | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Features** | | | | | |
| TypeScript Support | ✅ | ⚠️ | ✅ | ❌ | ✅ |
| Module-based Logging | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| Runtime Configuration | ✅ | ⚠️ | ❌ | ⚠️ | ❌ |
| Multiple Transports | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| Logger Decorators | ✅ | ❌ | ❌ | ❌ | ❌ |
| Performance Monitoring | ✅ | ❌ | ❌ | ❌ | ❌ |
| Built-in Caching | ✅ | ❌ | ❌ | ❌ | ❌ |
| Retry Logic | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Bundle Size** | | | | | |
| Core Size | ~15KB | ~200KB | ~50KB | ~20KB | ~30KB |
| Tree Shakable | ✅ | ❌ | ⚠️ | ⚠️ | ✅ |
| Zero Dependencies | ✅ | ❌ | ❌ | ⚠️ | ❌ |

## 🚀 Tại sao chọn @dqcai/logger?

**Một thư viện - Mọi môi trường**: Duy nhất hỗ trợ đầy đủ Node.js, Browser và React Native mà không cần thay đổi code hay cài thêm dependencies.

**Nhỏ gọn & Mạnh mẽ**: Bundle size chỉ ~15KB với đầy đủ tính năng enterprise như module-based logging, decorators, performance monitoring và retry logic.

**Developer Experience**: TypeScript native, runtime configuration, và zero dependencies - giúp development nhanh chóng và deployment đơn giản.

## Tính năng

- ✅ **Universal**: Node.js + Browser + React Native
- ✅ Module-based logging với runtime config
- ✅ TypeScript native support
- ✅ Performance monitoring & decorators  
- ✅ Zero dependencies, tree-shakable
- ✅ Built-in retry logic & caching