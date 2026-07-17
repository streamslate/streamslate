# StreamSlate Roadmap

> Last Updated: 2026-07-17
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

StreamSlate is a Tauri/Rust/React PDF-annotation overlay for streamers at
**v1.6.0** (bumped 2026-06-28, `f158be7`). Signed desktop binaries, updater
metadata, and macOS/Windows/Linux itch.io channels are published. Native
verification on 2026-07-17 proved protocol-v2 capabilities, simultaneous
clients, PDF page navigation, zoom, and connection status. It also found two
release-readiness defects: the signed v1.6.0 build displays a blank PDF
viewport, corrected by the current visible-canvas slice, and presenter control
reports active without creating a second native window. Stream Deck
hardware/Mobile validation and Marketplace publication remain external gates.

Evidence: v1.6.0 strict release preflight; signed Apple-silicon installation;
native evidence in `docs/manual-verification-evidence-2026-07-17.md`; latest
merged default-branch pipeline `19648` for `518717a` passed.

- **Plan store**: `plan-workspace-portfolio-refresh-2026-h2-roadmaps-quality-baselin-f3db23` (slice 9 refresh; no repo-local live plan)
- **Deployed**: v1.6.0 desktop release and itch.io channels published
- **CI**: node template family (platform/gitops CI templates, onboarded 2026-07-02)

## Now

- [ ] Stream Deck plugin: hardware / Stream Deck Mobile validation, then Marketplace packaging + publication ([#12](https://gitlab.flexinfer.ai/services/streamslate/-/issues/12))
- [ ] Complete the manual verification checklist, including presenter-window recovery, then run strict preflight on the next release candidate ([#14](https://gitlab.flexinfer.ai/services/streamslate/-/issues/14))

## Next

- [ ] Publish a signed follow-up release containing verified PDF-render and presenter-window fixes ([#18](https://gitlab.flexinfer.ai/services/streamslate/-/issues/18))

## Later

- PLAN.md §2 launch goal: pay-what-you-want distribution on itch.io; marketing hand-off to services/streamslate-site (CTA switch tracked as streamslate-site#8)
- Mobile companion (iPad side-car) ([#7](https://gitlab.flexinfer.ai/services/streamslate/-/issues/7))
- Cloud sync for settings ([#8](https://gitlab.flexinfer.ai/services/streamslate/-/issues/8))

## Backlog

Full backlog: [P1 issues](https://gitlab.flexinfer.ai/services/streamslate/-/issues/?label_name[]=P1) ·
[P2](https://gitlab.flexinfer.ai/services/streamslate/-/issues/?label_name[]=P2) ·
[P3](https://gitlab.flexinfer.ai/services/streamslate/-/issues/?label_name[]=P3) ·
[Milestones](https://gitlab.flexinfer.ai/services/streamslate/-/milestones)
