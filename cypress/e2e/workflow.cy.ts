/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * End-to-end workflow coverage for remote-control driven PDF + annotation + export paths.
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

    emitMessage(payload: Record<string, unknown>) {
      this.onmessage?.({ data: JSON.stringify(payload) } as MessageEvent);
    }
  }

  globalWindow.WebSocket = MockWebSocket;
}

const PDF_BASE64 =
  "JVBERi0xLjcKJYGBgYEKCjUgMCBvYmoKPDwKL0ZpbHRlciAvRmxhdGVEZWNvZGUKL1R5cGUgL09ialN0bQovTiA0Ci9GaXJzdCAyMAovTGVuZ3RoIDI1OQo+PgpzdHJlYW0KeJzVUk1LxDAQvedXzFFPmUyzSSul4PbjIsKyeFL2ELZhKchm6Qfov3fSrIoH8ezhMZm8N0kmbxQgEGgNGdgcNGwygrIU8un94kHu3MlPQj4M/QQvzCLs4SBkHZbzDEpUlfjW1m52r+EkUhGoKP5U7MbQL0c/Qtm1XYdoEdFohkGkhmPNKBjEOXOU85ph9RW8ZzPE7J65LsHYVBP5Vbu51rccWWuipklanaf86954V5vOoL/eU1RCPoa+cbOHm+aOkAySImVVQeb5lr9j9G4O/7e59f1DOP/a4Q+fo73R5NHHGVhdlns/hWU8su2sq+J/+X5w2/DGU4NxwjDhEMkPP1aN0gplbmRzdHJlYW0KZW5kb2JqCgo2IDAgb2JqCjw8Ci9TaXplIDcKL1Jvb3QgMiAwIFIKL0luZm8gMyAwIFIKL0ZpbHRlciAvRmxhdGVEZWNvZGUKL1R5cGUgL1hSZWYKL0xlbmd0aCAzNAovVyBbIDEgMiAyIF0KL0luZGV4IFsgMCA3IF0KPj4Kc3RyZWFtCnicFcQxDgAgCASwHsbd7/p6CB2K7nLZstV24pF8BkOGAq0KZW5kc3RyZWFtCmVuZG9iagoKc3RhcnR4cmVmCjM3NwolJUVPRg==";

function pdfBytesFromBase64(): Uint8Array {
  const binary = atob(PDF_BASE64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

describe("Core Workflow (Remote)", () => {
  it("applies remote PDF state, annotations, and can export", () => {
    const pdfBytes = pdfBytesFromBase64();

    cy.visit("/", {
      onBeforeLoad(win) {
        installMockWebSocket(win, "open");

        win.localStorage.removeItem("layout.sidebarOpen");
        win.localStorage.removeItem("layout.activePanel");

        const originalFetch = win.fetch.bind(win);
        win.fetch = (input, init) => {
          const url = typeof input === "string" ? input : input.url;
          if (url.endsWith("/mock.pdf") || url === "/mock.pdf") {
            return Promise.resolve(
              new win.Response(pdfBytes, {
                status: 200,
                headers: { "Content-Type": "application/pdf" },
              })
            );
          }
          return originalFetch(input, init);
        };
      },
    });

    cy.get('[data-testid="status-bar"]').contains("WebSocket Connected");

    // Ensure save dialog + fs write succeed in browser-only mode.
    cy.window().then((win) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = win as any;
      w.__TAURI_MOCK_IPC__.handlers.unshift({
        match: ({
          cmd,
          args,
        }: {
          cmd: string;
          args: Record<string, unknown>;
        }) =>
          cmd === "tauri" &&
          args.__tauriModule === "Dialog" &&
          typeof args.message === "object" &&
          args.message !== null &&
          (args.message as { cmd?: unknown }).cmd === "saveDialog",
        handle: () => "/tmp/streamslate-export.pdf",
      });
    });

    // Simulate backend state: PDF is open.
    cy.window().then((win) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sockets = (win as any).__mockSockets as Array<{
        emitMessage: (payload: Record<string, unknown>) => void;
      }>;
      sockets.forEach((socket) =>
        socket.emitMessage({
          type: "STATE",
          page: 1,
          total_pages: 1,
          zoom: 1.0,
          pdf_loaded: true,
          pdf_path: "/mock.pdf",
          pdf_title: "Mock PDF",
          presenter_active: false,
        })
      );
    });

    // Export should be enabled once the PDF is considered loaded.
    cy.get("[data-testid='panel-files']").should("be.visible");
    cy.contains("button", "Export with Annotations").should("not.be.disabled");

    // Simulate remote annotations update.
    cy.get("[data-testid='tab-annotations']").click();
    cy.get("[data-testid='panel-annotations']").should("be.visible");
    cy.contains("No annotations yet").should("be.visible");

    cy.window().then((win) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sockets = (win as any).__mockSockets as Array<{
        emitMessage: (payload: Record<string, unknown>) => void;
      }>;
      sockets.forEach((socket) =>
        socket.emitMessage({
          type: "ANNOTATIONS_UPDATED",
          annotations: {
            1: [
              {
                id: "ann-1",
                type: "highlight",
                pageNumber: 1,
                x: 10,
                y: 10,
                width: 50,
                height: 20,
                content: "",
                color: "#ffff00",
                opacity: 0.5,
                created: "2026-02-12T00:00:00.000Z",
                modified: "2026-02-12T00:00:00.000Z",
                visible: true,
              },
            ],
          },
        })
      );
    });

    cy.contains("1 total").should("be.visible");
    cy.contains("Highlight").should("be.visible");

    // Delete the annotation from the UI.
    cy.get('[title="Delete annotation"]').click({ force: true });
    cy.contains("No annotations yet").should("be.visible");

    // Export and assert a writeFile call was made via IPC.
    cy.get("[data-testid='tab-files']").click();
    cy.contains("button", "Export with Annotations").click();

    cy.window()
      .then((win) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = win as any;
        const calls = w.__TAURI_MOCK_IPC__.calls as Array<{
          cmd: string;
          args: Record<string, unknown>;
        }>;

        const wroteFile = calls.some((c) => {
          const module = c.cmd === "tauri" ? c.args.__tauriModule : null;
          const message = c.args.message as Record<string, unknown> | undefined;
          return module === "Fs" && message?.cmd === "writeFile";
        });
        return wroteFile;
      })
      .should("eq", true);
  });
});
