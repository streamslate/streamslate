# Implementation Plan

## Scope

Execute a focused hardening cycle for UI consistency and core workflow reliability, using the current green baseline as a guardrail.

## Baseline (Verified)

- `npm run lint` passes.
- `npm run build` passes (with chunk-size warnings).
- `npm run test:headless` passes when dev server is running on `http://127.0.0.1:1420`.

## Current Status

- `M1` is **complete** (v1.1.0):
  - WebSocket connection state moved from simulated to real client-backed state.
  - Event mapping expanded for page/zoom/presenter/annotation/integration events.
  - All simulated/placeholder patterns removed from integration store.
- `M2` is **complete** (v1.1.0):
  - Shell components aligned with design tokens.
  - PDF viewer overlay class fixed. Update banner and borderless/presenter UI normalized.
- `M3` is **complete** (v1.1.0):
  - 7 E2E specs (1105 lines): annotations-edit, app, integration-websocket, pdf-viewer, settings, sidebar, workflow.
  - Covers annotation creation/editing, WebSocket integration, remote control workflow.
- `M4` is **in progress**:
  - docs/api.md created.
  - ROADMAP.md and README.md reconciliation in progress (2026-02-18).

## Milestones

1. `M1`: Replace simulated integration state with real transport state.
2. `M2`: UI shell consistency + known defect cleanup.
3. `M3`: Core workflow coverage and reliability checks.
4. `M4`: Docs reconciliation and release readiness handoff.

## Detailed Plan

### M1: Real Integration State

- Complete `connectWebSocket` integration using `StreamSlateWebSocketClient` wiring (initial conversion already done).
- Handle `onStateChange` and propagate real `connected`, `lastError`, and `connectionTime`.
- Register/dispose message handlers for page/zoom/presenter/annotation events cleanly.
- Validate behavior when backend server is unavailable.

Target files:

- `src/stores/integration.store.ts`
- `src/lib/websocket/client.ts`
- `src/App.tsx`
- `src/hooks/useRemoteControl.ts`

### M2: UI Consistency and Defect Cleanup

- Normalize shell components to use design tokens instead of hardcoded gray classes where practical.
- Fix malformed class in PDF viewer overlay.
- Align update banner styling with app theme direction.
- Audit mode overlays (`BorderlessUI`, `PresenterUI`, `BorderlessWindowControls`) for consistency.

Target files:

- `src/components/layout/BorderlessUI.tsx`
- `src/components/layout/PresenterUI.tsx`
- `src/components/layout/BorderlessWindowControls.tsx`
- `src/components/layout/UpdateBanner.tsx`
- `src/components/pdf/PDFViewer.tsx`
- `src/styles/globals.css`

### M3: Core Workflow Tests and Reliability

- Add/extend tests for:
  - PDF load and navigation state updates.
  - Annotation creation + persistence path.
  - Export flow success/failure states.
  - Remote-control command effects.
- Keep existing smoke coverage intact.

Target files:

- `cypress/e2e/pdf-viewer.cy.ts`
- `cypress/e2e/settings.cy.ts`
- `cypress/e2e/sidebar.cy.ts`
- potential new spec: `cypress/e2e/workflow.cy.ts`

### M4: Docs + Handoff

- Reconcile README references and integration documentation reality.
- Capture remaining roadmap-delayed items as explicit follow-ups.
- Update `.loom/40-decisions.md` and `.loom/50-worklog.md` after each milestone.

Target files:

- `README.md`
- `.loom/40-decisions.md`
- `.loom/50-worklog.md`

## Execution Order

1. Implement `M1` first (status truthfulness is foundation).
2. Implement `M2` second (high-visibility polish with lower core risk).
3. Implement `M3` in parallel where possible, finalizing before merge.
4. Close `M4` before release candidate cut.

## Test Plan

- Local:
  - `npm run lint`
  - `npm run build`
  - `npm run dev -- --host 127.0.0.1 --port 1420`
  - `npm run test:headless`
- Manual smoke:
  - open/close PDF repeatedly
  - page/zoom remote commands
  - annotation add/remove + export
  - presenter toggle and borderless mode transitions

## Rollout / Backout

- Rollout: ship as `v1.0.x` hardening release once M1-M4 acceptance criteria are met.
- Backout:
  - if real integration wiring destabilizes the app, gate with fallback path and disable new wiring before release.
  - isolate UI token refactors into small commits to allow selective rollback.

## Acceptance Gate

- All baseline checks remain green after changes.
- New tests for core workflow pass in CI/headless local run.
- No known simulated-state placeholders remain in targeted integration status paths.

## Dependencies and Risks

- Requires stable local WebSocket startup from Tauri backend.
- Requires deterministic fixture strategy for PDF/annotation E2E tests.
- Bundle-size warning mitigation is optional unless perf regressions are observed.

## Sources

- `src/stores/integration.store.ts:214`
- `src/lib/websocket/client.ts:29`
- `src-tauri/src/lib.rs:102`
- `src-tauri/src/websocket/handlers.rs:23`
- `src/components/pdf/PDFViewer.tsx:551`
- `src/components/layout/BorderlessUI.tsx:33`
- `src/components/layout/UpdateBanner.tsx:85`
- Command: `npm run lint`
- Command: `npm run build`
- Command: `npm run dev -- --host 127.0.0.1 --port 1420`
- Command: `npm run test:headless`
