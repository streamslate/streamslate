# V2 S12 Stream Deck Validation Capture Tests

Plan id: `plan-v2-s12-streamdeck-validation-capture-tests`
Project: `services/streamslate`
Branch: `codex/streamdeck-validation-capture-tests`

## Review

- Roadmap milestone: `1.7 Stream Deck Plugin`
- Spec section(s): Stream Deck validation evidence path
- Prior decisions to preserve:
  - Hardware or Stream Deck Mobile validation remains open until direct external
    evidence exists.
  - Marketplace publication remains open until Elgato review/publication
    completes.
  - The validation capture helper supports evidence collection but does not
    itself complete hardware or mobile validation.

## Align

- Slice name: Stream Deck validation capture helper coverage
- Scope in:
  - Add automated tests for the validation capture helper CLI.
  - Cover help text, markdown scaffold output, output-file writing, argument
    validation, and loopback API probe capture against a mock WebSocket server.
  - Update planning/docs to record that the helper behavior is now covered by
    the plugin test suite.
- Scope out:
  - Claiming Stream Deck hardware or Stream Deck Mobile validation passed.
  - Automating Stream Deck button presses.
  - Marketplace packaging, submission, or publication.
- Acceptance criteria:
  - `npm test` in `plugins/streamdeck` includes validation capture helper tests.
  - `npm run typecheck` remains clean in `plugins/streamdeck`.
  - Roadmap still keeps hardware/mobile validation and Marketplace publication
    unchecked.
- Dependencies/blockers:
  - Actual validation still requires Stream Deck hardware or Stream Deck Mobile.
  - Marketplace publication remains blocked on validation evidence and Elgato
    review.

## Land

- Planned file areas:
  - `plugins/streamdeck/src/scripts/capture-validation.test.ts`
  - `docs/streamdeck-plugin.md`
  - `docs/streamdeck-validation-report.md`
  - `ROADMAP.md`
  - `.loom/00-index.md`
  - `.loom/30-implementation-plan.md`
- Implementation steps:
  1. Add CLI-level tests around `scripts/capture-validation.mjs`.
  2. Record the coverage in Stream Deck docs and roadmap/planning artifacts.
  3. Keep external validation and Marketplace status unchanged.

## Prove

- Tests to run:
  - `npm test` in `plugins/streamdeck`
  - `npm run capture:validation -- --help` in `plugins/streamdeck`
  - `npm run capture:validation` in `plugins/streamdeck`
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
  - finding: validation capture helper behavior has automated CLI/probe
    coverage, but external hardware/mobile validation remains open.
- Next-slice candidates:
  - Execute hardware/mobile validation and attach the completed report.
  - Complete Marketplace package/submission record after validation evidence
    passes.
