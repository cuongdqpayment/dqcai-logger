# DBTransport - Database Transport cho Logger

Transport lưu logs vào database sử dụng thư viện @dqcai/orm với hỗ trợ SQLite, PostgreSQL, MySQL, MariaDB.

## Tính năng

### ✅ Core Features
- **Dynamic Import**: Load @dqcai/orm và schema động khi cần
- **Batching**: Gom logs trước khi ghi vào database để tối ưu performance
- **Multi-database Support**: SQLite (default), PostgreSQL, MySQL, MariaDB
- **Session Tracking**: Theo dõi logs theo session
- **Statistics**: Thống kê logs theo ngày/module/level
- **Error Table**: Bảng riêng cho error logs
- **Query API**: Query logs linh hoạt
- **Auto Cleanup**: Tự động xóa logs cũ

### ✅ Database Schema
```
- logs: Bảng chính lưu tất cả logs
- error_logs: Bảng riêng cho errors (optional)
- log_statistics: Thống kê theo ngày/module/level
- log_sessions: Quản lý sessions
```

## Cài đặt

```bash
npm install @dqcai/logger @dqcai/orm
```

## Cấu hình

### 1. SQLite (Default - Recommended for local/development)

```typescript
import { DBTransport } from '@dqcai/logger/transports';

const dbTransport = new DBTransport({
  databaseType: 'sqlite',
  database: 'logger',
  dbDirectory: './logs',
  batchSize: 50,
  flushInterval: 5000,
  enableStatistics: true,
  enableErrorTable: true,
});
```

### 2. PostgreSQL

```typescript
const dbTransport = new DBTransport({
  databaseType: 'postgresql',
  database: 'logger',
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  batchSize: 100,
  flushInterval: 3000,
});
```

### 3. MySQL/MariaDB

```typescript
const dbTransport = new DBTransport({
  databaseType: 'mysql', // or 'mariadb'
  database: 'logger',
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'password',
  batchSize: 100,
  flushInterval: 3000,
});
```

## Sử dụng với CommonLoggerConfig

```typescript
import { CommonLoggerConfig, createModuleLogger } from '@dqcai/logger';
import { DBTransport } from '@dqcai/logger/transports';
import { LoggerConfigBuilder } from '@dqcai/logger/config';

// 1. Tạo và thêm transport
const dbTransport = new DBTransport({
  databaseType: 'sqlite',
  database: 'logger',
  dbDirectory: './logs',
});

CommonLoggerConfig.addTransport(dbTransport);

// 2. Cấu hình modules sử dụng transport
const config = new LoggerConfigBuilder()
  .useProductionPreset()
  .addModule('API', true, 
    ['info', 'warn', 'error'], 
    ['console', 'db']) // ← Thêm 'db' transport
  .addModule('Database', true,
    ['warn', 'error'],
    ['console', 'db'])
  .build();

CommonLoggerConfig.updateConfiguration(config);

// 3. Sử dụng logger
const logger = createModuleLogger('API');
logger.info('Application started');
logger.error('Database connection failed', { error: 'ECONNREFUSED' });

// 4. Flush logs (optional - auto flush mỗi 5s)
await CommonLoggerConfig.flush();
```

## Session Tracking

```typescript
// Start session
const sessionId = await dbTransport.startSession('user_session_123');

// Logs sẽ tự động gắn với session này
logger.info('User logged in');
logger.debug('Fetching user data');

// Query logs by session
const sessionLogs = await dbTransport.getLogsBySession(sessionId);

// End session
await dbTransport.endSession();
```

## Query Logs

### Query theo level
```typescript
const errorLogs = await dbTransport.getLogsByLevel('error', 100);
const warnLogs = await dbTransport.getLogsByLevel('warn', 50);
```

### Query theo module
```typescript
const apiLogs = await dbTransport.getLogsByModule('API', 100);
```

### Query tùy chỉnh
```typescript
const logs = await dbTransport.queryLogs(
  { 
    level: 'error',
    module: 'Database',
  },
  { 
    limit: 50,
    orderBy: { timestamp: 'DESC' }
  }
);
```

### Query với time range
```typescript
const logs = await dbTransport.queryLogs({
  timestamp: {
    $gte: '2024-01-01T00:00:00.000Z',
    $lte: '2024-01-31T23:59:59.999Z'
  }
});
```

## Statistics

```typescript
// Lấy thống kê tổng quan
const stats = await dbTransport.getTransportStats();
console.log(stats);
// {
//   totalLogs: 1500,
//   errorCount: 25,
//   levelCounts: {
//     trace: 100,
//     debug: 200,
//     info: 1000,
//     warn: 175,
//     error: 25
//   },
//   bufferSize: 0,
//   initialized: true,
//   currentSession: 'session_xyz'
// }

// Lấy thống kê theo ngày
const dailyStats = await dbTransport.getStatistics({
  date: '2024-01-15'
});
```

