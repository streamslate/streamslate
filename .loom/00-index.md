# Loom Context Pack

## Quick Links

- Workspace snapshot: `00-workspace-snapshot.md`
- MCP inventory: `00-mcp-inventory.md`
- Research: `10-research.md`
- Product spec: `20-product-spec.md`
- Implementation plan: `30-implementation-plan.md`
- Decisions: `40-decisions.md`
- Worklog: `50-worklog.md`

## Current Goal

Tighten StreamSlate's UI polish and core feature reliability so the app behavior matches `v1.0.x` expectations before expanding post-1.0 roadmap scope.

## Success Criteria

- Integration status in the UI reflects real backend connection state (not simulated state).
- UI shell uses a consistent visual system (theme tokens + component behavior consistency across main, borderless, and presenter controls).
- Core PDF workflows (open, navigate, annotate, export, presenter sync) are covered by automated tests beyond smoke checks.
- Known defects found in this planning pass are either fixed or tracked with implementation owners.

## In Scope (This Cycle)

- UI shell consistency and accessibility polish.
- WebSocket/integration state wiring correctness.
- PDF rendering and annotation workflow reliability hardening.
- Test coverage expansion for core workflows.

## Out of Scope (This Cycle)

- New platform-scale features (cloud sync, mobile companion, multi-monitor architecture redesign).
- Full NDI/Syphon roadmap delivery.

## Open Questions

- Should we target this as `v1.0.2` hardening, or batch with the next planned minor release?
- Which UI direction should be prioritized for first pass: stream-facing overlay ergonomics or desktop productivity ergonomics?
- Do we want to expose external WebSocket access now, or keep loopback-only while we harden auth/config?

## Risks

- OBS integration path is still simulated, which can hide real integration failures in that channel.
- PDF render path currently converts rendered canvas frames to data URLs on each render, which may limit performance at scale.
- Existing E2E tests are mostly shell-level; deeper workflow regressions can slip through.

## Sources

- `.loom/00-workspace-snapshot.md:1`
- `ROADMAP.md:36`
- `src/stores/integration.store.ts:214`
- `src/components/pdf/PDFViewer.tsx:454`
- Command: `npm run lint`
- Command: `npm run build`
- Command: `npm run dev -- --host 127.0.0.1 --port 1420`
- Command: `npm run test:headless`
- MCP: `read_mcp_resource(server="loom", uri="loom://config")`
