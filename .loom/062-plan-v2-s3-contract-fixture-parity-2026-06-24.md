# V2-S3 Contract Fixture Parity Plan

Date: 2026-06-24
Base: `origin/main` at `080c8f2`
Integration branch: `codex/v2-s3-contract-fixture-parity`

The `agent_plan_*` store tools are not exposed in this Codex session. This
tracked `.loom` plan is the durable substitute for this wave; slice agents must
read this file, keep to their file ownership boundary, and report changed paths.

## Objective

Bring the V2 local-control contract documentation and checked fixtures forward
from the S1/S2 runtime work so the public contract, Rust protocol, and
TypeScript client all agree on the shipped V2 behavior.

This wave does not ship OBS, Stream Deck, mobile, cloud sync, remote pairing, or
authentication. It keeps the loopback-only WebSocket control contract additive
and fixture-backed.

## Shared Interface Contract

- Protocol version remains `"2.0"`.
- Existing v1 command and event names remain valid.
- `GET_CAPABILITIES` returns the current `CAPABILITIES` shape.
- Direct V2 responses echo `request_id` where runtime support exists.
- `CAPABILITIES` is observable by TypeScript integration listeners.
- State-changing peer broadcasts include `ANNOTATIONS_UPDATED` and
  `ANNOTATIONS_CLEARED`.
- Message-only `ERROR` remains valid; richer V2 errors may include `code`,
  `recoverable`, `details`, `protocolVersion`, and `request_id`.

## Slice 1: Docs And Fixture Contract Refresh

Branch: `codex/v2-s3-docs-fixture-contract`

Owned files:

- `docs/api.md`
- `docs/api-v2-contract.md`
- `docs/api-v2-fixtures/*.json`

Goal:

- Update V2 docs from S1 wording to shipped S2 behavior.
- Document `CAPABILITIES` as an observable event and annotation mutation events
  as peer-broadcast state changes.
- Ensure fixtures cover the shipped contract, including
  `ANNOTATIONS_CLEARED`.

Acceptance criteria:

- Docs no longer describe the current runtime as only "S1" where S2 behavior is
  now shipped.
- `CAPABILITIES`, `ANNOTATIONS_UPDATED`, and `ANNOTATIONS_CLEARED` behavior is
  explicit in the contract and local API docs.
- All fixture JSON files parse.

Test strategy:

- Run a JSON parse check for `docs/api-v2-fixtures/*.json`.
- Run `npm run format:check -- docs/api.md docs/api-v2-contract.md docs/api-v2-fixtures`.

## Slice 2: Rust Protocol Fixture Conformance

Branch: `codex/v2-s3-rust-fixture-conformance`

Owned files:

- `src-tauri/src/websocket/protocol.rs`

Goal:

- Add focused Rust tests that keep protocol serialization/deserialization
  aligned with checked V2 fixtures.
- Avoid duplicating the docs slice fixture content; use existing fixture files as
  read-only inputs.

Acceptance criteria:

- `capabilities.v2.json` matches `WebSocketEvent::capabilities()` aside from
  request-specific metadata where appropriate.
- `error.v1.json` and `error.v2.json` deserialize as valid `WebSocketEvent`
  shapes.
- `command.get-capabilities.v2.json` deserializes to `WebSocketRequest` with
  V2 metadata preserved.
- `annotations-updated.v2.json` and `annotations-cleared.v2.json` deserialize as
  valid events when present.

Test strategy:

- Run `cargo test websocket::protocol`.

## Slice 3: TypeScript Fixture And Event Conformance

Branch: `codex/v2-s3-ts-fixture-conformance`

Owned files:

- `src/lib/websocket/client.test.ts`
- `src/lib/events/dispatcher.test.ts`

Goal:

- Add TypeScript coverage that uses checked fixtures for client capability
  negotiation and integration event mapping.
- Keep production code unchanged unless tests reveal a real parity bug.

Acceptance criteria:

- The WebSocket client accepts the checked `capabilities.v2.json` fixture and
  delivers it to registered `CAPABILITIES` handlers after state update.
- Rich `error.v2.json` continues through normal `ERROR` handlers when it is not
  the legacy unsupported-capabilities fallback.
- Dispatcher/message-map tests assert fixture-backed `CAPABILITIES` and
  annotation-cleared events are observable and handled correctly.

Test strategy:

- Run `npm run test:unit -- src/lib/websocket/client.test.ts src/lib/events/dispatcher.test.ts`.

## Integration Order

1. Slice 1
2. Slice 2
3. Slice 3

Slice 2 and Slice 3 may be implemented in parallel against the existing
fixtures, then rebased after Slice 1 if new fixtures are added. Keep all slices
within their owned files.

## Full Validation Gate

- `npm run test:unit`
- `npm run build`
- `npm run lint`
- `npm run format:check`
- `cargo test`
- `npm run release:preflight`
- `git diff --check origin/main...HEAD`
