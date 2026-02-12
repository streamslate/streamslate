# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.0.0](https://github.com/streamslate/streamslate/compare/v0.0.2-beta.10...v1.0.0) (2026-02-11)

### 🎉 v1.0 — Public Release

StreamSlate is production-ready. This release marks the culmination of the MVP and Beta phases, delivering a complete PDF annotation tool built for streamers.

### ✨ Highlights

- **Live Collaboration** — Real-time WebSocket-based sync for co-annotation sessions
- **Native Screen Capture** — ScreenCaptureKit integration with CVPixelBuffer extraction (macOS)
- **OBS Browser Source** — Plug `http://localhost:11451/presenter` into any OBS scene
- **Stream Deck Integration** — Official plugin for hotkey-driven annotation control
- **Cross-Platform** — macOS (Apple Silicon + Intel), Windows (x64), Linux (x64)
- **Auto-Update System** — Tauri updater with code signing support
- **CI/CD Pipeline** — Automated builds, code signing, notarization, and GitHub Releases

### ✨ Features

- PDF annotation tools: highlighter, free draw, text boxes, shapes, arrows
- Dark-first UI with true page inversion and WCAG-compliant contrast
- Presenter mode with transparent, borderless window
- Annotation save/export to PDF and JSON
- High-fidelity PDF export with precise arrowhead math
- WebSocket API (port 11451) for custom integrations
- E2E test suite with Cypress and data-testid selectors
- Tauri IPC mock for browser-only testing

### [0.0.2-beta.10](https://github.com/streamslate/streamslate/compare/v0.0.2-beta.9...v0.0.2-beta.10) (2026-02-01)

### 🔧 Chores

- **ci:** single-build multi-tag release workflow for consistent artifacts
- **ci:** cache optimization for faster CI builds

### [0.0.2-beta.9](https://github.com/streamslate/streamslate/compare/v0.0.2-beta.8...v0.0.2-beta.9) (2026-01-25)

### ✨ Features

- **collaboration:** live WebSocket sync for co-annotation sessions
- **ui:** real-time cursor sharing between connected clients

### [0.0.2-beta.8](https://github.com/streamslate/streamslate/compare/v0.0.2-beta.7...v0.0.2-beta.8) (2026-01-18)

### ✨ Features

- **capture:** ScreenCaptureKit integration with CVPixelBuffer extraction
- **capture:** frame tracking in IntegrationState for improved sync

### 🐛 Bug Fixes

- **export:** fixed arrowhead math in PDF export for precise rendering

### [0.0.2-beta.7](https://github.com/streamslate/streamslate/compare/v0.0.2-beta.6...v0.0.2-beta.7) (2026-01-10)

### ✨ Features

- **updater:** Tauri auto-update system with code signing support
- **ci:** macOS API key authentication for notarization

### 🧪 Testing

- expanded Cypress E2E test coverage with data-testid selectors
- added Tauri IPC mock for browser-only testing

### [0.0.2-beta.6](https://github.com/streamslate/streamslate/compare/v0.0.2-beta.5...v0.0.2-beta.6) (2026-01-04)

### 🐛 Bug Fixes

- **ci:** resolved webkit/jscore 4.0 compatibility issues in CI
- **ci:** fix dual-remote publishing for GitLab and GitHub

### 🔧 Chores

- **branding:** refresh repository assets and logos

### [0.0.2-beta.5](https://github.com/streamslate/streamslate/compare/v0.0.2-beta.4...v0.0.2-beta.5) (2025-12-29)

### 🔧 Chores

