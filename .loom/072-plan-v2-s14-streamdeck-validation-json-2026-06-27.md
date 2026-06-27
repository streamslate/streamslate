# V2 S14 Stream Deck Validation JSON Evidence

Plan id: `plan-v2-s14-streamdeck-validation-json`
Project: `services/streamslate`
Branch: `codex/streamdeck-validation-json`
Date: 2026-06-27

## Review

- Roadmap milestone: `1.7 Stream Deck Plugin`
- Spec section(s): Stream Deck validation evidence path
- Prior decisions to preserve:
  - Hardware or Stream Deck Mobile validation remains open until direct external evidence exists.
  - Marketplace publication remains open until Elgato review/publication completes.
  - Validation tooling can prepare evidence, but it must not mark external validation complete by itself.

## Align

- Slice name: Stream Deck validation JSON evidence metadata
- Scope in:
  - Add `--json-output` support to the validation capture helper.
  - Include environment, version, result, evidence-link, and loopback probe metadata in the JSON artifact.
  - Cover JSON output with automated tests, including probed loopback API data.
  - Update docs and planning markers without claiming external validation.
- Scope out:
  - Running Stream Deck hardware or Stream Deck Mobile validation.
  - Automating Stream Deck button presses.
  - Marketplace packaging, submission, review, or publication.
- Acceptance criteria:
  - Validation capture can emit both Markdown and structured JSON artifacts.
  - JSON output records `externalValidationComplete: false`.
  - Stream Deck hardware/mobile validation and Marketplace publication remain unchecked in the roadmap.
- Dependencies/blockers:
  - Actual validation still requires Stream Deck hardware or Stream Deck Mobile.
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
  1. Extend capture CLI parsing and output writing.
  2. Add JSON rendering from the same capture metadata used by Markdown.
  3. Add positive tests for static and probed JSON artifacts.
  4. Update docs and planning artifacts without claiming external validation.

## Prove

- Tests to run:
  - `npm test` in `plugins/streamdeck`
  - `npm run capture:validation -- --result partial --evidence-link validation-capture.md --json-output validation-capture.json`
  - `npm run validate:package` in `plugins/streamdeck`
- Lint/static checks:
  - `npm run typecheck` in `plugins/streamdeck`
  - `git diff --check origin/main...HEAD`
- CI checks:
  - Push branch and create/reuse MR if credentials are available.

## Handoff/Harvest

- Docs to update:
  - `docs/streamdeck-plugin.md`
  - `docs/streamdeck-validation-report.md`
  - `ROADMAP.md`
- Agent-context entries to add:
  - finding: validation capture helper now emits structured JSON evidence metadata, but external hardware/mobile validation remains open.
- Next-slice candidates:
  - Execute hardware/mobile validation and attach completed Markdown plus JSON evidence.
  - Complete Marketplace package/submission record after validation evidence passes.
