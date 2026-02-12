/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

type MockMode = "open" | "error";

function installMockWebSocket(
  win: Window & typeof globalThis,
  mode: MockMode = "open"
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalWindow = win as any;
  globalWindow.__mockSockets = [];
  globalWindow.__mockSocketMode = mode;

  class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    public readyState = MockWebSocket.CONNECTING;
    public onopen: ((event: Event) => void) | null = null;
    public onclose: ((event: CloseEvent) => void) | null = null;
    public onerror: ((event: Event) => void) | null = null;
    public onmessage: ((event: MessageEvent) => void) | null = null;
    public url: string;

    constructor(url: string) {
      this.url = url;
      globalWindow.__mockSockets.push(this);

      win.setTimeout(() => {
        if (globalWindow.__mockSocketMode === "error") {
          this.readyState = MockWebSocket.CLOSED;
          this.onerror?.(new Event("error"));
          return;
        }

        this.readyState = MockWebSocket.OPEN;
        this.onopen?.(new Event("open"));
      }, 0);
    }

    send(_data: string) {
      return;
    }

    close(code = 1000, reason = "closed") {
      this.readyState = MockWebSocket.CLOSING;
      this.onclose?.({ code, reason, wasClean: true } as CloseEvent);
      this.readyState = MockWebSocket.CLOSED;
    }

    emitClose(code = 1000, reason = "closed") {
      this.readyState = MockWebSocket.CLOSED;
      this.onclose?.({ code, reason, wasClean: true } as CloseEvent);
    }
  }

  globalWindow.WebSocket = MockWebSocket;
}

describe("Integration WebSocket State", () => {
  it("connects to the local websocket endpoint and updates status", () => {
    cy.visit("/", {
      onBeforeLoad(win) {
        installMockWebSocket(win, "open");
      },
    });

    cy.window().then((win) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sockets = (win as any).__mockSockets as Array<{ url: string }>;
      cy.wrap(sockets.length).should("be.gte", 1);
    });

    cy.get('[data-testid="status-bar"]').contains("WebSocket Connected");
  });

  it("transitions to disconnected when websocket closes", () => {
    cy.visit("/", {
      onBeforeLoad(win) {
        installMockWebSocket(win, "open");
      },
    });

    cy.get('[data-testid="status-bar"]').contains("WebSocket Connected");

    cy.window().then((win) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sockets = (win as any).__mockSockets as Array<{
        emitClose: (code?: number, reason?: string) => void;
      }>;
      sockets.forEach((socket) => socket.emitClose(1000, "test close"));
    });

    cy.get('[data-testid="status-bar"]').contains("WebSocket Disconnected");
  });

  it("stays disconnected when websocket connection errors", () => {
    cy.visit("/", {
      onBeforeLoad(win) {
        installMockWebSocket(win, "error");
      },
    });

    cy.get('[data-testid="status-bar"]').contains("WebSocket Disconnected");
  });
});
