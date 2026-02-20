/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * Cypress support file for E2E tests.
 * Mocks Tauri v2 IPC internals for browser-only testing.
 */

// Mock Tauri v2 IPC for browser-only testing
// Tauri v2 uses window.__TAURI_INTERNALS__ as the IPC bridge (v1 used __TAURI_IPC__)
beforeEach(() => {
  cy.on("window:before:load", (win) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tauriWindow = win as any;

    // Callback registry used by @tauri-apps/api/core transformCallback()
    let callbackId = 0;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    const callbacks = new Map<number, Function>();

    if (!tauriWindow.__TAURI_MOCK_IPC__) {
      tauriWindow.__TAURI_MOCK_IPC__ = {
        calls: [] as Array<{ cmd: string; args: Record<string, unknown> }>,
        handlers: [] as Array<{
          match: (payload: {
            cmd: string;
            args: Record<string, unknown>;
          }) => boolean;
          handle: (payload: {
            cmd: string;
            args: Record<string, unknown>;
          }) => unknown;
        }>,
      };
    }

    // Mock __TAURI_INTERNALS__ — the v2 IPC bridge used by @tauri-apps/api/core
    if (!tauriWindow.__TAURI_INTERNALS__) {
      tauriWindow.__TAURI_INTERNALS__ = {
        metadata: {
          currentWindow: { label: "main", kind: "Webview" },
          currentWebview: { label: "main", kind: "Webview" },
          windows: [{ label: "main" }],
          webviews: [{ label: "main" }],
        },

        // invoke() is the core IPC mechanism in v2
        invoke: (
          cmd: string,
          args?: Record<string, unknown>
        ): Promise<unknown> => {
          tauriWindow.__TAURI_MOCK_IPC__.calls.push({
            cmd,
            args: args ?? {},
          });

          // Check custom handlers first
          const custom = tauriWindow.__TAURI_MOCK_IPC__.handlers.find(
            (h: {
              match: (p: {
                cmd: string;
                args: Record<string, unknown>;
              }) => boolean;
            }) => h.match({ cmd, args: args ?? {} })
          );
          if (custom) {
            return Promise.resolve(custom.handle({ cmd, args: args ?? {} }));
          }

          // v2 plugin commands use "plugin:<name>|<method>" format
          if (cmd.startsWith("plugin:event|")) {
            // Event listen/unlisten — return a numeric listener ID
            return Promise.resolve(callbackId++);
          }
          if (cmd.startsWith("plugin:dialog|")) {
            return Promise.resolve(null);
          }
          if (cmd.startsWith("plugin:fs|")) {
            return Promise.resolve(null);
          }
          if (cmd.startsWith("plugin:shell|")) {
            return Promise.resolve(null);
          }
          if (cmd.startsWith("plugin:process|")) {
            return Promise.resolve(null);
          }
          if (cmd.startsWith("plugin:updater|")) {
            return Promise.resolve(null);
          }
          if (cmd.startsWith("plugin:http|")) {
            return Promise.resolve(null);
          }

          // Default for app-level commands: no-op
          return Promise.resolve(null);
        },

        // transformCallback registers a JS function and returns a numeric ID
        // so the Rust side can call it back via window.__TAURI_INTERNALS__._callbacks
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        transformCallback: (fn?: Function, once?: boolean): number => {
          const id = callbackId++;
          if (fn) {
            callbacks.set(id, (...args: unknown[]) => {
              fn(...args);
              if (once) callbacks.delete(id);
            });
          }
          return id;
        },

        // convertFileSrc creates asset:// protocol URLs in v2
        convertFileSrc: (filePath: string, _protocol?: string): string => {
          return filePath;
        },
      };
    }

    // Also set __TAURI__ for code that checks "in" operator (e.g. "__TAURI__" in window)
    if (!tauriWindow.__TAURI__) {
      tauriWindow.__TAURI__ = tauriWindow.__TAURI_INTERNALS__;
    }
  });
});

// Handle uncaught exceptions from Tauri IPC
// This prevents test failures when Tauri APIs are called outside the Tauri webview
Cypress.on("uncaught:exception", (err) => {
  // Ignore Tauri IPC errors - expected when running in browser-only mode
  if (
    err.message.includes("__TAURI_IPC__") ||
    err.message.includes("__TAURI__") ||
    err.message.includes("__TAURI_INTERNALS__")
  ) {
    return false; // Prevent test failure
  }

  // Let other errors fail the test
  return true;
});
