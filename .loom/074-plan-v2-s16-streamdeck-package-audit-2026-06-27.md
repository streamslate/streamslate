# V2 S16 Stream Deck Package Audit Evidence

Plan id: `plan-v2-s16-streamdeck-package-audit`
Project: `services/streamslate`
Branch: `codex/streamdeck-package-audit`
Date: 2026-06-27

## Review

- Roadmap milestone: `1.7 Stream Deck Plugin`
- Spec section(s): Stream Deck local package and Marketplace readiness
- Prior decisions to preserve:
  - Hardware or Stream Deck Mobile validation remains open until direct external evidence exists.
  - Marketplace publication remains open until Elgato review/publication completes.
  - Local packaging evidence can improve without claiming validation, submission, review, or publication.

## Align

- Slice name: Stream Deck package audit evidence
- Scope in:
  - Extend the local package validator to emit optional Markdown and JSON audit artifacts.
  - Record manifest metadata, action inventory, package guard details, checked files, and hashes.
  - Add tests and docs for generating audit evidence before Marketplace review.
  - Update roadmap/planning markers without claiming external validation or publication.
- Scope out:
  - Running Stream Deck hardware or Stream Deck Mobile validation.
  - Running Elgato Marketplace submission, review, DRM processing, or publication.
  - Changing plugin runtime behavior or StreamSlate WebSocket action contracts.
- Acceptance criteria:
  - `npm run validate:package -- --audit-output <file> --json-output <file>` writes both artifacts and preserves existing validation behavior.
  - Plugin tests cover audit artifact generation.
  - Marketplace checklist references the audit artifacts as preparation evidence.
  - Hardware/mobile validation and Marketplace publication remain unchecked.
- Dependencies/blockers:
  - Actual validation still requires Stream Deck hardware or Stream Deck Mobile.
  - Marketplace publication remains blocked on validation evidence and Elgato review.

## Land

- Planned file areas:
  - `plugins/streamdeck/scripts/validate-package.mjs`
  - `plugins/streamdeck/src/scripts/validate-package.test.ts`
  - `plugins/streamdeck/package.json`
  - `plugins/streamdeck/.gitignore`
  - `docs/streamdeck-plugin.md`
  - `docs/streamdeck-marketplace-checklist.md`
  - `ROADMAP.md`
  - `.loom/00-index.md`
  - `.loom/30-implementation-plan.md`
- Implementation steps:
  1. Add audit output options to the package validator.
  2. Add automated tests for Markdown and JSON audit artifacts.
  3. Add package script, docs, and planning status updates.

## Prove

- Tests to run:
  - `npm test` in `plugins/streamdeck`
  - `npm run validate:package` in `plugins/streamdeck`
  - `npm run validate:package -- --audit-output /tmp/streamdeck-package-audit.md --json-output /tmp/streamdeck-package-audit.json` in `plugins/streamdeck`
- Lint/static checks:
  - `npm run typecheck` in `plugins/streamdeck`
  - `git diff --check origin/main...HEAD`
- CI checks:
  - Push branch and create/reuse MR if credentials are available.

## Handoff/Harvest

- Docs to update:
  - `docs/streamdeck-plugin.md`
  - `docs/streamdeck-marketplace-checklist.md`
  - `ROADMAP.md`
- Agent-context entries to add:
  - finding: package audit evidence is now generated locally, but external hardware/mobile validation and Marketplace publication remain open.
- Next-slice candidates:
  - Execute hardware/mobile validation and attach completed Markdown plus JSON evidence.
  - Complete Marketplace package/submission record after validation evidence passes.
