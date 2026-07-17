# Manual Verification Evidence — 2026-07-17

Partial evidence for
[issue #14](https://gitlab.flexinfer.ai/services/streamslate/-/issues/14).
This record marks only behavior observed directly on the current-source native
runtime. It does not complete the full manual checklist.

## Runtime baseline

- Source ref: `fab65342` (`origin/main` at test start)
- Application version: `1.6.0`
- Build/run mode: `npm run tauri:dev` (`cargo run --no-default-features`)
- Host: macOS 26.4, Apple M4
- WebSocket client: `websocat`
- Endpoint: `ws://127.0.0.1:11451`

The signed `/Applications/StreamSlate.app` installation reported version
`1.0.1`, so it was explicitly excluded from current release evidence.

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

### Multiple simultaneous clients

Two `websocat` processes remained connected simultaneously. Each received the
initial `CONNECTED`/`STATE` messages and independently completed a request:

- client 1: `PING` request `ralph-client-1-concurrent` → matching `PONG`
- client 2: `PING` request `ralph-client-2-ping` → matching `PONG`
- client 2: `GET_STATE` request `ralph-client-2-state` → matching `STATE`

Result: **pass**.

## Checks not passed by this run

| Checklist behavior                                   | Result       | Reason                                                                                                |
| ---------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------- |
| `GO_TO_PAGE` changes the loaded document             | Not run      | No PDF was loaded; the direct probe correctly returned `PDF_NOT_LOADED`.                              |
| `SET_ZOOM` visibly zooms a PDF                       | Partial only | The backend emitted `ZOOM_CHANGED`, but no PDF was loaded for visual confirmation.                    |
| `TOGGLE_PRESENTER` opens/closes the presenter window | Partial only | `PRESENTER_CHANGED` emitted for active `true` and `false`; visual window/title proof was unavailable. |
| Status bar shows connected                           | Not run      | Native WebView inspection was unavailable without macOS assistive access.                             |
| Automatic reconnection succeeds                      | Not run      | A new manual client connection succeeded, which does not prove client auto-reconnect behavior.        |

## Environment blockers

- One 3440×1440 primary display was attached, so multi-monitor scenarios could
  not run.
- OBS Studio, Stream Deck, NDI monitor tools, and Syphon client tools were not
  installed.
- The run did not attempt updater installation or any streaming destination.

## Conclusion

Two WebSocket checklist items are directly verified on the current-source
v1.6.0 native runtime. All other manual items remain unchecked until their
exact prerequisites and observable outcomes are available.
