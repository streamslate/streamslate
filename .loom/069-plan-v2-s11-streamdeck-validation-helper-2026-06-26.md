# V2 S11 Stream Deck Validation Helper

Plan id: `plan-v2-s11-streamdeck-validation-helper`
Project: `services/streamslate`
Branch: `codex/streamdeck-validation-helper`

## Review

- Roadmap milestone: `1.7 Stream Deck Plugin`
- Spec section(s): Stream Deck validation evidence path
- Prior decisions to preserve:
  - Hardware or Stream Deck Mobile validation remains open until direct external
    evidence exists.
  - Marketplace publication remains open until Elgato review/publication
    completes.
  - Local package preflight and Marketplace readiness docs are already complete.

## Align

- Slice name: Stream Deck validation capture helper
- Scope in:
  - Add a Stream Deck plugin script that generates a validation evidence
    scaffold with environment metadata.
  - Optionally probe StreamSlate's loopback WebSocket API for capabilities,
    state, and ping responses while the app is running.
  - Link the helper from Stream Deck development and validation docs.
  - Update roadmap/planning status to show capture support is ready while
    external validation remains pending.
- Scope out:
  - Claiming hardware/mobile validation passed.
  - Automating Stream Deck hardware button presses.
  - Submitting or publishing the plugin.
- Acceptance criteria:
  - `npm run capture:validation -- --help` works in `plugins/streamdeck`.
  - Generated markdown can be used as supporting evidence for
    `docs/streamdeck-validation-report.md`.
  - Roadmap keeps hardware/mobile validation and Marketplace publication
    unchecked.
- Dependencies/blockers:
  - Actual validation still requires Stream Deck hardware or Stream Deck Mobile.

## Land

- Planned file areas:
  - `plugins/streamdeck/scripts/capture-validation.mjs`
  - `plugins/streamdeck/package.json`
  - `docs/streamdeck-plugin.md`
  - `docs/streamdeck-validation-report.md`
  - `ROADMAP.md`
  - `.loom/00-index.md`
  - `.loom/30-implementation-plan.md`
- Implementation steps:
  1. Add the validation capture helper and package script.
  2. Link the helper from validation docs.
  3. Update roadmap/planning artifacts.

## Prove

- Tests to run:
  - `npm run capture:validation -- --help`
  - `npm run capture:validation`
  - `npm run validate:package`
- Lint/static checks:
  - `npm run typecheck`
  - `npm test`
  - `git diff --check origin/main...HEAD`
- CI checks:
  - Push branch and create/reuse MR if credentials are available.

## Handoff/Harvest

- Docs to update:
  - `docs/streamdeck-plugin.md`
  - `docs/streamdeck-validation-report.md`
  - `ROADMAP.md`
- Agent-context entries to add:
  - finding: validation capture helper exists, but external hardware/mobile
    validation remains open.
- Next-slice candidates:
  - Execute hardware/mobile validation and attach the completed report.
  - Complete Marketplace package/submission record after validation evidence
    passes.
