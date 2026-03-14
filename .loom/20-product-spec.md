# Product Spec — Professional Grade Remediation

## Initiative

Close all feature truthfulness gaps and bring StreamSlate to a state where every public claim is backed by working code.

## Summary

StreamSlate v1.4.0 has strong core functionality (22 features working), but 6 features are overclaimed in README/ROADMAP with no backing implementation, and 4 features are partially implemented with gaps between what the code does and what the docs say. This initiative fixes the mismatch through documentation corrections and targeted code changes.

## Goals

1. Eliminate all false ✅ claims in README.
2. Wire presenter mode frontend to existing Tauri backend commands.
3. Add PDF page inversion to back the "dark-first" claim.
4. Promote multi-monitor selection from debug UI to main settings.
5. Improve verification coverage for shipped features.
6. Explicitly scope OBS/Stream Deck/text annotations as future work.

## Non-Goals

- Building OBS WebSocket integration in this slice.
- Building a real Stream Deck plugin in this slice.
- Cloud-backed settings sync.
- Mobile companion.
- New annotation types beyond fixing existing stubs.

## Functional Requirements

### FR1: Documentation Truthfulness

- Every feature marked ✅ must have a corresponding working code path.
- Feature-gated capabilities (NDI/Syphon) must be clearly labeled as build-time opt-in.
- Integration guide must describe only implemented behaviors.

### FR2: Presenter Mode Lifecycle

- Toggling presenter mode from the UI must invoke Tauri window open/close commands.
- Page, zoom, and annotation changes must sync between main and presenter windows.

### FR3: PDF Page Inversion

- A user toggle enables CSS-based page inversion on the PDF canvas.
- Annotations remain readable over inverted content.

### FR4: Output Settings UI

- Display selection, capture source, and NDI/Syphon controls are accessible from main settings (not just debug panel).

### FR5: Code Hygiene

- Unused annotation types removed from enum or implemented.
- OBS stub removed or clearly isolated from user-facing flows.
- No token references in user-visible UI without token validation.

## Acceptance Criteria — ALL MET

1. ✅ OBS stub isolated from user-visible integration panel (clarifying comment added, not exposed in UI).
2. ✅ Clicking "Presenter Mode" opens a real Tauri window via `WebviewWindowBuilder`.
3. ✅ README feature table has zero claims without implementation backing.
4. ✅ `tsc --noEmit`, `eslint`, and `vitest run` all pass (211 tests, 0 errors).

## Risks — Resolved

- README rewrite: completed without reducing apparent scope; features are honestly represented.
- Presenter lifecycle: no Cypress regressions; new unit tests cover the toggle lifecycle.
- PDF inversion: works correctly over annotation rendering (tested via AnnotationLayer.test.tsx).

## Open Questions — Resolved

- **OBS integration**: Explicitly deferred to Future in ROADMAP.md.
- **Page inversion**: Implemented as a separate toggle (independent of dark mode, nested under it in UI).
- **Unused annotation types**: Removed from enum (UNDERLINE, STRIKETHROUGH, STAMP, NOTE). Can be re-added in M9 if desired.

## Sources

- `.loom/10-research.md` (feature reality audit)
- `README.md:19,29,31,35,47,65-66`
- `src/stores/integration.store.ts:343-355`
- `src-tauri/src/commands/presenter.rs:72-290`
- `src/hooks/useViewModes.ts:32-69`
