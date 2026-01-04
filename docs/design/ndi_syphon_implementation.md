# NDI & Syphon Integration Design

## Objective

Enable StreamSlate to output its visual content (PDF + Annotations) directly to NDI (Network Device Interface) and Syphon (macOS local frame sharing) targets. This allows streamers to ingest the feed into OBS, vMix, or other production software with transparency and high performance, bypassing the "Window Capture" or "Browser Source" limitations.

## Challenges

1.  **Content Source**: The content is rendered in a WebView (HTML5 Canvas + DOM).
    - Getting high-performance GPU textures out of a WebView is difficult.
    - Approaches:
      - **Frontend Capture**: `canvas.captureStream()` -> Send frames to Backend? (High CPU/Latency)
      - **Window Capture (Backend)**: Rust captures the specific window ID. (OS specific, potentially resource intensive)
      - **WebView Surface Sharing**: Tying into the underlying surface of the WebView (if Tauri exposes it).
2.  **NDI SDK**: Requires proprietary SDK libraries (`libndi.dylib` / `Processing.NDI.Lib.x64.dll`). Licensing/distribution implications.
3.  **Syphon**: macOS specific, requires Objective-C/Swift bridging.

## Proposed Architecture

### Phase 1: Frontend Frame Capture (MVP)

Since `pdf-lib` and rendering handle canvas:

1.  Use `canvas.captureStream(30)` to get a `MediaStream`.
2.  Use a `MediaStreamTrackProcessor` (or hidden `<video>` + canvas draw) to extract `VideoFrame`s.
3.  Send raw RGBA data to Rust Backend via:
    - **WebSocket** (Too slow for 1080p60?)
    - **Tauri Command** (`invoke` with byte array)? (Serialization cost)
    - **Shared Memory**? (Not easily accessible from JS)
4.  Rust backend receives frames and pushes them to:
    - `ndi-rs` (NDI Sender)
    - Syphon Server (via `objc` binding).

_Pros_: Easy to implement. Captures exactly what is on the canvas. Supports transparency.
_Cons_: CPU intensive. JS-to-Rust bridge bottleneck.

### Phase 2: Native Window Capture (Performance)

Use macOS native APIs (ScreenCaptureKit) in Rust to capture the application window.

1.  Identify Window ID (Tauri exposes this).
2.  Capture texture.
3.  Publish texture directly to Syphon (Zero Copy!).
4.  Download texture to CPU for NDI sending.

_Pros_: Extremely performant for Syphon. Independent of JS thread.
_Cons_: Complex implementation. ScreenCaptureKit is macOS 12.3+.

## Dependency Selection

- **NDI**: `grafton-ndi` (Safe Rust bindings for NDI 6).
- **Syphon**: Custom `objc2` bindings to `Syphon.framework`.

## Strategy for "Proceedinig"

1.  **Feasibility Check**: Can we send 1080p60 raw frames from JS to Rust without dropping frames?
    - 1920x1080x4 bytes = ~8MB per frame. 60fps = 480MB/s.
    - IPC might choke.
2.  **Implementation**:
    - Start with **NDI** using `grafton-ndi`.
    - Implement a basic "Test Pattern" sender in Rust to verify SDK linkage.
    - Try JS -> Rust frame piping.