## Cleanup Old Logs

```typescript
// Xóa logs cũ hơn 30 ngày
const deletedCount = await dbTransport.clearOldLogs(30);
console.log(`Deleted ${deletedCount} old logs`);

// Có thể chạy định kỳ với cron job
setInterval(async () => {
  await dbTransport.clearOldLogs(30);
}, 24 * 60 * 60 * 1000); // Mỗi ngày
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `databaseType` | string | `'sqlite'` | Loại database |
| `database` | string | `'logger'` | Tên database |
| `dbDirectory` | string | `'./logs'` | Thư mục cho SQLite |
| `host` | string | - | Database host |
| `port` | number | - | Database port |
| `user` | string | - | Database user |
| `password` | string | - | Database password |
| `batchSize` | number | `50` | Số logs gom lại trước khi flush |
| `flushInterval` | number | `5000` | Interval flush (ms) |
| `enableStatistics` | boolean | `true` | Bật statistics tracking |
| `enableErrorTable` | boolean | `true` | Bật bảng error riêng |
| `enableInternalLogging` | boolean | `true` | Bật logging nội bộ |

## Best Practices

### 1. Production Setup
```typescript
// SQLite cho single server
const dbTransport = new DBTransport({
  databaseType: 'sqlite',
  database: 'logger',
  dbDirectory: '/var/log/myapp',
  batchSize: 100,
  flushInterval: 3000,
});

// PostgreSQL cho distributed system
const dbTransport = new DBTransport({
  databaseType: 'postgresql',
  database: 'logger',
  connectionString: process.env.DATABASE_URL,
  batchSize: 200,
  flushInterval: 2000,
});
```

### 2. Module Configuration
```typescript
// Chỉ ghi error/warn vào database
const config = new LoggerConfigBuilder()
  .useProductionPreset()
  .addModule('API', true, 
    ['warn', 'error'], 
    ['console', 'db'])
  .addModule('Critical', true,
    ['error'],
    ['console', 'db', 'api']) // Multiple transports
  .build();
```

### 3. Performance Tuning
```typescript
// High-traffic application
const dbTransport = new DBTransport({
  batchSize: 200,        // Lớn hơn để giảm write operations
  flushInterval: 1000,   // Flush nhanh hơn
  enableStatistics: false, // Tắt nếu không cần
});

// Low-traffic application
const dbTransport = new DBTransport({
  batchSize: 20,
  flushInterval: 10000,
  enableStatistics: true,
  enableErrorTable: true,
});
```

### 4. Graceful Shutdown
```typescript
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  
  // Flush pending logs
  await CommonLoggerConfig.flush();
  
  // Cleanup transport
  await dbTransport.cleanup();
  
  process.exit(0);
});
```

### 5. Error Handling
```typescript
try {
  // Your code
} catch (error) {
  logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    context: { /* additional context */ }
  });
  
  // Ensure error is written
  await CommonLoggerConfig.flush();
}
```

## Database Schema Details

### logs table
```sql
CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  level VARCHAR(20) NOT NULL,
  module VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  data TEXT,
  metadata TEXT,
  session_id VARCHAR(100),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_logs_module ON logs(module);
```

### error_logs table
```sql
CREATE TABLE error_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  module VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  stack_trace TEXT,
  data TEXT,
  metadata TEXT,
  session_id VARCHAR(100),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### log_statistics table
```sql
CREATE TABLE log_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  module VARCHAR(100) NOT NULL,
  level VARCHAR(20) NOT NULL,
  count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, module, level)
);
```

## Troubleshooting

### Logs không xuất hiện trong database?
1. Kiểm tra transport đã được thêm: `CommonLoggerConfig.listTransports()`
2. Kiểm tra module config có 'db' trong transports
3. Gọi `await CommonLoggerConfig.flush()` để force flush
4. Kiểm tra quyền ghi file (SQLite)
5. Kiểm tra database connection (PostgreSQL/MySQL)

### Performance issues?
1. Tăng `batchSize` để giảm số lần write
2. Tăng `flushInterval` để giảm frequency
3. Tắt `enableStatistics` nếu không cần
4. Tắt `enableErrorTable` nếu không cần
5. Xem xét sử dụng PostgreSQL thay vì SQLite cho high-traffic

### Database too large?
1. Chạy `clearOldLogs()` định kỳ
2. Giảm số ngày lưu trữ
3. Chỉ log error/warn vào database
4. Sử dụng log rotation ở OS level

## Examples

Xem file `test/test-db-transport.ts` để có ví dụ đầy đủ về:
- Basic logging
- Multi-module logging
- Error tracking
- Session management
- Statistics
- Query logs
- Cleanup

## License

MIT