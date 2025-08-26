import { describe, it, expect, vi } from "vitest";
import { UniversalLogger } from "../core/Logger";
import { LoggerConfigBuilder } from "../config/ConfigBuilder";
import { ConsoleTransport } from "../transports/ConsoleTransport";

/**
Circular Import Dependencies: File index.ts của bạn có thể đang tạo ra circular dependency:
typescript// index.ts export nhiều thứ, có thể tạo dependency loop
export { UniversalLogger } from './core/Logger';
export { ConsoleTransport } from './transports/ConsoleTransport';
export { LoggerConfigBuilder } from './config/ConfigBuilder';
// ... và nhiều export khác

ESM Module Resolution Issues: Khi import từ index.js, Vitest phải resolve tất cả exports trong index file, có thể gặp vấn đề với:

Module bundling
ESM/CommonJS mixing
Path resolution conflicts


Heavy Import Chain: File index.ts import nhiều file khác, tạo ra chain phức tạp mà Vitest khó xử lý trong môi trường test.

✅ Tại sao Import trực tiếp thành công:

Dependency rõ ràng: Mỗi import trỏ trực tiếp đến file cụ thể:
typescriptimport { UniversalLogger } from "../core/Logger";
import { LoggerConfigBuilder } from "../config/ConfigBuilder";
import { ConsoleTransport } from "../transports/ConsoleTransport";

Tránh circular dependencies: Không đi qua file trung gian (index.ts)
Module isolation: Mỗi module được load độc lập, không phụ thuộc vào bundling logic của index file
Test environment friendly: Vitest xử lý direct imports dễ dàng hơn aggregated exports

Gợi ý để sử dụng import từ index (nếu cần):
Option 1: Sửa file index.ts
Tách exports thành nhóm để tránh circular dependencies:
typescript// index.ts - chỉ export những gì cần thiết cho public API
export { UniversalLogger, createLogger } from './core/Logger';
export { LoggerConfigBuilder } from './config/ConfigBuilder';
export { ConsoleTransport } from './transports/ConsoleTransport';
export type { LogLevel, LoggerConfig } from './types/Logger.types';

// Không export tất cả (*) để tránh dependency issues
Option 2: Tạo test-specific imports
Tạo file test-utils.ts để export những gì cần cho testing:
typescript// test-utils.ts
export { UniversalLogger } from './core/Logger';
export { LoggerConfigBuilder } from './config/ConfigBuilder'; 
export { ConsoleTransport } from './transports/ConsoleTransport';
Option 3: Cấu hình Vitest để handle index imports tốt hơn
Thêm vào vitest.config.ts:
typescriptexport default defineConfig({
  test: {
    // Thêm option này để xử lý ES modules tốt hơn
    pool: 'forks',
    environment: 'node',
  },
  esbuild: {
    // Xử lý imports/exports tốt hơn
    keepNames: true,
  }
})
Kết luận:
Cách 2 (direct imports) là approach tốt nhất cho testing vì:

✅ Rõ ràng, dễ debug
✅ Tránh được dependency complexity
✅ Performance tốt hơn trong test environment
✅ Ít prone to module resolution errors

Trong production code, người dùng vẫn có thể import từ index, nhưng cho testing thì direct imports là lựa chọn tốt nhất! 🎯
 */

describe("Logger", () => {
  it("should log info with console transport", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const config = new LoggerConfigBuilder()
      .setEnabled(true)
      .setDefaultLevel("info")
      .addModule("TestModule", true, ["info"], ["console"])
      .build();

    const logger = new UniversalLogger(config);
    logger.addTransport(new ConsoleTransport());

    logger.info("TestModule", "Test message");

    // Kiểm tra đơn giản: có được gọi không và có chứa nội dung mong muốn
    expect(consoleSpy).toHaveBeenCalledTimes(1);

    const [firstArg] = consoleSpy.mock.calls[0];
    expect(firstArg).toContain("TestModule");
    expect(firstArg).toContain("Test message");
    expect(firstArg).toContain("[INFO]");

    consoleSpy.mockRestore();
  });

  it("should not log when module is disabled", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const config = new LoggerConfigBuilder()
      .setEnabled(true)
      .addModule("TestModule", false, [], [])
      .build();

    const logger = new UniversalLogger(config);
    logger.addTransport(new ConsoleTransport());

    logger.info("TestModule", "Should not log");

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
