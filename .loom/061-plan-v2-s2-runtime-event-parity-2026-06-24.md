# V2-S2 Runtime Event Parity Plan

Date: 2026-06-24
Base: `origin/main` at `5df403d`
Integration branch: `codex/v2-s2-runtime-event-parity`

The `agent_plan_*` store tools are not exposed in this Codex session. This
tracked `.loom` plan is the durable substitute for this wave; slice agents must
read this file, keep to their file ownership boundary, and report changed paths.

## Objective

Harden V2 local-control runtime/event parity after V2-S1 by ensuring runtime
events advertised in capabilities are emitted through the Rust server and
observable in the TypeScript integration event surface.

This wave does not ship OBS, Stream Deck, mobile, cloud sync, or remote pairing.

## Shared Interface Contract

- Protocol version remains `"2.0"`.
- Existing v1 command and event names remain valid.
- `CAPABILITIES` remains handled by the WebSocket client for negotiated state.
- V2-capable `CAPABILITIES` events should also be observable by integration
  event listeners without treating legacy `GET_CAPABILITIES` fallback errors as
  user-visible events.
- Annotation mutation commands should broadcast `ANNOTATIONS_UPDATED` and
  `ANNOTATIONS_CLEARED` to other connected WebSocket clients because those
  event names are advertised in `supported_events`.

## Slice 1: Rust Annotation Broadcast Parity

Branch: `codex/v2-s2-rust-annotation-broadcast`

Owned files:

- `src-tauri/src/websocket/server.rs`

Goal:

- Broadcast `ANNOTATIONS_UPDATED` and `ANNOTATIONS_CLEARED` state-changing
  events to peer WebSocket clients.
- Keep direct responses unchanged.
- Keep non-state discovery/keepalive events unbroadcast.

Acceptance criteria:

- `should_broadcast` returns true for `AnnotationsUpdated` and
  `AnnotationsCleared`.
- Existing broadcast exclusions for `Pong`, `Error`, and `Capabilities` remain
  covered.
- Rust tests pass for the websocket module or broader `cargo test`.

Test strategy:

- Add focused unit coverage in `server.rs`.
- Run `cargo test websocket` or `cargo test`.

## Slice 2: TypeScript Client CAPABILITIES Delivery

Branch: `codex/v2-s2-ts-capabilities-delivery`

Owned files:

- `src/lib/websocket/client.ts`
- `src/lib/websocket/client.test.ts`

Goal:

- Preserve negotiated WebSocket state behavior from V2-S1.
- Also dispatch valid `CAPABILITIES` messages to registered message handlers
  after state update so the integration event pipeline can observe them.
- Continue swallowing legacy fallback `ERROR` replies for unsupported
  `GET_CAPABILITIES`.

Acceptance criteria:

- A registered `CAPABILITIES` handler receives the payload after a valid
  capabilities response.
- State still records `capabilityNegotiated`, `legacyFallback`, and
  `capabilities` exactly as before.
- Fallback `ERROR` remains hidden from normal error handlers.

Test strategy:

- Extend `client.test.ts` mock WebSocket tests.
- Run `npm run test:unit -- src/lib/websocket/client.test.ts`.

## Slice 3: Integration Event Surface CAPABILITIES Mapping

Branch: `codex/v2-s2-ts-capabilities-events`

Owned files:

- `src/types/integration.types.ts`
- `src/lib/events/message-map.ts`
- `src/lib/events/dispatcher.test.ts`

Goal:

- Add a first-class `IntegrationMessageType.CAPABILITIES`.
- Register `CAPABILITIES` in `WS_MESSAGE_MAP` so integration subscribers can
  see V2 negotiation events.
- Treat `CAPABILITIES` as an observable event with no store mutation handler.

Acceptance criteria:

- `WS_MESSAGE_MAP` includes `CAPABILITIES`.
- Message-map tests expect the new total and verify `CAPABILITIES` produces an
  integration event with the new enum value.
- Dispatcher still marks no-op/unhandled events handled without side effects.

Test strategy:

- Extend `dispatcher.test.ts`.
- Run `npm run test:unit -- src/lib/events/dispatcher.test.ts`.

## Integration Order

1. Slice 1
2. Slice 2
3. Slice 3

Slices 2 and 3 are functionally complementary but file-disjoint. Merge Slice 2
before Slice 3 so the client delivery path exists before the event surface is
advertised.

## Full Validation Gate

- `npm run test:unit`
- `npm run build`
- `npm run lint`
- `npm run format:check`
- `cargo test`
- `npm run release:preflight`
- `git diff --check origin/main...HEAD`
