# V2 S18 Stream Deck Pass Evidence Guard

Plan id: `plan-v2-s18-streamdeck-pass-evidence-guard`
Project: `services/streamslate`
Branch: `codex/ralph-streamdeck-pass-evidence-guard`
Date: 2026-06-28

## Review

- Roadmap milestone: `1.7 Stream Deck Plugin`
- Spec section(s): Stream Deck validation evidence path
- Prior decisions to preserve:
  - Hardware or Stream Deck Mobile validation remains open until direct external evidence exists.
  - Marketplace publication remains open until Elgato review/publication completes.
  - Local validation tooling can prepare evidence, but should not make pass status easy to stamp without external proof.

## Align

- Slice name: Stream Deck pass-result evidence guard
- Scope in:
  - Require `--target` when `capture-validation` is run with `--result pass`.
  - Require at least one `--evidence-link` when `capture-validation` is run with `--result pass`.
  - Add CLI tests for accepted pass captures and rejected pass captures.
  - Update roadmap/planning/docs without claiming external validation completion.
- Scope out:
  - Running Stream Deck hardware or Stream Deck Mobile validation.
  - Elgato Marketplace submission, review, DRM processing, or publication.
  - Changing package audit, manifest validation, or runtime plugin actions.
- Acceptance criteria:
  - `--result pass` with no target fails with a clear error.
  - `--result pass` with no evidence link fails with a clear error.
  - `--result pass --target <target> --evidence-link <link>` renders capture output.
  - Roadmap still leaves hardware/mobile validation and Marketplace publication unchecked.
- Dependencies/blockers:
  - Actual external validation remains blocked on hardware or Stream Deck Mobile access.
  - Marketplace publication remains blocked on passing validation evidence and Elgato review.

## Land

- Planned file areas:
  - `plugins/streamdeck/scripts/capture-validation.mjs`
  - `plugins/streamdeck/src/scripts/capture-validation.test.ts`
  - `docs/streamdeck-plugin.md`
  - `docs/streamdeck-validation-report.md`
  - `ROADMAP.md`
  - `.loom/00-index.md`
  - `.loom/30-implementation-plan.md`
- Implementation steps:
  1. Add pass-result validation checks to the capture helper.
  2. Add CLI tests for pass guard behavior.
  3. Update docs and planning progress markers.

## Prove

- Tests to run:
  - `npm test -- --run src/scripts/capture-validation.test.ts` in `plugins/streamdeck`
  - `npm run capture:validation -- --result pass --target "Stream Deck Mobile" --evidence-link validation-report.md` in `plugins/streamdeck`
  - `npm run streamdeck:preflight`
- Lint/static checks:
  - `git diff --check origin/main...HEAD`
- CI checks:
  - Push branch and create/reuse MR if credentials are available.

## Handoff/Harvest

- Docs to update:
  - `docs/streamdeck-plugin.md`
  - `docs/streamdeck-validation-report.md`
  - `ROADMAP.md`
- Agent-context entries to add:
  - finding: Stream Deck pass-result capture now requires target and evidence links.
  - task: execute real hardware/mobile validation and attach completed Markdown plus JSON evidence.
- Next-slice candidates:
  - Execute hardware/mobile validation and attach completed Markdown plus JSON evidence.
  - Complete Marketplace package/submission record after validation evidence passes.
