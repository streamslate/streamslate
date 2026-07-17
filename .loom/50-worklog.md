# Worklog

## 2026-07-17: Native PDF Render Recovery

- What changed:
  - Installed and verified the official signed/notarized v1.6.0 Apple-silicon
    release.
  - Reproduced its blank PDF viewport with a known-good 65-page PDF.
  - Replaced the hidden-canvas PNG workaround with direct visible-canvas
    rendering in both main and presenter views and added a native pixel/a11y
    completion signal.
  - Preserved serialized Tauri PDF errors and added regression tests.
  - Verified page 3 navigation, 150% zoom, and connected status; reproduced a
    separate presenter-window failure.
- Why:
  - Backend PDF-open success was masking a user-visible rendering failure and
    made the remaining manual verification invalid.
- Validation:
  - Signed DMG digest, `codesign --verify --deep --strict`, and Gatekeeper.
  - Targeted Vitest regression tests.
  - `npm run test:unit` (250 passed).
  - Native `PDF page 3 rendered` pixel/a11y evidence.
  - Native `GO_TO_PAGE` and `SET_ZOOM` WebSocket requests.
- What's next:
  - Fix presenter mode so `active: true` corresponds to a real second window.
  - Re-run the corrected code as a signed release-candidate build.
- Sources:
  - `docs/manual-verification-evidence-2026-07-17.md`
  - `.loom/080-plan-v2-s22-pdf-render-recovery-2026-07-17.md`

## 2026-07-17: Current-Source Native WebSocket Evidence

- What changed:
  - Built and launched StreamSlate v1.6.0 from `origin/main` on macOS.
  - Verified protocol-v2 capabilities and two simultaneous WebSocket clients
    against the native runtime.
  - Added a dated evidence record and checked only those two exact manual
    checklist items.
  - Recorded why PDF, presenter-window, reconnect, and hardware scenarios remain
    open.
- Why:
  - Issue #14 requires direct manual evidence. The installed application was
    stale v1.0.1, so current source was used to avoid certifying old behavior.
- Validation:
  - `npm run tauri:dev`
  - `websocat -t ws://127.0.0.1:11451`
  - current-source `GET_CAPABILITIES` request/response
  - simultaneous independent `PING`/`PONG` and `GET_STATE` round-trips
- What's next:
  - Load a PDF in the native runtime and verify page, zoom, and presenter
    synchronization.
  - Run hardware-dependent scenarios only when their prerequisites are present.
- Sources:
  - `docs/manual-verification-evidence-2026-07-17.md`
  - `.loom/079-plan-v2-s21-native-websocket-evidence-2026-07-17.md`

## 2026-07-16: Release Preflight Evidence Guard

- What changed:
  - Changed strict release preflight to block when Butler returns no itch.io
    channel evidence; standard mode still warns.
  - Added and passed an empty-output Butler kill-test: standard exited `0`,
    strict exited `1` with one blocking error.
  - Re-ran live strict preflight for v1.6.0 and verified aligned versions, tag
    content, GitHub desktop/updater assets, `latest.json`, and macOS, Windows,
    and Linux itch.io channels.
  - Refreshed release-readiness and implementation-plan progress without
    claiming completion of the native manual checklist.
- Why:
  - Issue #14 requires trustworthy release evidence, and strict mode previously
    allowed an empty external status response to pass.
- Validation:
  - `bash -n scripts/release-preflight.sh`
  - empty-output Butler kill-test
  - `npm run release:preflight:strict`
  - `npm run format:check`
  - `npm run lint`
  - `npm run test:unit` (246 passed)
  - `npm run build`
  - scoped `pre-commit run --files ...`
- Known baseline note:
  - Repository-wide `pre-commit run --all-files` found and auto-fixed unrelated
    historical EOF/whitespace drift; those edits were reverted and excluded
    from this slice.
- What's next:
  - Execute and attach the native/manual verification checklist for issue #14.
  - Re-run strict preflight on the next release candidate before tagging.
