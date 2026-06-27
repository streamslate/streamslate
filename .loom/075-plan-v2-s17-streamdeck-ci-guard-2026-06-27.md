# V2 S17 Stream Deck Validation CI Guard

Plan id: `plan-v2-s17-streamdeck-ci-guard`
Project: `services/streamslate`
Branch: `codex/streamdeck-validation-ci-guard`
Date: 2026-06-27

## Review

- Roadmap milestone: `1.7 Stream Deck Plugin`
- Spec section(s): Stream Deck local package/preflight and Marketplace readiness
- Prior decisions to preserve:
  - Hardware or Stream Deck Mobile validation remains open until direct external evidence exists.
  - Marketplace publication remains open until Elgato review/publication completes.
  - CI can enforce local package readiness without claiming external validation.

## Align

- Slice name: Stream Deck validation CI guard
- Scope in:
  - Expose root scripts for Stream Deck install, preflight, package audit, and CI guard.
  - Add a GitLab CI job that runs the plugin guard on Node 24.
  - Upload generated Markdown/JSON package audit artifacts from CI.
  - Update roadmap/planning/docs to mark guardrails complete without closing external validation.
- Scope out:
  - Stream Deck hardware or Stream Deck Mobile validation.
  - Elgato Marketplace submission, review, DRM processing, or publication.
  - Runtime plugin behavior or StreamSlate WebSocket contract changes.
- Acceptance criteria:
  - `npm run streamdeck:ci` installs plugin dependencies, runs preflight, and emits package audit artifacts.
  - GitLab has a `test:streamdeck` job using Node 24 with plugin npm cache and package audit artifacts.
  - Docker deploy waits for `test:streamdeck`.
  - Roadmap still leaves hardware/mobile validation and Marketplace publication unchecked.
- Dependencies/blockers:
  - Node 24 is required by the Stream Deck SDK runtime/toolchain.
  - Actual external validation remains blocked on hardware or Stream Deck Mobile access.

## Land

- Planned file areas:
  - `package.json`
  - `.gitlab-ci.yml`
  - `docs/streamdeck-plugin.md`
  - `docs/streamdeck-marketplace-checklist.md`
  - `ROADMAP.md`
  - `.loom/00-index.md`
  - `.loom/30-implementation-plan.md`
- Implementation steps:
  1. Add root Stream Deck guard scripts.
  2. Add GitLab CI job and deployment dependency.
  3. Update docs and planning progress markers.

## Prove

- Tests to run:
  - `npm run streamdeck:ci`
  - `npm run streamdeck:preflight`
  - `npm run streamdeck:audit`
- Lint/static checks:
  - `git diff --check origin/main...HEAD`
- CI checks:
  - Push branch and create/reuse MR if credentials are available.

## Handoff/Harvest

- Docs to update:
  - `docs/streamdeck-plugin.md`
  - `docs/streamdeck-marketplace-checklist.md`
  - `ROADMAP.md`
- Agent-context entries to add:
  - finding: Stream Deck local validation guard is now automated in root scripts and CI.
  - question: who can run hardware or Stream Deck Mobile validation next?
- Next-slice candidates:
  - Execute hardware/mobile validation and attach completed Markdown plus JSON evidence.
  - Complete Marketplace package/submission record after validation evidence passes.
