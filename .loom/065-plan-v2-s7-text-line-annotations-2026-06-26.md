# V2 S7 Text-Line Annotations

Plan id: `plan-v2-s7-text-line-annotations`
Project: `services/streamslate`
Branch: `codex/v2-s7-text-line-annotations`
Date: 2026-06-26

## Goal

Complete the S7 roadmap slice for underline and strikethrough annotations. The
integrated branch adds first-class tool palette entries, drag creation, live SVG
rendering, PDF export, and docs without claiming OCR or PDF text-semantic
extraction.

## Scope

Integrated files:

- `src/types/pdf.types.ts`
- `src/lib/annotations/presets.ts`
- `src/lib/annotations/presets.test.ts`
- `src/hooks/useAnnotationDraw.ts`
- `src/components/layout/Sidebar.tsx`
- `src/components/pdf/AnnotationLayer.tsx`
- `src/components/pdf/AnnotationLayer.test.tsx`
- `src/lib/annotations/drawing.ts`
- `src/lib/annotations/drawing.test.ts`
- `src/lib/pdf/exporter.ts`
- `README.md`
- `ROADMAP.md`
- `docs/getting-started.mdx`
- `.loom/065-plan-v2-s7-text-line-annotations-2026-06-26.md`

## Implementation

- `AnnotationType.UNDERLINE` and `AnnotationType.STRIKETHROUGH` are supported
  annotation types.
- The tool palette and sidebar expose both text-line annotation types.
- Drag creation uses line-like geometry so short horizontal marks are accepted.
- Live SVG rendering draws underline near the lower portion of the annotation
  geometry box and strikethrough through the vertical midpoint.
- PDF export uses the same text-line placement helper as the SVG renderer, then
  flips into pdf-lib's bottom-left page coordinate system.
- Both line annotations use existing annotation `x`, `y`, `width`, `height`,
  `color`, `opacity`, and `strokeWidth` fields.
- Roadmap moves M9-style text-line annotations into a completed 1.8 item.
- README and Getting Started list Underline and Strikethrough as visual
  annotation tools and state, where relevant, that they do not perform OCR or
  semantic PDF text extraction.

## Acceptance

- [x] PDF export supports underline and strikethrough marks.
- [x] Export coordinates match StreamSlate's top-left annotation geometry by
      flipping into pdf-lib's bottom-left page coordinate system.
- [x] Color, opacity, and stroke width are respected.
- [x] Tooling, sidebar labels, rendering, and previews support both types.
- [x] Docs mention Underline and Strikethrough truthfully.
- [x] Roadmap records text-line annotations as completed 1.8-style work.

## Validation

- `NODE_OPTIONS="--localstorage-file=.node-localstorage" npm run test:unit`
  passed: 242 tests.
- `npm run build` passed.
- `npm run lint` passed.
- `npm run format:check` passed.
- `cargo test` passed: 34 passed, 2 ignored.
- `git diff --check origin/main...HEAD` passed.
