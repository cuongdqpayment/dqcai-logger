

## 4. Cách chạy test

### Bước 1: Build package
```bash
npm run build
```

### Bước 2: Test Node.js (CommonJS)
```bash
node test-package.js
```

### Bước 3: Test ES Modules
```bash
node test-es-module.mjs
```

### Bước 4: Test Browser
```bash
# Mở test-browser.html trong browser
# Hoặc dùng live server
npx live-server --open=test-browser.html
```

### Bước 5: Test tất cả
```bash
npm run test:all
```

## 5. Test với npm pack

Trước khi publish, test với npm pack:

```bash
# Tạo tarball
npm pack

# Cài đặt tarball ở project khác để test
mkdir test-install
cd test-install
npm init -y
npm install ../your-package-name-1.0.0.tgz

# Test import
node -e "
const { createLogger } = require('your-package-name');
const logger = createLogger();
logger.info('Package install test successful!');
"
```

## 6. Test TypeScript Support

Tạo file `test-typescript.ts`:

```typescript
// test-typescript.ts
import {
  UniversalLogger,
  LogLevel,
  LogEntry,
  createLogger
} from './lib/index';

const logger: UniversalLogger = createLogger();

// Test type safety
const level: LogLevel = 'info';
logger[level]('TypeScript test message');

console.log('✅ TypeScript types work correctly');
```

Compile và chạy:
```bash
npx tsc test-typescript.ts --target es2017 --module commonjs
node test-typescript.js
```

## 7. Automated Test Script

Tạo file `run-all-tests.sh`:

```bash
#!/bin/bash

echo "🚀 Running comprehensive package tests..."

# Build
echo "📦 Building package..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Test Node.js
echo "🧪 Testing Node.js (CommonJS)..."
node test-package.js

if [ $? -ne 0 ]; then
    echo "❌ Node.js test failed"
    exit 1
fi

# Test ES Modules
echo "🧪 Testing ES Modules..."
node test-es-module.mjs

if [ $? -ne 0 ]; then
    echo "❌ ES Module test failed"
    exit 1
fi

# Test package integrity
echo "🧪 Testing package..."
npm pack --dry-run

echo "🎉 All tests passed! Package ready for publish."
```

Chạy:
```bash
chmod +x run-all-tests.sh
./run-all-tests.sh
```