# RALPH Iteration Plan — Annotation Workflow Polish

## Review

- Roadmap milestone: 1.9 Annotation Workflow Polish
- Spec section(s): `.loom/30-implementation-plan.md` Phase 3 M9/M10, `ROADMAP.md` 1.8/1.9
- Prior decisions to preserve:
  - Treat underline and strikethrough as visual geometry annotations, not OCR or text-semantic PDF operations.
  - Keep public docs truthful about completed features and external validation gates.

## Align

- Slice name: Annotation tool picker and text-line template polish
- Scope in:
  - Group the annotation picker into Markup, Shapes, and Notes sections.
  - Make the picker controls fixed-size, accessible icon buttons with explicit pressed state.
  - Add built-in underline and strikethrough presets plus matching use-case templates.
  - Add focused tests for picker grouping and text-line preset/template coverage.
- Scope out:
  - New annotation geometry, OCR/text selection, mobile companion, cloud sync, or Stream Deck hardware validation.
- Acceptance criteria:
  - Underline and strikethrough remain first-class tools in the picker.
  - Built-in template profile includes text-line presets.
  - Use-case templates include key-line and correction-pass workflows.
  - Unit tests cover the new picker and preset contracts.
- Dependencies/blockers:
  - Requires frontend dependency install in the worktree before local quality commands can run.

## Land

- Planned file areas:
  - `src/lib/annotations/presets.ts`
  - `src/components/annotation/ToolSelector.tsx`
  - `src/components/annotation/ToolSettings.tsx`
  - `src/types/pdf.types.ts`
  - `src/lib/annotations/presets.test.ts`
  - `src/components/annotation/ToolSelector.test.tsx`
  - `src/test/setup.ts`
  - `vitest.config.ts`
  - `ROADMAP.md`
  - `.loom/30-implementation-plan.md`
- Implementation steps:
  1. Extend tool metadata with category and description.
  2. Group picker rendering by tool category with stable icon controls.
  3. Add text-line built-in presets/templates and tests.
  4. Stabilize Vitest browser storage setup for the existing localStorage suites.
  5. Update roadmap/spec progress markers.

## Prove

- Tests to run:
  - `npm run test:unit -- src/lib/annotations/presets.test.ts src/components/annotation/ToolSelector.test.tsx`
  - `npm run test:unit`
- Lint/static checks:
  - `npm run lint`
  - `npm run build`
- CI checks:
  - Not created yet in this local slice; push/PR can run GitLab CI if requested.

## Handoff/Harvest

- Docs to update:
  - `ROADMAP.md`
  - `.loom/30-implementation-plan.md`
- Agent-context entries to add:
  - Decision: treat this as 1.9 workflow polish layered on completed 1.8 text-line annotations.
  - Finding: fresh worktree initially lacked `node_modules`, so dependency install is part of proof.
- Next-slice candidates:
  - Stream Deck hardware or Stream Deck Mobile validation.
  - Marketplace packaging after external validation evidence exists.
