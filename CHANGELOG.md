# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.0.0] - 2025-11-27

### 🚀 Major Release - Transport System Overhaul

This is a major release with significant improvements to the transport system and new powerful features.

### Added

#### New Transports
- **DBTransport**: Store logs in databases (SQLite, PostgreSQL, MySQL, MongoDB)
  - Automatic table creation and schema management
  - Batch inserts for performance (configurable batch size)
  - Session tracking with `startSession()` and `endSession()`
  - Built-in statistics tracking
  - Query logs by level, module, session, date range
  - Automatic cleanup of old logs
  - Separate error table support
  - Uses `@dqcai/orm` for database operations

- **NodeFileTransport**: Optimized file logging for Node.js
  - Automatic file rotation based on size
  - Configurable retention policy (max files)
  - High-performance async I/O
  - JSON format for easy parsing
  - No external dependencies (uses native `fs` module)
  - Methods: `getLogs()`, `clearLogs()`, `rotateLogs()`

- **RNFileTransport**: React Native file logging
  - Uses `react-native-fs` for file operations
  - Automatic file rotation
  - Works on iOS and Android
  - Persists across app restarts
  - Log export functionality

- **ElectronFileTransport**: Electron desktop app logging
  - Uses Electron's `app.getPath('userData')`
  - Works in main and renderer processes
  - Automatic file rotation
  - No external dependencies

- **ApiTransport**: Send logs to remote APIs
  - Automatic batching for efficiency
  - Exponential backoff retry mechanism
  - Custom headers and authentication
  - Network error handling
  - Queue management
  - Uses `axios` (dynamically loaded)

#### Features
- **Dynamic Import System**: Optional dependencies loaded only when needed
  - `@dqcai/orm` for DBTransport
  - `react-native-fs` for RNFileTransport
  - `axios` for ApiTransport
  - Keeps bundle size minimal for unused features

- **Session Tracking**: Track logs across related operations
  - Start/end sessions with unique IDs
  - Query logs by session
  - Perfect for request/response tracking

- **Statistics**: Built-in log analytics
  - Daily statistics by module and level
  - Transport statistics (total logs, errors, buffer size)
  - Level distribution tracking

- **Advanced Querying**: Filter and search logs
  - Query by level, module, date range
  - Pagination support (limit, offset)
  - Session-based filtering

- **Auto Cleanup**: Manage log retention
  - Delete logs older than N days
  - Automatic file rotation
  - Configurable retention policies

- **Custom Transport API**: Build your own transports
  - Simple `ILogTransport` interface
  - Examples: Slack, Sentry, Email transports
  - Full documentation and best practices

### Changed

- **Transport Naming**: More explicit names
  - `"file"` → `"node-file"` (Node.js specific)
  - Added `"rn-file"` for React Native
  - Added `"electron-file"` for Electron
  - Added `"db"` for database
  - Added `"api"` for remote logging

- **Configuration Format**: Enhanced transport configuration
```typescript
  // Before (v2.1.0)
  new FileTransport("./logs/app.log")
  
  // After (v3.0.0)
  new NodeFileTransport({
    filePath: "./logs/app.log",
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 5
  })
```

- **CommonLoggerConfig**: New transport management methods
  - `addTransport(transport)`: Add a transport
  - `removeTransport(name)`: Remove by name
  - `getTransport(name)`: Get transport instance
  - `listTransports()`: List all transport names
  - `setTransports([])`: Replace all transports

### Breaking Changes

1. **Transport Names Changed**
```typescript
   // Before
   .addModule("Auth", true, ["info"], ["console", "file"])
   
   // After
   .addModule("Auth", true, ["info"], ["console", "node-file"])
```

2. **File Transport Constructor**
```typescript
   // Before
   import { FileTransport } from "@dqcai/logger";
   new FileTransport("./logs/app.log");
   
   // After
   import { NodeFileTransport } from "@dqcai/logger";
   new NodeFileTransport({ filePath: "./logs/app.log" });
```

3. **Removed Generic FileTransport**
   - Use platform-specific transports: `NodeFileTransport`, `RNFileTransport`, `ElectronFileTransport`

