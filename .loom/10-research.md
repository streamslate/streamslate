# Research Brief

## Problem

StreamSlate's high-level release status is strong (`v1.0.x`), but the current codebase shows multiple UI consistency gaps and core wiring issues that can undermine confidence in day-to-day use.

## Questions

- Q1: Which code paths are currently mismatched between UI state and backend reality?
- Q2: Which UI issues are structural (design-system drift) versus tactical bugs?
- Q3: What is the current test/build baseline for safe refactoring?
- Q4: What should be prioritized first to tighten UI and core features without destabilizing roadmap work?

## Constraints

- The working tree is already dirty with user-owned changes.
- Some MCP servers are unavailable in this environment, so repo-local evidence is the primary source.
- Cypress requires a running dev server (`http://localhost:1420`) to execute.

## Method

- Reviewed key frontend shell + hooks + stores:
  - `src/App.tsx`
  - `src/components/layout/*.tsx`
  - `src/components/pdf/PDFViewer.tsx`
  - `src/hooks/usePDF.ts`
  - `src/hooks/useRemoteControl.ts`
  - `src/hooks/useViewModes.ts`
  - `src/stores/integration.store.ts`
  - `src/lib/websocket/client.ts`
- Reviewed backend WebSocket/command state paths:
  - `src-tauri/src/lib.rs`
  - `src-tauri/src/websocket/*.rs`
  - `src-tauri/src/commands/*.rs`
- Ran baseline checks:
  - `npm run lint`
  - `npm run build`
  - `npm run dev -- --host 127.0.0.1 --port 1420`
  - `npm run test:headless`

## Findings

1. Integration wiring is partially real now, but not complete.

- `connectWebSocket` now uses `StreamSlateWebSocketClient` and state-change handlers.
- `connectOBS` still uses timeout-based simulation placeholders.

2. A real WebSocket backend exists and is already running in Tauri.

- Tauri app startup launches a WebSocket server on port `11451`.
- The server handles `NEXT_PAGE`, `GO_TO_PAGE`, `SET_ZOOM`, presenter toggle, annotation updates, and state queries.

3. WebSocket client integration is now active but event mapping remains minimal.

- Current store wiring handles connection state and server `ERROR` events.
- Additional event mapping for richer telemetry/control flow is still open.

4. UI styling is inconsistent with design-token intent.

- Several layout components use hardcoded `gray-*` classes instead of the tokenized `bg/surface/text` system.
- Update banner uses hardcoded indigo/purple gradient styles that diverge from the rest of the shell.

5. There is at least one concrete UI defect in the PDF viewer class list.

- Loading overlay includes `bg-[rgb(var(--color-bg-tertiary)))` (extra closing parenthesis), indicating a malformed utility class.

6. Current PDF render path favors compatibility but likely adds overhead.

- After rendering to canvas, each page is converted to PNG data URL (`toDataURL`) and displayed via `<img>` fallback.
- This may increase CPU/memory pressure for frequent page/zoom updates.

7. View mode preferences are session-only.

- `presenterMode`, `transparentBg`, and `borderlessMode` are initialized with local component state and not persisted.

8. Build and lint are green after dependency install, but bundle warnings indicate optimization headroom.

- Vite reports large chunks (>500kB), including the main app chunk and PDF worker.

9. E2E baseline is green but shallow.

- Cypress passes 13/13 tests, focused mainly on shell structure/toggles.
- There is no automated E2E coverage for opening a PDF, creating annotations, autosave/export, or remote-control command handling.

10. README integration docs reference an API doc path that is missing.

- README references `docs/api.md`, but file is absent.

## Options

### Option A: Core Wiring First, UI Second

- Complete transport-backed integration behavior (including remaining simulated OBS path).
- Then do UI consistency pass.
- Pros: fixes trustworthiness of status indicators and control plane first.
- Cons: user-visible UI polish lands later.

### Option B: UI Polish First, Core Wiring Second

- Fix visual consistency, reduce design drift, ship immediate UX improvements.
- Then wire core integration state.
- Pros: immediate polish.
- Cons: can mask foundational reliability gaps.

### Option C: Dual-Track Hardening (Recommended)

- Track 1: real integration state + transport correctness.
- Track 2: design-token alignment + focused UI bug fixes.
- Track 3: PDF workflow test coverage and performance checks.
- Pros: balanced user-facing improvements + foundational correctness.
- Cons: requires tighter sequencing and discipline.

## Recommendation

Adopt **Option C** with a strict sequence:

1. Complete transport-backed integration signals and remove remaining simulation in core status paths.
2. Resolve UI drift and defects in shared shell components.
3. Expand automated coverage for core PDF workflows before larger roadmap expansion.

## Assumptions

- Near-term release target is a hardening release (`v1.0.x`) rather than a feature-heavy minor.
- Existing roadmap items (`NDI`, `Syphon`, presets/templates) remain valid but should follow core hardening.

## Sources

- `src/stores/integration.store.ts:214`
- `src/stores/integration.store.ts:329`
- `src/stores/integration.store.ts:249`
- `src-tauri/src/lib.rs:102`
- `src-tauri/src/websocket/server.rs:44`
- `src-tauri/src/websocket/handlers.rs:23`
- `src/lib/websocket/client.ts:29`
- `src/components/layout/BorderlessUI.tsx:33`
- `src/components/layout/UpdateBanner.tsx:85`
- `src/components/pdf/PDFViewer.tsx:551`
- `src/components/pdf/PDFViewer.tsx:454`
- `src/hooks/useViewModes.ts:22`
- Command: `npm run build`
- Command: `npm run lint`
- Command: `npm run test:headless`
- `README.md:64`
- Command: `if [ -f docs/api.md ]; then echo "docs/api.md exists"; else echo "docs/api.md missing"; fi`
- `ROADMAP.md:38`
