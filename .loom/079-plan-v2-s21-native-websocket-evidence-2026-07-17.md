# RALPH Iteration Plan — Native WebSocket Evidence

## Riskiest assumption + kill-test

**Load-bearing assumption**: A current-source StreamSlate v1.6.0 macOS build
exposes the documented protocol-v2 WebSocket control surface on
`ws://127.0.0.1:11451`, so native checklist evidence can be collected without
using the stale installed application.

**Kill test**: Launch `npm run tauri:dev` from `fab65342`, connect with
`websocat`, send `GET_CAPABILITIES` with a unique request ID, and require both
`CONNECTED` version `1.6.0` and a matching `CAPABILITIES` response that lists
the documented command/event surface.

**Failure mode if the assumption is wrong**: The slice would record unit-test
or stale-binary behavior as current native release evidence.

**Status**: passed 2026-07-17 — the current-source build returned
`CONNECTED` version `1.6.0` and matching protocol-v2 `CAPABILITIES` for request
`ralph-native-capabilities`.

### Positive and disconfirming evidence

- Positive: the current-source dev build returned protocol-v2 capabilities,
  two concurrent clients independently received `PONG`, and connection state
  identified version `1.6.0`.
- Disconfirming/limiting: `/Applications/StreamSlate.app` is version `1.0.1`
  and is excluded; `GO_TO_PAGE` without a loaded PDF returned
  `PDF_NOT_LOADED`; visual window inspection lacked macOS assistive access.

## Review

- Roadmap milestone: Now — verification and release-readiness completion
  ([#14](https://gitlab.flexinfer.ai/services/streamslate/-/issues/14))
- Spec section(s): `.loom/30-implementation-plan.md` M11,
  `docs/manual-verification-checklist.md`
- Prior decisions to preserve:
  - External and manual gates stay open until direct evidence exists.
  - Release documentation must distinguish current-source evidence from stale
    installed artifacts.

## Align

- Slice name: Current-source native WebSocket evidence
- Scope in:
  - Record the v1.6.0 `GET_CAPABILITIES` response from a native Tauri runtime.
  - Verify two simultaneous WebSocket clients can independently round-trip
    requests.
  - Record environment constraints and the exact checks that remain open.
- Scope out:
  - PDF-dependent page/zoom behavior without a loaded PDF.
  - Visual status-bar or presenter-window assertions.
  - NDI, Syphon, multi-monitor, OBS, Stream Deck, or updater validation.
- Acceptance criteria:
  - Evidence identifies the source ref, build mode, host, requests, and
    observed responses.
  - Only directly observed checklist items are checked.
  - Stale installed application and unavailable prerequisites are documented.
  - Existing repository quality checks remain green.
- Dependencies/blockers:
  - Current-source Tauri build, macOS runtime, and `websocat` are available.
  - Only one display is attached; OBS, Stream Deck, NDI, and Syphon apps are
    unavailable.
  - macOS assistive access is unavailable for window-title inspection.
- Risk notes:
  - Protocol events prove backend behavior, not visual WebView state.

## Land

- Planned file areas:
  - `docs/manual-verification-evidence-2026-07-17.md`
  - `docs/manual-verification-checklist.md`
  - `.loom/30-implementation-plan.md`
  - `.loom/40-decisions.md`
  - `.loom/50-worklog.md`
- Implementation steps:
  1. Capture current-source native protocol and concurrent-client evidence.
  2. Mark only the two directly proven checklist items.
  3. Record limitations and update the active implementation plan.

## Prove

- Tests to run:
  - Native v1.6.0 `GET_CAPABILITIES` request/response.
  - Two concurrent clients with independent `PING`/`PONG` request IDs.
  - `npm run test:unit`.
- Lint/static checks:
  - `npm run format:check`
  - `npm run lint`
  - `npm run build`
  - scoped pre-commit hooks.
- CI checks:
  - GitLab merge-request pipeline after push.

## Handoff/Harvest

- Docs to update:
  - `docs/manual-verification-checklist.md`
  - `docs/manual-verification-evidence-2026-07-17.md`
  - `.loom/30-implementation-plan.md`
- Agent-context entries to add:
  - Decision: check manual items only when the exact behavior is directly
    observed on current-source runtime.
  - Finding: WebSocket capabilities and simultaneous clients pass on v1.6.0.
- Next-slice candidates:
  - Load a PDF in the native app and verify page/zoom commands plus presenter
    synchronization.
  - Run Stream Deck or output validation when required hardware is available.
