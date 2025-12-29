# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.0.2-beta.5](https://github.com/cblevins/streamslate/compare/v0.0.2-beta.4...v0.0.2-beta.5) (2025-12-29)

### 🔧 Chores

- **build:** update Dockerfile and version for release ([0114a8d](https://github.com/cblevins/streamslate/commit/0114a8de48848473cec3aa91f7293359bb5103ca))

### [0.0.2-beta.4](https://github.com/cblevins/streamslate/compare/v0.0.2-beta.3...v0.0.2-beta.4) (2025-08-29)

### 🔧 Chores

- **build:** optimize Dockerfile and ignore Cargo.lock ([bb15fe2](https://github.com/cblevins/streamslate/commit/bb15fe2cf96859ec8d4f700d1c686e8b2cbe005e))

### [0.0.2-beta.3](https://github.com/cblevins/streamslate/compare/v0.0.2-beta.2...v0.0.2-beta.3) (2025-08-29)

### 🔧 Chores

- **build:** normalize Windows MSI version for releases ([0292624](https://github.com/cblevins/streamslate/commit/02926248807a75928e32495cab256311dcf2b6ac))

### [0.0.2-beta.2](https://github.com/cblevins/streamslate/compare/v0.0.2-beta.1...v0.0.2-beta.2) (2025-08-29)

### 🔧 Chores

- **release:** update version and release workflow ([a21c2c9](https://github.com/cblevins/streamslate/commit/a21c2c9f2e377e0900792b1b20373c8c2ac398b4))

### [0.0.2-beta.1](https://github.com/cblevins/streamslate/compare/v0.0.2-beta.0...v0.0.2-beta.1) (2025-08-29)

### 0.0.2-beta.0 (2025-08-29)

### 🐛 Bug Fixes

- apt error ([aeba080](https://github.com/cblevins/streamslate/commit/aeba08087b1e27dfe3d0f129a7fbee87b374b3c2))
- **ci:** skip Cypress tests when dev server is not running ([440608b](https://github.com/cblevins/streamslate/commit/440608bb9267ef0b7c967fc8b5646dcf355d6893))
- Core build deps + the WebKit 4.0 dev package that _does_ exist ([76c867f](https://github.com/cblevins/streamslate/commit/76c867fa88aae94b1dc392ff4e6dd8846271e42f))
- install newer WebKit if stock repo is too old ([2c2b5db](https://github.com/cblevins/streamslate/commit/2c2b5dbaab294136d9c1b19475f8b6b9647edb45))
- Removed libappindicator3-dev from both functions - Ubuntu Noble uses libayatana-appindicator3-dev exclusively Removed the fallback logic (|| sudo apt-get install -y libappindicator3-dev) since it causes conflicts The script now only installs the Ayatana version of the appindicator library, which is the correct one for Ubuntu 24.04 (Noble). ([a270d58](https://github.com/cblevins/streamslate/commit/a270d58e699f4c2608aede9c74304b28a25a809d))
- resolve all ESLint errors and warnings for CI ([eb3c199](https://github.com/cblevins/streamslate/commit/eb3c199f26f93e3a8f7657b5a1e6b7131953709f))
- The backslash with an inline comment creates a malformed command. I removed the comment from that line. Also moved the install_webkit_linux call to the proper place in main(). What Changed Line 118: Removed inline comment after backslash continuation Line 148: Moved the webkit install call into main() function where it belongs Line order: The webkit install now happens after install_sys_packages but before Node/Rust installation The script should now run without the "Unable to locate package" error. ([c78b7a9](https://github.com/cblevins/streamslate/commit/c78b7a9fdd9d84c559226291d20a4961fa8f1de5))
- The fix removes libwebkit2gtk-4.0-dev from the initial package installation since it doesn't exist on Ubuntu Noble. The install_webkit_linux() function already handles installing the correct webkit version (4.1) for the distro ([8f01a29](https://github.com/cblevins/streamslate/commit/8f01a2928cd4eda052d4edf1d0f1efc7213c96dd))
- update Cypress config for macOS compatibility ([87d4e0d](https://github.com/cblevins/streamslate/commit/87d4e0d5ebb6a5e5417c747bcae6eac921a21159))

### ✅ Tests

- update Cypress tests for current StreamSlate UI ([ab95237](https://github.com/cblevins/streamslate/commit/ab95237bead18a6a26566fb64e2c69839e3e9229))

### 📦 Build System

- add libsoup2.4-dev to ubuntu build requirements ([3d4e5a8](https://github.com/cblevins/streamslate/commit/3d4e5a8bd3d185a55008a8e4343eee8fe4aefea2))
- adjust npm dependency installation in Dockerfile ([5cd1e6d](https://github.com/cblevins/streamslate/commit/5cd1e6dcf6618c3c5d7510b55bca38164ffa94eb))
- consolidate Linux build dependencies into requirement files ([bb0a39b](https://github.com/cblevins/streamslate/commit/bb0a39b2fd1bb4a8720229c1a82efd2eb8f72643))
- **deps:** add libjavascriptcoregtk-4.0-dev to ubuntu build requirements ([93a0c80](https://github.com/cblevins/streamslate/commit/93a0c8031bc761e22ed1114a030788fc26bfa30e))
- **deps:** update package-lock.json ([73d0adc](https://github.com/cblevins/streamslate/commit/73d0adc96436539b6aad7d49adcd66fab17d5a78))
- **docker:** add libssl-dev to Dockerfile ([3237a95](https://github.com/cblevins/streamslate/commit/3237a95adf23551d84bc7b05a1d39f5d8f657632))
- improve npm dependency installation in Dockerfile ([4fb0cd5](https://github.com/cblevins/streamslate/commit/4fb0cd543c1bb3a0beefd92da14c4bbb2228b1eb))

### 👷 CI/CD

- **release:** configure macOS certificate import and keychain setup ([846828e](https://github.com/cblevins/streamslate/commit/846828e4d3e4c0b58f301c741498fb56ef5a2f37))
- **release:** configure macOS signing and fix Tauri build issues ([3beacf3](https://github.com/cblevins/streamslate/commit/3beacf3dc8e7b965994cf39c56d3b637f1a818fa))
- **release:** enhance release workflow with tag validation and logging ([94007dc](https://github.com/cblevins/streamslate/commit/94007dc227604446ec2ddf9e5d33f322b52c06cd))
- **release:** remove macOS certificate import from release workflow ([abbbabd](https://github.com/cblevins/streamslate/commit/abbbabde30d281c6f6a1edfae964700b2dfa2621))
- set APPLE_SIGNING_IDENTITY in release workflow ([004c532](https://github.com/cblevins/streamslate/commit/004c5328624a5562fe638d7f41d6b8ce304d3f40))
- **workflows:** add Xcode command line tools installation for macOS CI ([4a66874](https://github.com/cblevins/streamslate/commit/4a66874cc89bd91708ac18dfbed73887e967a744))
- **workflows:** adjust Docker build conditions for PRs ([0ef46a1](https://github.com/cblevins/streamslate/commit/0ef46a140f06f3583d06b138f9dfd5b5126916ba))
- **workflows:** adjust macOS runner and clippy execution order ([4b25e51](https://github.com/cblevins/streamslate/commit/4b25e51d2c6c32115bc76f8fce62744062d56804))
- **workflows:** enhance CI setup for build dependencies and macOS ([1ba2875](https://github.com/cblevins/streamslate/commit/1ba2875180451aac575ebec94d169277a8877d8e))
- **workflows:** ignore comments and empty lines in ubuntu build requirements ([5efbd5e](https://github.com/cblevins/streamslate/commit/5efbd5ed8da9c2b3a1133953d52b4ceff8368636))
- **workflows:** improve dev server readiness and Vite build target ([701b2ac](https://github.com/cblevins/streamslate/commit/701b2aca31579e26756f219669b1a693081711c7))
- **workflows:** improve dev server readiness check ([b964f14](https://github.com/cblevins/streamslate/commit/b964f1478fcab097772d9f5cb2f990f1bad65722))
- **workflows:** improve dev server readiness check ([1dda8d1](https://github.com/cblevins/streamslate/commit/1dda8d197735291916880bfe58238740d261c7c1))
- **workflows:** improve Docker build and push logic ([9fa70ef](https://github.com/cblevins/streamslate/commit/9fa70efd8ccb13956855c627a015ae1357a637f1))
- **workflows:** improve frontend dependency installation ([c955c50](https://github.com/cblevins/streamslate/commit/c955c501f21b20a2c5a5ae4618b6b36f5262c3f8))
- **workflows:** improve macOS signing and Docker build stability ([41c7743](https://github.com/cblevins/streamslate/commit/41c7743ef3c9ee78947b045e077a44f4c6dcfb4d))
- **workflows:** improve npm dependency handling for native modules ([6503323](https://github.com/cblevins/streamslate/commit/6503323a9af1db5b7433bd91c02f9935c1262de1))
- **workflows:** install build and dev requirements for Ubuntu ([793667a](https://github.com/cblevins/streamslate/commit/793667ae443a9673ceb0327ce171efa3c66a6e7b))
- **workflows:** install build-essential for Ubuntu CI ([463976e](https://github.com/cblevins/streamslate/commit/463976e883df2bec22efd50dccffad5050999728))
- **workflows:** install VS Build Tools on Windows ([a1eb009](https://github.com/cblevins/streamslate/commit/a1eb009a93514d4377d6f8276cce9e6c09450ef3))
- **workflows:** remove unnecessary Tauri config argument ([0de61c8](https://github.com/cblevins/streamslate/commit/0de61c8b80fe75b8718718423b498be8e5862870))
- **workflows:** specify bash shell for frontend tests ([5aa2093](https://github.com/cblevins/streamslate/commit/5aa2093598fd902d6768dcce5a1697ae1e1dcd2d))
- **workflows:** update CI to run frontend tests against dev server ([4804db0](https://github.com/cblevins/streamslate/commit/4804db02970b31bf61a694219390bf4cd17604aa))
- **workflows:** update macOS runner and Ubuntu build requirements ([47b4458](https://github.com/cblevins/streamslate/commit/47b44581d42b0caa300fa58c361f86ca5bda68f1))
- **workflows:** update macOS runner and Ubuntu dev dependencies ([f2eed23](https://github.com/cblevins/streamslate/commit/f2eed23546521a3f263cba60111a74c8806a0b32))
- **workflows:** update release workflow for Tauri action and Ubuntu version ([ef276b3](https://github.com/cblevins/streamslate/commit/ef276b3e178bfef40e3ad27f512a1cdafa9a5529))
- **workflows:** update Ubuntu version and Tauri action ([c6b7846](https://github.com/cblevins/streamslate/commit/c6b78462618687fc6f51575d46a083cdab8c1c5e))
- **workflows:** update Windows build tools installation ([bf916e6](https://github.com/cblevins/streamslate/commit/bf916e6197a55ce60e3530379e6bacb7bb6ee106))
- **workflows:** use self-hosted macOS ARM64 runner ([8ac6b60](https://github.com/cblevins/streamslate/commit/8ac6b60ab12912d5fd80039842bb918132d4c465))
- **workflows:** use self-hosted macOS runner ([ec56c0e](https://github.com/cblevins/streamslate/commit/ec56c0e8a25d2889e629a9edaef95f43f67516b7))

### 📚 Documentation

- add macOS code signing setup guide ([36e4dda](https://github.com/cblevins/streamslate/commit/36e4dda1d28ba860759ba18713a5fa04c3358ade))
- document fix for macOS notarization hanging ([c39f0a3](https://github.com/cblevins/streamslate/commit/c39f0a3257276eeb2e6c5c1ea8996b4c54f16bde))

### ✨ Features

- **build:** add generated platform-specific icons for Tauri builds ([bf62ff5](https://github.com/cblevins/streamslate/commit/bf62ff5d43709b92e83425f03ea3ccba6e7f1366))
- **ci:** add Docker build and release workflows ([fb7658a](https://github.com/cblevins/streamslate/commit/fb7658ab274f78dba9a80de3d6d408a07a25df04))
- **ci:** add Docker support and pre-commit hooks ([8818354](https://github.com/cblevins/streamslate/commit/881835464cbf28c5a835f14add70c1683dabaa89))
- **ci:** add pre-commit hooks and Docker support ([457a3c6](https://github.com/cblevins/streamslate/commit/457a3c6f07588bc7c559a9d06aef798f825786af))
- **ci:** improve pre-push hook with Cypress auto-fix ([05f23d3](https://github.com/cblevins/streamslate/commit/05f23d3c6bbaeaf162d2dec0f20c493235a1ff8b))
- **ci:** update macOS release workflow for API key authentication ([2532dc4](https://github.com/cblevins/streamslate/commit/2532dc483bc65cefab981cbd6b157fa7c52c4f7f))
- **ci:** use self-hosted runner for Ubuntu builds ([11c0eb6](https://github.com/cblevins/streamslate/commit/11c0eb6ffd8ff6464737ed78c2ffc8adfaf997fc))
- **config:** configure macOS and Windows signing details ([092d978](https://github.com/cblevins/streamslate/commit/092d978ea5413fe98e7beb356cdbf70d3c737085))
- initialize project structure and core dependencies ([14ebdb5](https://github.com/cblevins/streamslate/commit/14ebdb572f8c373a72127b565a23e24f2e9fabd5))
- **pdf:** enhance PDF viewer with dark mode and improved rendering ([23e280b](https://github.com/cblevins/streamslate/commit/23e280b1070c50a8cb23bced207562f19e2084f6))
- **pdf:** implement PDF viewer with annotation capabilities ([31eb5db](https://github.com/cblevins/streamslate/commit/31eb5dba16aa4e1fefbc76ab5deb59320df52981))
- **setup:** optimize setup.sh for container/CI environments and improve Node/Rust installation ([5d6c55a](https://github.com/cblevins/streamslate/commit/5d6c55a74c20cb0b6784b25b5e9ec366794bde9b))
- **ui:** complete UI overhaul with modern design system ([d2b701a](https://github.com/cblevins/streamslate/commit/d2b701ad3bbecdf745c06382822e26caeb6436df))
- **ui:** enhance PDF viewer and sidebar with improved styling and animations ([3547495](https://github.com/cblevins/streamslate/commit/35474959fe6b18d88742f58f7b8986896eecb882))
- **ui:** implement PDF dark mode support ([6670ee1](https://github.com/cblevins/streamslate/commit/6670ee16964378ce0e9675a4f56d057cc6d53b79))
- **ui:** implement PDF fit modes and enhance dark mode ([2b7f93b](https://github.com/cblevins/streamslate/commit/2b7f93bc2fe6ed3d03ae8923a441558d0df0a966))
- **ui:** improve PDF rendering and WebView compatibility ([9f4b6af](https://github.com/cblevins/streamslate/commit/9f4b6af2b97019bd44376975c308c5e7d56bfb82))
- **ui:** integrate PDF opening functionality and dark mode for viewer ([bdbd6c9](https://github.com/cblevins/streamslate/commit/bdbd6c912f50e2a3abafca40f6bc4342abd9e76d))
- **ui:** migrate to Tailwind CSS color variables ([4613a4d](https://github.com/cblevins/streamslate/commit/4613a4d9b6efc94292ba9420b158d315ba17c853))
- **ui:** refactor app layout and introduce new components ([0c912a0](https://github.com/cblevins/streamslate/commit/0c912a04fda047c11ec66dde629c0213cab1d291))

### 🔧 Chores

- **ci:** create dist directory for Rust tests ([7030e90](https://github.com/cblevins/streamslate/commit/7030e90d1352f869ed6545f4b4a643a73c294960))
- **config:** add app icons to tauri.conf.json ([76c0ac0](https://github.com/cblevins/streamslate/commit/76c0ac0644e19dfb153162643af673530d1e2eb1))
- **deps:** add standard-version for release automation ([374cfef](https://github.com/cblevins/streamslate/commit/374cfef9684e9bdfac3a43e6ef774507c23c8857))
- **deps:** update lint-staged to v15.2.10 ([33012da](https://github.com/cblevins/streamslate/commit/33012da9d156df279baf8b3fe09da140bcaa9a03))
- **deps:** update rust version in Dockerfile ([0c9a3e6](https://github.com/cblevins/streamslate/commit/0c9a3e60c7a6c406de70316e00cf9df3c09883a1))
- **deps:** update ubuntu build requirements and error formatting ([3c3382b](https://github.com/cblevins/streamslate/commit/3c3382b01502c1bfef386449ef07c62b59715db4))
- **docker:** add npm ci fallback for dependency installation ([e18e62d](https://github.com/cblevins/streamslate/commit/e18e62d23cc9e8a617ef23aab9aee7b2598b2191))
- **husky:** relax commit subject length limit ([e287b84](https://github.com/cblevins/streamslate/commit/e287b84deabf4b6008245663417acd87577e338c))
- **husky:** relax commit subject length limit ([4c3659a](https://github.com/cblevins/streamslate/commit/4c3659afb3e03ddc0749dae71f4096d23838a274))
- **husky:** remove redundant husky setup from scripts ([363e4e2](https://github.com/cblevins/streamslate/commit/363e4e2bbf705625c26f4ab22e9991a543f84d30))
- update pre-commit hook and workspace settings ([b0bccd4](https://github.com/cblevins/streamslate/commit/b0bccd4909ee2799393652364d5167b31bc1357d))

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