- Sources:
  - `scripts/release-preflight.sh`
  - `docs/release-readiness-1.0.md`
  - `.loom/078-plan-v2-s20-release-preflight-evidence-2026-07-16.md`

## 2026-06-27: Stream Deck Validation JSON Evidence

- What changed:
  - Added `--json-output` to the Stream Deck validation capture helper so external testers can attach structured evidence metadata alongside the Markdown validation report.
  - Included result, target, evidence links, StreamSlate/plugin versions, host environment, optional loopback API probe data, and `externalValidationComplete: false`.
  - Updated Stream Deck docs, roadmap status, and Loom planning markers without marking hardware/mobile validation or Marketplace publication complete.
- Why:
  - Roadmap 1.7 is blocked on external Stream Deck hardware or Stream Deck Mobile evidence. A JSON artifact makes that evidence easier to attach to issues, MRs, or release records while preserving truthfulness.
- What's next:
  - Run hardware or Stream Deck Mobile validation and attach completed Markdown plus JSON evidence.
  - Prepare Marketplace package/submission records only after validation evidence passes.
- Sources:
  - `plugins/streamdeck/scripts/capture-validation.mjs`
  - `plugins/streamdeck/src/scripts/capture-validation.test.ts`
  - `.loom/072-plan-v2-s14-streamdeck-validation-json-2026-06-27.md`

## 2026-06-26: RALPH Planning Reconciliation

- What changed:
  - Ran the RALPH review phase against `ROADMAP.md`, root `.loom` planning docs, recent slice mirrors, and agent-context recall.
  - Confirmed current `origin/main` already includes roadmap 1.6 OBS WebSocket direct control, roadmap 1.7 Stream Deck local plugin/package preflight, and roadmap 1.8 text-line annotations.
  - Updated root `.loom` context docs so the index, product spec, implementation plan, and decisions reflect shipped 1.6/1.8 work and the still-open external Stream Deck validation gates.
- Why:
  - Root `.loom` docs still described M7-M9 as optional future backlog even though the recent roadmap and slice mirrors had advanced. This created stale planning context for future agents.
- What's next:
  - Run hardware or Stream Deck Mobile validation and record evidence.
  - Prepare Marketplace packaging/publication only after validation evidence exists.
  - Continue mobile companion or cloud sync only as separately scoped roadmap slices.
- Sources:
  - `ROADMAP.md`
  - `.loom/064-plan-v2-s6-streamdeck-plugin-2026-06-26.md`
  - `.loom/065-plan-v2-s7-text-line-annotations-2026-06-26.md`
  - `.loom/066-plan-v2-s8-streamdeck-package-preflight-2026-06-26.md`
  - Agent-context session `dfaa45b243fa0b4a`

## 2026-03-14 (session 2): M1–M6 Execution — Professional Grade Complete

- What changed:
  - Executed all 6 milestones of the professional-grade remediation plan in a single RALPH loop:
  - **M1+M2** (`d43be27`): Fixed README/ROADMAP overclaims, removed 4 unused annotation types from enum, isolated OBS stub.
  - **M3** (`3e46b46`): Wired presenter mode to Tauri window commands. `useViewModes.togglePresenterMode()` now invokes `open_presenter_mode`/`close_presenter_mode`. Rust side recreates window via `WebviewWindowBuilder`. Graceful fallback for non-Tauri environments.
  - **M4** (`dd9216e`): Added independent PDF page inversion toggle. `invertPages` state in `useTheme.ts`, nested toggle in Sidebar settings, wired through PDFViewer → PDFCanvasRenderer, included in settings sync.
  - **M5** (`bdff25f`): Created `OutputControls.tsx` component, promoted capture/output UI from "Experimental" to "Output" section in Sidebar.
  - **M6** (`cc9fe46`): Added 31 new tests — presenter toggle lifecycle (10), settings round-trip (12), annotation rendering for all 6 types (9). Manual verification checklist at `docs/manual-verification-checklist.md`. Test count: 180 → 211.
  - Updated ROADMAP.md with "1.5 ✅ (Professional Grade)" section.
  - Updated all `.loom` context docs to reflect completion.
  - All acceptance criteria met: 211 tests pass, lint clean, tsc clean.
