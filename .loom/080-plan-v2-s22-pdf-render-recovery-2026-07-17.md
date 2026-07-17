# RALPH Iteration Plan — PDF Render Recovery

## Riskiest assumption + kill-test

**Load-bearing assumption**: StreamSlate's supported macOS WKWebView can render
PDF.js output directly to a visible canvas, and the v1.6.0 blank viewport is
caused by rendering into a Tailwind `hidden` (`display: none`) canvas before
converting it to an image.

**Kill test**: Build and launch the patched native app on this Apple-silicon
Mac, open the known-good 65-page `/usr/share/doc/bash/bash.pdf`, and require
page 1 to show non-blank document content in the visible canvas. Then navigate
to page 3 and set 150% zoom through the loopback WebSocket API, requiring the
native UI to reflect both changes.

**Failure mode if the assumption is wrong**: Replacing the image fallback with
a visible canvas would still leave users with an empty viewer, and downstream
page, zoom, presenter, and annotation evidence would be invalid.

**Status**: passed 2026-07-17 — the patched native WKWebView exposed
`PDF page 3 rendered` after its pixel audit found opaque canvas content;
page/zoom evidence is recorded in
`docs/manual-verification-evidence-2026-07-17.md`.

### Positive and disconfirming evidence

- Positive: the installed v1.6.0 backend opened the 65-page PDF successfully,
  while the UI screenshot showed only a blank black page area. The renderer
  explicitly applies Tailwind `hidden` to its source canvas before PDF.js
  paints it.
- Disconfirming/limiting: commit `9f4b6af` introduced the PNG fallback because
  direct canvas rendering was believed to have Tauri WebView compatibility
  issues. The current host test passed, but other OS WebViews still require
  release-candidate verification; unit tests alone are insufficient.

## Review

- Roadmap milestone: Now — manual verification and release-readiness closure.
- Spec sections: `.loom/30-implementation-plan.md` M11 and
  `docs/manual-verification-checklist.md`.
- Prior decisions to preserve:
  - Manual checks require direct evidence from the current native runtime.
  - Protocol success is not proof of visible WebView behavior.

## Align

- Slice name: Restore visible PDF rendering and resume native verification.
- Scope in:
  - Replace the hidden-canvas PNG workaround with a visible PDF.js canvas.
  - Preserve page inversion and annotation-layer geometry.
  - Preserve serialized Tauri error text instead of collapsing it to a generic
    `Failed to load PDF` message.
  - Add regression tests for the visible canvas and error normalization.
  - Re-run PDF, page, zoom, presenter, and reconnect checks on a native build.
- Scope out:
  - Broad PDF parser replacement or `lopdf` dependency upgrade.
  - NDI, Syphon, OBS, Stream Deck hardware, and multi-monitor validation.
- Acceptance criteria:
  - A known-good multi-page PDF visibly renders in the native app.
  - Page and zoom changes are visible after loopback WebSocket commands.
  - A serialized backend error remains visible to the user.
  - Unit, formatting, lint, build, and CI checks pass.

## Land

- Planned file areas:
  - `src/components/pdf/PDFViewer.tsx`
  - `src/components/pdf/PDFViewer.test.tsx`
  - `src/components/presenter/PresenterView.tsx`
  - `src/components/presenter/PresenterView.test.tsx`
  - `src/lib/error-message.ts`
  - `src/lib/error-message.test.ts`
  - `src/hooks/usePDF.ts`
  - Native verification and RALPH evidence documents.
- Implementation steps:
  1. Add failing regression tests for a visible render target and serialized
     error preservation.
  2. Remove the hidden-canvas image conversion path and render PDF.js directly
     into the displayed canvas.
  3. Run local quality gates.
  4. Execute the native kill test and remaining installed-build scenarios.

## Prove

- Tests to run:
  - Targeted Vitest regression tests.
  - Full `npm run test:unit`.
  - Native PDF render/page/zoom/presenter/reconnect checks.
- Static checks:
  - `npm run format:check`
  - `npm run lint`
  - `npm run build`
- CI checks:
  - GitLab merge-request pipeline after push.

## Handoff/Harvest

- Update the manual verification evidence and checklist only for behavior
  directly observed on the patched native build.
- Record the v1.6.0 release defect and its native reproduction evidence.
- Leave external hardware/output scenarios open.
