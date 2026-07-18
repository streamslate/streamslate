# RALPH Iteration Plan — S23 Presenter Lifecycle Recovery

## Review

- Roadmap milestone: **Now — manual verification and release-readiness completion (#14)**
- Spec sections: Product spec FR2; implementation plan M11 presenter-window recovery
- Prior decisions to preserve:
  - Mark only directly observed native/manual checks complete.
  - Treat presenter state as truthful only when backed by the native `presenter` window.
  - Keep external hardware, multi-monitor, and auto-reconnect checks open without direct evidence.

## Riskiest assumption + kill-test

**Load-bearing assumption**: On the current macOS/Tauri v2 runtime, invoking the existing `WebviewWindowBuilder` presenter lifecycle from the WebSocket command handler can synchronously create and destroy a separately enumerable native window while preserving PDF/page event delivery.

**Positive evidence**: `src-tauri/src/commands/presenter.rs` already builds a window labeled `presenter` at `/presenter`, and the product spec records the direct frontend command path as previously verified.

**Disconfirming evidence**: `src-tauri/src/websocket/handlers.rs` currently changes only `AppState` and emits `presenter-changed`; `src/hooks/useRemoteControl.ts` then changes React state without invoking a native window command. The 2026-07-17 native run therefore observed `active: true` while AX and CoreGraphics found only the main window.

**Kill test**: In a current-source native build with `/usr/share/doc/bash/bash.pdf` loaded, send `TOGGLE_PRESENTER` over `ws://127.0.0.1:11451`. Require a `PRESENTER_CHANGED { active: true }` response only after accessibility enumerates a second window titled `StreamSlate - Presenter Mode`. Send `GO_TO_PAGE` and require the presenter canvas to expose the matching page. Toggle off and require the second window to disappear; toggle on again and require a newly created second window. Complete this in under 30 minutes.

**Failure mode if the assumption is wrong**: Stream Deck and WebSocket controls would continue reporting a presenter state that has no native output window, so release-readiness and presenter synchronization claims would remain false.

**Status**: passed — native macOS exposed the exact second-window title,
contrast-bearing page sync, close, cold reopen, and Escape destruction while
protocol state matched native visibility.

## Align

- Slice name: Remote presenter native lifecycle truthfulness
- Scope in:
  - Share the native presenter open/close lifecycle between Tauri commands and WebSocket handling.
  - Derive `active` from successful native window operations, not an optimistic state flip.
  - Keep main-window presenter state synchronized through Tauri events.
  - Prove open, title, page sync, close, and reopen in the native app.
  - Update release-readiness evidence and roadmap/spec progress for directly observed results.
- Scope out:
  - Stream Deck hardware/Mobile validation and Marketplace publication.
  - OBS, NDI, Syphon, updater, and automatic reconnect verification.
  - Multi-monitor presenter placement, which needs a second attached display.
- Acceptance criteria:
  1. WebSocket `TOGGLE_PRESENTER` returns `active: true` only when a native `presenter` window exists.
  2. The second window title is `StreamSlate - Presenter Mode` and it renders the loaded PDF.
  3. Page changes from the main/remote path visibly synchronize to the presenter canvas.
  4. A second toggle destroys the presenter window and returns `active: false`.
  5. Reopening after close creates a new presenter window.
  6. Targeted tests, full frontend/Rust gates, and GitLab CI pass.
- Dependencies/blockers:
  - Native macOS accessibility access is available.
  - A deterministic 65-page PDF fixture is available at `/usr/share/doc/bash/bash.pdf`.
  - Shared agent-context is unavailable; repo-local handoff files are the durability fallback.

## Land

- Planned file areas:
  - `src-tauri/src/commands/presenter.rs`
  - `src-tauri/src/websocket/handlers.rs`
  - focused Rust/frontend tests where the lifecycle boundary is testable
  - manual verification, implementation-plan, roadmap, and decision docs
- Implementation steps:
  1. Extract native presenter window operations behind reusable helpers that update state only after success.
  2. Route WebSocket presenter toggles through those helpers and return classified errors on lifecycle failure.
  3. Synchronize the main UI from the resulting native lifecycle event and run the native kill-test.
- Review-size note: the slice exceeds 500 added lines only after its RALPH plan,
  durable manual evidence, and regression tests are included. Runtime changes
  remain a single cross-window acceptance path: truthful native lifecycle,
  presenter hydration, and the same buffer-level PDF conversion in both views.
  Splitting those pieces would leave an intermediate presenter that opens but
  cannot reliably reproduce the main viewer's dark-page output.

## Prove

- Tests to run:
  - targeted presenter/WebSocket tests
  - `npm run test:unit`
  - `cargo test`
- Lint/static checks:
  - `npm run format:check`
  - `npm run lint`
  - `npm run build`
  - `cargo fmt --all -- --check`
  - `cargo clippy --all-targets -- -D warnings`
- CI checks:
  - required GitLab lint/unit jobs
  - signed macOS build (allowed-failure job, but monitored to terminal state)

## Handoff/Harvest

- Docs to update:
  - `ROADMAP.md`
  - `.loom/30-implementation-plan.md`
  - `.loom/40-decisions.md`
  - `docs/manual-verification-checklist.md`
  - `docs/manual-verification-evidence-2026-07-17.md`
- Agent-context entries to add: unavailable; write a local RALPH handoff instead
- Next-slice candidates:
  - Complete remaining locally testable manual checks.
  - Re-run strict release preflight on a follow-up release candidate.
  - Publish the signed follow-up release after issue #14 gates are satisfied.