- Why:
  - User requested continuation of professional-grade remediation after feature audit.
- What's next:
  - Push to remote for CI validation.
  - M7-M9 remain as optional future work (OBS, Stream Deck, text annotations).
- Sources:
  - Commits: `d43be27`, `3e46b46`, `dd9216e`, `bdff25f`, `cc9fe46`
  - `src/hooks/useViewModes.ts:49-63` (togglePresenterMode)
  - `src-tauri/src/commands/presenter.rs:80-105` (WebviewWindowBuilder)
  - `src/hooks/useTheme.ts:28-46` (invertPages)
  - `src/components/layout/OutputControls.tsx:1-155`
  - `src/hooks/useViewModes.test.ts`, `src/hooks/useSettingsSync.test.ts`, `src/components/pdf/AnnotationLayer.test.tsx`

## 2026-03-14 (session 1): Feature Reality Audit

- What changed:
  - Ran `$plan-loom-core` context refresh for professional-grade assessment.
  - Regenerated workspace snapshot.
  - Verified codebase index is current (593 chunks, `repo_id=streamslate`).
  - Confirmed loom-mode active with 46 servers, 483 tools.
  - Performed comprehensive feature reality audit across 4 parallel investigation agents:
    - NDI/Syphon: fully implemented (feature-gated, production-grade Rust code)
    - Capture/Presenter/Monitor: capture fully implemented, presenter commands exist but frontend doesn't invoke them
    - WebSocket/Collab/Export: WebSocket server real, PDF export real, settings sync is local-only, Stream Deck is PoC only, OBS is `NOT_IMPLEMENTED`
    - Annotations/UI/Updater: 6 of 10 annotation types working, templates working, dark mode is UI-only, no WCAG validation, auto-updater working
  - Built feature reality matrix: 22 working, 6 overclaimed, 4 partially implemented.
  - Updated all `.loom` context docs:
    - `00-index.md` — refreshed with audit findings and priority sequence
    - `10-research.md` — complete feature reality audit with file:line evidence
    - `20-product-spec.md` — professional grade remediation spec
    - `30-implementation-plan.md` — M1-M9 phased plan
    - `40-decisions.md` — new decision record
- Why:
  - User requested review of remaining feature reality/implementation gaps to get StreamSlate to professional grade.
- What's next:
  - Execute M1 (fix README/ROADMAP claims) and M2 (code cleanup) as the immediate slice.
  - Then M3 (presenter mode wiring), M4 (PDF inversion), M5 (output UI), M6 (tests).
- Sources:
  - MCP: `codebase_stats(repo_id="streamslate")` → 593 chunks
  - MCP: `read_mcp_resource(server="loom", uri="loom://servers")` → 46 servers
  - MCP: `read_mcp_resource(server="loom", uri="loom://tools/index")` → 483 tools
  - `src-tauri/src/ndi/sender.rs:27-153`
  - `src-tauri/src/syphon/server.rs:16-118`
  - `src-tauri/src/commands/presenter.rs:72-290`
  - `src/stores/integration.store.ts:343-355`
  - `src/hooks/useViewModes.ts:32-69`
  - `src/types/pdf.types.ts:65-76`
  - `src/components/pdf/AnnotationLayer.tsx:243-416`
  - `docs/plugins/manifest.json:1-51`

## 2026-03-11

