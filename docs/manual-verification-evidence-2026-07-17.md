# Manual Verification Evidence — 2026-07-17

Partial evidence for
[issue #14](https://gitlab.flexinfer.ai/services/streamslate/-/issues/14).
This record marks only behavior observed directly on the current-source native
runtime. It does not complete the full manual checklist.

## Runtime baselines

- Initial WebSocket source ref: `fab65342`
- PDF follow-up source ref: `518717a` plus the PDF render-recovery slice on
  `codex/fix-pdf-blank-render`
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
contains opaque pixels. Result: **pass** for the current macOS WKWebView.

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

## Checks not passed by this run

| Checklist behavior                                   | Result  | Reason                                                                                                      |
| ---------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| `TOGGLE_PRESENTER` opens/closes the presenter window | Failed  | The response reported `active: true`, but both AX and CoreGraphics still found only the main native window. |
| Automatic reconnection succeeds                      | Not run | A new manual client connection succeeded, which does not prove client auto-reconnect behavior.              |

## Environment blockers

- One 3440×1440 primary display was attached, so multi-monitor scenarios could
  not run.
- OBS Studio, Stream Deck, NDI monitor tools, and Syphon client tools were not
  installed.
- The run did not attempt updater installation or any streaming destination.

## Conclusion

Capabilities, simultaneous clients, page navigation, zoom, and connection
status are directly verified. The signed v1.6.0 release has a blank-render
defect corrected by this source slice. Presenter-window creation is a separate
reproduced defect, and all remaining manual items stay unchecked until their
exact prerequisites and observable outcomes are available.
