# StreamSlate itch.io Profile Pack (v1.0.0)

## Project Title

`StreamSlate — Mark it. Show it.`

## Short Description

`A lightning-fast PDF annotator for streamers: dark-first UI, OBS-ready presenter mode, live collaboration, and export to PDF/JSON.`

## Full Description

StreamSlate is a professional PDF annotation tool built for streamers, educators, and content creators.

It is designed for live use first: low-friction annotation tools, a transparent presenter overlay for OBS, and collaboration/remote control surfaces that work during broadcasts.

### Highlights

- Dark-first PDF workflow with high-contrast annotation colors
- Presenter mode with transparent borderless output
- OBS Browser Source integration (`http://localhost:11451/presenter`)
- Live collaboration via local WebSocket sync
- Annotation export to PDF and JSON
- Native desktop app with small footprint (Tauri + Rust)

### Platform Support

- macOS (Apple Silicon + Intel)
- Windows (x64)
- Linux (x64)

### Community

- GitHub: https://github.com/streamslate/streamslate
- Discord: https://discord.gg/streamslate
- Website: https://streamslate.app

## Suggested itch.io Tags

- `pdf`
- `annotation`
- `streaming`
- `obs`
- `education`
- `productivity`
- `tool`

## Suggested Metadata

- Classification: `Tool`
- Platforms: `Windows`, `macOS`, `Linux`
- Pricing: `Free` (or free with optional support)

## v1.0.0 Release Notes (itch Changelog)

StreamSlate v1.0.0 is now production-ready.

New in this release:

- Live collaboration and cursor sync
- Native screen capture integration (macOS)
- Cross-platform release builds (macOS/Windows/Linux)
- CI/CD release automation and signed updater path
- Expanded annotation/export reliability and test coverage

## Channel Mapping

- `caedus90/streamslate:macos` -> DMG
- `caedus90/streamslate:windows` -> setup EXE
- `caedus90/streamslate:linux` -> AppImage

## Verification Commands

```bash
npm run release:preflight:strict
```

```bash
set -a; source ai.env; set +a
butler status caedus90/streamslate
```