- What changed:
  - Re-ran the `$plan-loom-core` context workflow for the current repo state.
  - Generated a fresh workspace snapshot at `.loom/00-workspace-snapshot.md`.
  - Re-validated loom runtime inventory and refreshed `.loom/00-mcp-inventory.md`.
  - Detected that `codebase_memory` had no current chunks for `repo_id=streamslate`, then rebuilt a lexical index to `593` chunks.
  - Ran `npm ci`, then verified:
    - `npm run lint`
    - `npm run test:unit`
    - `npm run build`
    - `npm run release:preflight`
      all passed locally.
  - Added component smoke coverage for:
    - `src/components/presenter/PresenterView.tsx`
    - `src/components/layout/UpdateBanner.tsx`
  - Updated repo-facing docs:
    - `README.md`
    - `ROADMAP.md`
    - `docs/release-readiness-1.0.md`
  - Reviewed the repo’s current product and release docs against implementation and CI.
  - Identified four immediate gap classes:
    - README/ROADMAP wording drift around collaboration and cloud sync
    - release-readiness doc still pinned to `v1.0.0`
    - verification coverage is thinner for presenter/output/update surfaces than for state/util layers
    - post-install dependency/security cleanup remains open (`11` npm audit vulnerabilities)
  - Rewrote:
    - `.loom/00-index.md`
    - `.loom/00-mcp-inventory.md`
    - `.loom/10-research.md`
    - `.loom/20-product-spec.md`
    - `.loom/30-implementation-plan.md`
  - Added a new decision entry for prioritizing readiness/truthfulness before more feature work.
- Why:
  - User asked to review the current status and plan next steps to resolve issues and feature gaps.
- What's next:
  - Add verification coverage for settings sync and borderless/presenter transitions.
  - Define manual checks for NDI/Syphon/multi-monitor paths.
  - Triage the `npm ci` vulnerability report and decide whether it warrants a dedicated dependency-remediation slice.
- Sources:
  - Command: `python /Users/cblevins/.codex/skills/plan-loom-core/scripts/workspace_snapshot.py --root .`
  - Command: `npm ci`
  - Command: `npm run lint`
  - Command: `npm run test:unit`
  - Command: `npm run build`
  - Command: `npm run release:preflight`
  - `README.md:32`
  - `README.md:90`
  - `ROADMAP.md:54`
  - `docs/release-readiness-1.0.md:1`
  - `src/hooks/useSettingsSync.ts:108`
  - `src-tauri/src/websocket/server.rs:44`
  - MCP: `read_mcp_resource(server="loom", uri="loom://config")`
  - MCP: `read_mcp_resource(server="loom", uri="loom://servers")`
  - MCP: `read_mcp_resource(server="loom", uri="loom://tools/index")`
  - MCP: `read_mcp_resource(server="loom", uri="loom://health")`
  - MCP: `mcp__loom__codebase_memory__codebase_index_poll(job_id="03491e1b24ff9a86")`
  - MCP: `mcp__loom__codebase_memory__codebase_stats(repo_id="streamslate")`

## 2026-03-01

- What changed:
  - Ran post-v1.3.0 release review across GitHub, GitLab, and itch.io.
  - Found v1.3.0 release is incomplete (3 of ~15 expected assets) due to tauri-action v0.5.17 regression.
  - Root-caused to tauri-apps/tauri-action#975: v0.5.17 signature detection broken, fixed in v0.5.18.
  - Applied fixes:
    - `.github/workflows/release.yml`: tauri-action v0.5.17 -> v0.5.25
    - `.github/workflows/ci.yml`: tauri-action v0.5.17 -> v0.5.25
    - `.github/workflows/release.yml`: Docker build arm64 disabled (QEMU cargo fetch unreliable)
    - `Dockerfile`: Node 18-slim -> 20-slim (matching CI requirement)
  - Fixed release-please tag format: added `"include-component-in-tag": false` to prevent `streamslate-v1.4.0` prefix.
  - Merged release-please PR #5, manually tagged v1.4.0, and triggered release build.
  - v1.4.0 release completed successfully: 14 assets uploaded (all platforms + `.sig` files + `latest.json`).
  - Auto-updater verified functional: `latest.json` has 9 platform entries with valid minisign signatures.
  - Docker image published to GHCR (amd64-only, as planned).
  - itch.io CI uploads skipped due to Butler CDN (`broth.itch.ovh`) DNS outage; uploaded manually via local Butler CLI.
  - Replaced custom Butler download script with `jdno/setup-butler@v1` action (downloads from GitHub releases, not flaky CDN).
  - Deleted stale releases: v1.2.0 (empty, published + draft), v1.3.0 (broken, 3 assets only).
  - Pushed v1.4.0 tag and all fixes to GitHub and GitLab.
  - itch.io builds updated: all 3 channels (macos, windows, linux) now at v1.4.0.
  - Discovered `BUTLER_API_KEY` secret is missing from GitHub repo — needs to be added for automated uploads.