### Migration Guide

**Step 1**: Update transport names in configuration
```typescript
const config = new LoggerConfigBuilder()
  .addModule("MyModule", true, ["info"], ["console", "node-file"]) // Changed from "file"
  .build();
```

**Step 2**: Update transport instantiation
```typescript
// Old
const transport = new FileTransport("./logs/app.log");

// New
const transport = new NodeFileTransport({
  filePath: "./logs/app.log",
  maxFileSize: 10 * 1024 * 1024,
  maxFiles: 5
});
```

**Step 3**: Install optional dependencies if needed
```bash
npm install @dqcai/orm      # For DBTransport
npm install react-native-fs # For RNFileTransport
npm install axios           # For ApiTransport
```

### Performance Improvements

- **Batch Processing**: All network transports use batching
- **Async I/O**: Non-blocking file operations
- **Buffer Management**: Efficient memory usage
- **Query Optimization**: Indexed database queries

### Documentation

- Complete rewrite of README.md with v3.0 features
- Added transport comparison table
- Added custom transport examples (Slack, Sentry, Email)
- Added best practices for each transport
- Added migration guide from v2.1.0

### Dependencies

- **New Peer Dependencies** (optional, loaded dynamically):
  - `@dqcai/orm` (for DBTransport)
  - `react-native-fs` (for RNFileTransport)
  - `axios` (for ApiTransport)

### Testing

- Added comprehensive test suite for NodeFileTransport
- Added comprehensive test suite for DBTransport
- Stress tests for high-volume logging
- Multi-module logging tests
- File rotation tests
- Session tracking tests

---

## [2.1.0] - 2025-01-10

### Added
- Global configuration with `CommonLoggerConfig`
- `createModuleLogger()` helper function
- `CommonModules` predefined module names
- Centralized logger management

### Changed
- Improved TypeScript types
- Enhanced documentation with global config examples

---

## [2.0.0] - 2025-01-05

### Added
- Logger decorators (LogMethod, LogPerformance, LogCache, LogRetry)
- `BaseModule` class for inheritance pattern
- Performance monitoring utilities

### Breaking Changes
- Refactored configuration system

---

## [1.0.3] - 2025-08-25

### Fixed
- Fixed React Native white screen issue
- Fixed module resolution for test imports
- Resolved ESM/CommonJS compatibility issues

### Changed
- Updated tsup configuration for better React Native support

---

## [1.0.2] - 2025-08-25

### Fixed
- Fixed file transport memory leak in web environment
- Corrected log level filtering in console transport

### Changed
- Improved performance of log formatting

---

## [1.0.1] - 2025-08-25

### Fixed
- Fixed TypeScript declaration file generation
- Corrected export paths in package.json

### Added
- Basic unit tests for core logger functionality

---

## [1.0.0] - 2025-08-25

### Added
- Initial release of @dqcai/logger
- Universal logger supporting React Native, Web, and Node.js
- Console transport for all platforms
- File transport for web and Node.js environments
- Configurable log levels (trace, debug, info, warn, error)
- TypeScript support with full type definitions

---

## Version Comparison

| Version | Release Date | Key Features |
|---------|--------------|--------------|
| 3.0.0   | 2025-01-15   | Transport system overhaul, DB/API logging, custom transports |
| 2.1.0   | 2025-01-10   | Global configuration, module helpers |
| 2.0.0   | 2025-01-05   | Logger decorators, BaseModule |
| 1.0.3   | 2025-08-25   | React Native fixes |
| 1.0.0   | 2025-08-25   | Initial release |

---

## Upgrade Path

### From 1.x to 2.x
- Update to use new `LoggerConfigBuilder`
- Migrate to `BaseModule` for class-based logging
- Optional: Add decorators to methods

### From 2.x to 3.x
- Update transport names (`"file"` → `"node-file"`)
- Update transport constructors to use config objects
- Install optional dependencies for new transports
- Review breaking changes section above

---

*This changelog is maintained by [Doan Quoc Cuong](https://github.com/cuongdqpayment) and the @dqcai/logger contributors.*