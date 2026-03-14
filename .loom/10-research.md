# Research Brief — Feature Reality Audit

## Problem

StreamSlate v1.4.0 claims production-ready status across README, ROADMAP, and feature highlights, but several feature claims diverge from what the source code actually implements. This audit maps every claimed feature to implementation evidence and classifies gaps by severity.

## Method

- Read all feature claims in README.md, ROADMAP.md, and docs/.
- For each claim, traced to Rust backend (`src-tauri/src/`) and React frontend (`src/`) source.
- Used codebase index (593 chunks) plus full file reads for deep inspection.
- Cross-checked CI workflow, package.json scripts, and Tauri config.

---

## Feature Reality Matrix

### Fully Implemented (Real, Working)

| #   | Feature                                          | Claim                     | Evidence                                                        |
| --- | ------------------------------------------------ | ------------------------- | --------------------------------------------------------------- |
| 1   | PDF Viewing                                      | Core viewer               | `src/components/pdf/PDFViewer.tsx`, PDF.js renderer             |
| 2   | Highlight annotation                             | ✅                        | `AnnotationLayer.tsx:235-237`, `presets.ts:127`                 |
| 3   | Rectangle annotation                             | ✅                        | `AnnotationLayer.tsx:244-254`                                   |
| 4   | Circle annotation                                | ✅                        | `AnnotationLayer.tsx:256-265`                                   |
| 5   | Arrow annotation                                 | ✅                        | `AnnotationLayer.tsx:267-316`                                   |
| 6   | Free-draw (free-ink)                             | ✅                        | `AnnotationLayer.tsx:377-411`                                   |
| 7   | Text annotation                                  | ✅                        | `AnnotationLayer.tsx:319-374`, `TextAnnotationEditor.tsx`       |
| 8   | Template/preset system                           | ✅                        | `TemplatePacks.tsx:47-306`, `presets.ts:163-188`                |
| 9   | Dark mode (UI chrome)                            | ✅                        | `useTheme.ts:22-41`, Tailwind dark class                        |
| 10  | WebSocket server                                 | ✅                        | `server.rs:39-80`, binds `127.0.0.1:11451`                      |
| 11  | Remote control (page/zoom/presenter/annotations) | ✅                        | `protocol.rs:26-58`, 9 commands                                 |
| 12  | PDF export with annotations                      | ✅                        | `exporter.ts:66-304`, 6 annotation types embedded via pdf-lib   |
| 13  | Settings export/import                           | ✅                        | `useSettingsSync.ts:114-154`, JSON file download/upload         |
| 14  | Auto-updater                                     | ✅                        | `UpdateBanner.tsx:9-59`, `@tauri-apps/plugin-updater`           |
| 15  | NDI output                                       | ✅ (feature-gated)        | `ndi/sender.rs:27-153`, `grafton-ndi` crate, full send pipeline |
| 16  | Syphon output                                    | ✅ (macOS, feature-gated) | `syphon/server.rs:16-118`, `syphon_bridge.m:22-118`, Metal GPU  |
| 17  | Screen capture                                   | ✅ (macOS)                | `capture/mod.rs:54-182`, ScreenCaptureKit                       |
| 18  | Multi-monitor capture                            | ✅                        | `capture/mod.rs:186-286`, display enumeration + selection       |
| 19  | Presenter view (content sync)                    | ✅                        | `PresenterView.tsx:108-218`, Tauri events + WS fallback         |
| 20  | Cross-platform builds                            | ✅                        | CI: macOS, Windows, Linux in `.github/workflows/ci.yml`         |
| 21  | Borderless mode                                  | ✅                        | `useViewModes.ts:33`, `BorderlessUI.tsx`                        |
| 22  | Page navigation + zoom                           | ✅                        | `PageNavigation.tsx`, `ZoomControls.tsx`                        |

### Partially Implemented (Gap Between Claim and Code)

| #   | Feature                     | Claim                                 | Reality                                                                                                                                                    | Severity |
| --- | --------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| P1  | Presenter mode lifecycle    | "Borderless window/Browser Source" ✅ | Backend commands exist (`presenter.rs:72-290`) but frontend **never invokes** them. `useViewModes.ts` toggles local state only—no Tauri window open/close. | HIGH     |
| P2  | Annotation: Underline       | "underline" in feature list           | `AnnotationType.UNDERLINE` defined in `pdf.types.ts:68` but no rendering case in `AnnotationLayer.tsx` and not in TOOLS array                              | MEDIUM   |
| P3  | Multi-monitor UI            | "Pick any display"                    | Selection UI exists only in `NDIControls.tsx` (debug panel), not in main settings                                                                          | MEDIUM   |
| P4  | PresenterConfig application | Config accepted by command            | `open_presenter_mode` accepts `PresenterConfig` but ignores it (line 104 unused)                                                                           | LOW      |

### Overclaimed in Documentation (No Implementation)

