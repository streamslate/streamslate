# Decisions

## 2026-07-17: Derive Presenter State From Native Visibility

- Decision:
  - Route Tauri and WebSocket presenter toggles through one native lifecycle
    and report active only after the `presenter` window is visible.
  - Hydrate the presenter from native state after its Tauri listeners mount.
  - Convert PDF canvas pixels directly for dark mode instead of relying on a
    compositor-only CSS filter.
- Rationale:
  - Tauri pre-creates a hidden presenter webview, so label existence does not
    prove active output. The former WebSocket path only flipped state.
  - The optional `window.__TAURI__` global is disabled; Tauri's supported
    `isTauri()` detector is required.
  - Buffer-level dark conversion makes black-page/light-text output observable
    before WebKit compositing and preserves mid-tone color identity.
- Consequences:
  - Remote active state is backed by actual native visibility.
  - Presenter PDF/page state survives listener-mount races and cold reopen.
  - Render success requires page contrast, not merely opaque background pixels.
- Sources:
  - `src-tauri/src/commands/presenter.rs`
  - `src-tauri/src/websocket/handlers.rs`
  - `src/components/presenter/PresenterView.tsx`
  - `src/lib/pdf/renderer.ts`
  - `docs/manual-verification-evidence-2026-07-17.md`

## 2026-07-17: Render PDF.js Directly Into the Displayed Canvas

- Decision:
  - Remove the hidden-canvas PNG fallback and make the displayed canvas the
    PDF.js render target.
  - Preserve serialized Tauri error strings in the PDF load error UI.
- Rationale:
  - The signed v1.6.0 release opened a valid 65-page PDF in the backend but
    displayed a blank black page because PDF.js painted a `display: none`
    canvas. The current macOS WKWebView directly rendered the visible canvas,
    and its pixel audit plus accessibility state proved opaque page content.
- Alternatives considered:
  - Keep the hidden canvas and adjust only the PNG conversion timing.
  - Treat backend `open_pdf` success as sufficient and leave the visual defect
    for manual troubleshooting.
- Consequences:
  - Direct-canvas behavior needs release-candidate coverage on non-macOS
    WebViews.
  - Presenter mode remains a separate failed native check because it reports
    active without creating a second window.
- Sources:
  - `src/components/pdf/PDFViewer.tsx`
  - `src/lib/pdf/renderer.ts`
  - `docs/manual-verification-evidence-2026-07-17.md`
  - `.loom/080-plan-v2-s22-pdf-render-recovery-2026-07-17.md`

## 2026-07-17: Mark Only Directly Observed Manual Checks Complete

- Decision:
  - Check a manual-verification item only when its exact user-visible or
    protocol outcome is observed on a current-source runtime.
- Rationale:
  - Backend events, stale installed binaries, or adjacent behavior can provide
    useful diagnostics without proving the checklist wording. Keeping partial
    results explicit prevents release-readiness overclaims.
- Alternatives considered:
  - Treat related unit/E2E coverage as equivalent to native evidence.
  - Check presenter, zoom, and reconnect items from protocol-adjacent results.
- Consequences:
  - This slice completes only protocol-v2 capabilities and simultaneous-client
    checks; PDF, visual, automatic reconnect, and hardware items remain open.
- Sources:
  - `docs/manual-verification-evidence-2026-07-17.md`
  - `.loom/079-plan-v2-s21-native-websocket-evidence-2026-07-17.md`

## 2026-07-16: Strict Release Checks Fail Closed on Empty Channel Evidence

- Decision:
  - Treat an empty `butler status` result as blocking in strict release
    preflight mode while preserving the warning-only behavior in standard mode.
- Rationale:
  - A successful process exit without channel output does not prove that the
    public itch.io artifacts exist. Strict release readiness should require
    positive evidence from every configured distribution surface.
- Alternatives considered:
  - Keep empty output warning-only in both modes.
  - Make empty output blocking in standard and strict modes.
- Consequences:
  - Transient Butler output failures can block a strict release, requiring a
    retry or investigation.
  - Local diagnostic runs remain usable in standard mode.
- Sources:
  - `scripts/release-preflight.sh`
  - `docs/release-readiness-1.0.md`
  - `.loom/078-plan-v2-s20-release-preflight-evidence-2026-07-16.md`

## 2026-06-26: Treat Stream Deck Hardware and Marketplace as External Validation Gates

- Decision:
  - Mark Stream Deck local plugin/package readiness as complete, but keep hardware or Stream Deck Mobile validation and Marketplace publication open until there is direct external evidence.
- Rationale:
  - The repo now contains an official Elgato SDK v2 plugin runtime, action set, compiled package output, and local preflight validation, but this coding environment cannot prove physical hardware/mobile behavior or Elgato review/publication.
- Alternatives considered:
  - Mark the whole Stream Deck milestone complete after local preflight.
  - Keep the local plugin work unclaimed until hardware validation is available.