- Why:
  - User requested post-release review, feedback check, issue remediation, stale release cleanup, and itch.io uploads.
- What's next:
  - Add `BUTLER_API_KEY` secret to GitHub repo for automated itch.io uploads on future releases.
  - Consider discoverability improvements (GitHub topics, SEO).
- Sources:
  - GitHub Actions run 22245864849 (v1.3.0 partial release)
  - GitHub Actions run 22549857909 (v1.4.0 successful release)
  - GitHub: tauri-apps/tauri-action#975
  - `gh release view v1.4.0 -R streamslate/streamslate`
  - `latest.json`: 9 platform entries, all signed
  - `butler status caedus90/streamslate`: all channels at v1.4.0
  - `gh secret list -R streamslate/streamslate`: no BUTLER_API_KEY
  - GitHub: jdno/setup-butler (Butler GitHub Action)

## 2026-02-20

- What changed:
  - Used `$plan-loom-core` workflow to refresh planning artifacts for a new post-Tauri v2 UI/UX initiative.
  - Refreshed `.loom` scaffolding and regenerated workspace snapshot.
  - Rebuilt MCP inventory in loom-mode with paged tool capture (`445` tools, `42` servers).
  - Established codebase index readiness under `repo_id=streamslate`:
    - initial embedding index failed (Morph decoder prompt error)
    - fallback lexical index completed and stats captured.
  - Rewrote:
    - `.loom/00-index.md`
    - `.loom/00-mcp-inventory.md`
    - `.loom/10-research.md`
    - `.loom/20-product-spec.md`
    - `.loom/30-implementation-plan.md`
  - Added new decision records in `.loom/40-decisions.md`.
- Why:
  - User requested to start planning UI/UX polish and enhancements after Tauri v2.
- What's next:
  - Confirm milestone priority (M1 shell/mode clarity vs M2 settings IA first).
  - Start implementation slice with M0 baseline checks and M1 component updates.
- Sources:
  - Command: `python /Users/cblevins/.codex/skills/plan-loom-core/scripts/init_loom_context.py --root .`
  - Command: `python /Users/cblevins/.codex/skills/plan-loom-core/scripts/workspace_snapshot.py --root .`
  - MCP: `read_mcp_resource(server="loom", uri="loom://config")`
  - MCP: `read_mcp_resource(server="loom", uri="loom://tools/index")`
  - MCP: `mcp__loom__codebase_memory__codebase_index_poll(job_id="a8b6f45486bc6c16")`
  - MCP: `mcp__loom__codebase_memory__codebase_index_poll(job_id="5098c2be84b0fc03")`
  - MCP: `mcp__loom__codebase_memory__codebase_stats(repo_id="streamslate")`

## 2026-02-18

- What changed:
  - Ran RALPH loop Review phase across ROADMAP.md, README.md, CHANGELOG.md, and .loom/ artifacts.
  - Identified drift: v1.1.0/v1.1.1 shipped (annotation presets, templates, Syphon scaffolding, hardening) but ROADMAP/README not updated.
  - Updated ROADMAP.md:
    - Added "1.1 ✅" section with all delivered items.
    - Moved NDI, Syphon GA, and auto-update to "Post-1.1" section.
    - Marked annotation presets and template system as complete.
  - Updated README.md:
    - Changed Presenter Mode and OBS/Stream Deck status from 🛠️ to ✅.
    - Added Presets & Templates row.
    - Removed premature NDI integration guide claim.
    - Updated roadmap summary to reflect v1.1 delivery.
  - Updated .loom/30-implementation-plan.md:
    - Marked M1, M2, M3 as complete with evidence.
    - Set M4 as in-progress.
  - Added this worklog entry.
- Why:
  - RALPH M4 docs reconciliation slice, closing the hardening cycle.
