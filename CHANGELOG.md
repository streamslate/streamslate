# Changelog

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.2.0](https://github.com/streamslate/streamslate/compare/v1.1.1...v1.2.0) (2026-02-19)

### 👷 CI/CD

- retry buildkit connection failures ([9eee5e0](https://github.com/streamslate/streamslate/commit/9eee5e05ca2cb8d89d55e7210f88d88788a9c76c))

### 🐛 Bug Fixes

- guard displayTargets against null in non-Tauri environments ([c956803](https://github.com/streamslate/streamslate/commit/c9568032fab5b45417df39b3b553f77b062f9565))
- prefix unused display_id param in non-macOS stub ([4f228bc](https://github.com/streamslate/streamslate/commit/4f228bc6791e8905eec11ed50bf1ea9b4c1af893))
- use correct Tauri v1 env var names and regenerate signing keypair ([8f720e0](https://github.com/streamslate/streamslate/commit/8f720e04a5de8732fdecda3d6d76a8e5650fbb9a))

### ✨ Features

- add multi-monitor capture support ([60da989](https://github.com/streamslate/streamslate/commit/60da9896004069c6cbfc2529577c8ea6c5da5cc9)), closes [#9](https://github.com/streamslate/streamslate/issues/9)
- add settings export/import for cross-machine sync ([45947b6](https://github.com/streamslate/streamslate/commit/45947b64d1b2822439feabb1b355d0bd30599aed)), closes [#8](https://github.com/streamslate/streamslate/issues/8)
- wire NDI output and add Syphon Metal bridge ([7d2a53d](https://github.com/streamslate/streamslate/commit/7d2a53d5d881e4d4a3a82282c5bda19c001abb03)), closes [#2](https://github.com/streamslate/streamslate/issues/2) [#3](https://github.com/streamslate/streamslate/issues/3)
- wire Tauri auto-update signing into CI and release pipeline ([a2dd5be](https://github.com/streamslate/streamslate/commit/a2dd5be049a1d67730ad816885a46debe9a768e1)), closes [#4](https://github.com/streamslate/streamslate/issues/4)

### 📚 Documentation

- mark cloud sync for settings as complete in roadmap ([b72dab3](https://github.com/streamslate/streamslate/commit/b72dab37ebaa8563b0f628450818a3466605dd3c))
- mark Post-1.1 phase complete and close shipped issues ([45c7bad](https://github.com/streamslate/streamslate/commit/45c7bad63116fd6107c4a9545452eaf058570344)), closes [#3](https://github.com/streamslate/streamslate/issues/3) [#2](https://github.com/streamslate/streamslate/issues/2) [#4](https://github.com/streamslate/streamslate/issues/4) [#5](https://github.com/streamslate/streamslate/issues/5) [#6](https://github.com/streamslate/streamslate/issues/6) [#1](https://github.com/streamslate/streamslate/issues/1)
- reconcile roadmap and README with v1.1.x shipped state ([7e1856b](https://github.com/streamslate/streamslate/commit/7e1856b3c959e1ada218e6c6d0629e0dda2d6850))

### [1.1.1](https://github.com/streamslate/streamslate/compare/v1.1.0...v1.1.1) (2026-02-17)

### 🔧 Chores

- sync tauri version + commit-all releases ([2003469](https://github.com/streamslate/streamslate/commit/2003469d8a5c108ec004a9cfd82018e3e7ff8ddd))

## [1.1.0](https://github.com/cblevins/streamslate/compare/v1.0.1...v1.1.0) (2026-02-17)

### 📚 Documentation

- **itch:** update profile copy for v1.0.1 hotfix ([d25a765](https://github.com/cblevins/streamslate/commit/d25a7652f0cf22d5c7190feff2c4fce63c135624))
- refresh loom context pack for ui/core hardening ([1361db1](https://github.com/cblevins/streamslate/commit/1361db1e040f72987c59d7c4cadb7df0fedcd6f4))

### 💄 Styles

- align pdf navigation controls with design tokens ([51a8077](https://github.com/cblevins/streamslate/commit/51a80779f084740f45f1c6707d8c4f67ac89b61b))
- format roadmap and cypress support ([486793e](https://github.com/cblevins/streamslate/commit/486793e6039d44fb36c31dfc48d1c3dd2f9a655a))

### ✅ Tests

- add remote workflow e2e and tauri ipc mock ([fe8d4bf](https://github.com/cblevins/streamslate/commit/fe8d4bfb08e2a1dd54a082f1ec55668abe4601d2))
- cover annotation move and resize ([d20fa52](https://github.com/cblevins/streamslate/commit/d20fa529e681f0ec1e382cd3fb5e4a4a64ac449f))
- force canvas mouse events in annotation e2e ([83ac41b](https://github.com/cblevins/streamslate/commit/83ac41bffb02e5b17f572153679a1056219f17f4))

### 🔧 Chores

- ignore cache dirs in prettier ([8fbd9e4](https://github.com/cblevins/streamslate/commit/8fbd9e42820b498167fe7430e6602c1efb8a247c))
- ignore local scratch docs in prettier ([8b47fe6](https://github.com/cblevins/streamslate/commit/8b47fe6e16d7b8e6852d431d750d99163c28c8ce))

### ✨ Features

- add template profiles and syphon output scaffolding ([70cc7b6](https://github.com/cblevins/streamslate/commit/70cc7b6693b5d81c5ae040791106b09de313c011))
- add undo/redo buttons to annotation toolbar ([518bb78](https://github.com/cblevins/streamslate/commit/518bb78abfd457f90f062811927bbe7402d1c0c8))
- annotation toolbar style controls ([5906a37](https://github.com/cblevins/streamslate/commit/5906a3723fdd5c9b7964389e9a9280b8dcf5dc9c))
- **annotations:** persist text backgrounds and stabilize edit ux ([3afdf12](https://github.com/cblevins/streamslate/commit/3afdf12082c95fdaf1f3e876dd15ed965e3452cf))
- apply websocket events to app state ([0d4013c](https://github.com/cblevins/streamslate/commit/0d4013c6d7df7f7c0fcf70eace3b936e24b619c5))
- clamp annotation toolbar using measured size ([bf76426](https://github.com/cblevins/streamslate/commit/bf7642677f10522adf643f3cb70a0dcc4c25d590))
- duplicate annotations via toolbar and shortcut ([0455219](https://github.com/cblevins/streamslate/commit/0455219c7bd80040d8f47507339baf8f91c12a15))
- expand integration event sync and annotation mapping ([e035bab](https://github.com/cblevins/streamslate/commit/e035bab7eae3cbb06bea496b1818ac1ee40ba139))
- harden websocket state and tighten shell UI ([73955e9](https://github.com/cblevins/streamslate/commit/73955e9b32fa419827b75213e05ce0b83aab7002))
- keyboard nudge and copy-resize modifiers ([221dc80](https://github.com/cblevins/streamslate/commit/221dc8037417847439f132be75513dcb7ab5aa94))
- persist annotation style and geometry ([ecd4354](https://github.com/cblevins/streamslate/commit/ecd4354a9681a53f0e9b23e0143e2d2df38b32a2))
- persist sidebar layout state and reload behavior ([9d4880e](https://github.com/cblevins/streamslate/commit/9d4880e74840177bb0307feb3df91c1928c6bca3))
- persist view mode preferences ([688085f](https://github.com/cblevins/streamslate/commit/688085fef81307e83d5e99f4f6aeeb9bb96a941e))
- surface remote websocket activity in status bar ([a2662a2](https://github.com/cblevins/streamslate/commit/a2662a2e9c1227e2b191a4737b4858a8e7fce9b7))
- **ui:** add annotation preset library in toolbar ([96d2558](https://github.com/cblevins/streamslate/commit/96d2558b608d66a8fc17d26afd59c0cd703f49c7))
- **ui:** add use-case annotation templates ([ccf98d0](https://github.com/cblevins/streamslate/commit/ccf98d0cc1162672c4af4f153fe1df586cba4140))
- undo and redo annotation edits ([efb1fbd](https://github.com/cblevins/streamslate/commit/efb1fbdc67592a126eba77f2231ef18c0764b183))

### 🐛 Bug Fixes

- accept legacy arrow key names for nudge ([f2160ed](https://github.com/cblevins/streamslate/commit/f2160edacee35db695614dbcc82df3b478dd07e9))
- collapse template controls to keep annotation canvas visible ([0edba76](https://github.com/cblevins/streamslate/commit/0edba765e038d0135c9b0f4303651e49d7da4a6f))
- **e2e:** harden annotation toolbar assertions in headless linux ([2155588](https://github.com/cblevins/streamslate/commit/21555889560cfc775dc5cd93aa91234ab6f476e0))
- hide annotation toolbar while dragging ([5df35d2](https://github.com/cblevins/streamslate/commit/5df35d2005c7d65c24002baa93a463edfb70a902))
- keep annotation toolbar clickable after selection ([ba8bd79](https://github.com/cblevins/streamslate/commit/ba8bd798f4e47072acee120c84c72229d3c14362))
- keep annotation toolbar visible but non-interactive during drags ([49c5296](https://github.com/cblevins/streamslate/commit/49c5296ea944d5ee927915b9e0de7557ff30d7f8))
- use unique arrowhead markers and selected color ([1efed1f](https://github.com/cblevins/streamslate/commit/1efed1f367fe45cf9700de76f051a04984dfcc98))

### 👷 CI/CD

- bump cache key to avoid old large cache ([0c5ab98](https://github.com/cblevins/streamslate/commit/0c5ab9876c08712de72d1c3fc0638cd69390fa17))
- harden release + harbor docker build ([e6a3eff](https://github.com/cblevins/streamslate/commit/e6a3effd16232e6068aac02b962560cca5d2897c))
- ignore cargo/npm caches in eslint ([d09687f](https://github.com/cblevins/streamslate/commit/d09687f1246816c985ec1eb8926700a9c5da63a6))
- reduce cache size and fix cargo cache paths ([ca9bdcd](https://github.com/cblevins/streamslate/commit/ca9bdcd4707efe8bbd2439d24e58f0e0b9735db6))
- scope linux package installs to required jobs ([8b36dd6](https://github.com/cblevins/streamslate/commit/8b36dd6e3f41de5541ca132781ff9d77576eebd8))
- shard linux cypress specs across parallel jobs ([7a8d719](https://github.com/cblevins/streamslate/commit/7a8d7194be53281369d3deb8122b755fe76e9183))
- split linux tests and tighten cache usage ([9ea2aa6](https://github.com/cblevins/streamslate/commit/9ea2aa6a804713905cc71d94cbd50a51d92027a7))
- start linux tests immediately with needs ([b9aab00](https://github.com/cblevins/streamslate/commit/b9aab00da26735d7b496669c1cd9cf4876f7dfe5))
- tolerate harbor build cache export failures ([cb4815d](https://github.com/cblevins/streamslate/commit/cb4815dc58e10f0d3fe97959a74274438af9df46))

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
