# Implementation Plan — Professional Grade

## Objective

Close all feature truthfulness gaps and implementation mismatches to bring StreamSlate to professional grade: every claim in README is backed by working code, and every shipped feature has appropriate validation coverage.

## Baseline

- Repo version: `1.4.0`
- CI: typecheck, format, lint, unit tests, Rust tests, Cypress, frontend build, Tauri build (macOS/Windows/Linux)
- Codebase index: 593 chunks (lexical)
- M0 (local validation): complete
- M1 (docs truthfulness): partially complete — README/ROADMAP modified but not committed

## Phase 1: Truthfulness Remediation

### M1: Fix Documentation Claims (docs-only)

Status: in progress (working copy has partial fixes)

**README.md changes needed:**

| Line | Current Claim | Fix |
|------|--------------|-----|
| 29 | "WCAG-contrast color swatches" | → "Dark-optimized color palette" |
| 19 | "true dark-mode page inversion" | → "dark-first UI with dark chrome and stream-optimized palettes" |
| 31 | "OBS / Stream Deck: Global hotkeys + plug-in, WebSocket control ✅" | → "WebSocket API: Remote page, zoom, presenter, and annotation control via `ws://127.0.0.1:11451` ✅" |
| 35 | NDI/Syphon ✅ | → Add "(build-time opt-in, requires NDI SDK / Syphon.framework)" |
| 47 | `?token=YOUR_TOKEN` | → Remove token parameter |
| 65-66 | OBS/Stream Deck integration steps | → Rewrite as WebSocket API integration guide |

**ROADMAP.md changes needed:**

| Item | Fix |
|------|-----|
| Post-1.1 items all marked ✅ | Verify each against implementation; NDI/Syphon correct but should note feature-gate |
| No mention of OBS/Stream Deck gap | Add explicit "Future" items for OBS WebSocket client and Stream Deck plugin |

**Other docs:**
- `docs/release-readiness-1.0.md` → Already updated in working copy
- Remove or archive `docs/plugins/manifest.json` and `test_plugin.js` (or clearly label as "example/schema")

Deliverables:
- [ ] Corrected README.md feature table
- [ ] Corrected README.md integration guide
- [ ] Corrected ROADMAP.md with explicit future items
- [ ] Plugin docs labeled as API schema/PoC

### M2: Code Cleanup (minimal code changes)

Status: not started

- Remove unused annotation types from `AnnotationType` enum (`UNDERLINE`, `STRIKETHROUGH`, `STAMP`, `NOTE`) or implement them
- Remove `connectOBS()` stub from integration store (or clearly mark as future)
- Remove token reference from any user-facing code/comments

Deliverables:
- [ ] Clean `pdf.types.ts` enum
- [ ] Clean integration store OBS stub
- [ ] No dead-code references to unimplemented features

## Phase 2: Implementation Gap Closure

### M3: Presenter Mode Wiring

Status: not started

The Tauri backend has complete presenter commands (`open_presenter_mode`, `close_presenter_mode`, `toggle_presenter_mode`, `update_presenter_config`, `set_presenter_page`, `get_presenter_state`) but the frontend `useViewModes.ts` only manages local state.

Tasks:
- [ ] Wire `useViewModes` presenter toggle to invoke Tauri `toggle_presenter_mode` command
- [ ] On presenter mode enter: invoke `open_presenter_mode` to show the Tauri window
- [ ] On presenter mode exit: invoke `close_presenter_mode`
- [ ] Verify page sync works end-to-end between main and presenter windows
- [ ] Add unit test for presenter mode toggle lifecycle

### M4: PDF Page Inversion

Status: not started

Add a "dark page" mode that inverts the PDF canvas for stream-friendly dark backgrounds.

Tasks:
- [ ] Add CSS `filter: invert(1) hue-rotate(180deg)` to PDF canvas container when dark mode + inversion enabled
- [ ] Add toggle in settings/toolbar for "Invert PDF pages"
- [ ] Ensure annotations render correctly over inverted canvas
- [ ] Add unit test for inversion toggle

### M5: Multi-Monitor UI Promotion

Status: not started

Move display selection from debug-only `NDIControls.tsx` into a proper settings panel.

Tasks:
- [ ] Create "Output" settings section accessible from main UI
- [ ] Display enumeration with primary display indicator
- [ ] Capture source selection (window vs display)
- [ ] NDI/Syphon enable/disable controls with status
- [ ] Frame rate and resolution display

### M6: Verification Coverage

Status: partially started (PresenterView.test.tsx, UpdateBanner.test.tsx exist as untracked files)

Tasks:
- [ ] Add test for presenter mode toggle lifecycle (frontend → Tauri command invocation)
- [ ] Add test for settings export/import round-trip
- [ ] Add test for annotation type rendering (each of the 6 working types)
- [ ] Add test for WebSocket command handling (at least page nav + state)
- [ ] Document manual verification checklist for NDI/Syphon/multi-monitor

## Phase 3: Professional Polish (Future)

### M7: OBS WebSocket Client (Optional)

If OBS integration is desired:
- Implement OBS WebSocket v5 client in Rust or frontend
- Scene switching, source control, streaming/recording state
- This is a significant feature — scope separately

### M8: Stream Deck Plugin (Optional)

If Stream Deck support is desired:
- Build proper Elgato Stream Deck SDK v2 plugin
- Package with property inspectors and action images
- This is a standalone deliverable — scope separately

### M9: Underline/Strikethrough Annotations (Optional)

If text-level annotations are desired:
- Implement `UNDERLINE` and `STRIKETHROUGH` rendering in AnnotationLayer
- Add to TOOLS array in presets.ts
- Add to PDF export in exporter.ts

## Execution Order

1. **M1** — Docs truthfulness (immediate, low risk)
2. **M2** — Code cleanup (immediate, low risk)
3. **M3** — Presenter mode wiring (short, medium risk)
4. **M4** — PDF page inversion (short, low risk)
5. **M5** — Multi-monitor UI (medium, low risk)
6. **M6** — Verification coverage (parallel with M3-M5)
7. **M7-M9** — Future scope (backlog)

## Acceptance Gate

- [ ] Every ✅ in README is backed by working, exercised code
- [ ] No `OBS_NOT_IMPLEMENTED` stub referenced in user-facing docs
- [ ] Presenter mode opens real Tauri window from frontend toggle
- [ ] Local quality commands pass (`lint`, `test:unit`, `build`, `release:preflight`)
- [ ] Feature-gated capabilities (NDI/Syphon) clearly labeled
- [ ] Integration guide describes only implemented behaviors

## Sources

- `.loom/10-research.md` (feature reality audit)
- `README.md:19,29,31,35,47,65-66`
- `ROADMAP.md:47-56`
- `src-tauri/src/commands/presenter.rs:72-290`
- `src/hooks/useViewModes.ts:32-69`
- `src/stores/integration.store.ts:343-355`
- `src/types/pdf.types.ts:65-76`
- `src/components/pdf/AnnotationLayer.tsx:243-416`
- `src/components/debug/NDIControls.tsx:104-176`
