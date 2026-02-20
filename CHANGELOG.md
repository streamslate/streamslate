# Changelog

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.4.0](https://github.com/streamslate/streamslate/compare/streamslate-v1.3.0...streamslate-v1.4.0) (2026-02-20)


### Features

* add multi-monitor capture support ([60da989](https://github.com/streamslate/streamslate/commit/60da9896004069c6cbfc2529577c8ea6c5da5cc9)), closes [#9](https://github.com/streamslate/streamslate/issues/9)
* add settings export/import for cross-machine sync ([45947b6](https://github.com/streamslate/streamslate/commit/45947b64d1b2822439feabb1b355d0bd30599aed)), closes [#8](https://github.com/streamslate/streamslate/issues/8)
* add template profiles and syphon output scaffolding ([70cc7b6](https://github.com/streamslate/streamslate/commit/70cc7b6693b5d81c5ae040791106b09de313c011))
* add undo/redo buttons to annotation toolbar ([518bb78](https://github.com/streamslate/streamslate/commit/518bb78abfd457f90f062811927bbe7402d1c0c8))
* annotation toolbar style controls ([5906a37](https://github.com/streamslate/streamslate/commit/5906a3723fdd5c9b7964389e9a9280b8dcf5dc9c))
* **annotations:** Add text editor modal and smooth free-draw paths ([5dc41f5](https://github.com/streamslate/streamslate/commit/5dc41f56240da0cedc98afa62d6f495b4138e412))
* **annotations:** persist text backgrounds and stabilize edit ux ([3afdf12](https://github.com/streamslate/streamslate/commit/3afdf12082c95fdaf1f3e876dd15ed965e3452cf))
* apply websocket events to app state ([0d4013c](https://github.com/streamslate/streamslate/commit/0d4013c6d7df7f7c0fcf70eace3b936e24b619c5))
* **build:** add generated platform-specific icons for Tauri builds ([bf62ff5](https://github.com/streamslate/streamslate/commit/bf62ff5d43709b92e83425f03ea3ccba6e7f1366))
* **capture:** add frame tracking to IntegrationState ([b4e348b](https://github.com/streamslate/streamslate/commit/b4e348bfce25c1b09f64aca4d8aa82eac62b215a))
* **capture:** implement CVPixelBuffer data extraction ([3164cd0](https://github.com/streamslate/streamslate/commit/3164cd09ceede575b18dc10a1860185f91596200))
* **ci:** add Docker build and release workflows ([fb7658a](https://github.com/streamslate/streamslate/commit/fb7658ab274f78dba9a80de3d6d408a07a25df04))
* **ci:** add Docker support and pre-commit hooks ([8818354](https://github.com/streamslate/streamslate/commit/881835464cbf28c5a835f14add70c1683dabaa89))
* **ci:** add pre-commit hooks and Docker support ([457a3c6](https://github.com/streamslate/streamslate/commit/457a3c6f07588bc7c559a9d06aef798f825786af))
* **ci:** improve pre-push hook with Cypress auto-fix ([05f23d3](https://github.com/streamslate/streamslate/commit/05f23d3c6bbaeaf162d2dec0f20c493235a1ff8b))
* **ci:** update macOS release workflow for API key authentication ([2532dc4](https://github.com/streamslate/streamslate/commit/2532dc483bc65cefab981cbd6b157fa7c52c4f7f))
* **ci:** use self-hosted runner for Ubuntu builds ([11c0eb6](https://github.com/streamslate/streamslate/commit/11c0eb6ffd8ff6464737ed78c2ffc8adfaf997fc))
* clamp annotation toolbar using measured size ([bf76426](https://github.com/streamslate/streamslate/commit/bf7642677f10522adf643f3cb70a0dcc4c25d590))
* Complete backend implementation for feature-complete beta ([e534de8](https://github.com/streamslate/streamslate/commit/e534de81ed7bdc0e399abe376f659f3faf05a125))
* **config:** add macOS code signing configuration to tauri.conf.json ([36e4dda](https://github.com/streamslate/streamslate/commit/36e4dda1d28ba860759ba18713a5fa04c3358ade))
* **config:** configure macOS and Windows signing details ([092d978](https://github.com/streamslate/streamslate/commit/092d978ea5413fe98e7beb356cdbf70d3c737085))
* **DEBT-008:** migrate Tauri v1 to v2 ([354d609](https://github.com/streamslate/streamslate/commit/354d60924a158dac139da16c6d9f63e3fbd018dd))
* **DEBT-008:** migrate Tauri v1 to v2 ([566ca08](https://github.com/streamslate/streamslate/commit/566ca08eb9fa1496faa3798f7294bdc4ef9c55f3))
* duplicate annotations via toolbar and shortcut ([0455219](https://github.com/streamslate/streamslate/commit/0455219c7bd80040d8f47507339baf8f91c12a15))
* expand integration event sync and annotation mapping ([e035bab](https://github.com/streamslate/streamslate/commit/e035bab7eae3cbb06bea496b1818ac1ee40ba139))
* harden websocket state and tighten shell UI ([73955e9](https://github.com/streamslate/streamslate/commit/73955e9b32fa419827b75213e05ce0b83aab7002))
* Implement GitLab CI/CD for macOS builds, code signing, and release preparation. ([4b30cdb](https://github.com/streamslate/streamslate/commit/4b30cdbb4ffe002cff45c3670c397b02efeaa13f))
* implement live collaboration and stream deck integration ([bbc8614](https://github.com/streamslate/streamslate/commit/bbc861473f3563e3b8661c22207d4205cc78854e))
* Implement native screen capture and NDI output with new Tauri commands and modules. ([b8cb848](https://github.com/streamslate/streamslate/commit/b8cb8482f882be7d29a215dcf82642db8f2af744))
* implement NDI/Syphon remote control prototype and fix formatting ([afe2fe5](https://github.com/streamslate/streamslate/commit/afe2fe599ef2bbf8a7a8d8859b4097174fcb500a))
* implement PDF export with burned-in annotations ([020a009](https://github.com/streamslate/streamslate/commit/020a009f22db6a2271addc1fba390ef337bb43d7))
* Implement WebSocket support for Presenter view and mark OBS browser source as complete. ([7382a45](https://github.com/streamslate/streamslate/commit/7382a4503eb642329a59f203d11f811266cec7dd))
* initialize project structure and core dependencies ([14ebdb5](https://github.com/streamslate/streamslate/commit/14ebdb572f8c373a72127b565a23e24f2e9fabd5))
* Introduce linting stage and job, rename release to deploy, and refactor test job setup. ([37f6a6d](https://github.com/streamslate/streamslate/commit/37f6a6d84695ad2f6dd9fc039425b30dd18aa53d))
* keyboard nudge and copy-resize modifiers ([221dc80](https://github.com/streamslate/streamslate/commit/221dc8037417847439f132be75513dcb7ab5aa94))
* **pdf:** enhance PDF viewer with dark mode and improved rendering ([23e280b](https://github.com/streamslate/streamslate/commit/23e280b1070c50a8cb23bced207562f19e2084f6))
* **pdf:** implement PDF viewer with annotation capabilities ([31eb5db](https://github.com/streamslate/streamslate/commit/31eb5dba16aa4e1fefbc76ab5deb59320df52981))
* **pdf:** implement proper arrowhead math in PDF export ([9396b07](https://github.com/streamslate/streamslate/commit/9396b075076323765e9071ae6701e937c82fa11c))
* persist annotation style and geometry ([ecd4354](https://github.com/streamslate/streamslate/commit/ecd4354a9681a53f0e9b23e0143e2d2df38b32a2))
* persist sidebar layout state and reload behavior ([9d4880e](https://github.com/streamslate/streamslate/commit/9d4880e74840177bb0307feb3df91c1928c6bca3))
* persist view mode preferences ([688085f](https://github.com/streamslate/streamslate/commit/688085fef81307e83d5e99f4f6aeeb9bb96a941e))
* **setup:** optimize setup.sh for container/CI environments and improve Node/Rust installation ([5d6c55a](https://github.com/streamslate/streamslate/commit/5d6c55a74c20cb0b6784b25b5e9ec366794bde9b))
* surface remote websocket activity in status bar ([a2662a2](https://github.com/streamslate/streamslate/commit/a2662a2e9c1227e2b191a4737b4858a8e7fce9b7))
* **ui:** add annotation preset library in toolbar ([96d2558](https://github.com/streamslate/streamslate/commit/96d2558b608d66a8fc17d26afd59c0cd703f49c7))
* **ui:** Add annotation sidebar panel with full management capabilities ([d81a666](https://github.com/streamslate/streamslate/commit/d81a6661ba3f8f8fa7e5044b1b0259d568d2c79b))
* **ui:** add use-case annotation templates ([ccf98d0](https://github.com/streamslate/streamslate/commit/ccf98d0cc1162672c4af4f153fe1df586cba4140))
* **ui:** complete UI overhaul with modern design system ([d2b701a](https://github.com/streamslate/streamslate/commit/d2b701ad3bbecdf745c06382822e26caeb6436df))
* **ui:** enhance PDF viewer and sidebar with improved styling and animations ([3547495](https://github.com/streamslate/streamslate/commit/35474959fe6b18d88742f58f7b8986896eecb882))
* **ui:** implement PDF dark mode support ([6670ee1](https://github.com/streamslate/streamslate/commit/6670ee16964378ce0e9675a4f56d057cc6d53b79))
* **ui:** implement PDF fit modes and enhance dark mode ([2b7f93b](https://github.com/streamslate/streamslate/commit/2b7f93bc2fe6ed3d03ae8923a441558d0df0a966))
* **ui:** improve PDF rendering and WebView compatibility ([9f4b6af](https://github.com/streamslate/streamslate/commit/9f4b6af2b97019bd44376975c308c5e7d56bfb82))
* **ui:** integrate PDF opening functionality and dark mode for viewer ([bdbd6c9](https://github.com/streamslate/streamslate/commit/bdbd6c912f50e2a3abafca40f6bc4342abd9e76d))
* **ui:** migrate to Tailwind CSS color variables ([4613a4d](https://github.com/streamslate/streamslate/commit/4613a4d9b6efc94292ba9420b158d315ba17c853))
* **ui:** refactor app layout and introduce new components ([0c912a0](https://github.com/streamslate/streamslate/commit/0c912a04fda047c11ec66dde629c0213cab1d291))
* undo and redo annotation edits ([efb1fbd](https://github.com/streamslate/streamslate/commit/efb1fbdc67592a126eba77f2231ef18c0764b183))
* **updater:** add Tauri auto-update support ([842173c](https://github.com/streamslate/streamslate/commit/842173c43e5d62a6d057a4860ee7c40169e47618))
* wire NDI output and add Syphon Metal bridge ([c912aaa](https://github.com/streamslate/streamslate/commit/c912aaa834441f9fab29efd45d40a425301058bc))
* wire NDI output and add Syphon Metal bridge ([7d2a53d](https://github.com/streamslate/streamslate/commit/7d2a53d5d881e4d4a3a82282c5bda19c001abb03))
* wire Tauri auto-update signing into CI and release pipeline ([a2dd5be](https://github.com/streamslate/streamslate/commit/a2dd5be049a1d67730ad816885a46debe9a768e1)), closes [#4](https://github.com/streamslate/streamslate/issues/4)


### Bug Fixes

* accept legacy arrow key names for nudge ([f2160ed](https://github.com/streamslate/streamslate/commit/f2160edacee35db695614dbcc82df3b478dd07e9))
* apt error ([aeba080](https://github.com/streamslate/streamslate/commit/aeba08087b1e27dfe3d0f129a7fbee87b374b3c2))
* **backend:** replace unsafe .unwrap() on Mutex locks with proper error handling [DEBT-004] ([68cc19c](https://github.com/streamslate/streamslate/commit/68cc19c5305ea7a3698ffbcb5a9088af01830f7a))
* **bundle:** enable createUpdaterArtifacts for complete release uploads ([8c4a8ed](https://github.com/streamslate/streamslate/commit/8c4a8edbf666a47ad4601cb570cb8418102ecdce))
* **ci:** add clippy component ([13cd6e7](https://github.com/streamslate/streamslate/commit/13cd6e70061930bfab1091144550a90224ef9ffc))
* **ci:** add library symlinks for webkit/jscore 4.0 compat ([945c865](https://github.com/streamslate/streamslate/commit/945c8655527edb026f7d4fb5cb0710f3b1e5f5d5))
* **ci:** add libsoup2.4-dev dependency ([0df5323](https://github.com/streamslate/streamslate/commit/0df53233fd1534bef20e3e6348655c921c2c637e))
* **ci:** add Tauri IPC mock for Cypress browser-only testing ([aa63823](https://github.com/streamslate/streamslate/commit/aa63823a267708772e28b3fafd08e17f6dc1b723))
* **ci:** add webkit/jscore 4.1 and pkg-config symlinks for 4.0 compat ([1ccadf2](https://github.com/streamslate/streamslate/commit/1ccadf209b4b5c796e7410fe4629dd4c77194e85))
* **ci:** clean YAML formatting and remove --all-features ([0cf8815](https://github.com/streamslate/streamslate/commit/0cf8815ad88907351e02f20cbc0db2697db67c31))
* **ci:** fix GitLab CI YAML script block validation error ([70bade9](https://github.com/streamslate/streamslate/commit/70bade9051743dbc60c88e12cf16d5815360032f))
* **ci:** fix swift link error and requirements format ([8fbdfdc](https://github.com/streamslate/streamslate/commit/8fbdfdc09ee9b7b68554e6797cd49c7a96a2fd22))
* **ci:** fix xargs comment parsing and decouple macOS build from Linux stages ([abd61fc](https://github.com/streamslate/streamslate/commit/abd61fcf7bb48e01a90aa98bedc65cfe9e33001e))
* **ci:** Improve GitLab CI/CD configuration and documentation ([8b9d9ac](https://github.com/streamslate/streamslate/commit/8b9d9ac7534605e560a7a4be0510f1136ca35737))
* **ci:** install rustfmt component ([4523d03](https://github.com/streamslate/streamslate/commit/4523d0372225b036a764f0e9cf8bd427875e607b))
* **ci:** make Cypress E2E tests optional if dev server fails ([8870650](https://github.com/streamslate/streamslate/commit/88706508990a727824a8b6a0f8945810898ef019))
* **ci:** make screen capture conditional on macOS ([033ef1b](https://github.com/streamslate/streamslate/commit/033ef1b108b87e91942b669c429581d296425890))
* **ci:** prevent codesign keychain password prompt on macOS runner ([234f63e](https://github.com/streamslate/streamslate/commit/234f63e8a05ada4c9143d3e9ba53f9d44477a6ef))
* **ci:** quote values in build.env to handle parentheses in signing identity ([9c71cb0](https://github.com/streamslate/streamslate/commit/9c71cb0912dc14bf6fd438c9defbd71331b7f22d))
* **ci:** remove default-keychain override that breaks gitlab-runner ([b0674fe](https://github.com/streamslate/streamslate/commit/b0674fe80c576d35b1bbccc272801cac11fb2a9b))
* **ci:** resolve Docker, GitHub CI, and GitLab CI failures ([9de1c59](https://github.com/streamslate/streamslate/commit/9de1c590396e978365ac2b283659b7690523ab8d))
* **ci:** single-build multi-tag push, remove destructive npm cache clean ([0b4b326](https://github.com/streamslate/streamslate/commit/0b4b3267325b0ec4944e56736647b933448f0160))
* **ci:** skip Cypress tests when dev server is not running ([440608b](https://github.com/streamslate/streamslate/commit/440608bb9267ef0b7c967fc8b5646dcf355d6893))
* **ci:** upgrade webkitgtk to 4.1 and add Makefile ([dcc7698](https://github.com/streamslate/streamslate/commit/dcc7698654aa6eade01156380b3091dec3d2beab))
* **ci:** use fetch-depth 0 to fix tag validation in release workflow ([b34dbb4](https://github.com/streamslate/streamslate/commit/b34dbb4d4221604431fd72bab73082716cd7f3f8))
* **ci:** use webkit2gtk 4.1 packages for Debian 13 (Trixie) compatibility ([e750f54](https://github.com/streamslate/streamslate/commit/e750f54639dd7102bf05731ea50d11e0688503b1))
* collapse template controls to keep annotation canvas visible ([0edba76](https://github.com/streamslate/streamslate/commit/0edba765e038d0135c9b0f4303651e49d7da4a6f))
* Core build deps + the WebKit 4.0 dev package that *does* exist ([76c867f](https://github.com/streamslate/streamslate/commit/76c867fa88aae94b1dc392ff4e6dd8846271e42f))
* **deps:** regenerate package-lock.json for npm ci compatibility ([56e2fc5](https://github.com/streamslate/streamslate/commit/56e2fc5942d1cc90d80f49f75743cb4be6f732ab))
* **docker:** add missing index.html and fix cache mount binary copy ([6992689](https://github.com/streamslate/streamslate/commit/6992689c28dd945687e90c1682d92e65905b4111))
* **docker:** create dummy main.rs for cargo fetch manifest parsing ([aed63d8](https://github.com/streamslate/streamslate/commit/aed63d85a4fddd13e53ef5df9448118ff36b6a97))
* **docker:** update Dockerfile for Tauri v2 deps ([772f879](https://github.com/streamslate/streamslate/commit/772f879a03bff2dddad31d6b7b11660a9e1ce8ae))
* **e2e:** harden annotation toolbar assertions in headless linux ([2155588](https://github.com/streamslate/streamslate/commit/21555889560cfc775dc5cd93aa91234ab6f476e0))
* **gitlab:** fix cd persistence between script lines in lint job ([2b87805](https://github.com/streamslate/streamslate/commit/2b8780571acba33587c2ed247d1b1dc2bda3cc28))
* **gitlab:** override buildkit image entrypoint for CI shell access ([8922531](https://github.com/streamslate/streamslate/commit/8922531c9f8f151a2f0ab3f7ad36da7835dcb6d1))
* guard displayTargets against null in non-Tauri environments ([c956803](https://github.com/streamslate/streamslate/commit/c9568032fab5b45417df39b3b553f77b062f9565))
* hide annotation toolbar while dragging ([5df35d2](https://github.com/streamslate/streamslate/commit/5df35d2005c7d65c24002baa93a463edfb70a902))
* install newer WebKit if stock repo is too old ([2c2b5db](https://github.com/streamslate/streamslate/commit/2c2b5dbaab294136d9c1b19475f8b6b9647edb45))
* keep annotation toolbar clickable after selection ([ba8bd79](https://github.com/streamslate/streamslate/commit/ba8bd798f4e47072acee120c84c72229d3c14362))
* keep annotation toolbar visible but non-interactive during drags ([49c5296](https://github.com/streamslate/streamslate/commit/49c5296ea944d5ee927915b9e0de7557ff30d7f8))
* **linux:** correct WebKit GTK deps and Dockerfile for Tauri v1.x ([da93186](https://github.com/streamslate/streamslate/commit/da93186e3915bc78e1eb093ec606100916e2369a))
* prefix unused display_id param in non-macOS stub ([4f228bc](https://github.com/streamslate/streamslate/commit/4f228bc6791e8905eec11ed50bf1ea9b4c1af893))
* **release:** add Apple API key file setup for notarization ([7af7f5c](https://github.com/streamslate/streamslate/commit/7af7f5c66e80499d7ca1d46b56443524a80667f7))
* **release:** correct cargo version check in preflight ([506917a](https://github.com/streamslate/streamslate/commit/506917aa718552a56061d837dc69d7da631bc7a7))
* **release:** ship v1.0.1 startup hotfix ([92990a8](https://github.com/streamslate/streamslate/commit/92990a8e990d57af0bfdf1b57ebde77dbe9e0fe1))
* Removed libappindicator3-dev from both functions - Ubuntu Noble uses libayatana-appindicator3-dev exclusively Removed the fallback logic (|| sudo apt-get install -y libappindicator3-dev) since it causes conflicts  The script now only installs the Ayatana version of the appindicator library, which is the correct one for Ubuntu 24.04 (Noble). ([a270d58](https://github.com/streamslate/streamslate/commit/a270d58e699f4c2608aede9c74304b28a25a809d))
* resolve all ESLint errors and warnings for CI ([eb3c199](https://github.com/streamslate/streamslate/commit/eb3c199f26f93e3a8f7657b5a1e6b7131953709f))
* restore updater config and fix release-please jsonpath for Tauri v2 ([c0bded5](https://github.com/streamslate/streamslate/commit/c0bded558291eaca433e42d7306583a4a81a4c27))
* **signing:** fix macOS code signing and notarization across all CI environments ([248f834](https://github.com/streamslate/streamslate/commit/248f834ef031820dc55759e7424a6b19fe0d6950))
* **test:** update Cypress E2E tests to match current UI labels ([0178957](https://github.com/streamslate/streamslate/commit/0178957c29c7ec8789ad708b4a4c785641c60b78))
* **test:** use class assertion for sidebar toggle visibility ([1d519a5](https://github.com/streamslate/streamslate/commit/1d519a5692705b806cc7a9f22468248dab9dc39b))
* The backslash with an inline comment creates a malformed command. I removed the comment from that line. Also moved the install_webkit_linux call to the proper place in main(). What Changed  Line 118: Removed inline comment after backslash continuation Line 148: Moved the webkit install call into main() function where it belongs Line order: The webkit install now happens after install_sys_packages but before Node/Rust installation  The script should now run without the "Unable to locate package" error. ([c78b7a9](https://github.com/streamslate/streamslate/commit/c78b7a9fdd9d84c559226291d20a4961fa8f1de5))
* The fix removes libwebkit2gtk-4.0-dev from the initial package installation since it doesn't exist on Ubuntu Noble. The install_webkit_linux() function already handles installing the correct webkit version (4.1) for the distro ([8f01a29](https://github.com/streamslate/streamslate/commit/8f01a2928cd4eda052d4edf1d0f1efc7213c96dd))
* update Cypress config for macOS compatibility ([87d4e0d](https://github.com/streamslate/streamslate/commit/87d4e0d5ebb6a5e5417c747bcae6eac921a21159))
* **updater:** align pubkey with TAURI_SIGNING_PRIVATE_KEY secret ([2ddfd44](https://github.com/streamslate/streamslate/commit/2ddfd442b8812ff02963a4a64f671e85f9e83cef))
* **updater:** regenerate Tauri updater signing key pair ([36a8e88](https://github.com/streamslate/streamslate/commit/36a8e88e79e803b327a49b2c849cab1c34534189))
* use correct Tauri v1 env var names and regenerate signing keypair ([8f720e0](https://github.com/streamslate/streamslate/commit/8f720e04a5de8732fdecda3d6d76a8e5650fbb9a))
* use unique arrowhead markers and selected color ([1efed1f](https://github.com/streamslate/streamslate/commit/1efed1f367fe45cf9700de76f051a04984dfcc98))


### Code Refactoring

* **backend:** migrate read-heavy state fields from Mutex to RwLock [DEBT-005] ([7535181](https://github.com/streamslate/streamslate/commit/75351816c1f05df9d3bb20b23307d94d180cd828))
* **backend:** replace Mutex&lt;Option&lt;&gt;&gt; with OnceLock for broadcast_sender [DEBT-010] ([ffdd2be](https://github.com/streamslate/streamslate/commit/ffdd2beb4c2aa32ffece7612005ba9ee472a748d))
* **DEBT-001,DEBT-011:** decompose AnnotationLayer and AnnotationTools ([0d90ade](https://github.com/streamslate/streamslate/commit/0d90adea3e4c47b9fd1879cdf4acbfd02ddaabe1))
* **DEBT-009:** extract typed event dispatcher from integration store ([2222ac9](https://github.com/streamslate/streamslate/commit/2222ac9f6e1696c1040144214a9b028cd04fbc89))
* **frontend:** replace 55 console.log calls with structured logger [DEBT-003] ([354af56](https://github.com/streamslate/streamslate/commit/354af5678b4b7f1756526fca0bc7e72f7e51174e))


### Documentation

* add macOS code signing setup guide ([36e4dda](https://github.com/streamslate/streamslate/commit/36e4dda1d28ba860759ba18713a5fa04c3358ade))
* document fix for macOS notarization hanging ([c39f0a3](https://github.com/streamslate/streamslate/commit/c39f0a3257276eeb2e6c5c1ea8996b4c54f16bde))
* **itch:** update profile copy for v1.0.1 hotfix ([d25a765](https://github.com/streamslate/streamslate/commit/d25a7652f0cf22d5c7190feff2c4fce63c135624))
* mark cloud sync for settings as complete in roadmap ([b72dab3](https://github.com/streamslate/streamslate/commit/b72dab37ebaa8563b0f628450818a3466605dd3c))
* mark Post-1.1 phase complete and close shipped issues ([45c7bad](https://github.com/streamslate/streamslate/commit/45c7bad63116fd6107c4a9545452eaf058570344))
* reconcile roadmap and README with v1.1.x shipped state ([7e1856b](https://github.com/streamslate/streamslate/commit/7e1856b3c959e1ada218e6c6d0629e0dda2d6850))
* refresh loom context pack for ui/core hardening ([1361db1](https://github.com/streamslate/streamslate/commit/1361db1e040f72987c59d7c4cadb7df0fedcd6f4))
* **release:** add itch.io v1.0 profile pack ([29c7c87](https://github.com/streamslate/streamslate/commit/29c7c87ffae0698e6ec8eabb11f60259f7993486))
* standardize agents.md, roadmap.md and add hero banner ([aa66399](https://github.com/streamslate/streamslate/commit/aa66399169212c0cf28e80d84ceced672f0ba562))


### Styles

* align pdf navigation controls with design tokens ([51a8077](https://github.com/streamslate/streamslate/commit/51a80779f084740f45f1c6707d8c4f67ac89b61b))
* format roadmap and cypress support ([486793e](https://github.com/streamslate/streamslate/commit/486793e6039d44fb36c31dfc48d1c3dd2f9a655a))


### Tests

* Add git-tunes-test.txt containing git commit history. ([c5e6af3](https://github.com/streamslate/streamslate/commit/c5e6af3e3164a645a787fee4d3a788f60016b84a))
* add remote workflow e2e and tauri ipc mock ([fe8d4bf](https://github.com/streamslate/streamslate/commit/fe8d4bfb08e2a1dd54a082f1ec55668abe4601d2))
* cover annotation move and resize ([d20fa52](https://github.com/streamslate/streamslate/commit/d20fa529e681f0ec1e382cd3fb5e4a4a64ac449f))
* expand Cypress E2E test coverage ([3d9201f](https://github.com/streamslate/streamslate/commit/3d9201fb7193c156c77be9fbc99648fd8b3c2654))
* force canvas mouse events in annotation e2e ([83ac41b](https://github.com/streamslate/streamslate/commit/83ac41bffb02e5b17f572153679a1056219f17f4))
* **frontend:** add Vitest unit test infrastructure with 86 initial tests [DEBT-002] ([7ed5090](https://github.com/streamslate/streamslate/commit/7ed5090676919583befdaac6e9266f55d4f781cd))
* update Cypress tests for current StreamSlate UI ([ab95237](https://github.com/streamslate/streamslate/commit/ab95237bead18a6a26566fb64e2c69839e3e9229))


### Build System

* add libsoup2.4-dev to ubuntu build requirements ([3d4e5a8](https://github.com/streamslate/streamslate/commit/3d4e5a8bd3d185a55008a8e4343eee8fe4aefea2))
* adjust npm dependency installation in Dockerfile ([5cd1e6d](https://github.com/streamslate/streamslate/commit/5cd1e6dcf6618c3c5d7510b55bca38164ffa94eb))
* consolidate Linux build dependencies into requirement files ([bb0a39b](https://github.com/streamslate/streamslate/commit/bb0a39b2fd1bb4a8720229c1a82efd2eb8f72643))
* **deps:** add libjavascriptcoregtk-4.0-dev to ubuntu build requirements ([93a0c80](https://github.com/streamslate/streamslate/commit/93a0c8031bc761e22ed1114a030788fc26bfa30e))
* **deps:** update package-lock.json ([73d0adc](https://github.com/streamslate/streamslate/commit/73d0adc96436539b6aad7d49adcd66fab17d5a78))
* **docker:** add libssl-dev to Dockerfile ([3237a95](https://github.com/streamslate/streamslate/commit/3237a95adf23551d84bc7b05a1d39f5d8f657632))
* improve npm dependency installation in Dockerfile ([4fb0cd5](https://github.com/streamslate/streamslate/commit/4fb0cd543c1bb3a0beefd92da14c4bbb2228b1eb))
* replace deprecated standard-version with release-please [DEBT-007] ([26193e1](https://github.com/streamslate/streamslate/commit/26193e15981aa3d807edb8cd11622706e3e36315))


### CI/CD

* add notarization credential verification step for macOS ([683ff48](https://github.com/streamslate/streamslate/commit/683ff4864ada73ad27ab92d5e30fe6449e4b716d))
* add TAURI_PRIVATE_KEY to CI build step ([c227956](https://github.com/streamslate/streamslate/commit/c227956aca5afaefdfcb0e5b548e4065b4191198))
* allow publish-release to run even if docker-release fails ([806d08e](https://github.com/streamslate/streamslate/commit/806d08e623eaa7de371cea362da17a7438275661))
* bump cache key to avoid old large cache ([0c5ab98](https://github.com/streamslate/streamslate/commit/0c5ab9876c08712de72d1c3fc0638cd69390fa17))
* **gitlab:** add npm retry config and job retry for flaky K8s network ([650f80d](https://github.com/streamslate/streamslate/commit/650f80d32a15e4c6d921c6d8319e612a3a9cf0c2))
* **gitlab:** switch docker:build to BuildKit + Harbor registry ([9d6c5a2](https://github.com/streamslate/streamslate/commit/9d6c5a224cd53ad9f9125fb5523be7053ce72d7f))
* **gitlab:** unblock docker:build from macOS build stage ([c838b64](https://github.com/streamslate/streamslate/commit/c838b64c76a2f6f73f3346c888ee44feb1ba7d3c))
* harden release + harbor docker build ([e6a3eff](https://github.com/streamslate/streamslate/commit/e6a3effd16232e6068aac02b962560cca5d2897c))
* ignore cargo/npm caches in eslint ([d09687f](https://github.com/streamslate/streamslate/commit/d09687f1246816c985ec1eb8926700a9c5da63a6))
* limit Docker build to amd64-only in CI workflow ([e8187cf](https://github.com/streamslate/streamslate/commit/e8187cf1a3058dda8279d5dd4b24747ccc6e892d))
* normalize Windows MSI version in CI workflow ([f95f3f7](https://github.com/streamslate/streamslate/commit/f95f3f7521394a473240b730e5516d895dadb096))
* reduce cache size and fix cargo cache paths ([ca9bdcd](https://github.com/streamslate/streamslate/commit/ca9bdcd4707efe8bbd2439d24e58f0e0b9735db6))
* **release:** add macOS code signing secrets to release workflow ([36e4dda](https://github.com/streamslate/streamslate/commit/36e4dda1d28ba860759ba18713a5fa04c3358ade))
* **release:** configure macOS certificate import and keychain setup ([846828e](https://github.com/streamslate/streamslate/commit/846828e4d3e4c0b58f301c741498fb56ef5a2f37))
* **release:** configure macOS signing and fix Tauri build issues ([3beacf3](https://github.com/streamslate/streamslate/commit/3beacf3dc8e7b965994cf39c56d3b637f1a818fa))
* **release:** enhance release workflow with tag validation and logging ([94007dc](https://github.com/streamslate/streamslate/commit/94007dc227604446ec2ddf9e5d33f322b52c06cd))
* **release:** remove macOS certificate import from release workflow ([abbbabd](https://github.com/streamslate/streamslate/commit/abbbabde30d281c6f6a1edfae964700b2dfa2621))
* remove diagnostic notarization verification step ([f960d46](https://github.com/streamslate/streamslate/commit/f960d4600761724e159129d075e4045f52a85d98))
* retry buildkit connection failures ([9eee5e0](https://github.com/streamslate/streamslate/commit/9eee5e05ca2cb8d89d55e7210f88d88788a9c76c))
* scope linux package installs to required jobs ([8b36dd6](https://github.com/streamslate/streamslate/commit/8b36dd6e3f41de5541ca132781ff9d77576eebd8))
* set APPLE_SIGNING_IDENTITY in release workflow ([004c532](https://github.com/streamslate/streamslate/commit/004c5328624a5562fe638d7f41d6b8ce304d3f40))
* shard linux cypress specs across parallel jobs ([7a8d719](https://github.com/streamslate/streamslate/commit/7a8d7194be53281369d3deb8122b755fe76e9183))
* split linux tests and tighten cache usage ([9ea2aa6](https://github.com/streamslate/streamslate/commit/9ea2aa6a804713905cc71d94cbd50a51d92027a7))
* start linux tests immediately with needs ([b9aab00](https://github.com/streamslate/streamslate/commit/b9aab00da26735d7b496669c1cd9cf4876f7dfe5))
* tolerate harbor build cache export failures ([cb4815d](https://github.com/streamslate/streamslate/commit/cb4815dc58e10f0d3fe97959a74274438af9df46))
* upgrade Node.js from 18 (EOL) to 20 LTS in CI and release workflows [DEBT-006] ([da4494a](https://github.com/streamslate/streamslate/commit/da4494ac8cd29863c779e15cf39f2f04996d746d))
* **workflows:** add Xcode command line tools installation for macOS CI ([4a66874](https://github.com/streamslate/streamslate/commit/4a66874cc89bd91708ac18dfbed73887e967a744))
* **workflows:** adjust Docker build conditions for PRs ([0ef46a1](https://github.com/streamslate/streamslate/commit/0ef46a140f06f3583d06b138f9dfd5b5126916ba))
* **workflows:** adjust macOS runner and clippy execution order ([4b25e51](https://github.com/streamslate/streamslate/commit/4b25e51d2c6c32115bc76f8fce62744062d56804))
* **workflows:** enhance CI setup for build dependencies and macOS ([1ba2875](https://github.com/streamslate/streamslate/commit/1ba2875180451aac575ebec94d169277a8877d8e))
* **workflows:** ignore comments and empty lines in ubuntu build requirements ([5efbd5e](https://github.com/streamslate/streamslate/commit/5efbd5ed8da9c2b3a1133953d52b4ceff8368636))
* **workflows:** improve dev server readiness and Vite build target ([701b2ac](https://github.com/streamslate/streamslate/commit/701b2aca31579e26756f219669b1a693081711c7))
* **workflows:** improve dev server readiness check ([b964f14](https://github.com/streamslate/streamslate/commit/b964f1478fcab097772d9f5cb2f990f1bad65722))
* **workflows:** improve dev server readiness check ([1dda8d1](https://github.com/streamslate/streamslate/commit/1dda8d197735291916880bfe58238740d261c7c1))
* **workflows:** improve Docker build and push logic ([9fa70ef](https://github.com/streamslate/streamslate/commit/9fa70efd8ccb13956855c627a015ae1357a637f1))
* **workflows:** improve frontend dependency installation ([c955c50](https://github.com/streamslate/streamslate/commit/c955c501f21b20a2c5a5ae4618b6b36f5262c3f8))
* **workflows:** improve macOS signing and Docker build stability ([41c7743](https://github.com/streamslate/streamslate/commit/41c7743ef3c9ee78947b045e077a44f4c6dcfb4d))
* **workflows:** improve npm dependency handling for native modules ([6503323](https://github.com/streamslate/streamslate/commit/6503323a9af1db5b7433bd91c02f9935c1262de1))
* **workflows:** install build and dev requirements for Ubuntu ([793667a](https://github.com/streamslate/streamslate/commit/793667ae443a9673ceb0327ce171efa3c66a6e7b))
* **workflows:** install build-essential for Ubuntu CI ([463976e](https://github.com/streamslate/streamslate/commit/463976e883df2bec22efd50dccffad5050999728))
* **workflows:** install VS Build Tools on Windows ([a1eb009](https://github.com/streamslate/streamslate/commit/a1eb009a93514d4377d6f8276cce9e6c09450ef3))
* **workflows:** remove unnecessary Tauri config argument ([0de61c8](https://github.com/streamslate/streamslate/commit/0de61c8b80fe75b8718718423b498be8e5862870))
* **workflows:** specify bash shell for frontend tests ([5aa2093](https://github.com/streamslate/streamslate/commit/5aa2093598fd902d6768dcce5a1697ae1e1dcd2d))
* **workflows:** update CI to run frontend tests against dev server ([4804db0](https://github.com/streamslate/streamslate/commit/4804db02970b31bf61a694219390bf4cd17604aa))
* **workflows:** update macOS runner and Ubuntu build requirements ([47b4458](https://github.com/streamslate/streamslate/commit/47b44581d42b0caa300fa58c361f86ca5bda68f1))
* **workflows:** update macOS runner and Ubuntu dev dependencies ([f2eed23](https://github.com/streamslate/streamslate/commit/f2eed23546521a3f263cba60111a74c8806a0b32))
* **workflows:** update release workflow for Tauri action and Ubuntu version ([ef276b3](https://github.com/streamslate/streamslate/commit/ef276b3e178bfef40e3ad27f512a1cdafa9a5529))
* **workflows:** update Ubuntu version and Tauri action ([c6b7846](https://github.com/streamslate/streamslate/commit/c6b78462618687fc6f51575d46a083cdab8c1c5e))
* **workflows:** update Windows build tools installation ([bf916e6](https://github.com/streamslate/streamslate/commit/bf916e6197a55ce60e3530379e6bacb7bb6ee106))
* **workflows:** use self-hosted macOS ARM64 runner ([8ac6b60](https://github.com/streamslate/streamslate/commit/8ac6b60ab12912d5fd80039842bb918132d4c465))
* **workflows:** use self-hosted macOS runner ([ec56c0e](https://github.com/streamslate/streamslate/commit/ec56c0e8a25d2889e629a9edaef95f43f67516b7))


### Miscellaneous

* Add CA certificate updates to GitLab CI and create git-tunes-test.txt. ([6702200](https://github.com/streamslate/streamslate/commit/67022001da9a4642bcb7c84063d4473375f4b1f2))
* add certs/Cody_Blevins.p12 to .gitignore ([36e4dda](https://github.com/streamslate/streamslate/commit/36e4dda1d28ba860759ba18713a5fa04c3358ade))
* add generated icon ([eedfd3b](https://github.com/streamslate/streamslate/commit/eedfd3bac0e35857588b8d47d99172f13dc6a252))
* Add shebang to pre-commit hook. ([c5d6cc7](https://github.com/streamslate/streamslate/commit/c5d6cc72d90fabc88de9f4922f7a0af01dedcff8))
* **branding:** refresh repo assets ([ea2ce72](https://github.com/streamslate/streamslate/commit/ea2ce721b7532a12550abb33fe81daa08c5a6344))
* **build:** normalize Windows MSI version for releases ([0292624](https://github.com/streamslate/streamslate/commit/02926248807a75928e32495cab256311dcf2b6ac))
* **build:** optimize Dockerfile and ignore Cargo.lock ([bb15fe2](https://github.com/streamslate/streamslate/commit/bb15fe2cf96859ec8d4f700d1c686e8b2cbe005e))
* **build:** update Dockerfile and version for release ([92e8288](https://github.com/streamslate/streamslate/commit/92e828873844a6ce22e4de3fc9e47f6e319d8cb7))
* **build:** update Dockerfile and version for release ([0114a8d](https://github.com/streamslate/streamslate/commit/0114a8de48848473cec3aa91f7293359bb5103ca))
* bump version to 0.0.2-beta.10 ([b7a5d2c](https://github.com/streamslate/streamslate/commit/b7a5d2c059d61b71be2f21015cfea7084a510065))
* bump version to 0.0.2-beta.6 ([29215df](https://github.com/streamslate/streamslate/commit/29215df76978040ea5a96d97f9b5870cab472405))
* bump version to 0.0.2-beta.7 ([eceaf4f](https://github.com/streamslate/streamslate/commit/eceaf4fce48407ecf8be315116d0738725476df4))
* bump version to 0.0.2-beta.8 ([cb3b365](https://github.com/streamslate/streamslate/commit/cb3b365023065d0c771860b90ae962b488478e45))
* bump version to 0.0.2-beta.9 ([838ff6c](https://github.com/streamslate/streamslate/commit/838ff6ce90f5538dfc194971c61f9fea409a3542))
* **ci:** create dist directory for Rust tests ([7030e90](https://github.com/streamslate/streamslate/commit/7030e90d1352f869ed6545f4b4a643a73c294960))
* **ci:** enable debug logging for macOS build to diagnose notarization ([2e1731d](https://github.com/streamslate/streamslate/commit/2e1731d8192b530dc4efbf5f22ec36e9bb912daa))
* **config:** add app icons to tauri.conf.json ([76c0ac0](https://github.com/streamslate/streamslate/commit/76c0ac0644e19dfb153162643af673530d1e2eb1))
* **deps:** add standard-version for release automation ([374cfef](https://github.com/streamslate/streamslate/commit/374cfef9684e9bdfac3a43e6ef774507c23c8857))
* **deps:** update lint-staged to v15.2.10 ([33012da](https://github.com/streamslate/streamslate/commit/33012da9d156df279baf8b3fe09da140bcaa9a03))
* **deps:** update rust version in Dockerfile ([0c9a3e6](https://github.com/streamslate/streamslate/commit/0c9a3e60c7a6c406de70316e00cf9df3c09883a1))
* **deps:** update ubuntu build requirements and error formatting ([3c3382b](https://github.com/streamslate/streamslate/commit/3c3382b01502c1bfef386449ef07c62b59715db4))
* **docker:** add npm ci fallback for dependency installation ([e18e62d](https://github.com/streamslate/streamslate/commit/e18e62d23cc9e8a617ef23aab9aee7b2598b2191))
* **husky:** relax commit subject length limit ([e287b84](https://github.com/streamslate/streamslate/commit/e287b84deabf4b6008245663417acd87577e338c))
* **husky:** relax commit subject length limit ([4c3659a](https://github.com/streamslate/streamslate/commit/4c3659afb3e03ddc0749dae71f4096d23838a274))
* **husky:** remove redundant husky setup from scripts ([363e4e2](https://github.com/streamslate/streamslate/commit/363e4e2bbf705625c26f4ab22e9991a543f84d30))
* ignore cache dirs in prettier ([8fbd9e4](https://github.com/streamslate/streamslate/commit/8fbd9e42820b498167fe7430e6602c1efb8a247c))
* ignore local scratch docs in prettier ([8b47fe6](https://github.com/streamslate/streamslate/commit/8b47fe6e16d7b8e6852d431d750d99163c28c8ce))
* **mcp:** ignore local tooling configs ([9c94b26](https://github.com/streamslate/streamslate/commit/9c94b2631906f2caa4017ae976d8d4a9391df791))
* **release:** 🚀 v0.0.2-beta.0 ([7e4ae9f](https://github.com/streamslate/streamslate/commit/7e4ae9fddc3468c5bfef50c52539dc2b4a859e84))
* **release:** 🚀 v0.0.2-beta.1 ([012efd9](https://github.com/streamslate/streamslate/commit/012efd914c04c8178c9cc2daac97269d32d49aad))
* **release:** 🚀 v0.0.2-beta.2 ([bb91953](https://github.com/streamslate/streamslate/commit/bb9195343745a00b56f433c8807fd7ed7caa6b57))
* **release:** 🚀 v0.0.2-beta.3 ([cab0c41](https://github.com/streamslate/streamslate/commit/cab0c4161aed48c669216dcdd3527fedcb585841))
* **release:** 🚀 v0.0.2-beta.4 ([b8a7f54](https://github.com/streamslate/streamslate/commit/b8a7f548d183b92015822e4c2f0f892ccbb64cc7))
* **release:** 🚀 v0.0.2-beta.5 ([ead2064](https://github.com/streamslate/streamslate/commit/ead2064b2f889a7fd0d5daa2d90162fe62c465af))
* **release:** 🚀 v1.1.0 ([f75485f](https://github.com/streamslate/streamslate/commit/f75485f6edd42ce03925b4362a0c2fe8987ffc76))
* **release:** 🚀 v1.1.1 ([9eb30b7](https://github.com/streamslate/streamslate/commit/9eb30b7d38423b3becde40060cb4def50f41d973))
* **release:** 🚀 v1.2.0 ([304e1f0](https://github.com/streamslate/streamslate/commit/304e1f08f221d8c4d261e579753aa9edda4214c0))
* **release:** finalize v1.0.0 metadata and distro checks ([14a8ecd](https://github.com/streamslate/streamslate/commit/14a8ecd27ee966c6ad238bd54dcc9348bb714d55))
* **release:** update version and release workflow ([a21c2c9](https://github.com/streamslate/streamslate/commit/a21c2c9f2e377e0900792b1b20373c8c2ac398b4))
* **release:** v1.3.0 ([270dc91](https://github.com/streamslate/streamslate/commit/270dc91468493f18b6ce158ad236b8348c40b6c1))
* Remove unnecessary comments from the CI build script. ([2da8392](https://github.com/streamslate/streamslate/commit/2da8392d94099ac98d1982ed77d285eed8dacb51))
* sync tauri version + commit-all releases ([2003469](https://github.com/streamslate/streamslate/commit/2003469d8a5c108ec004a9cfd82018e3e7ff8ddd))
* sync tauri versions in standard-version releases ([8b84fcd](https://github.com/streamslate/streamslate/commit/8b84fcd71d9ead469b639bded615c51c1418fd01))
* update pre-commit hook and workspace settings ([b0bccd4](https://github.com/streamslate/streamslate/commit/b0bccd4909ee2799393652364d5167b31bc1357d))
* update project banner ([7e33ea4](https://github.com/streamslate/streamslate/commit/7e33ea460479f71fcf0c0d11a03c9dc37d1e843f))
* **updater:** add signing public key to tauri config ([efac8c0](https://github.com/streamslate/streamslate/commit/efac8c00fa797ebd260d390b4f7cd66a055d572d))

## [1.3.0](https://github.com/streamslate/streamslate/compare/v1.2.0...v1.3.0) (2026-02-20)

### ✨ Features

- **DEBT-008:** migrate Tauri v1 to v2 ([566ca08](https://github.com/streamslate/streamslate/commit/566ca08))
  - Rust backend: `tauri` 1.8 → 2.x, plugin-based architecture (dialog, fs, shell, process, updater, http)
  - Frontend: all 10 import files migrated to v2 module paths
  - Config: v2 schema (`tauri.conf.json`), capabilities system replaces allowlist
  - CI: removed webkit 4.0→4.1 symlink hacks, updated `tauri-action` to v0.5.17

### 🐛 Bug Fixes

- restore updater config and fix release-please jsonpath for Tauri v2 ([c0bded5](https://github.com/streamslate/streamslate/commit/c0bded5))
- **ci:** prevent codesign keychain password prompt on macOS runner ([234f63e](https://github.com/streamslate/streamslate/commit/234f63e))
- **backend:** replace unsafe `.unwrap()` on Mutex locks with proper error handling [DEBT-004] ([68cc19c](https://github.com/streamslate/streamslate/commit/68cc19c))

### ♻️ Code Refactoring

- **DEBT-009:** extract typed event dispatcher from integration store ([2222ac9](https://github.com/streamslate/streamslate/commit/2222ac9))
- **DEBT-001,DEBT-011:** decompose AnnotationLayer and AnnotationTools ([0d90ade](https://github.com/streamslate/streamslate/commit/0d90ade))
- **DEBT-005:** migrate read-heavy state fields from Mutex to RwLock ([7535181](https://github.com/streamslate/streamslate/commit/7535181))
- **DEBT-003:** replace 55 console.log calls with structured logger ([354af56](https://github.com/streamslate/streamslate/commit/354af56))
- **DEBT-010:** replace Mutex<Option<>> with OnceLock for broadcast_sender ([ffdd2be](https://github.com/streamslate/streamslate/commit/ffdd2be))

### 🧪 Tests

- **DEBT-002:** add Vitest unit test infrastructure with 86 initial tests ([7ed5090](https://github.com/streamslate/streamslate/commit/7ed5090))

### 📦 Build System

- **DEBT-007:** replace deprecated standard-version with release-please ([26193e1](https://github.com/streamslate/streamslate/commit/26193e1))

### 👷 CI/CD

- **DEBT-006:** upgrade Node.js from 18 (EOL) to 20 LTS in CI and release workflows ([da4494a](https://github.com/streamslate/streamslate/commit/da4494a))

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