| #   | Feature                | Claim Location                                             | Reality                                                                                                      | Severity     |
| --- | ---------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------ |
| O1  | OBS integration        | README:31 "Global hotkeys + plug-in, WebSocket control ✅" | `integration.store.ts:343-355`: `connectOBS()` returns `OBS_NOT_IMPLEMENTED` error. No OBS WebSocket client. | **CRITICAL** |
| O2  | Stream Deck plug-in    | README:31, README:66 "official StreamSlate plug-in"        | Only `docs/plugins/manifest.json` (schema) + `test_plugin.js` (PoC). No real SDK integration.                | **CRITICAL** |
| O3  | WCAG-contrast swatches | README:29 "WCAG-contrast color swatches ✅"                | Zero WCAG validation code. Colors are hardcoded presets.                                                     | HIGH         |
| O4  | Page inversion         | README:19 "true dark-mode page inversion"                  | Dark mode only toggles UI chrome. No PDF `filter: invert()` or canvas inversion.                             | HIGH         |
| O5  | Presenter token auth   | README:47 `?token=YOUR_TOKEN`                              | `main.tsx:31` routes `/presenter` with no token validation. No auth code.                                    | MEDIUM       |
| O6  | "Global hotkeys"       | README:31                                                  | No global hotkey registration found in source. WebSocket commands exist.                                     | MEDIUM       |

### Correctly Marked as Future

| Feature                 | Location   | Status          |
| ----------------------- | ---------- | --------------- |
| Mobile companion        | ROADMAP:54 | `[ ]` — Correct |
| Cloud sync for settings | ROADMAP:55 | `[ ]` — Correct |

---

## Gap Classification

### P0 — Critical (Must Fix Before Professional Grade)

1. **OBS integration claim is false.** The code explicitly returns `OBS_NOT_IMPLEMENTED`. Either implement OBS WebSocket integration or remove the ✅ claim.
2. **Stream Deck "official plug-in" doesn't exist.** Either build a real plugin or remove the claim.
3. **Presenter mode frontend doesn't use backend.** The Tauri commands are ready but the React side only toggles CSS state.

### P1 — High (Significant Truthfulness Gap)

4. **"WCAG-contrast" is marketing copy with no code backing.** Remove claim or implement contrast validation.
5. **"Page inversion" is not implemented.** Dark mode only affects UI chrome. Either add PDF inversion or reword.
6. **README integration guide mentions features that don't work** (OBS scene control, Stream Deck actions).

### P2 — Medium (Polish Gaps)

7. **Underline/strikethrough annotation types** defined but not rendered.
8. **Multi-monitor selection** hidden in debug UI.
9. **Presenter URL token** documented but not enforced.
10. **NDI/Syphon require feature flags** — README should clarify these are opt-in at build time.

### P3 — Low (Nice to Have)

11. **Annotation types Stamp/Note** defined but not rendered (remove from enum or implement).
12. **PresenterConfig** accepted but unused.

---

## Recommendation

Two-phase approach to professional grade:

**Phase 1: Truthfulness Remediation (docs + minimal code)**

- Rewrite README feature table to accurately reflect implementation
- Remove or reword OBS, Stream Deck, WCAG, page inversion claims
- Clarify NDI/Syphon as build-time feature flags
- Remove token from presenter URL example
- Clean up unused annotation types from enum

**Phase 2: Implementation Gaps (code changes)**

- Wire presenter mode frontend to Tauri commands
- Add PDF page inversion (CSS filter on canvas)
- Implement underline annotation rendering
- Move multi-monitor selection to main settings UI
- Consider minimal OBS WebSocket client or remove from roadmap

## Sources

- `README.md:19,29,31,35,47,66`
- `ROADMAP.md:47-50`
- `src-tauri/src/commands/ndi.rs:95-521`
- `src-tauri/src/commands/presenter.rs:72-290`
- `src-tauri/src/ndi/sender.rs:27-153`
- `src-tauri/src/syphon/server.rs:16-118`
- `src-tauri/src/syphon/syphon_bridge.m:22-118`
- `src-tauri/src/websocket/server.rs:39-80`
- `src-tauri/src/websocket/protocol.rs:26-58`
- `src-tauri/src/websocket/handlers.rs:45-95`
- `src-tauri/src/capture/mod.rs:54-286`
- `src-tauri/Cargo.toml:47,62,65`
- `src/stores/integration.store.ts:343-355`
- `src/hooks/useViewModes.ts:32-69`
- `src/hooks/useSettingsSync.ts:38-154`
- `src/hooks/useNDI.ts:125-165`
- `src/components/pdf/AnnotationLayer.tsx:235-416`
- `src/components/presenter/PresenterView.tsx:108-218`
- `src/components/layout/UpdateBanner.tsx:9-59`
- `src/components/debug/NDIControls.tsx:104-176`
- `src/lib/annotations/presets.ts:66-200`
- `src/lib/pdf/exporter.ts:66-304`
- `src/types/pdf.types.ts:65-76`
- `docs/plugins/manifest.json:1-51`
- `docs/plugins/test_plugin.js:1-89`
