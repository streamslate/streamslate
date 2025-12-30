# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

StreamSlate is a Tauri + React desktop PDF annotator for live streamers and YouTubers. It features dark-mode PDF viewing, annotation tools (highlights, drawing, shapes), presenter mode for OBS integration, and a WebSocket API for external control.

## Build & Development Commands

```bash
# Development (hot-reload frontend + Tauri backend)
npm run tauri:dev

# Frontend only (Vite dev server)
npm run dev

# Build production app
npm run tauri:build

# Type checking
npx tsc --noEmit

# Linting and formatting
npm run lint              # ESLint
npm run format:check      # Prettier check
npm run format            # Prettier fix
cd src-tauri && cargo fmt --check    # Rust formatting
cd src-tauri && cargo clippy         # Rust linting

# Testing
npm run test              # Cypress interactive
npm run test:headless     # Cypress headless
cd src-tauri && cargo test           # Rust unit tests

# Version sync (updates Cargo.toml and tauri.conf.json from package.json)
npm run sync-versions

# Release workflow
npm run ship:patch        # Bump patch version + push + create draft release
npm run ship:beta         # Bump with beta prerelease tag
```

## Architecture

### Dual-Runtime Stack

**Frontend (React + TypeScript):**

- `src/` - React app with Vite bundler
- `src/stores/` - Zustand state management (pdf.store.ts, integration.store.ts)
- `src/components/pdf/` - PDF viewer and annotation layer using PDF.js
- `src/components/layout/` - App chrome: Header, Sidebar, StatusBar, Presenter/Borderless modes
- `src/lib/tauri/commands.ts` - TypeScript wrappers for Tauri IPC

**Backend (Rust + Tauri):**

- `src-tauri/src/lib.rs` - Tauri app entry, command handler registration
- `src-tauri/src/commands/` - Tauri commands: `pdf.rs` (file ops), `presenter.rs` (window management)
- `src-tauri/src/state/mod.rs` - Thread-safe app state (Arc<Mutex<T>> pattern)

### Key State Domains

| Domain         | Frontend Store        | Rust State                  |
| -------------- | --------------------- | --------------------------- |
| PDF document   | `usePDFStore`         | `PdfState`                  |
| Presenter mode | `useViewModes`        | `PresenterState`            |
| WebSocket/OBS  | `useIntegrationStore` | `WebSocketState`            |
| Annotations    | In PDF store Map      | `HashMap<u32, Vec<String>>` |

### IPC Pattern

Frontend invokes Tauri commands via `@tauri-apps/api/invoke`:

```typescript
invoke("open_pdf", { path: filePath });
invoke("toggle_presenter_mode");
```

Commands defined in Rust with `#[tauri::command]` attribute and registered in `lib.rs`.

### Window Configuration

Two windows defined in `tauri.conf.json`:

- `main` - Primary editor window (decorations, visible)
- `presenter` - OBS capture window (borderless, transparent, always-on-top, hidden by default)

### WebSocket Server

Planned for port 11451 - enables OBS scene switching, Stream Deck control, and external automation.

## Testing Notes

- Cypress E2E tests in `cypress/e2e/`
- Frontend dev server must be running for Cypress tests
- Rust tests: `cd src-tauri && cargo test`
- CI runs on Ubuntu, macOS, and Windows with cross-platform npm dependency handling

## Version Management

Three files must stay in sync:

- `package.json` (source of truth)
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`

Run `npm run sync-versions` after manual edits, or use `npm run ship:*` commands which handle this automatically. Windows builds have special version normalization for MSI compatibility (no alpha characters in prerelease).
