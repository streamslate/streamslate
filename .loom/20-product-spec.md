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

## Acceptance Criteria

1. `grep -r "OBS_NOT_IMPLEMENTED" src/` returns no results, OR the stub is isolated from any user-visible integration panel.
2. Clicking "Presenter Mode" in the app opens a real Tauri window.
3. README feature table has zero claims without implementation backing.
4. `npm run lint && npm run test:unit && npm run build` pass.

## Risks

- Rewriting README may make the product look narrower short-term.
- Presenter window lifecycle changes could affect existing Cypress tests.
- PDF inversion may interact unexpectedly with annotation rendering.

## Open Questions

- Should OBS integration be added to the active roadmap or explicitly deferred?
- Should page inversion be a separate toggle or tied to dark mode?
- Should the unused annotation types be removed or implemented?

## Sources

- `.loom/10-research.md` (feature reality audit)
- `README.md:19,29,31,35,47,65-66`
- `src/stores/integration.store.ts:343-355`
- `src-tauri/src/commands/presenter.rs:72-290`
- `src/hooks/useViewModes.ts:32-69`
