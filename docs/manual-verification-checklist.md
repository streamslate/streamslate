# Manual Verification Checklist

Features that require manual testing because they depend on native hardware,
platform-specific APIs, or multi-window behavior that cannot be automated in
the unit test environment.

## NDI Output (Feature-gated)

**Prerequisites:** Build with `--features ndi`, NDI SDK installed.

- [ ] NDI availability indicator shows green in Output settings
- [ ] Start capture → NDI feed appears in NDI Studio Monitor
- [ ] Frame counter increments in status display
- [ ] Stop capture → NDI feed disappears from receivers
- [ ] Capture survives a display resolution change

## Syphon Output (macOS only, feature-gated)

**Prerequisites:** Build with `--features syphon`, macOS.

- [ ] Syphon availability indicator shows green in Output settings
- [ ] Start Syphon → feed appears in Syphon Simple Client
- [ ] Syphon status shows "Active" in capture status
- [ ] Stop Syphon → feed disappears from Syphon clients
- [ ] Syphon and native capture can run simultaneously

## Multi-Monitor Capture

**Prerequisites:** Multiple displays connected.

- [ ] Output settings display selector lists all connected displays
- [ ] Primary display is labeled "(Primary)"
- [ ] Selecting a display and starting capture captures that display
- [ ] "StreamSlate Window" option captures only the app window
- [ ] Display selector is disabled while capture is active
- [ ] Unplugging a display while capturing degrades gracefully

## Presenter Mode (Multi-Window)

- [ ] Toggle presenter mode → a second window opens
- [ ] Presenter window title shows "StreamSlate - Presenter Mode"
- [ ] Changing pages in main window syncs to presenter
- [ ] ESC key closes presenter mode and destroys presenter window
- [ ] Re-opening presenter mode after close creates a new window
- [ ] Presenter mode works when app is in borderless mode
- [ ] Presenter mode works across multiple monitors (drag to second screen)

## PDF Page Inversion

- [ ] Dark mode + invert ON → PDF pages have dark background
- [ ] Dark mode + invert OFF → PDF pages show original colors
- [ ] Light mode → invert toggle is hidden (no effect)
- [ ] Annotations render correctly over inverted pages
- [ ] Inversion setting persists after app restart
- [ ] Inversion is included in settings export/import

## WebSocket Remote Control

**Prerequisites:** WebSocket client (e.g., `websocat ws://127.0.0.1:11451`).

- [ ] Send `{"type": "PAGE_CHANGED", "page": 3}` → app navigates to page 3
- [ ] Send `{"type": "ZOOM_CHANGED", "zoom": 1.5}` → app zooms to 150%
- [ ] Send `{"type": "PRESENTER_MODE_TOGGLED", "active": true}` → presenter opens
- [ ] Connection status indicator in status bar shows connected
- [ ] Disconnect and reconnect → auto-reconnection succeeds
- [ ] Multiple simultaneous WebSocket clients work correctly

## Auto-Updater

- [ ] Update banner appears when a new version is available
- [ ] "Dismiss" hides the banner
- [ ] "Install & Relaunch" downloads and installs the update
- [ ] Update banner does not appear when already on latest version

## Settings Sync

- [ ] Export settings → JSON file downloads with current date in filename
- [ ] Import settings from exported file → all settings restored
- [ ] Import file with missing `invertPages` → existing setting preserved
- [ ] Import invalid JSON → error message displayed
- [ ] Import file with wrong version → error message displayed
