# StreamSlate Release Readiness

Tracking issue: [services/streamslate#14](https://gitlab.flexinfer.ai/services/streamslate/-/issues/14)

## Quick Check

Run:

```bash
npm run release:preflight
```

Strict gate:

```bash
npm run release:preflight:strict
```

The preflight script:

- verifies required CLI tools are installed
- loads `ai.env` for `BUTLER_API_KEY` when needed
- checks version alignment across `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json`
- checks the expected `v<version>` tag and release assets
- validates `latest.json`
- checks itch.io channel status

## Current Baseline (2026-07-16)

Validated with `npm run release:preflight:strict` from a clean worktree at
`9de1c83`:

- toolchain present (`git`, `node`, `npm`, `cargo`, `gh`, `butler`)
- `BUTLER_API_KEY` available for itch.io checks
- local version alignment at `1.6.0`
- local tag `v1.6.0` exists and matches repo version files
- GitHub release `v1.6.0` exists with desktop binaries, updater
  bundle/signature, and `latest.json`
- `latest.json` reports version `1.6.0` with `9` configured platforms
- itch.io channels `macos`, `windows`, and `linux` all report `v1.6.0`

The strict gate now treats empty itch.io status output as blocking. Standard
mode retains a warning so it remains useful for local diagnostics without
release credentials or reliable external status.

Remaining issue #14 work:

- execute and attach results for the native/manual scenarios in
  `docs/manual-verification-checklist.md`
- rerun strict preflight on the next release-candidate commit before tagging

## Standard Release Flow

1. Align versions:

```bash
npm run sync-versions
git diff -- package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
```

2. Ensure the release tag exists and points at the intended commit:

```bash
VERSION="$(node -p "require('./package.json').version")"
git tag "v${VERSION}"
git push origin "v${VERSION}"
git push github "v${VERSION}"
```

3. Confirm the GitHub release is present:

```bash
VERSION="$(node -p "require('./package.json').version")"
gh release view "v${VERSION}" --repo streamslate/streamslate
```

4. Confirm itch.io channels are populated:

```bash
butler status caedus90/streamslate
```

5. Re-run preflight:

```bash
npm run release:preflight
```

## Strict Gate Use

Use strict mode when you want warnings like a missing tag or incomplete release assets to fail the check:

```bash
npm run release:preflight:strict
```
