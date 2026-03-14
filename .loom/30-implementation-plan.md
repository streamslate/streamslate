# Implementation Plan — Professional Grade

## Objective

Close all feature truthfulness gaps and implementation mismatches to bring StreamSlate to professional grade: every claim in README is backed by working code, and every shipped feature has appropriate validation coverage.

## Baseline

- Repo version: `1.4.0`
- CI: typecheck, format, lint, unit tests, Rust tests, Cypress, frontend build, Tauri build (macOS/Windows/Linux)
- Codebase index: 593 chunks (lexical)

## Phase 1: Truthfulness Remediation — COMPLETE

### M1: Fix Documentation Claims ✅

Commit: `d43be27` (2026-03-14)

- [x] Corrected README.md feature table (removed OBS/Stream Deck/WCAG/page-inversion overclaims)
- [x] Corrected README.md integration guide (WebSocket-only, removed token parameter)
- [x] Corrected ROADMAP.md with explicit future items
- [x] NDI/Syphon labeled as build-time opt-in

### M2: Code Cleanup ✅

Commit: `d43be27` (2026-03-14, same commit as M1)

- [x] Removed unused annotation types from `AnnotationType` enum (`UNDERLINE`, `STRIKETHROUGH`, `STAMP`, `NOTE`)
- [x] Isolated OBS stub with clarifying comment
- [x] Removed dead annotation label/icon entries from Sidebar

## Phase 2: Implementation Gap Closure — COMPLETE

### M3: Presenter Mode Wiring ✅

Commit: `3e46b46` (2026-03-14)

- [x] `useViewModes.togglePresenterMode()` invokes Tauri `open_presenter_mode` / `close_presenter_mode`
- [x] `exitPresenterMode()` convenience wrapper for ESC key / exit button
- [x] Graceful fallback for non-Tauri environments (dev server in browser)
- [x] Rust `open_presenter_mode` creates window dynamically via `WebviewWindowBuilder`
- [x] `setPresenterMode` remains available for remote control events (no Tauri command needed)

### M4: PDF Page Inversion ✅

Commit: `dd9216e` (2026-03-14)

- [x] Added `invertPages` state to `useTheme.ts` with localStorage persistence
- [x] CSS inversion conditioned on `darkMode && invertPages` (independent toggle)
- [x] "Invert PDF Pages" toggle in Sidebar settings (nested under dark mode)
- [x] Wired through PDFViewer → PDFCanvasRenderer via props
- [x] Included in settings sync export/import

### M5: Multi-Monitor UI Promotion ✅

Commit: `bdff25f` (2026-03-14)

- [x] Created `src/components/layout/OutputControls.tsx` (clean user-facing component)
- [x] Display selector, capture start/stop, Syphon toggle, compact status
- [x] Replaced "Experimental (NDI / Syphon)" section with first-class "Output" section
- [x] Debug features (legacy IPC benchmarking) remain in `debug/NDIControls.tsx`

### M6: Verification Coverage ✅

Commit: `cc9fe46` (2026-03-14)

- [x] Presenter mode toggle lifecycle test (10 tests) — `src/hooks/useViewModes.test.ts`
- [x] Settings export/import round-trip test (12 tests) — `src/hooks/useSettingsSync.test.ts`
- [x] Annotation type rendering test (9 tests) — `src/components/pdf/AnnotationLayer.test.tsx`
- [x] WebSocket command handling — already covered by existing 39+ tests in `dispatcher.test.ts`
- [x] Manual verification checklist — `docs/manual-verification-checklist.md`
- Test count: 180 → 211 (+31 tests)

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

1. **M1** — Docs truthfulness ✅ `d43be27`
2. **M2** — Code cleanup ✅ `d43be27`
3. **M3** — Presenter mode wiring ✅ `3e46b46`
4. **M4** — PDF page inversion ✅ `dd9216e`
5. **M5** — Multi-monitor UI ✅ `bdff25f`
6. **M6** — Verification coverage ✅ `cc9fe46`
7. **M7-M9** — Future scope (backlog)

## Acceptance Gate — ALL MET

- [x] Every ✅ in README is backed by working, exercised code
- [x] No `OBS_NOT_IMPLEMENTED` stub referenced in user-facing docs
- [x] Presenter mode opens real Tauri window from frontend toggle
- [x] Local quality commands pass (`lint`, `test:unit`, `tsc --noEmit`)
- [x] Feature-gated capabilities (NDI/Syphon) clearly labeled
- [x] Integration guide describes only implemented behaviors
- [x] 211 tests passing, 0 lint errors

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
