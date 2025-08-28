# VERSION_TEMPLATE.md

## Version Release Templates

### Patch Release Template (Bug fixes)
```markdown
## [X.X.X] - YYYY-MM-DD

### Fixed
- Fixed [specific bug description]
- Resolved [issue description] 
- Corrected [problem description]

### Changed
- Improved [performance/behavior description]
- Updated [dependency/configuration description]
```

### Minor Release Template (New features)
```markdown
## [X.X.X] - YYYY-MM-DD

### Added
- Added [new feature description]
- Introduced [new capability description]
- Support for [new platform/environment]

### Changed  
- Enhanced [existing feature description]
- Improved [performance/usability description]

### Fixed
- Fixed [bug description]
```

### Major Release Template (Breaking changes)
```markdown
## [X.X.X] - YYYY-MM-DD

### Added
- [New major features]

### Changed
- **BREAKING:** [Breaking change description]
- **BREAKING:** [API change description]
- [Other significant changes]

### Removed
- **BREAKING:** Removed [deprecated feature]

### Migration Guide
See [Migration Guide](#migration-examples) for upgrade instructions.
```

---

# RELEASE_NOTES_TEMPLATE.md

## Release Notes Templates

### Standard Release Notes
```
🚀 @dqcai/logger v{version} Release

✨ What's New:
- [Feature 1]
- [Feature 2]

🐛 Bug Fixes:
- [Fix 1] 
- [Fix 2]

🔧 Improvements:
- [Improvement 1]
- [Improvement 2]

📦 Installation:
npm install @dqcai/logger@{version}

📚 Documentation: [Link to docs]
🔗 NPM Package: https://www.npmjs.com/package/@dqcai/logger/v/{version}
```

### Major Release Notes
```
🎉 @dqcai/logger v{version} - Major Release!

⚠️ BREAKING CHANGES:
This release contains breaking changes. Please read the migration guide.

🌟 Major New Features:
- [Major feature 1]
- [Major feature 2]

💥 Breaking Changes:
- [Breaking change 1] - See migration guide
- [Breaking change 2] - See migration guide

🚀 Migration Guide:
[Link to migration guide in CHANGELOG.md]

📦 Upgrade:
npm install @dqcai/logger@{version}

⚠️ Please test thoroughly before deploying to production!
```

---

# .github/PULL_REQUEST_TEMPLATE.md

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Maintenance (dependency updates, build process, etc.)

## Changelog Entry
Please add your changes to the appropriate section in CHANGELOG.md under [Unreleased]:

### Added
- [If new feature] Description of new feature

### Changed  
- [If modification] Description of changes

### Fixed
- [If bug fix] Description of bug fix

## Testing
- [ ] I have tested this change locally
- [ ] I have added/updated tests as needed
- [ ] All existing tests pass

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have updated CHANGELOG.md with my changes
- [ ] I have updated documentation as needed
- [ ] My changes don't introduce new TypeScript errors
```

---

# scripts/changelog-validator.js

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const CHANGELOG_PATH = path.join(process.cwd(), 'CHANGELOG.md');

function validateChangelog() {
  if (!fs.existsSync(CHANGELOG_PATH)) {
    console.error('❌ CHANGELOG.md not found!');
    return false;
  }
  
  const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  
  // Check for required sections
  const requiredSections = [
    '## [Unreleased]',
    '### Added',
    '### Changed', 
    '### Fixed'
  ];
  
  const missingSections = requiredSections.filter(section => 
    !changelog.includes(section)
  );
  
  if (missingSections.length > 0) {
    console.error('❌ Missing required changelog sections:');
    missingSections.forEach(section => console.error(`  - ${section}`));
    return false;
  }
  
  // Check for placeholder content
  const hasPlaceholders = changelog.includes('Placeholder for');
  if (hasPlaceholders) {
    // Check if there are non-placeholder entries
    const unreleasedSection = changelog.match(/## \[Unreleased\](.*?)(?=## \[|$)/s);
    if (unreleasedSection) {
      const content = unreleasedSection[1];
      const hasRealEntries = content.match(/^- (?!Placeholder)/m);
      
      if (!hasRealEntries) {
        console.warn('⚠️ Only placeholder entries found in [Unreleased] section');
        console.warn('   Please add actual changes before releasing');
        return false;
      }
    }
  }
  
  console.log('✅ CHANGELOG.md validation passed');
  return true;
}

// Add to package.json scripts:
// "preversion": "npm run test && npm run typecheck && node scripts/changelog-validator.js"

if (require.main === module) {
  const isValid = validateChangelog();
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateChangelog };
```