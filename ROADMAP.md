# StreamSlate Roadmap

> Last Updated: 2026-07-02
> Tier: 1 (see workspace AGENTS.md "Portfolio Tiers")
> Tracking Issue: https://gitlab.flexinfer.ai/services/streamslate/-/issues/17

<!--
Convention (portfolio-refresh 2026-H2, see libs/STANDARDS.md "Roadmap & Backlog"):
- This file states CURRENT TRUTH, derived from git activity and deployed state —
  never re-date stale content. Each refresh MR must cite its evidence (git-log
  window inspected, deploy-state query used).
- Backlog lives in GitLab issues (P1/P2/P3 labels + milestones), NOT in this file.
  This file links the backlog; it does not duplicate it.
- If a live plan exists in the agent-context plan store, reference its plan_id
  here; the store is canonical and this file is a rendered summary.
- Staleness SLO: Tier 1/2 repos must have this file dated within 90 days.
  `bin/portfolio-inventory --roadmaps` reports conformance.
-->

## Current Status

StreamSlate is a production-ready Tauri/Rust/React PDF-annotation overlay for
streamers at **v1.6.0** (bumped 2026-06-28, `f158be7`). The prior phase roadmap
(MVP → 1.9) is complete: core annotations, WebSocket remote control,
presets/templates, NDI/Syphon build-time outputs, OBS WebSocket direct control,
presenter mode, PDF page inversion, text-line annotations, and the Stream Deck
SDK v2 plugin runtime; 211 unit tests, lint and CI clean. The last product
commit stream (2026-06-26 → 06-28) was Stream Deck validation/packaging
evidence tooling; since then only CI template onboarding (2026-07-02,
`f204df9`). Honest gaps: Stream Deck hardware/Mobile validation and Marketplace
publication are **not** done, and no commits target the PLAN.md launch items
(public release binaries, itch.io distribution) yet — the launch goal is
strategic intent, not current momentum. Phase history (MVP → 1.9) is preserved
in this file's git history.

Evidence: git log main, last 20 commits (2026-06-26 → 2026-07-02), inspected
2026-07-02; default-branch pipeline success 2026-06-28
(`.loom/62-functional-health-baseline-2026-07-02.md`).

- **Plan store**: `plan-workspace-portfolio-refresh-2026-h2-roadmaps-quality-baselin-f3db23` (slice 9 refresh; no repo-local live plan)
- **Deployed**: not deployed (desktop app; public distribution pending itch.io launch)
- **CI**: node template family (platform/gitops CI templates, onboarded 2026-07-02)

## Now

- [ ] Stream Deck plugin: hardware / Stream Deck Mobile validation, then Marketplace packaging + publication ([#12](https://gitlab.flexinfer.ai/services/streamslate/-/issues/12))
- [ ] Execute the manual verification checklist + strict release preflight on the next release candidate ([#14](https://gitlab.flexinfer.ai/services/streamslate/-/issues/14))

## Next

- [ ] Launch distribution: release binaries (macOS DMG first) + itch.io page and upload ([#18](https://gitlab.flexinfer.ai/services/streamslate/-/issues/18))

## Later

- PLAN.md §2 launch goal: pay-what-you-want distribution on itch.io; marketing hand-off to services/streamslate-site (CTA switch tracked as streamslate-site#8)
- Mobile companion (iPad side-car) ([#7](https://gitlab.flexinfer.ai/services/streamslate/-/issues/7))
- Cloud sync for settings ([#8](https://gitlab.flexinfer.ai/services/streamslate/-/issues/8))

## Backlog

Full backlog: [P1 issues](https://gitlab.flexinfer.ai/services/streamslate/-/issues/?label_name[]=P1) ·
[P2](https://gitlab.flexinfer.ai/services/streamslate/-/issues/?label_name[]=P2) ·
[P3](https://gitlab.flexinfer.ai/services/streamslate/-/issues/?label_name[]=P3) ·
[Milestones](https://gitlab.flexinfer.ai/services/streamslate/-/milestones)
