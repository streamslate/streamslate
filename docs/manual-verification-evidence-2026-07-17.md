# Manual Verification Evidence — 2026-07-17

Partial evidence for
[issue #14](https://gitlab.flexinfer.ai/services/streamslate/-/issues/14).
This record marks only behavior observed directly on the current-source native
runtime. It does not complete the full manual checklist.

## Runtime baselines

- Initial WebSocket source ref: `fab65342`
- PDF follow-up source ref: `518717a` plus the PDF render-recovery slice on
  `codex/fix-pdf-blank-render`
- Presenter/dark-page follow-up: `codex/fix-presenter-window`
- Signed installed release: `/Applications/StreamSlate.app` v1.6.0, notarized
  Developer ID team `BX8243HJHS`
- Patched build/run mode: `npm run tauri:dev`
  (`cargo run --no-default-features`)
- Host: macOS 26.4, Apple M4
- WebSocket client: `websocat`
- Endpoint: `ws://127.0.0.1:11451`

The official Apple-silicon v1.6.0 DMG matched GitHub's SHA-256 digest, its app
passed strict code-signature verification, and Gatekeeper accepted it as a
notarized Developer ID build. Opening the known-good 65-page
`/usr/share/doc/bash/bash.pdf` in that installed release reproduced a blank
black document viewport even though the backend and sidebar reported success.
The follow-up native build tests the scoped source correction for that release
defect; it is not a signed replacement release.

## Passed checks

### Protocol-v2 capabilities

The native runtime emitted:

```json
{ "type": "CONNECTED", "version": "1.6.0" }
```

Request:

```json
{
  "type": "GET_CAPABILITIES",
  "protocolVersion": "2.0",
  "request_id": "ralph-native-capabilities"
}
```

The matching `CAPABILITIES` response reported protocol `2.0`, the documented
page/state/zoom/presenter/annotation commands, and the corresponding state and
annotation events.

Result: **pass**.

### PDF render recovery

The installed v1.6.0 renderer painted PDF.js into a Tailwind `hidden`
(`display: none`) canvas and converted that canvas to a PNG. The native
screenshot showed the resulting blank black page area.

The patched native run rendered PDF.js directly into the displayed canvas and
audited the rendered pixel alpha channel. macOS accessibility then exposed:

```text
AXImage | PDF page 3 rendered | 893 x 1263
```

The `rendered` state is set only after PDF.js completes and the canvas sample
contains meaningful luminance contrast. Result: **pass** for the current macOS
WKWebView.

### Page navigation and zoom

With the 65-page PDF loaded, direct requests produced matching protocol
responses and visible native UI changes:

- `GO_TO_PAGE`, page `3`, request `manual-page-3` returned `PAGE_CHANGED`; the
  accessible canvas changed to `PDF page 3 rendered`.
- `SET_ZOOM`, zoom `1.5`, request `manual-zoom-150` returned `ZOOM_CHANGED`;
  the canvas grew from 596×842 at 100% to 893×1263 at 150%.

Result: **pass** for page navigation and zoom.

### Connection status

The installed v1.6.0 screenshot directly showed both the header `Connected`
indicator and footer `WebSocket Connected` status. Result: **pass**.

### Multiple simultaneous clients

Two `websocat` processes remained connected simultaneously. Each received the
initial `CONNECTED`/`STATE` messages and independently completed a request:

- client 1: `PING` request `ralph-client-1-concurrent` → matching `PONG`
- client 2: `PING` request `ralph-client-2-ping` → matching `PONG`
- client 2: `GET_STATE` request `ralph-client-2-state` → matching `STATE`

Result: **pass**.

### Dark-page conversion

The follow-up renderer now paints an opaque source page and converts the
canvas pixels themselves when dark-page inversion is enabled. White page
pixels map to RGB `18,18,18`; black text maps to `235,235,235`; mid-tone color
identity is retained while lightness is inverted. A whole-page contrast audit
prevents a solid background from being reported as a successful render.

The known fixture's page 1 contains only the printed page number `1` (one
extracted character), which explained the nearly empty screenshots. Page 2
contains 3,124 extracted characters beginning with `BASH(1)` and `NAME`.
With page 2 selected, accessibility exposed both contrast-bearing buffers:

```text
StreamSlate: PDF page 2 rendered
StreamSlate - Presenter Mode: Presenter PDF page 2 rendered
```

Result: **pass** for dark mode with page inversion enabled. Inversion-off and
light-mode checks remain open.

### Presenter native lifecycle

Before the correction, WebSocket `TOGGLE_PRESENTER` returned `active: true`
while macOS exposed only `StreamSlate`. The command now invokes the same native
lifecycle as the Tauri UI, distinguishes the configured hidden presenter
webview from a visible presenter, and responds active only after native
visibility succeeds.

Observed current-source sequence:

- `TOGGLE_PRESENTER` request `s23-open-hydrated` returned
  `PRESENTER_CHANGED { active: true }`; macOS exposed two windows titled
  `StreamSlate` and `StreamSlate - Presenter Mode`.
- A main-window Next button press moved the main canvas and presenter canvas
  together from page 2 to `PDF page 3 rendered` / `Presenter PDF page 3 rendered`.
- `TOGGLE_PRESENTER` request `s23-close` returned `active: false` and removed
  the second window.
- Request `s23-cold-reopen` returned `active: true`; the newly constructed
  presenter exposed `Presenter PDF page 2 rendered` and `2 / 65`.
- Escape in the presenter destroyed it; macOS reported one remaining window
  and `GET_STATE` request `s23-state-after-escape-2` returned
  `presenter_active: false`.

Result: **pass** for native open, exact title, main-to-presenter page sync,
remote close, cold reopen, and Escape close. Borderless and multi-monitor
checks remain open.

## Checks not passed by this run

| Checklist behavior              | Result  | Reason                                                                                         |
| ------------------------------- | ------- | ---------------------------------------------------------------------------------------------- |
| Automatic reconnection succeeds | Not run | A new manual client connection succeeded, which does not prove client auto-reconnect behavior. |

## Environment blockers

- One 3440×1440 primary display was attached, so multi-monitor scenarios could
  not run.
- OBS Studio, Stream Deck, NDI monitor tools, and Syphon client tools were not
  installed.
- The run did not attempt updater installation or any streaming destination.

## Conclusion

Capabilities, simultaneous clients, page navigation, zoom, connection status,
dark-page rendering, and the native presenter lifecycle are directly verified.
The signed v1.6.0 blank-render and remote presenter defects are corrected by
follow-up source slices. All remaining manual items stay unchecked until their
exact prerequisites and observable outcomes are available.
