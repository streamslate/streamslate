# RALPH Iteration Plan — Release Preflight Evidence

## Riskiest assumption + kill-test

**Load-bearing assumption**: `npm run release:preflight:strict` fails when
itch.io returns no channel evidence, rather than certifying a release from the
GitHub checks alone.

**Kill test**: Put an executable `butler` stub that exits successfully without
output first on `PATH`, run `npm run release:preflight:strict`, and require a
non-zero exit with `itch.io status returned empty output` reported as a
blocking error.

**Failure mode if the assumption is wrong**: Issue #14 can be marked ready
while the public itch.io distribution channels are missing or unverifiable.

**Status**: passed 2026-07-16 — standard mode exited `0` with a warning;
strict mode exited `1` with one blocking error under the empty-output Butler
stub.

## Review

- Roadmap milestone: Now — verification and release-readiness completion
  ([#14](https://gitlab.flexinfer.ai/services/streamslate/-/issues/14))
- Spec section(s): `.loom/30-implementation-plan.md` M11,
  `docs/release-readiness-1.0.md`, `ROADMAP.md` Now
- Prior decisions to preserve:
  - Keep external validation gates open until direct evidence exists.
  - Treat documentation truthfulness as a release requirement.

## Align

- Slice name: Strict itch.io evidence guard
- Scope in:
  - Make empty itch.io status a blocking error in strict preflight mode.
  - Run the v1.6.0 strict preflight and capture its verified baseline.
  - Update the active implementation plan and release-readiness guide.
- Scope out:
  - Hardware-dependent NDI, Syphon, multi-monitor, or Stream Deck validation.
  - Publishing a new release, changing itch.io channels, or Marketplace
    submission.
  - Mobile companion or cloud sync work.
- Acceptance criteria:
  - Strict mode exits non-zero when Butler returns no status evidence.
  - Standard mode retains a non-blocking warning for the same condition.
  - The live v1.6.0 strict preflight passes when GitHub and itch.io evidence is
    available.
  - Release-readiness docs record the command, result, and remaining manual
    gates without claiming issue #14 is complete.
- Dependencies/blockers:
  - Live proof requires authenticated `gh` and `butler` access.
  - Manual checklist completion still requires native hardware and application
    runtime testing outside this slice.
- Risk notes:
  - Butler can transiently return empty output; strict mode should fail closed
    because absence of evidence is not release evidence.

## Land

- Planned file areas:
  - `scripts/release-preflight.sh`
  - `docs/release-readiness-1.0.md`
  - `.loom/30-implementation-plan.md`
  - `.loom/40-decisions.md`
  - `.loom/50-worklog.md`
- Implementation steps:
  1. Route empty Butler output through the existing strict-aware warning path.
  2. Execute the kill-test with a local empty-output Butler stub.
  3. Execute the live v1.6.0 strict preflight.
  4. Record the verified baseline and remaining manual gates.

## Prove

- Tests to run:
  - Empty-output Butler kill-test (strict must fail).
  - Empty-output Butler compatibility check (standard must warn and continue).
  - `npm run release:preflight:strict` against live release services.
- Lint/static checks:
  - `bash -n scripts/release-preflight.sh`
  - `npm run format:check`
- CI checks:
  - GitLab merge-request pipeline after push.

## Handoff/Harvest

- Docs to update:
  - `docs/release-readiness-1.0.md`
  - `.loom/30-implementation-plan.md`
- Agent-context entries to add:
  - Decision: strict release checks fail closed when external channel evidence
    is empty.
  - Finding: v1.6.0 release assets and all three itch.io channels are present.
- Next-slice candidates:
  - Execute and attach the native manual verification checklist for issue #14.
  - Perform Stream Deck hardware or Mobile validation for issue #12.
