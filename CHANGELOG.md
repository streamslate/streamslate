# Changelog

All notable changes to StreamSlate will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial project setup with Tauri + React + TypeScript
- PDF viewing infrastructure with PDF.js integration
- Basic annotation framework
- Presenter mode window configuration
- WebSocket API for external integrations (port 11451)
- Stream Deck integration preparation
- Development tooling (ESLint, Prettier, Cargo formatting)
- Comprehensive CI/CD pipeline with GitHub Actions
- Cross-platform build support (macOS, Windows, Linux)

### Changed

- N/A

### Deprecated

- N/A

### Removed

- N/A

### Fixed

- N/A

### Security

- N/A

## [0.0.1] - 2025-01-XX (Initial Development Release)

### Added

- Project foundation and development environment
- Core application architecture
- PDF rendering capabilities foundation
- Basic Tauri commands for PDF operations
- State management with Zustand
- WebSocket server for external control
- Presenter mode window management
- Development documentation and contribution guidelines
- Automated testing and linting workflows

---

## Release Notes Format

Each release should document changes in the following categories:

### Added

- New features and capabilities

### Changed

- Changes to existing functionality

### Deprecated

- Features that will be removed in future versions

### Removed

- Features that have been removed

### Fixed

- Bug fixes and issue resolutions

### Security

- Security improvements and vulnerability fixes

## Version Numbering

StreamSlate follows [Semantic Versioning](https://semver.org/):

- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **MAJOR**: Incompatible API changes
- **MINOR**: New functionality (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## Release Schedule

- **Patch releases**: As needed for critical bugs and security fixes
- **Minor releases**: Monthly feature releases
- **Major releases**: Quarterly or when significant breaking changes are introduced

## Contributing to the Changelog

When contributing:

1. Add your changes to the `[Unreleased]` section
2. Use the appropriate category (Added, Changed, etc.)
3. Write clear, user-focused descriptions
4. Include issue/PR references where applicable
5. Follow the existing format and style

Example entry:

```markdown
### Added

- Real-time collaboration support for shared annotation sessions (#123)
- Export annotations to PDF with custom styling options (#145)

### Fixed

- Resolved memory leak in PDF rendering on large documents (#156)
- Fixed annotation positioning on high-DPI displays (#167)
```

## Links and References

- [Project Repository](https://github.com/streamslate/streamslate)
- [Issue Tracker](https://github.com/streamslate/streamslate/issues)
- [Documentation](https://streamslate.app/docs)
- [Discord Community](https://discord.gg/streamslate)
