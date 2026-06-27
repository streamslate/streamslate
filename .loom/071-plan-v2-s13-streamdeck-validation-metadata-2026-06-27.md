# V2 S13 Stream Deck Validation Metadata

Plan id: `plan-v2-s13-streamdeck-validation-metadata`
Project: `services/streamslate`
Branch: `codex/underline-strikethrough`
Date: 2026-06-27

## Review

- Roadmap milestone: `1.7 Stream Deck Plugin`
- Spec section(s): Stream Deck validation evidence path
- Prior decisions to preserve:
  - Hardware or Stream Deck Mobile validation remains open until direct external evidence exists.
  - Marketplace publication remains open until Elgato review/publication completes.
  - Validation tooling can prepare evidence, but it must not mark external validation complete by itself.

## Align

- Slice name: Stream Deck validation capture metadata
- Scope in:
  - Add `--result` support to the validation capture helper for `pass`, `fail`, or `partial`.
  - Add repeatable `--evidence-link` support for evidence URLs, paths, or notes.
  - Cover the new CLI behavior with automated tests.
  - Update docs and roadmap/planning markers.
- Scope out:
  - Running Stream Deck hardware or Stream Deck Mobile validation.
  - Automating Stream Deck button presses.
  - Marketplace packaging, submission, review, or publication.
- Acceptance criteria:
  - Validation capture output can prefill result status and evidence links.
  - Invalid result values and empty evidence links are rejected.
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
  - `.gitlab-ci.yml`
  - `.loom/00-index.md`
  - `.loom/30-implementation-plan.md`
- Implementation steps:
  1. Extend capture CLI parsing and report rendering.
  2. Add positive and negative CLI tests.
  3. Disable macOS updater artifact generation in CI when the updater private key is absent.
  4. Update docs and planning artifacts without claiming external validation.

## Prove

- Tests to run:
  - `npm test` in `plugins/streamdeck`
  - `npm run capture:validation -- --result partial --evidence-link validation-capture.md`
  - `npm run validate:package` in `plugins/streamdeck`
  - GitLab MR pipeline
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
  - finding: validation capture helper now records result/evidence metadata, but external hardware/mobile validation remains open.
- Next-slice candidates:
  - Execute hardware/mobile validation and attach the completed report.
  - Complete Marketplace package/submission record after validation evidence passes.
