# V2 S15 Stream Deck Package Ignore Guard

Plan id: `plan-v2-s15-streamdeck-package-ignore`
Project: `services/streamslate`
Branch: `codex/streamdeck-sdignore`
Date: 2026-06-27

## Review

- Roadmap milestone: `1.7 Stream Deck Plugin`
- Spec section(s): Stream Deck local package and Marketplace readiness
- Prior decisions to preserve:
  - Hardware or Stream Deck Mobile validation remains open until direct external evidence exists.
  - Marketplace publication remains open until Elgato review/publication completes.
  - Local packaging readiness can improve without claiming either external gate complete.

## Align

- Slice name: Stream Deck package ignore guard
- Scope in:
  - Add `.sdignore` beside the Stream Deck manifest.
  - Validate that source maps, logs, generated installers, and validation evidence are excluded from local installer packages.
  - Update roadmap/planning markers without claiming external validation or publication.
- Scope out:
  - Running Stream Deck hardware or Stream Deck Mobile validation.
  - Submitting, reviewing, DRM-processing, or publishing the Marketplace package.
  - Changing plugin runtime behavior or action contracts.
- Acceptance criteria:
  - Package validation requires `.sdignore` and the expected exclusion rules.
  - Plugin tests cover the package validation CLI.
  - Roadmap still keeps hardware/mobile validation and Marketplace publication unchecked.
- Dependencies/blockers:
  - Actual validation still requires Stream Deck hardware or Stream Deck Mobile.
  - Marketplace publication remains blocked on validation evidence and Elgato review.

## Land

- Planned file areas:
  - `plugins/streamdeck/ai.flexinfer.streamslate.sdPlugin/.sdignore`
  - `plugins/streamdeck/scripts/validate-package.mjs`
  - `plugins/streamdeck/src/scripts/validate-package.test.ts`
  - `docs/streamdeck-plugin.md`
  - `docs/streamdeck-marketplace-checklist.md`
  - `ROADMAP.md`
  - `.loom/00-index.md`
  - `.loom/30-implementation-plan.md`
- Implementation steps:
  1. Add `.sdignore` package exclusions.
  2. Extend package validation and tests.
  3. Update docs and planning artifacts without claiming external gates complete.

## Prove

- Tests to run:
  - `npm test` in `plugins/streamdeck`
  - `npm run validate:package` in `plugins/streamdeck`
  - `npm run preflight` in `plugins/streamdeck`
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
  - finding: local package ignore guard is in place, but external hardware/mobile validation remains open.
- Next-slice candidates:
  - Execute hardware/mobile validation and attach completed Markdown plus JSON evidence.
  - Complete Marketplace package/submission record after validation evidence passes.
