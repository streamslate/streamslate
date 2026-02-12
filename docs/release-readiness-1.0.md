# StreamSlate v1.0.0 Release Readiness

## Quick Check

Run:

```bash
npm run release:preflight
```

Release gate (fails on unresolved publish blockers):

```bash
npm run release:preflight:strict
```

This command:

- verifies required CLI tools are installed
- loads `ai.env` for `BUTLER_API_KEY` when needed
- checks version alignment across `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json`
- checks tag/release visibility expectations for `v<version>`
- checks itch.io project/channel visibility

## Current Status (2026-02-11)

Validated:

- toolchain present (`git`, `node`, `npm`, `cargo`, `gh`, `butler`)
- local version alignment at `1.0.0`
- local auth path for butler works when `ai.env` is loaded

Remaining release blockers:

- create/push `v1.0.0` git tag if not present locally/remotely
- ensure GitHub release for `v1.0.0` is visible and published
- publish at least one artifact per itch.io channel:
  - `caedus90/streamslate:macos`
  - `caedus90/streamslate:windows`
  - `caedus90/streamslate:linux`

## Manual Completion Checklist

1. Confirm version alignment:

```bash
npm run sync-versions
git diff -- package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
```

2. Tag and push release tag:

```bash
git tag v1.0.0
git push origin v1.0.0
git push github v1.0.0
```

3. Verify/create GitHub release:

```bash
gh release view v1.0.0 --repo streamslate/streamslate || gh release create v1.0.0 --repo streamslate/streamslate --generate-notes
```

4. Ensure itch.io channels are populated (via CI job or manual push):

```bash
# Examples (paths are placeholders)
butler push /path/to/StreamSlate.dmg caedus90/streamslate:macos --userversion v1.0.0
butler push /path/to/StreamSlateSetup.exe caedus90/streamslate:windows --userversion v1.0.0
butler push /path/to/StreamSlate.AppImage caedus90/streamslate:linux --userversion v1.0.0
```

5. Re-run preflight:

```bash
npm run release:preflight
```
