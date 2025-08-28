# @dqcai/logger

🚀 **Universal Logging Library for JavaScript & TypeScript**
🚀 **Thư viện ghi log đa nền tảng cho JavaScript & TypeScript**

Cross-platform logging for **Node.js, Web, and React Native**.
Hỗ trợ ghi log trên **Node.js, Web, và React Native**.

The most **flexible, modern, and developer-friendly logger** for real-world projects.
Logger **linh hoạt, hiện đại, thân thiện với lập trình viên** cho các dự án thực tế.

[![NPM Version](https://img.shields.io/npm/v/@dqcai/logger.svg)](https://www.npmjs.com/package/@dqcai/logger)
[![License](https://img.shields.io/npm/l/@dqcai/logger.svg)](LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@dqcai/logger.svg)](https://www.npmjs.com/package/@dqcai/logger)

---

## ✨ Why @dqcai/logger?

## ✨ Tại sao chọn @dqcai/logger?

When building apps across **multiple environments** (Web, Node.js, React Native), logging is often fragmented.
Khi xây dựng ứng dụng trên **nhiều môi trường** (Web, Node.js, React Native), việc ghi log thường bị rời rạc.

`@dqcai/logger` solves this with a **single, unified API** and **pluggable transports** that work everywhere:
`@dqcai/logger` giải quyết vấn đề này với **API thống nhất** và **các transport có thể cắm thêm** hoạt động ở mọi nơi:

* 🌍 **Cross-platform** → One library for Web, Node.js, React Native.

* 🌍 **Đa nền tảng** → Một thư viện duy nhất cho Web, Node.js, React Native.

* 🛠 **Flexible configuration** → Control logs by **module, log level, transport**.

* 🛠 **Cấu hình linh hoạt** → Kiểm soát log theo **module, cấp độ log, transport**.

* 📂 **Multiple transports** → Console, File, API, or custom transport.

* 📂 **Hỗ trợ nhiều transport** → Console, File, API, hoặc tùy chỉnh.

* 🔧 **Runtime control** → Enable/disable logs dynamically.

* 🔧 **Điều khiển runtime** → Bật/tắt log động khi đang chạy.

* 🎯 **Module-based logging** → Organize logs per feature/service.

* 🎯 **Ghi log theo module** → Tổ chức log theo từng chức năng/dịch vụ.

* 💡 **TypeScript-first** → Strongly typed, tree-shakable, ESM & CJS ready.

* 💡 **Ưu tiên TypeScript** → Kiểu mạnh, tree-shakable, hỗ trợ cả ESM & CJS.

* ⚡ **Zero dependencies** → Lightweight, only optional peer deps.

* ⚡ **Không phụ thuộc** → Gọn nhẹ, chỉ có peer deps tùy chọn.

> 🏆 Instead of juggling `winston`, `pino`, and `react-native-logs`,
> use **one consistent solution** across all platforms.
> 🏆 Thay vì phải dùng `winston`, `pino`, `react-native-logs`,
> hãy chọn **một giải pháp nhất quán duy nhất** trên tất cả nền tảng.

---

## 📦 Installation

## 📦 Cài đặt

```bash
npm install @dqcai/logger
# or / hoặc
yarn add @dqcai/logger
# or / hoặc
pnpm add @dqcai/logger
```

**Optional transports**
**Các transport tùy chọn**

```bash
# React Native file logging / Ghi file trong React Native
npm install react-native-fs

# API transport / Transport API
npm install axios
```

---

## 🚀 Quick Start

## 🚀 Bắt đầu nhanh

### Basic Example

### Ví dụ cơ bản

```ts
import { createLogger } from '@dqcai/logger';

const logger = createLogger();

logger.info('App', '🚀 Application started');
logger.error('App', 'Something went wrong', { error: 'details' });
logger.debug('App', 'Debugging info', { userId: 123 });
```

### Using `BaseModule`

### Sử dụng `BaseModule`

```ts
import { BaseModule, createLogger } from '@dqcai/logger';

const logger = createLogger();

class DatabaseManager extends BaseModule {
  constructor() {
    super('DatabaseManager', logger);
  }

  async connect() {
    this.logInfo('Connecting to database...');
    try {
      this.logDebug('Connected successfully');
    } catch (error) {
      this.logError('Connection failed', { error });
    }
  }
}
```

---

## ⚙️ Advanced Configuration

## ⚙️ Cấu hình nâng cao

*(giữ code gốc, giải thích song ngữ trước/sau như trên)*

---

## 🌍 Platform Examples

## 🌍 Ví dụ trên các nền tảng

* React Native → React Native
* Web Browser → Trình duyệt Web
* Node.js → Node.js

*(giữ nguyên code, chỉ cần phần tiêu đề song ngữ)*

---

## 🚛 Built-in Transports

## 🚛 Các transport tích hợp sẵn

*(song ngữ list như phần trên, giữ code)*

---

## 🔧 Remote Control

## 🔧 Điều khiển từ xa

*(song ngữ mô tả, giữ nguyên code)*

---

## 📊 Best Practices

## 📊 Thực hành tốt nhất

*(song ngữ bullet list)*

---

## 📈 Comparison vs Other Loggers

## 📈 So sánh với các logger khác

| Library / Thư viện | Node.js | Web | React Native |      Transports / Transport hỗ trợ     |     TypeScript     | Notes / Ghi chú                        |
| ------------------ | :-----: | :-: | :----------: | :------------------------------------: | :----------------: | -------------------------------------- |
| winston / pino     |    ✅    |  ⚠️ |       ❌      |            Strong / Mạnh mẽ            | Partial / Một phần | Node-first / Ưu tiên Node.js           |
| react-native-logs  |    ❌    |  ✅  |       ✅      |             Basic / Cơ bản             |          ❌         | RN-only / Chỉ cho RN                   |
| tslog              |    ✅    |  ✅  |       ❌      |           Limited / Giới hạn           |          ✅         | No RN / Không hỗ trợ RN                |
| Adze               |    ✅    |  ✅  |       ✅      |     Format/Emoji / Định dạng/Emoji     |          ✅         | Limited transports / Transport hạn chế |
| **@dqcai/logger**  |    ✅    |  ✅  |       ✅      | Console, File, API, Custom / Tùy chỉnh |          ✅         | **All-in-one**                         |

---

## 🤝 Contributing

## 🤝 Đóng góp

Contributions, issues, and feature requests are welcome!
Mọi đóng góp, báo lỗi, và yêu cầu tính năng đều được hoan nghênh!

👉 [GitHub Issues](https://github.com/cuongdqpayment/dqcai-logger/issues)

---

## 📄 License

## 📄 Giấy phép

MIT © [Cuong Doan](https://github.com/cuongdqpayment)

---

🔥 **@dqcai/logger** — The only logger you need for **React Native, Web, and Node.js**.
🔥 **@dqcai/logger** — Logger duy nhất bạn cần cho **React Native, Web, và Node.js**.

Stop switching between libraries. Start logging smarter today.
Dừng việc phải đổi qua lại nhiều thư viện. Bắt đầu ghi log thông minh ngay hôm nay.