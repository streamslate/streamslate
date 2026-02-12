# StreamSlate Local API

StreamSlate exposes a local WebSocket control API for integrations such as Stream Deck and automation tools.

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

## Notes

- Authentication is not currently enforced on this local endpoint.
- Clients should handle `ERROR` events and reconnect logic.
- Event/command names are defined in `src-tauri/src/websocket/protocol.rs`.
