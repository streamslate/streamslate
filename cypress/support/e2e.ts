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

    // Mock the Tauri IPC bridge if not present
    if (!tauriWindow.__TAURI_IPC__) {
      tauriWindow.__TAURI_IPC__ = () => {
        // Return a resolved promise for basic IPC calls
        return Promise.resolve();
      };
    }

    // Mock __TAURI__ global if not present
    if (!tauriWindow.__TAURI__) {
      tauriWindow.__TAURI__ = {
        invoke: () => Promise.resolve(),
        event: {
          listen: () => Promise.resolve(() => {}),
          emit: () => Promise.resolve(),
        },
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
