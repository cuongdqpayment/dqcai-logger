# @dqcai/logger

🚀 **Universal Logging Library for JavaScript & TypeScript**
Cross-platform logging for **Node.js, Web, and React Native**.
The most **flexible, modern, and developer-friendly logger** for real-world projects.

[![NPM Version](https://img.shields.io/npm/v/@dqcai/logger.svg)](https://www.npmjs.com/package/@dqcai/logger)
[![License](https://img.shields.io/npm/l/@dqcai/logger.svg)](LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@dqcai/logger.svg)](https://www.npmjs.com/package/@dqcai/logger)

---

## ✨ Why @dqcai/logger?

When building apps across **multiple environments** (Web, Node.js, React Native), logging is often fragmented.
`@dqcai/logger` solves this with a **single, unified API** and **pluggable transports** that work everywhere:

* 🌍 **Cross-platform** → One library for Web, Node.js, React Native.
* 🛠 **Flexible configuration** → Control logs by **module, log level, transport**.
* 📂 **Multiple transports** → Console, File, API, or custom transport.
* 🔧 **Runtime control** → Enable/disable logs dynamically.
* 🎯 **Module-based logging** → Organize logs per feature/service.
* 💡 **TypeScript-first** → Strongly typed, tree-shakable, ESM & CJS ready.
* ⚡ **Zero dependencies** → Lightweight, only optional peer deps.

> 🏆 Instead of juggling `winston`, `pino`, and `react-native-logs`,
> use **one consistent solution** across all platforms.

---

## 📦 Installation

```bash
npm install @dqcai/logger
# or
yarn add @dqcai/logger
# or
pnpm add @dqcai/logger
```

**Optional transports**:

```bash
# React Native file logging
npm install react-native-fs

# API transport
npm install axios
```

---

## 🚀 Quick Start

### Basic Example

```ts
import { createLogger } from '@dqcai/logger';

const logger = createLogger();

logger.info('App', '🚀 Application started');
logger.error('App', 'Something went wrong', { error: 'details' });
logger.debug('App', 'Debugging info', { userId: 123 });
```

### Using `BaseModule`

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

```ts
import { LoggerConfigBuilder, createLogger } from '@dqcai/logger';

const config = new LoggerConfigBuilder()
  .setEnabled(true)
  .setDefaultLevel('info')
  .addModule('App', true, ['info','warn','error'], ['console'])
  .addModule('DatabaseManager', true, ['debug','info'], ['console','file'])
  .addModule('AuthService', true, ['error'], ['console','api'])
  .build();

const logger = createLogger(config);
```

Runtime update:

```ts
logger.setModuleConfig('DatabaseManager', {
  enabled: false,
  levels: [],
  transports: []
});
```

---

## 🌍 Platform Examples

### React Native

```ts

import RNFS from 'react-native-fs';
import { createLogger, ConsoleTransport } from '@dqcai/logger';
import type { ILogTransport, LogEntry } from '@dqcai/logger';

export default class RNFileTransport implements ILogTransport {
  readonly name = 'file';
  constructor(private fileName: string = 'app.log') {}
  async log(entry: LogEntry) {
    const line = JSON.stringify(entry) + '\n';
    const path = `${RNFS.DocumentDirectoryPath}/${this.fileName}`;
    await RNFS.appendFile(path, line, 'utf8').catch(err =>
      console.error('[RNFileTransport] write error', err)
    );
  }
}

const logger = createLogger();
logger.addTransport(new ConsoleTransport());
logger.addTransport(new RNFileTransport('app.log'));

logger.info('App', 'React Native app started');
```

### Web Browser

```ts
import { createLogger, ConsoleTransport } from '@dqcai/logger';
import type { ILogTransport, LogEntry } from '@dqcai/logger';
const KEY = 'unilog';

export default class WebFileTransport implements ILogTransport {
  readonly name = 'file';
  async log(entry: LogEntry) {
    try {
      const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
      arr.push(entry);
      localStorage.setItem(KEY, JSON.stringify(arr));
    } catch (e) {
      // fallback console
      console.error('[WebFileTransport] persist error', e);
    }
  }
}

const logger = createLogger();
logger.addTransport(new ConsoleTransport());
logger.addTransport(new WebFileTransport()); // uses localStorage
```

### Node.js

```ts
import fs from 'fs/promises';
import { createLogger, ConsoleTransport } from '@dqcai/logger';
import type { ILogTransport, LogEntry } from '@dqcai/logger';

export default class NodeFileTransport implements ILogTransport {
  readonly name = 'file';
  constructor(private filePath: string = './app.log') {}
  async log(entry: LogEntry) {
    try {
      await fs.appendFile(this.filePath, JSON.stringify(entry) + '\n');
    } catch (e) {
      console.error('[NodeFileTransport] write error', e);
    }
  }
}

const logger = createLogger();
logger.addTransport(new ConsoleTransport());
logger.addTransport(new NodeFileTransport('./server.log'));

logger.info('Server', 'Listening on port 3000');
```

---

## 🚛 Built-in Transports

* ✅ **Console** (default)
* ✅ **Custom** (implement your own `ILogTransport`)

```ts
import type { ILogTransport, LogEntry } from '@dqcai/logger';

class CustomTransport implements ILogTransport {
  readonly name = 'custom';
  log(entry: LogEntry) {
    console.log('Custom transport:', entry);
  }
}
logger.addTransport(new CustomTransport());
```

### API Transport (send logs to server)

```ts
import axios, { AxiosInstance } from 'axios';
import { ILogTransport, LogEntry } from '@dqcai/logger';

export class ApiTransport implements ILogTransport {
  readonly name = 'api';
  private client: AxiosInstance;
  private endpoint: string;

  constructor(baseURL: string, endpoint: string = '/logs') {
    this.client = axios.create({ baseURL });
    this.endpoint = endpoint;
  }

  async log(entry: LogEntry): Promise<void> {
    try {
      await this.client.post(this.endpoint, entry);
    } catch (err) {
      console.error('[ApiTransport] Failed to send log:', err);
    }
  }
}

logger.addTransport(new ApiTransport('https://api.example.com'));
```

> 💡 You can also design your own `YourTransport` for multiple purposes with the help of AI tools (Claude, ChatGPT, Grok, Gemini…) — just describe your needs and adapt from the provided samples.

---

## 🔧 Remote Control

Control logging dynamically from a **remote API**. Perfect for production monitoring.

```ts
const remoteConfig = await axios.get('https://your-api.com/logger-config');
const logger = createLogger(remoteConfig.data);
```

---

## 📊 Best Practices

* ✅ Use **structured logs** (objects, not string concatenation).
* ✅ Configure **different levels per environment** (`debug` in dev, `warn` in prod).
* ✅ Centralize logger in `logger.config.ts`.
* ✅ Replace `console.log` with `logger.info | logger.error | logger.debug | logger.warn`.

---

## 📈 Comparison vs Other Loggers

| Library           | Node.js | Web | React Native |         Transports         | TypeScript | Notes              |
| ----------------- | :-----: | :-: | :----------: | :------------------------: | :--------: | ------------------ |
| winston / pino    |    ✅    |  ⚠️ |       ❌      |           Strong           |   Partial  | Node-first         |
| react-native-logs |    ❌    |  ✅  |       ✅      |            Basic           |      ❌     | RN-only            |
| tslog             |    ✅    |  ✅  |       ❌      |           Limited          |      ✅     | No RN              |
| Adze              |    ✅    |  ✅  |       ✅      |        Format/Emoji        |      ✅     | Limited transports |
| **@dqcai/logger** |    ✅    |  ✅  |       ✅      | Console, File, API, Custom |      ✅     | **All-in-one**     |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
👉 [GitHub Issues](https://github.com/cuongdqpayment/dqcai-logger/issues)

---

## 📄 License

MIT © [Cuong Doan](https://github.com/cuongdqpayment)

---

🔥 **@dqcai/logger** — The only logger you need for **React Native, Web, and Node.js**.
Stop switching between libraries. Start logging smarter today.