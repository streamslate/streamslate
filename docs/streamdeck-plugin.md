# Stream Deck Plugin Development

This page documents the first-party StreamSlate Stream Deck plugin slice. It
supersedes the old `docs/plugins` proof of concept, which was a standalone
WebSocket demo and not an installable Stream Deck plugin.

## Status

- Target: official Elgato Stream Deck SDK v2 plugin.
- Plugin UUID namespace: `ai.flexinfer.streamslate`.
- Control transport: StreamSlate loopback WebSocket API at
  `ws://127.0.0.1:11451`.
- Marketplace status: not published or submitted. Treat the plugin as local
  development / validation work until a release explicitly says otherwise.
- Runtime package: `plugins/streamdeck/**` contains the SDK v2 manifest,
  TypeScript source, compiled local plugin bundle, and tests.
- Hardware status: Stream Deck hardware or Stream Deck Mobile validation is
  still pending.

The local API is already implemented by StreamSlate. See [Local API](api.md)
and [API V2 Contract](api-v2-contract.md) for the command and event contract
the plugin must use.

## External SDK Baseline

Elgato's current SDK documentation says Stream Deck plugin development requires
Node.js 24 or newer, Stream Deck 7.1 or newer, a Stream Deck device or Stream
Deck Mobile, and the Stream Deck CLI. The SDK plugin structure uses a
`*.sdPlugin/manifest.json` file with `CodePath`, actions, supported OS, Node.js
runtime, and SDK metadata.

Useful upstream references:

- [Stream Deck SDK getting started](https://docs.elgato.com/streamdeck/sdk/introduction/getting-started/)
- [Stream Deck CLI introduction](https://docs.elgato.com/streamdeck/cli/intro/)
- [Stream Deck manifest reference](https://docs.elgato.com/streamdeck/sdk/references/manifest/)
- [Stream Deck distribution](https://docs.elgato.com/streamdeck/sdk/introduction/distribution/)

## Repository Layout

The first-party plugin lives under `plugins/streamdeck/` and follows the
official SDK scaffold shape:

```text
plugins/streamdeck/
  package.json
  src/
  ai.flexinfer.streamslate.sdPlugin/
    manifest.json
    bin/
    imgs/
    ui/
```

The manifest should use official SDK field names such as `Actions`, `CodePath`,
`Name`, `Nodejs`, `OS`, `SDKVersion`, `Software`, `UUID`, and `Version`. Action
UUIDs should stay under the same reverse-DNS namespace, for example
`ai.flexinfer.streamslate.next-page`.

## StreamSlate Connection Defaults

Plugin settings should default to:

| Setting            | Default                |
| ------------------ | ---------------------- |
| Host               | `127.0.0.1`            |
| Port               | `11451`                |
| Protocol version   | `2.0`                  |
| WebSocket endpoint | `ws://127.0.0.1:11451` |

Keep the endpoint loopback-only. Do not document LAN control, pairing,
authentication, cloud relay, or Marketplace distribution until those features
exist.

## Action Contract

The plugin should discover capabilities after connecting, request state, and
then map Stream Deck actions to existing StreamSlate commands.

| Stream Deck action | WebSocket command  |
| ------------------ | ------------------ |
| Next Page          | `NEXT_PAGE`        |
| Previous Page      | `PREVIOUS_PAGE`    |
| Go To Page         | `GO_TO_PAGE`       |
| Set Zoom           | `SET_ZOOM`         |
| Toggle Presenter   | `TOGGLE_PRESENTER` |
| Refresh State      | `GET_STATE`        |
| Health Check       | `PING`             |

On connect, send:

```json
{
  "type": "GET_CAPABILITIES",
  "protocolVersion": "2.0",
  "request_id": "streamdeck-capabilities"
}
```

Then request current state:

```json
{
  "type": "GET_STATE",
  "protocolVersion": "2.0",
  "request_id": "streamdeck-state"
}
```

The plugin should handle these events at minimum: `CONNECTED`,
`CAPABILITIES`, `STATE`, `PAGE_CHANGED`, `PRESENTER_CHANGED`, `ZOOM_CHANGED`,
`PDF_OPENED`, `PDF_CLOSED`, `ERROR`, and `PONG`.

## Local Development

Prerequisites:

- Node.js 24 or newer for the Stream Deck plugin toolchain.
- Stream Deck 7.1 or newer.
- Stream Deck hardware or Stream Deck Mobile.
- StreamSlate app dependencies from the repository root.
- Stream Deck CLI:

```bash
npm install -g @elgato/cli@latest
streamdeck -v
streamdeck dev
```

Run StreamSlate:

```bash
cd /path/to/streamslate
npm install
npm run tauri:dev
```

Build and watch the plugin:

```bash
cd /path/to/streamslate/plugins/streamdeck
npm install
npm run build
npm run watch
```

Run the local package preflight before linking, packing, or handing the plugin
to another tester:

```bash
npm run preflight
```

The preflight typechecks, runs unit tests, rebuilds the compiled plugin bundle,
and validates that `manifest.json` points to existing bundle and icon assets,
uses the expected SDK/runtime fields, and stays version-aligned with
`package.json`.

Link the compiled plugin directory to Stream Deck if the package script does
not do it automatically:

```bash
streamdeck link ./ai.flexinfer.streamslate.sdPlugin
streamdeck restart ai.flexinfer.streamslate
```

Validate and package for local distribution only:

```bash
npm run validate:package
npm run pack:local
```

Packaging creates a `.streamDeckPlugin` installer. It does not mean the plugin
has been reviewed, DRM-processed, or published on Elgato Marketplace.

## Manual Verification

Use these steps before marking the plugin slice complete:

1. Start StreamSlate with `npm run tauri:dev`.
2. Open a multi-page PDF.
3. Confirm the loopback API is reachable with a WebSocket client:

   ```bash
   websocat ws://127.0.0.1:11451
   ```

   Send:

   ```json
   {
     "type": "GET_CAPABILITIES",
     "protocolVersion": "2.0",
     "request_id": "manual-capabilities"
   }
   ```

   Expect a `CAPABILITIES` response that includes page, zoom, presenter, ping,
   and state commands.

4. Install or link the plugin in Stream Deck.
5. Add StreamSlate actions to a profile.
6. Press **Next Page** and **Previous Page** actions. The PDF page should
   change and the plugin should receive `PAGE_CHANGED`.
7. Press **Toggle Presenter**. Presenter mode should open or close and the
   plugin should receive `PRESENTER_CHANGED`.
8. Use a page or zoom action with configured settings. The app should respond
   with `PAGE_CHANGED`, `ZOOM_CHANGED`, or `ERROR` for invalid input.
9. Quit StreamSlate while Stream Deck remains open. Plugin keys should enter a
   disconnected/error state without crashing Stream Deck.
10. Restart StreamSlate. The plugin should reconnect, rediscover capabilities,
    and refresh state.

Record the StreamSlate version, Stream Deck version, Node.js version, OS, and
plugin commit when completing manual verification.
