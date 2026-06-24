# StreamSlate Local API

StreamSlate exposes a local WebSocket control API for integrations such as Stream Deck and automation tools.

This page documents the currently implemented local API. The V2 contract is
being defined for future local-control integrations; see
[API V2 Contract](api-v2-contract.md) for the compatibility target and planned
schema additions.

## Endpoint

- URL: `ws://127.0.0.1:11451`
- Transport: WebSocket
- Message format: JSON
- Scope: local loopback only (binds to `127.0.0.1`)

## Command Messages

Commands are sent as JSON objects with a `type` field in `SCREAMING_SNAKE_CASE`.

### Supported Commands

- `NEXT_PAGE`
- `PREVIOUS_PAGE`
- `GO_TO_PAGE`
- `GET_STATE`
- `SET_ZOOM`
- `TOGGLE_PRESENTER`
- `PING`
- `ADD_ANNOTATION`
- `CLEAR_ANNOTATIONS`

These names are implemented by the Rust WebSocket protocol in
`src-tauri/src/websocket/protocol.rs`.

### Examples

Go to a specific page:

```json
{
  "type": "GO_TO_PAGE",
  "page": 3
}
```

Set zoom:

```json
{
  "type": "SET_ZOOM",
  "zoom": 1.25
}
```

Get current state:

```json
{
  "type": "GET_STATE"
}
```

## Event Messages

Server events are emitted with a `type` field in `SCREAMING_SNAKE_CASE`.

### Common Events

- `CONNECTED`
- `STATE`
- `PAGE_CHANGED`
- `PDF_OPENED`
- `PDF_CLOSED`
- `ZOOM_CHANGED`
- `PRESENTER_CHANGED`
- `ANNOTATIONS_UPDATED`
- `ANNOTATIONS_CLEARED`
- `ERROR`
- `PONG`

### Event Examples

Connected:

```json
{
  "type": "CONNECTED",
  "version": "1.0.1"
}
```

Page changed:

```json
{
  "type": "PAGE_CHANGED",
  "page": 5,
  "total_pages": 20
}
```

State snapshot:

```json
{
  "type": "STATE",
  "page": 5,
  "total_pages": 20,
  "zoom": 1.25,
  "pdf_loaded": true,
  "pdf_path": "/path/to/file.pdf",
  "pdf_title": "Slides",
  "presenter_active": false
}
```

## V2 Contract Additions

The V2 local-control contract keeps the current command and event names stable
and adds version/capability discovery. These additions are contract work unless
the runtime advertises them with `protocolVersion: "2.0"` or a
`CAPABILITIES` event.

Planned V2 discovery command:

```json
{
  "type": "GET_CAPABILITIES"
}
```

Planned V2 capabilities response:

```json
{
  "type": "CAPABILITIES",
  "protocolVersion": "2.0",
  "transport": {
    "kind": "websocket-json",
    "loopbackOnly": true
  },
  "commands": [
    "NEXT_PAGE",
    "PREVIOUS_PAGE",
    "GO_TO_PAGE",
    "GET_STATE",
    "SET_ZOOM",
    "TOGGLE_PRESENTER",
    "PING",
    "ADD_ANNOTATION",
    "CLEAR_ANNOTATIONS",
    "GET_CAPABILITIES"
  ],
  "stateFields": [
    "page",
    "total_pages",
    "zoom",
    "pdf_loaded",
    "pdf_path",
    "pdf_title",
    "presenter_active"
  ]
}
```

V2 clients should treat the current `ERROR` event as the minimum supported error
envelope:

```json
{
  "type": "ERROR",
  "message": "Page 99 is out of range (1-20)"
}
```

V2 implementations may add fields such as `code`, `request_id`, `details`, and
`recoverable`, but clients must continue to handle the `message`-only v1 shape.

## Notes

- Authentication is not currently enforced on this local endpoint.
- Clients should handle `ERROR` events and reconnect logic.
- Event/command names are defined in `src-tauri/src/websocket/protocol.rs`.
- V2 does not make OBS, Stream Deck, mobile, or cloud sync features shipped
  product behavior. It defines a stable local contract those agents can target.
