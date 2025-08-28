# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Placeholder for new features

### Changed
- Placeholder for changes in existing functionality

### Fixed
- Placeholder for bug fixes

### Security
- Placeholder for security fixes

---

## [1.0.3] -  2025-08-25

### Fixed
- Fixed React Native white screen issue by adding platform-specific builds
- Fixed module resolution for test imports
- Resolved ESM/CommonJS compatibility issues

### Changed
- Updated tsup configuration for better React Native support
- Improved TypeScript path mapping in test environment
- Enhanced build output structure with separate React Native bundle

### Added
- React Native specific build target in tsup config
- Better error handling in logger transports
- Enhanced documentation for cross-platform usage

---

## [1.0.2] -  2025-08-25

### Fixed
- Fixed file transport memory leak in web environment
- Corrected log level filtering in console transport

### Changed
- Improved performance of log formatting
- Updated dependencies to latest stable versions

---

## [1.0.1] -  2025-08-25

### Fixed
- Fixed TypeScript declaration file generation
- Corrected export paths in package.json

### Added
- Basic unit tests for core logger functionality

---

## [1.0.0] -  2025-08-25

### Added
- Initial release of @dqcai/logger
- Universal logger supporting React Native, Web, and Node.js
- Console transport for all platforms
- File transport for web and Node.js environments
- Configurable log levels (debug, info, warn, error)
- TypeScript support with full type definitions
- LoggerConfigBuilder for easy configuration
- Support for custom log formatters
- Memory-efficient logging with configurable buffer sizes

### Features
- 🚀 **Cross-platform**: Works on React Native, Web browsers, and Node.js
- 📝 **Multiple Transports**: Console, File, and extensible custom transports
- 🎯 **TypeScript First**: Full TypeScript support with comprehensive type definitions
- ⚡ **High Performance**: Optimized for high-throughput logging scenarios
- 🔧 **Configurable**: Flexible configuration system with builder pattern
- 📱 **React Native Ready**: Zero configuration needed for React Native projects
- 🌐 **Web Compatible**: Works in modern browsers with file download capabilities
- 🖥️ **Node.js Native**: Full file system integration for server environments

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.3   |  2025-08-25 | React Native compatibility fixes |
| 1.0.2   |  2025-08-25 | Performance improvements and bug fixes |
| 1.0.1   |  2025-08-25 | TypeScript and export fixes |
| 1.0.0   |  2025-08-25 | Initial release |

---

## Upgrade Guide

### From 1.0.2 to 1.0.3
- No breaking changes
- React Native users should reinstall the package to get new builds
- Test imports now work correctly without specific file paths

### From 1.0.1 to 1.0.2  
- No breaking changes
- Performance improvements are automatic
- Consider reviewing log levels if using file transport extensively

### From 1.0.0 to 1.0.1
- No breaking changes
- TypeScript users get better intellisense support
- Re-run `npm install` to get updated type definitions

---

## Migration Examples

### React Native Usage (Updated in 1.0.3)
```typescript
// Before (might cause white screen)
import { Logger } from '@dqcai/logger';

// After (recommended)
import { LoggerConfigBuilder, ConsoleTransport } from '@dqcai/logger';

const logger = new LoggerConfigBuilder()
  .addTransport(new ConsoleTransport())
  .build();
```

### Test Imports (Fixed in 1.0.3)
```typescript
// Before (would fail)
import { LoggerConfigBuilder } from "../index";

// After (now works)
import { LoggerConfigBuilder, ConsoleTransport } from '@dqcai/logger';
```

---

## Contributing to Changelog

When contributing, please:

1. **Add entries to [Unreleased]** section first
2. **Use the correct category**: Added, Changed, Deprecated, Removed, Fixed, Security
3. **Write clear descriptions** that help users understand the impact
4. **Include breaking changes** in the description if any
5. **Reference issues/PRs** when applicable: `Fixed memory leak (#123)`

### Changelog Categories

- **Added** for new features
- **Changed** for changes in existing functionality  
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** in case of vulnerabilities

---

*This changelog is maintained by [Doan Quoc Cuong](https://github.com/cuongdqpayment) and the @dqcai/logger contributors.*