- **build:** update Dockerfile and version for release ([0114a8d](https://github.com/cblevins/streamslate/commit/0114a8de48848473cec3aa91f7293359bb5103ca))

### [0.0.2-beta.4](https://github.com/streamslate/streamslate/compare/v0.0.2-beta.3...v0.0.2-beta.4) (2025-08-29)

### 🔧 Chores

- **build:** optimize Dockerfile and ignore Cargo.lock ([bb15fe2](https://github.com/cblevins/streamslate/commit/bb15fe2cf96859ec8d4f700d1c686e8b2cbe005e))

### [0.0.2-beta.3](https://github.com/streamslate/streamslate/compare/v0.0.2-beta.2...v0.0.2-beta.3) (2025-08-29)

### 🔧 Chores

- **build:** normalize Windows MSI version for releases ([0292624](https://github.com/cblevins/streamslate/commit/02926248807a75928e32495cab256311dcf2b6ac))

### [0.0.2-beta.2](https://github.com/streamslate/streamslate/compare/v0.0.2-beta.1...v0.0.2-beta.2) (2025-08-29)

### 🔧 Chores

- **release:** update version and release workflow ([a21c2c9](https://github.com/cblevins/streamslate/commit/a21c2c9f2e377e0900792b1b20373c8c2ac398b4))

### [0.0.2-beta.1](https://github.com/streamslate/streamslate/compare/v0.0.2-beta.0...v0.0.2-beta.1) (2025-08-29)

### 0.0.2-beta.0 (2025-08-29)

### 🐛 Bug Fixes

- apt error ([aeba080](https://github.com/cblevins/streamslate/commit/aeba08087b1e27dfe3d0f129a7fbee87b374b3c2))
- **ci:** skip Cypress tests when dev server is not running ([440608b](https://github.com/cblevins/streamslate/commit/440608bb9267ef0b7c967fc8b5646dcf355d6893))
- Core build deps + the WebKit 4.0 dev package that _does_ exist ([76c867f](https://github.com/cblevins/streamslate/commit/76c867fa88aae94b1dc392ff4e6dd8846271e42f))
- install newer WebKit if stock repo is too old ([2c2b5db](https://github.com/cblevins/streamslate/commit/2c2b5dbaab294136d9c1b19475f8b6b9647edb45))
- resolve all ESLint errors and warnings for CI ([eb3c199](https://github.com/cblevins/streamslate/commit/eb3c199f26f93e3a8f7657b5a1e6b7131953709f))
- update Cypress config for macOS compatibility ([87d4e0d](https://github.com/cblevins/streamslate/commit/87d4e0d5ebb6a5e5417c747bcae6eac921a21159))

### ✅ Tests

- update Cypress tests for current StreamSlate UI ([ab95237](https://github.com/cblevins/streamslate/commit/ab95237bead18a6a26566fb64e2c69839e3e9229))

### 📦 Build System

- add libsoup2.4-dev to ubuntu build requirements ([3d4e5a8](https://github.com/cblevins/streamslate/commit/3d4e5a8bd3d185a55008a8e4343eee8fe4aefea2))
- consolidate Linux build dependencies into requirement files ([bb0a39b](https://github.com/cblevins/streamslate/commit/bb0a39b2fd1bb4a8720229c1a82efd2eb8f72643))

### 👷 CI/CD

- **release:** configure macOS certificate import and keychain setup ([846828e](https://github.com/cblevins/streamslate/commit/846828e4d3e4c0b58f301c741498fb56ef5a2f37))
- **release:** configure macOS signing and fix Tauri build issues ([3beacf3](https://github.com/cblevins/streamslate/commit/3beacf3dc8e7b965994cf39c56d3b637f1a818fa))
- **release:** enhance release workflow with tag validation and logging ([94007dc](https://github.com/cblevins/streamslate/commit/94007dc227604446ec2ddf9e5d33f322b52c06cd))

### 📚 Documentation

- add macOS code signing setup guide ([36e4dda](https://github.com/cblevins/streamslate/commit/36e4dda1d28ba860759ba18713a5fa04c3358ade))

### ✨ Features

- **build:** add generated platform-specific icons for Tauri builds ([bf62ff5](https://github.com/cblevins/streamslate/commit/bf62ff5d43709b92e83425f03ea3ccba6e7f1366))
- **ci:** add Docker build and release workflows ([fb7658a](https://github.com/cblevins/streamslate/commit/fb7658ab274f78dba9a80de3d6d408a07a25df04))
- **pdf:** enhance PDF viewer with dark mode and improved rendering ([23e280b](https://github.com/cblevins/streamslate/commit/23e280b1070c50a8cb23bced207562f19e2084f6))
- **pdf:** implement PDF viewer with annotation capabilities ([31eb5db](https://github.com/cblevins/streamslate/commit/31eb5dba16aa4e1fefbc76ab5deb59320df52981))
- **ui:** complete UI overhaul with modern design system ([d2b701a](https://github.com/cblevins/streamslate/commit/d2b701ad3bbecdf745c06382822e26caeb6436df))
- **ui:** implement PDF dark mode support ([6670ee1](https://github.com/cblevins/streamslate/commit/6670ee16964378ce0e9675a4f56d057cc6d53b79))
- initialize project structure and core dependencies ([14ebdb5](https://github.com/cblevins/streamslate/commit/14ebdb572f8c373a72127b565a23e24f2e9fabd5))

---

## Version Numbering

StreamSlate follows [Semantic Versioning](https://semver.org/):

- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **MAJOR**: Incompatible API changes
- **MINOR**: New functionality (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## Links and References

- [Project Repository](https://github.com/streamslate/streamslate)
- [Issue Tracker](https://github.com/streamslate/streamslate/issues)
- [Documentation](https://streamslate.app/docs)
- [Discord Community](https://discord.gg/streamslate)
