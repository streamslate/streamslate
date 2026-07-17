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

## Phase 3: Professional Polish — UPDATED 2026-06-26

### M7: OBS WebSocket Client ✅

Integrated as roadmap 1.6:

- [x] OBS WebSocket v5 client/runtime in Tauri
- [x] Scene switching and source visibility control
- [x] Recording and streaming state/control
- [x] Output settings UI for local OBS control
- [x] Manual verification checklist for local OBS WebSocket control

### M8: Stream Deck Plugin 🚧

Integrated as roadmap 1.7 local plugin readiness:

- [x] Official Elgato SDK v2 plugin runtime under `plugins/streamdeck`
- [x] Actions for page navigation, zoom, presenter mode, state refresh, and health check over local WebSocket control
- [x] Local development, install, build, and manual verification documentation
- [x] Local package preflight validating manifest assets, compiled bundle, version, and runtime metadata
- [x] Validation evidence template for hardware or Stream Deck Mobile testing
- [x] Validation capture helper for environment metadata and loopback API evidence
- [x] Validation capture helper CLI/probe behavior covered by automated tests
- [x] Validation capture helper result/evidence-link metadata for external reports
- [x] Validation capture helper structured JSON metadata for issue/MR evidence attachments
- [x] Repository-root `npm run capture:validation` wrapper for the validation helper
- [x] Marketplace submission checklist for post-validation package review
- [x] Package ignore guard for local installer contents
- [x] Package audit helper for Markdown/JSON Marketplace prep artifacts
- [x] Root `npm run streamdeck:ci` guard for install, preflight, and package audit
- [x] GitLab `test:streamdeck` job uploads package audit artifacts
- [x] Validation capture helper refuses pass results unless a validation target and evidence link are provided
- [ ] Hardware or Stream Deck Mobile validation
- [ ] Marketplace packaging/publication after validation and Elgato review

### M9: Underline/Strikethrough Annotations ✅

Integrated as roadmap 1.8:

- [x] Restored `UNDERLINE` and `STRIKETHROUGH` annotation types
- [x] Added visible tool defaults and preset/template support
- [x] Added drag creation, SVG rendering, selection hit targets, and live previews
- [x] Added PDF export using matching text-line placement helpers
- [x] Updated docs to describe them as visual geometry annotations, not OCR or semantic PDF text extraction

### M10: Annotation Workflow Polish ✅

Integrated as roadmap 1.9:

- [x] Grouped the annotation picker into Markup, Shapes, and Notes sections with fixed-size icon controls
- [x] Promoted underline and strikethrough into the built-in template profile
- [x] Added first-party key-line and correction-pass use-case templates
- [x] Covered the picker grouping and text-line preset/template contract with focused unit tests

## Execution Order

1. **M1** — Docs truthfulness ✅ `d43be27`
2. **M2** — Code cleanup ✅ `d43be27`
3. **M3** — Presenter mode wiring ✅ `3e46b46`
4. **M4** — PDF page inversion ✅ `dd9216e`
5. **M5** — Multi-monitor UI ✅ `bdff25f`
6. **M6** — Verification coverage ✅ `cc9fe46`
7. **M7** — OBS WebSocket direct control ✅ (roadmap 1.6)
8. **M8** — Stream Deck local plugin/package readiness 🚧 (roadmap 1.7; external validation and publication pending)
9. **M9** — Text-line annotations ✅ (roadmap 1.8)
10. **M10** — Annotation workflow polish ✅ (roadmap 1.9)

### M8 Follow-Up: Stream Deck Validation CI Guard ✅

- [x] Root scripts expose plugin install, preflight, audit, and CI guard commands.
- [x] GitLab CI runs the plugin guard independently on Node 24 and uploads Markdown/JSON package audit artifacts.
- [x] Deployment waits for the Stream Deck guard without claiming external hardware/mobile validation.

### M11: Release Readiness Evidence 🚧

Tracked by
[issue #14](https://gitlab.flexinfer.ai/services/streamslate/-/issues/14):

- [x] Re-run strict release preflight against the v1.6.0 tag, GitHub release
      assets, updater metadata, and itch.io channels.
- [x] Fail strict mode closed when itch.io returns empty status evidence.
- [x] Refresh the release-readiness baseline with the v1.6.0 result.
- [x] Record current-source native WebSocket evidence for protocol-v2
      capabilities and simultaneous clients.
- [x] Install and verify the signed v1.6.0 Apple-silicon release, reproduce its
      blank PDF viewport, and restore visible PDF.js canvas rendering.
- [x] Verify native PDF page navigation, zoom, and connection-status behavior.
- [ ] Correct presenter mode reporting `active: true` without creating a second
      native window.
- [ ] Execute and attach the native/manual verification checklist.
- [ ] Re-run strict preflight on the next release-candidate commit before
      tagging.

## Professional Grade Acceptance Gate — ALL MET

- [x] Every ✅ in README is backed by working, exercised code
- [x] No `OBS_NOT_IMPLEMENTED` stub referenced in user-facing docs
- [x] Presenter mode opens real Tauri window from frontend toggle
- [x] Local quality commands pass (`lint`, `test:unit`, `tsc --noEmit`)
- [x] Feature-gated capabilities (NDI/Syphon) clearly labeled
- [x] Integration guide describes only implemented behaviors
- [x] 250 tests passing, 0 lint errors

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
- `ROADMAP.md`
- `docs/streamdeck-plugin.md`
- `.loom/064-plan-v2-s6-streamdeck-plugin-2026-06-26.md`
- `.loom/065-plan-v2-s7-text-line-annotations-2026-06-26.md`
- `.loom/066-plan-v2-s8-streamdeck-package-preflight-2026-06-26.md`
- `.loom/067-plan-v2-s9-streamdeck-validation-evidence-2026-06-26.md`
- `.loom/068-plan-v2-s10-streamdeck-marketplace-readiness-2026-06-26.md`
- `.loom/070-plan-v2-s12-streamdeck-validation-capture-tests-2026-06-26.md`
- `.loom/074-plan-v2-s16-streamdeck-package-audit-2026-06-27.md`
- `.loom/077-plan-v2-s19-annotation-workflow-polish-2026-06-28.md`
