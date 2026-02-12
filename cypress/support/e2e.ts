/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * Cypress support file for E2E tests.
 * Handles Tauri-specific exceptions when running in browser-only mode.
 */

// Mock Tauri IPC for browser-only testing
// When running outside of Tauri webview, __TAURI_IPC__ is not available
beforeEach(() => {
  cy.on("window:before:load", (win) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tauriWindow = win as any;

    // Mock __TAURI__ global if not present
    if (!tauriWindow.__TAURI__) {
      tauriWindow.__TAURI__ = {
        invoke: () => Promise.resolve(),
        convertFileSrc: (filePath: string) => filePath,
        event: {
          listen: () => Promise.resolve(() => {}),
          emit: () => Promise.resolve(),
        },
      };
    } else if (!tauriWindow.__TAURI__.convertFileSrc) {
      tauriWindow.__TAURI__.convertFileSrc = (filePath: string) => filePath;
    }

    if (!tauriWindow.__TAURI_MOCK_IPC__) {
      tauriWindow.__TAURI_MOCK_IPC__ = {
        calls: [] as Array<{ cmd: string; args: Record<string, unknown> }>,
        handlers: [] as Array<{
          match: (payload: { cmd: string; args: Record<string, unknown> }) => boolean;
          handle: (payload: { cmd: string; args: Record<string, unknown> }) => unknown;
        }>,
      };
    }

    // Mock the Tauri IPC bridge if not present.
    // This must call the callback/error functions created by @tauri-apps/api/tauri invoke().
    if (!tauriWindow.__TAURI_IPC__) {
      tauriWindow.__TAURI_IPC__ = (payload: {
        cmd: string;
        callback: number;
        error: number;
        [key: string]: unknown;
      }) => {
        const { cmd, callback, error, ...args } = payload;

        tauriWindow.__TAURI_MOCK_IPC__.calls.push({
          cmd,
          args: args as Record<string, unknown>,
        });

        const resolve = (value: unknown) => {
          const fn = tauriWindow[`_${callback}`];
          if (typeof fn === "function") {
            fn(value);
          }
        };

        const reject = (value: unknown) => {
          const fn = tauriWindow[`_${error}`];
          if (typeof fn === "function") {
            fn(value);
          }
        };

        try {
          const custom = tauriWindow.__TAURI_MOCK_IPC__.handlers.find((h: {
            match: (payload: { cmd: string; args: Record<string, unknown> }) => boolean;
            handle: (payload: { cmd: string; args: Record<string, unknown> }) => unknown;
          }) => h.match({ cmd, args }));
          if (custom) {
            resolve(custom.handle({ cmd, args }));
            return;
          }

          // Minimal defaults for APIs used in browser-only tests.
          if (cmd === "tauri") {
            const module = (args as Record<string, unknown>).__tauriModule;
            const message =
              (args as Record<string, unknown>).message &&
              typeof (args as Record<string, unknown>).message === "object"
                ? ((args as Record<string, unknown>).message as Record<
                    string,
                    unknown
                  >)
                : {};

            if (module === "Dialog" && message.cmd === "openDialog") {
              resolve(null);
              return;
            }
            if (module === "Dialog" && message.cmd === "saveDialog") {
              resolve(null);
              return;
            }
            if (module === "Fs" && message.cmd === "writeFile") {
              resolve(null);
              return;
            }
            if (module === "Fs" && message.cmd === "readFile") {
              resolve([]);
              return;
            }

            resolve(null);
            return;
          }

          // Default for app-level commands: act like a no-op.
          resolve(null);
        } catch (e) {
          reject(e instanceof Error ? e.message : e);
        }
      };
    }
  });
});

// Handle uncaught exceptions from Tauri IPC
// This prevents test failures when Tauri APIs are called outside the Tauri webview
Cypress.on("uncaught:exception", (err) => {
  // Ignore Tauri IPC errors - expected when running in browser-only mode
  if (
    err.message.includes("__TAURI_IPC__") ||
    err.message.includes("__TAURI__")
  ) {
    return false; // Prevent test failure
  }

  // Let other errors fail the test
  return true;
});
