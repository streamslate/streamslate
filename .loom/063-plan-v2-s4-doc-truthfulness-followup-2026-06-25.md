# V2-S4 Docs Truthfulness Follow-up Plan

Date: 2026-06-25
Base: `origin/main` at `a5ca529`
Plan ID: `plan-streamslate-v2-s4-doc-truthfulness-followup`
Integration branch: `codex/v2-s4-doc-truthfulness-followup`

## Objective

Continue from the completed V2-S2/V2-S3 plans by aligning user-facing docs,
getting-started examples, plugin proof-of-concept labeling, and bundle metadata
with the shipped V2 local-control contract.

V2 is a loopback-only WebSocket JSON protocol at `ws://127.0.0.1:11451`. It
does not ship OBS WebSocket scene/source control, a hosted HTTP presenter
endpoint at port 11451, a real Stream Deck SDK plugin, mobile, cloud sync,
remote pairing, or authentication.

## Shared Interface Contract

- Keep the runtime API names documented in `docs/api.md` and
  `docs/api-v2-contract.md` unchanged.
- Use `ws://127.0.0.1:11451` for local-control examples.
- Use command objects with `type` in `SCREAMING_SNAKE_CASE`.
- Present Stream Deck content as automation examples or proof-of-concept
  material, not shipped official plugin support.
- Preserve OBS guidance for capturing the presenter window or native output,
  not an HTTP URL on the WebSocket port.

## Slice 1: README And Bundle Metadata Truthfulness

Branch: `codex/v2-s4-readme-metadata-truthfulness`

Owned files:

- `README.md`
- `src-tauri/tauri.conf.json`

Goal:

- Fix README quick-start, integration, and roadmap language that incorrectly
  points OBS at `http://localhost:11451/presenter` or lists already-shipped and
  future status inaccurately.
- Keep the WebSocket API described as local-control automation.
- Update bundle long description so app metadata does not claim direct OBS
  integration.

Acceptance criteria:

- README no longer describes port `11451` as an HTTP presenter URL.
- README clearly distinguishes OBS window/native-output capture from WebSocket
  automation.
- Roadmap "Next" text reflects remaining future items without claiming PDF
  inversion is still future.
- Tauri long description matches shipped behavior.

Test strategy:

- `npm run format:check -- README.md src-tauri/tauri.conf.json`
- `git diff --check -- README.md src-tauri/tauri.conf.json`

## Slice 2: Getting Started V2 Example Refresh

Branch: `codex/v2-s4-getting-started-v2-examples`

Owned files:

- `docs/getting-started.mdx`

Goal:

- Replace stale Stream Deck support claim with V2-compatible automation
  guidance.
- Replace non-existent `action: "changePage"` examples with actual V2 command
  shapes.
- Update Node prerequisite to match `package.json` and repo build guidance.

Acceptance criteria:

- WebSocket examples use `type: "GO_TO_PAGE"` and
  `type: "CLEAR_ANNOTATIONS"` or other supported commands.
- Stream Deck section says no official plugin is shipped yet and points users to
  WebSocket automation/API docs.
- Prerequisite Node version matches repo expectations.

Test strategy:

- `npm run format:check -- docs/getting-started.mdx`
- `git diff --check -- docs/getting-started.mdx`

## Slice 3: Plugin PoC Labeling And V2 Handshake

Branch: `codex/v2-s4-plugin-poc-v2-labeling`

Owned files:

- `docs/plugins/manifest.json`
- `docs/plugins/test_plugin.js`

Goal:

- Make plugin artifacts clearly proof-of-concept/example materials instead of
  implied official shipped Stream Deck plugin support.
- Update the test plugin to perform V2 capability discovery and use request
  metadata where helpful.

Acceptance criteria:

- Manifest description indicates example/proof-of-concept status or otherwise
  avoids official plugin language.
- Test plugin sends `GET_CAPABILITIES` with `protocolVersion: "2.0"` and
  `request_id`, then handles `CAPABILITIES` without breaking existing state/page
  logging.
- Existing command methods keep using supported command names.

Test strategy:

- `node -c docs/plugins/test_plugin.js`
- `npm run format:check -- docs/plugins/manifest.json docs/plugins/test_plugin.js`
- `git diff --check -- docs/plugins/manifest.json docs/plugins/test_plugin.js`

## Integration Order

1. Slice 1
2. Slice 2
3. Slice 3

All slices are file-disjoint and can run in parallel. Slice 1 should merge first
so the top-level public message is the baseline for the more detailed docs.

## Full Validation Gate

- `npm run format:check -- README.md docs/getting-started.mdx docs/plugins/manifest.json docs/plugins/test_plugin.js src-tauri/tauri.conf.json`
- `node -c docs/plugins/test_plugin.js`
- `npm run test:unit`
- `npm run build`
- `npm run lint`
- `git diff --check origin/main...HEAD`
