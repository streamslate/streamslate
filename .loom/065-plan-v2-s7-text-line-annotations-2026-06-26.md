# V2 S7 Text-Line Annotations

Plan id: `plan-v2-s7-text-line-annotations`
Slice id: `plan-v2-s7-text-line-annotations#3`
Project: `services/streamslate`
Branch: `codex/v2-s7-text-line-export-docs`
Date: 2026-06-26

## Goal

Complete the export and documentation slice for underline and strikethrough
annotations. The shared contract already adds `AnnotationType.UNDERLINE` and
`AnnotationType.STRIKETHROUGH`; this slice makes PDF export preserve those
marks and updates docs without claiming OCR or PDF text-semantic extraction.

## Scope

Owned files:

- `src/lib/pdf/exporter.ts`
- `ROADMAP.md`
- `docs/getting-started.mdx`
- `.loom/065-plan-v2-s7-text-line-annotations-2026-06-26.md`

Out of scope:

- `README.md`, which is intentionally left for orchestrator integration.
- Tooling and on-screen rendering changes owned by sibling S7 slices.

## Implementation

- PDF export draws underline at the bottom edge of the annotation geometry box.
- PDF export draws strikethrough through the vertical midpoint of the annotation
  geometry box.
- Both line annotations use existing annotation `x`, `y`, `width`, `height`,
  `color`, `opacity`, and `strokeWidth` fields.
- Roadmap moves M9-style text-line annotations into a completed 1.8 item.
- Getting Started lists Underline and Strikethrough as visual annotation tools
  and states they do not perform OCR or semantic PDF text extraction.

## Acceptance

- [x] PDF export supports underline and strikethrough marks.
- [x] Export coordinates match StreamSlate's top-left annotation geometry by
      flipping into pdf-lib's bottom-left page coordinate system.
- [x] Color, opacity, and stroke width are respected.
- [x] Docs mention Underline and Strikethrough truthfully.
- [x] Roadmap records text-line annotations as completed 1.8-style work.

## Validation

- `npx prettier --check src/lib/pdf/exporter.ts ROADMAP.md docs/getting-started.mdx .loom/065-plan-v2-s7-text-line-annotations-2026-06-26.md`
  passed.
- `npx eslint src/lib/pdf/exporter.ts` passed.
- `git diff --check` passed.
- `npx tsc --noEmit --pretty false` was attempted and currently stops on
  `src/components/layout/Sidebar.tsx`, where the shared enum contract has added
  `underline` and `strikethrough` before the sidebar label map has been updated
  by its owning slice.