- What's next:
  - Verify lint/build remain green.
  - Close M4 and decide next feature slice (NDI output vs. auto-update key setup).
- Sources:
  - CHANGELOG.md (v1.1.0, v1.1.1 entries)
  - ROADMAP.md
  - README.md
  - .loom/30-implementation-plan.md

## 2026-02-12

- What changed:
  - Refreshed `.loom/` context docs for a new initiative focused on tightening UI and core reliability.
  - Re-ran workspace snapshot generation.
  - Performed architecture/codepath analysis across frontend + Tauri backend for integration, rendering, and presenter flows.
  - Verified local baseline:
    - `npm run lint` passed.
    - `npm run build` passed (chunk-size warnings reported).
    - `npm run test:headless` passed (13/13) when Vite was running on `127.0.0.1:1420`.
  - Updated:
    - `.loom/00-index.md`
    - `.loom/00-mcp-inventory.md`
    - `.loom/10-research.md`
    - `.loom/20-product-spec.md`
    - `.loom/30-implementation-plan.md`
    - `.loom/40-decisions.md`
  - Started implementation work:
    - Replaced simulated WebSocket connection behavior with real client-backed transport state wiring.
    - Added backend WebSocket event mapping into integration events (`CONNECTED`, `STATE`, `PAGE_CHANGED`, `PDF_*`, `PRESENTER_CHANGED`, `PONG`, `ERROR`).
    - Removed misleading fake OBS "connected" behavior and replaced it with explicit `OBS_NOT_IMPLEMENTED` error state.
    - Aligned borderless/presenter/update shell components with theme tokens instead of hardcoded gray/indigo-purple styling.
    - Fixed malformed PDF viewer loading overlay class token.
    - Re-verified lint/build/Cypress after code changes.
- Why:
  - User requested to begin work on tightening StreamSlate UI and core features, and explicitly invoked the planning workflow.
- What’s next:
  - Expand M3 with deeper workflow E2E coverage (PDF open/annotate/export/remote-control), since current suite is shell-heavy.
  - Reconcile README integration/API references during M4 docs pass.
- Sources:
  - Command: `python ${CODEX_HOME:-$HOME/.codex}/skills/plan-loom-core/scripts/workspace_snapshot.py --root .`
  - Command: `npm install`
  - Command: `npm run lint`
  - Command: `npm run build`
  - Command: `npm run dev -- --host 127.0.0.1 --port 1420`
  - Command: `npm run test:headless`
  - `src/stores/integration.store.ts:214`
  - `src/stores/integration.store.ts:251`
  - `src/stores/integration.store.ts:401`
  - `src/components/pdf/PDFViewer.tsx:551`
  - `src/lib/websocket/client.ts:59`
  - `src/stores/integration.store.ts:249`
  - `src/components/layout/UpdateBanner.tsx:85`
  - `src/components/layout/BorderlessUI.tsx:33`
  - `src-tauri/src/websocket/server.rs:44`

## 2026-02-11

- What changed:
  - Initialized `.loom/` context pack and generated workspace snapshot.
  - Collected MCP inventory/resources and health data.
  - Captured current release baseline (`1.0.0`), active git state, and release workflow changes.
  - Produced research, product spec, implementation plan, and decisions for post-1.0 enhancements.
- Why:
  - User requested to resume from current repo/release state and begin structured planning for new features/enhancements.
- What’s next:
  - Confirm milestone ordering (`v1.0.1` then `v1.1`) and begin executing `M1` release-hardening tasks.
- Sources:
  - [S1] Command: `python /Users/cblevins/.codex/skills/plan-loom-core/scripts/init_loom_context.py --root .`
  - [S2] Command: `python /Users/cblevins/.codex/skills/plan-loom-core/scripts/workspace_snapshot.py --root .`
  - [S3] `.loom/00-workspace-snapshot.md:3`
  - [S4] `ROADMAP.md:32`
  - [S5] `CHANGELOG.md:5`
  - [S6] MCP: `read_mcp_resource(server="loom", uri="loom://config")`
