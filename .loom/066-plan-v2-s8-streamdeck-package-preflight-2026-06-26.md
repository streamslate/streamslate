# V2 S8 Stream Deck Package Preflight

Plan id: `plan-v2-s8-streamdeck-package-preflight`
Project: `services/streamslate`
Branch: `codex/feat-streamdeck-package-preflight`

## Review

- Roadmap milestone: `1.7 Stream Deck Plugin`
- Spec section(s): Stream Deck plugin local packaging and validation readiness
- Prior decisions to preserve:
  - The plugin is local-development / validation work only.
  - Hardware or Stream Deck Mobile validation remains pending.
  - Marketplace publication must not be claimed until Elgato review/publication
    has actually happened.

## Align

- Slice name: Stream Deck package preflight
- Scope in:
  - Add a package-local validator for `manifest.json`, compiled bundle files,
    referenced icon assets, SDK/runtime fields, and version alignment.
  - Add npm scripts for local preflight and local packing.
  - Document the preflight before Stream Deck CLI linking or packing.
  - Record roadmap progress for packaging readiness without closing hardware or
    Marketplace validation.
- Scope out:
  - Stream Deck hardware or Stream Deck Mobile validation.
  - Elgato Marketplace submission, DRM processing, or publication.
  - New StreamSlate WebSocket commands or plugin actions.
- Acceptance criteria:
  - `npm --prefix plugins/streamdeck run validate:package` passes after build.
  - `npm --prefix plugins/streamdeck run preflight` runs typecheck, unit tests,
    build, and package validation successfully.
  - Docs and roadmap accurately distinguish local package readiness from
    external hardware and Marketplace validation.
- Dependencies/blockers:
  - Hardware/mobile validation requires Stream Deck hardware or Stream Deck
    Mobile outside this coding environment.
  - Marketplace publication requires Elgato review and release process.

## Land

- Planned file areas:
  - `plugins/streamdeck/package.json`
  - `plugins/streamdeck/scripts/validate-package.mjs`
  - `docs/streamdeck-plugin.md`
  - `ROADMAP.md`
- Implementation steps:
  1. Add package validator script.
  2. Wire package scripts.
  3. Update docs and roadmap status.

## Prove

- Tests to run:
  - `npm --prefix plugins/streamdeck run typecheck`
  - `npm --prefix plugins/streamdeck test`
  - `npm --prefix plugins/streamdeck run build`
  - `npm --prefix plugins/streamdeck run validate:package`
  - `npm --prefix plugins/streamdeck run preflight`
- Lint/static checks:
  - `npm run lint`
  - `npm run format:check`
  - `git diff --check origin/main...HEAD`
- CI checks:
  - Push branch and reuse/create MR if credentials are available.

## Handoff/Harvest

- Docs to update:
  - `docs/streamdeck-plugin.md`
  - `ROADMAP.md`
- Agent-context entries to add:
  - finding: hardware/mobile validation remains externally blocked.
  - decision: local package readiness is a separate completed slice.
- Next-slice candidates:
  - Run hardware or Stream Deck Mobile validation and record evidence.
  - Prepare Marketplace submission checklist once validation evidence exists.
