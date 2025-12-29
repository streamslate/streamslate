# Implementation Plan: StreamSlate Release Preparation

**Objective:** Package and prepare StreamSlate (v0.0.2-beta.5) for public release on Itch.io.

## Phase 1: Build & Packaging

- [x] **Run Production Build**: Execute `npm run tauri:build` to generate release artifacts.
  - Expected output: `.dmg` or `.app` for macOS (since current OS is darwin).
- [x] **Binary Verification**:
  - [x] Launch the built `.app` to ensure it starts correctly.
  - [x] Verify "Presenter Mode" (transparent overlay) works as expected.
- [x] **Artifact Collection**:
  - Collect the final binary from `src-tauri/target/release/bundle/`.

## Phase 2: Release Assets

- [x] **Icon Audit**: Ensure `src-tauri/icons` are high-quality and consistent.
- [x] **Changelog Update**: Finalize `CHANGELOG.md` for `v0.0.2-beta.5`.
- [x] **Metadata Check**: Verify `tauri.conf.json` description and product name.

## Phase 3: Itch.io Readiness

- [x] **Create Itch.io Description**: Draft a short, punchy description highlighting OBS/Streaming benefits.
- [ ] **Screenshot Capture**: Take 3-5 high-quality screenshots of the app in use (Main UI + Presenter Overlay).
- [ ] **Distribution Zip**: Create a `.zip` containing the app for easier upload to Itch.io.

## Phase 4: GitLab CI Migration

- [x] **Create GitLab CI Configuration**: Port `.github/workflows/ci.yml` to `.gitlab-ci.yml`.
- [ ] **MacOS Runner Setup**: Configure the local MacBook Air as a shell runner for GitLab.
  - Install `gitlab-runner`.
  - Register runner with tags `macos`, `darwin`.
  - Configure for non-interactive shell execution.
- [ ] **Signing Configuration**:
  - Add `APPLE_CERTIFICATE` (Base64 or File) and `APPLE_CERTIFICATE_PASSWORD` to GitLab CI/CD Variables.
  - Add `APPLE_TEAM_ID`, `APPLE_API_ISSUER`, `APPLE_API_KEY`, `APPLE_API_KEY_BASE64` for notarization.

## Reference Commands

```bash
# Full build pipeline
npm install
npm run build
npm run tauri:build
```

## Status

- **2025-12-29**: Implementation plan created.
