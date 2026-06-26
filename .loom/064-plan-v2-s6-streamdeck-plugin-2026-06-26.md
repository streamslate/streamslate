# V2 S6 Stream Deck Official Plugin

Plan id: `plan-v2-s6-streamdeck-plugin`
Project: `services/streamslate`
Base: `origin/main` at `6fbd58f`

## Goal

Ship the next roadmap slice after OBS WebSocket direct control: a first-party
StreamSlate Stream Deck plugin scaffold using the official Elgato SDK v2. The
plugin controls the existing StreamSlate loopback WebSocket API and does not
require desktop app changes.

## External Contract

- Elgato SDK v2 plugin structure: `*.sdPlugin/manifest.json`, `CodePath`,
  action metadata, supported OS declarations, and Node.js runtime.
- Current SDK guidance targets Stream Deck 7.1+ and Node.js 24+.
- npm registry verification on 2026-06-26: `@elgato/streamdeck@2.1.0`,
  `@elgato/cli@1.7.4`.
- StreamSlate endpoint remains `ws://127.0.0.1:11451`.

## Shared Interface

Commands:

- `GET_CAPABILITIES`
- `GET_STATE`
- `NEXT_PAGE`
- `PREVIOUS_PAGE`
- `GO_TO_PAGE`
- `SET_ZOOM`
- `TOGGLE_PRESENTER`
- `PING`

Events:

- `CONNECTED`
- `CAPABILITIES`
- `STATE`
- `PAGE_CHANGED`
- `PRESENTER_CHANGED`
- `ZOOM_CHANGED`
- `PDF_OPENED`
- `PDF_CLOSED`
- `ERROR`
- `PONG`

Defaults: host `127.0.0.1`, port `11451`, protocolVersion `2.0`.

## Slice 1: Plugin Runtime/Actions

Branch: `codex/v2-s6-streamdeck-plugin-runtime`

Owns:

- `plugins/streamdeck/**`

Acceptance criteria:

- Adds a self-contained official SDK v2 plugin package.
- Provides manifest, TypeScript entrypoint, action implementations, settings
  helpers, StreamSlate WebSocket client, tests, and build scripts.
- Key actions send stable StreamSlate WebSocket command payloads.
- Connection/page/presenter state is surfaced to actions where feasible.
- Package-level build and tests pass.

## Slice 2: Docs and Verification

Branch: `codex/v2-s6-streamdeck-docs`

Owns:

- `README.md`
- `ROADMAP.md`
- `docs/**`

Acceptance criteria:

- Updates user/developer docs without overclaiming Marketplace publication.
- Replaces or clearly supersedes the old POC Stream Deck script language.
- Adds manual verification steps for local Stream Deck plugin development.
- Keeps API and roadmap truthfulness aligned with the shipped implementation.

## Integration Success

- `npm --prefix plugins/streamdeck run build` passes.
- `npm --prefix plugins/streamdeck test` passes.
- `NODE_OPTIONS="--localstorage-file=.node-localstorage" npm run test:unit`
  passes.
- `npm run build` passes.
- `npm run lint` passes.
- `npm run format:check` passes.
- `cargo test` passes.
- `git diff --check origin/main...HEAD` passes.