- Consequences:
  - README and ROADMAP can truthfully claim local SDK v2 plugin/package support while preserving the validation caveat.
  - The next Stream Deck slice should gather hardware/mobile evidence or prepare Marketplace submission only after validation passes.
- Sources:
  - `ROADMAP.md`
  - `docs/streamdeck-plugin.md`
  - `.loom/066-plan-v2-s8-streamdeck-package-preflight-2026-06-26.md`

## 2026-06-26: Restore Underline and Strikethrough as Visual Geometry Annotations

- Decision:
  - Treat underline and strikethrough as supported visual annotation tools, not OCR-backed or PDF text-semantic operations.
- Rationale:
  - The implementation uses the existing annotation geometry model (`x`, `y`, `width`, `height`, `color`, `opacity`, and `strokeWidth`) consistently across drag creation, SVG rendering, and PDF export. This gives streamers the visible marks they expect without overclaiming text extraction.
- Alternatives considered:
  - Wait for PDF text selection/OCR before restoring these tools.
  - Keep them out of the tool palette despite complete visual rendering/export support.
- Consequences:
  - Public docs must keep describing underline/strikethrough as visual marks.
  - Future semantic text features should be scoped separately.
- Sources:
  - `src/types/pdf.types.ts`
  - `src/components/pdf/AnnotationLayer.tsx`
  - `src/lib/pdf/exporter.ts`
  - `.loom/065-plan-v2-s7-text-line-annotations-2026-06-26.md`

## 2026-03-14: Close Feature Truthfulness Gaps Before Adding New Features

- Decision:
  - Perform a full feature reality audit, then fix all documentation overclaims and wire partially-implemented features before any new roadmap expansion.
- Rationale:
  - Audit revealed 6 features claimed as ✅ with no implementation (OBS integration, Stream Deck plugin, WCAG contrast, PDF page inversion, presenter token auth, global hotkeys) and 4 features partially implemented (presenter mode lifecycle, underline annotation, multi-monitor UI, presenter config). This gap undermines professional credibility.
- Alternatives considered:
  - Implement missing features to match claims (too broad for one slice).
  - Ship as-is and address later (erodes trust).
- Consequences:
  - README and ROADMAP will be rewritten to match reality. Some ✅ will become future items.
  - Presenter mode, page inversion, and multi-monitor UI get targeted implementation fixes.
  - OBS and Stream Deck become explicit future backlog items.
- Sources:
  - `.loom/10-research.md` (feature reality audit, 2026-03-14)
  - `src/stores/integration.store.ts:343-355` (OBS_NOT_IMPLEMENTED)
  - `src/hooks/useViewModes.ts:32-69` (presenter local state only)
  - `docs/plugins/manifest.json` (Stream Deck PoC)

## 2026-03-11: Prioritize Readiness and Truthfulness Before Additional Feature Delivery

- Decision:
  - Use the next delivery slice to restore local validation readiness, correct docs drift, and close verification gaps before taking on more feature expansion.
- Rationale:
  - The repo is at `v1.4.0` with strong CI coverage, but the local workspace cannot currently run lint/unit commands because frontend dependencies are missing, and several public docs overstate implemented behavior (`collaboration`, `cloud sync`, `v1.0.0` release-readiness state, missing `dev:setup` command).
- Alternatives considered:
  - Continue directly into new feature work and defer docs/runtime cleanup.
  - Fix only the docs and postpone validation/test coverage work.
- Consequences:
  - Near-term work focuses on validation, documentation truthfulness, and presenter/output coverage.
  - Collaboration/cloud-sync work becomes an explicit backlog choice instead of implied shipped scope.
- Sources:
  - `package.json:4`
  - `package.json:20`
  - `README.md:32`
  - `README.md:90`
  - `ROADMAP.md:54`
  - `docs/release-readiness-1.0.md:1`
  - `src/hooks/useSettingsSync.ts:108`
  - `src-tauri/src/websocket/server.rs:44`
  - Command: `npm run lint` -> `sh: eslint: command not found`
  - Command: `npm run test:unit` -> `sh: vitest: command not found`
  - Command: `ls -la node_modules 2>/dev/null || echo 'node_modules: missing'`

## 2026-03-01: Fix Release Pipeline Before Cutting v1.4.0

- Decision:
  - Upgrade tauri-action from v0.5.17 to v0.5.25, fix Docker Node version and arm64 build, then cut v1.4.0 via release-please.
