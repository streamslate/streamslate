# V2 S10 Stream Deck Marketplace Readiness

Plan id: `plan-v2-s10-streamdeck-marketplace-readiness`
Project: `services/streamslate`
Branch: `codex/docs-streamdeck-marketplace-readiness`

## Review

- Roadmap milestone: `1.7 Stream Deck Plugin`
- Spec section(s): Stream Deck Marketplace readiness after external validation
- Prior decisions to preserve:
  - Local plugin package readiness is complete.
  - Hardware or Stream Deck Mobile validation remains open until direct external
    evidence exists.
  - Marketplace publication remains open until Elgato review/publication
    completes.

## Align

- Slice name: Stream Deck Marketplace readiness checklist
- Scope in:
  - Add a Marketplace submission checklist for the post-validation package
    review path.
  - Link the checklist from Stream Deck plugin docs and the validation report.
  - Update roadmap/planning status to show readiness documentation is prepared,
    while validation and publication remain pending.
- Scope out:
  - Claiming hardware/mobile validation passed.
  - Submitting, DRM-processing, reviewing, or publishing the plugin.
  - Changing SDK/runtime behavior or plugin manifest values.
- Acceptance criteria:
  - Docs provide a concrete place to record pre-submission gates, manifest
    review, package contents, listing assets, and submission record.
  - Roadmap still keeps hardware/mobile validation and Marketplace publication
    unchecked.
  - Local markdown/static checks pass.
- Dependencies/blockers:
  - Actual validation still requires Stream Deck hardware or Stream Deck Mobile
    outside this coding environment.
  - Marketplace submission requires Elgato account/review process after
    validation evidence exists.

## Land

- Planned file areas:
  - `docs/streamdeck-plugin.md`
  - `docs/streamdeck-validation-report.md`
  - `docs/streamdeck-marketplace-checklist.md`
  - `ROADMAP.md`
  - `.loom/00-index.md`
  - `.loom/30-implementation-plan.md`
- Implementation steps:
  1. Add the Marketplace checklist.
  2. Link it from Stream Deck plugin docs and validation report.
  3. Update roadmap/planning artifacts with the readiness step.

## Prove

- Tests to run:
  - `npm run format:check -- --ignore-path .prettierignore ROADMAP.md docs/streamdeck-plugin.md docs/streamdeck-validation-report.md docs/streamdeck-marketplace-checklist.md .loom/00-index.md .loom/30-implementation-plan.md .loom/068-plan-v2-s10-streamdeck-marketplace-readiness-2026-06-26.md`
- Lint/static checks:
  - `git diff --check origin/main...HEAD`
- CI checks:
  - Push branch and reuse/create MR if credentials are available.

## Handoff/Harvest

- Docs to update:
  - `docs/streamdeck-plugin.md`
  - `docs/streamdeck-validation-report.md`
  - `docs/streamdeck-marketplace-checklist.md`
  - `ROADMAP.md`
- Agent-context entries to add:
  - finding: Marketplace readiness docs are prepared, but external validation
    and Elgato review/publication remain blocked.
  - task: after hardware/mobile validation passes, complete the Marketplace
    checklist and package submission record.
- Next-slice candidates:
  - Execute hardware/mobile validation and attach the completed evidence report.
  - Complete Marketplace submission package after validation evidence passes.
