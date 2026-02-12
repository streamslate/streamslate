# Product Spec

## Summary

Define and execute a near-term hardening initiative focused on tightening StreamSlate's UI consistency and core feature reliability, while preserving post-1.0 roadmap momentum.

## Release Target

- Primary target: next `v1.0.x` hardening release.
- Follow-on: use this baseline to de-risk `v1.1` roadmap execution.

## Goals

1. Make integration/presenter status truthful and transport-backed.
2. Make the app shell visually and behaviorally consistent across normal, borderless, and presenter workflows.
3. Harden core PDF workflows (open, navigate, annotate, autosave, export, presenter sync).
4. Expand automated validation beyond shell-level smoke checks.

## Non-Goals

- Delivering full NDI/Syphon roadmap scope in this initiative.
- Shipping cloud sync, mobile companion, or multi-monitor redesign.
- Large-scale visual redesign that breaks current product identity.

## Users / Stakeholders

- Primary: creators/educators presenting annotated PDFs live.
- Secondary: users controlling StreamSlate through local WebSocket/automation.
- Internal: maintainers responsible for release quality and regression prevention.

## Functional Requirements

### FR1: Real Integration State

- WebSocket connection status shown in the UI must reflect real transport state.
- Connection errors must surface actionable status (`lastError`) instead of optimistic simulated state.
- Presenter and page/zoom remote events must remain synchronized with local state.

### FR2: UI Consistency and Defect Cleanup

- Shared shell components must use theme tokens consistently.
- Remove hardcoded style drift in borderless/presenter/update surfaces where feasible.
- Fix known class defects affecting rendering/loading visuals.

### FR3: Core Workflow Reliability

- PDF loading/closing and annotation autosave must remain stable under repeated operations.
- Export flow must preserve user annotations and complete without silent failure.
- View-mode settings behavior must be explicit (persisted or intentionally session-scoped with clear UX).

### FR4: Validation and Documentation

- Add automated checks for core workflow regressions, not just shell rendering.
- Ensure documentation paths referenced in README actually exist or are updated.

## Non-Functional Requirements

- No regressions in current passing lint/build/test baseline.
- No uncaught runtime exceptions in common flows under normal usage.
- Maintain acceptable responsiveness for page navigation and zoom in presenter workflows.

## UX Principles

- Status must be trustworthy over decorative.
- Streaming-critical controls should be legible, minimal, and predictable.
- Styling should follow one consistent token system across all shell variants.

## Acceptance Criteria

1. Integration indicators are backed by real connection events and fail correctly when server is down.
2. Identified UI inconsistencies and malformed class usage are resolved in targeted shell components.
3. Cypress or equivalent automated tests cover at least one end-to-end PDF workflow including annotation and export path checks.
4. `npm run lint` and `npm run build` pass after changes.
5. README references are reconciled with existing docs paths.

## Risks

- Wiring real transport state may expose hidden race conditions currently masked by simulated status.
- UI refactor across shared shell components can introduce subtle mode-specific regressions.
- Expanding E2E coverage may require additional deterministic test fixtures.

## Open Questions

- Should external WebSocket access (`allowExternalConnections`) be part of this hardening cycle?
- Do we persist view mode toggles now, or keep session-only behavior for simplicity?
- Is bundle-size reduction in scope for this cycle, or tracked separately?

## Sources

- `src/stores/integration.store.ts:214`
- `src-tauri/src/websocket/server.rs:44`
- `src/hooks/useRemoteControl.ts:33`
- `src/components/layout/BorderlessUI.tsx:33`
- `src/components/layout/UpdateBanner.tsx:85`
- `src/components/pdf/PDFViewer.tsx:551`
- `src/components/pdf/PDFViewer.tsx:454`
- `src/hooks/useViewModes.ts:22`
- `README.md:64`
- `ROADMAP.md:38`
- Command: `npm run lint`
- Command: `npm run build`
- Command: `npm run test:headless`