- Rationale:
  - v1.3.0 release is broken: only 3 of ~15 expected assets uploaded due to a known signature-detection regression in tauri-action v0.5.17 (tauri-apps/tauri-action#975, fixed in v0.5.18). Auto-updater is non-functional. Docker build fails under QEMU arm64 emulation.
- Alternatives considered:
  - Delete v1.3.0 and re-release at the same version.
  - Skip to v1.4.0 without fixing (would repeat the failure).
- Consequences:
  - v1.4.0 will be the first complete release since v1.1.1, with all platform builds + updater artifacts.
  - itch.io builds will be updated from v1.0.1 to v1.4.0.
- Sources:
  - GitHub Actions run 22245864849: "Signature not found for the updater JSON. Skipping upload..."
  - GitHub: tauri-apps/tauri-action#975
  - `.github/workflows/release.yml:234`
  - `Dockerfile:3`

## 2026-02-20: Prioritize Post-Tauri v2 UX Polish as the Next Delivery Program

- Decision:
  - Run a dedicated UX polish program after Tauri v2 stabilization, focused on mode clarity, settings IA, accessibility, and perceived performance.
- Rationale:
  - Tauri v2 platform baseline is in place; the highest leverage now is interaction quality across normal, borderless, and presenter workflows.
- Alternatives considered:
  - Jump directly to net-new features without UX consolidation.
- Consequences:
  - Work is phased into M0-M4 milestones with clear acceptance gates before feature expansion.
- Sources:
  - `package.json:31`
  - `src-tauri/Cargo.toml:21`
  - `src/App.tsx:149`
  - `src/components/layout/Sidebar.tsx:623`

## 2026-02-20: Use Lexical Codebase Index Fallback For Planning/Execution

- Decision:
  - Use `codebase_memory` lexical indexing (`embeddings=false`) as the active baseline for this initiative.
- Rationale:
  - Embedding-backed indexing failed in this environment (`The decoder prompt cannot be empty`), while lexical indexing completed successfully and provides reliable navigation.
- Alternatives considered:
  - Block planning until embedding pipeline is fixed.
- Consequences:
  - Implementation should prefer text/structure search calls and only rely on embeddings once Morph issue is resolved.
- Sources:
  - MCP: `mcp__loom__codebase_memory__codebase_index_poll(job_id="a8b6f45486bc6c16")`
  - MCP: `mcp__loom__codebase_memory__codebase_index_poll(job_id="5098c2be84b0fc03")`
  - MCP: `mcp__loom__codebase_memory__codebase_stats(repo_id="streamslate")`

## 2026-02-12: Prioritize Core Truthfulness Before Net-New Features

- Decision:
  - Prioritize real integration-state wiring and core workflow hardening before taking on additional post-1.0 feature expansion.
- Rationale:
  - Current frontend integration state is simulated and can misrepresent actual backend connectivity, which is a foundational reliability risk.
- Alternatives considered:
  - Start with visual polish only and defer core state wiring.
- Consequences:
  - First implementation slice targets transport correctness and status trustworthiness.
- Sources:
  - `src/stores/integration.store.ts:214`
  - `src-tauri/src/websocket/server.rs:44`
  - `src/lib/websocket/client.ts:29`

## 2026-02-12: Use Dual-Track Hardening (Core + UI) Instead of Sequential Big-Bang

- Decision:
  - Run a dual-track plan where integration correctness and UI consistency are both addressed in the same cycle, with core wiring sequenced first.
- Rationale:
  - Users need both truthful status behavior and a coherent shell; either in isolation leaves obvious quality gaps.
- Alternatives considered:
  - Full sequential model (all core first, then UI), or full UI-first model.
- Consequences:
  - Requires smaller, well-scoped commits and stronger test discipline.
- Sources:
  - `.loom/10-research.md:78`
  - `.loom/30-implementation-plan.md:13`

## 2026-02-11: Prioritize Release Hardening Before Net-New Features

- Decision:
  - Execute `v1.0.1` release hardening and documentation alignment before committing to larger `v1.1` feature delivery.
- Rationale:
  - Public `1.0.0` is now baseline, but release verification had environment/tooling gaps and docs drift that increased risk.
- Alternatives considered:
  - Start NDI/Syphon implementation immediately.
- Consequences:
  - Near-term roadmap focused first sprint on reliability and source-of-truth alignment.
- Sources:
  - `CHANGELOG.md:5`
  - `.loom/00-workspace-snapshot.md:12`

## 2026-02-11: Sequence NDI Before Syphon for v1.1

- Decision:
  - Implement and stabilize NDI output before Syphon GA; Syphon may launch as experimental.
- Rationale:
  - Existing code and design artifacts were centered on NDI capability, while Syphon remained design-stage plus platform constraints.
- Alternatives considered:
  - Build Syphon and NDI in parallel from day one.
- Consequences:
  - Reduced complexity in first feature milestone, clearer performance validation path.
- Sources:
  - `ROADMAP.md:38`
  - `src-tauri/src/commands/ndi.rs:95`

## 2026-02-11: Treat README/ROADMAP/CHANGELOG Consistency as a Release Requirement

- Decision:
  - Include docs consistency checks as a required deliverable in release hardening.
- Rationale:
  - README contained planned-status claims that conflicted with roadmap/changelog post-1.0 status.
- Alternatives considered:
  - Defer docs reconciliation to later cleanup.
- Consequences:
  - Better alignment between user-facing messaging and actual shipped capabilities.
- Sources:
  - `README.md:25`
  - `ROADMAP.md:36`
  - `CHANGELOG.md:5`
