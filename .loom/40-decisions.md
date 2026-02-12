# Decisions

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
