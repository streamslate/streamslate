/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * E2E coverage for selecting + moving + resizing annotations in the canvas.
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

function readRectGeometry(selector: string) {
  return cy.get(selector).then(($el) => {
    const node = $el[0];
    return {
      x: Number(node.getAttribute("x") ?? 0),
      y: Number(node.getAttribute("y") ?? 0),
      width: Number(node.getAttribute("width") ?? 0),
      height: Number(node.getAttribute("height") ?? 0),
    };
  });
}

describe("Annotations UX (Canvas)", () => {
  it("selects a rectangle annotation and can delete it via the toolbar", () => {
    const pdfBytes = pdfBytesFromBase64();

    cy.visit("/", {
      onBeforeLoad(win) {
        installMockWebSocket(win, "open");

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

    cy.get('[data-testid="status-bar"]')
      .contains("WebSocket Connected")
      .should("be.visible");

    // Simulate backend state: PDF is open.
    cy.window().then((win) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sockets = (win as any).__mockSockets as Array<{
        emitMessage: (payload: Record<string, unknown>) => void;
      }>;
      cy.wrap(sockets.length).should("be.gt", 0);
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

    // Wait until the app has switched out of the empty state.
    cy.contains("button", "Close PDF", { timeout: 20000 }).should("be.visible");

    // Inject a rectangle annotation.
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
                id: "ann-rect",
                type: "rectangle",
                pageNumber: 1,
                x: 40,
                y: 40,
                width: 80,
                height: 50,
                content: "",
                color: "#ff0000",
                opacity: 0.8,
                strokeWidth: 2,
                created: "2026-02-12T00:00:00.000Z",
                modified: "2026-02-12T00:00:00.000Z",
                visible: true,
              },
            ],
          },
        })
      );
    });

    cy.get('[data-testid="annotation-layer"]', { timeout: 20000 }).should(
      "be.visible"
    );
    cy.get('[data-annotation-id="ann-rect"]').should("exist");

    // Select (shows toolbar + handles).
    cy.get('[data-annotation-id="ann-rect"]').then(($el) => {
      const rect = $el[0].getBoundingClientRect();
      const clientX = rect.left + rect.width / 2;
      const clientY = rect.top + rect.height / 2;
      cy.wrap($el).trigger("mousedown", {
        clientX,
        clientY,
        button: 0,
        force: true,
      });
    });
    cy.get('[data-testid="annotation-layer"]').trigger("mouseup", {
      force: true,
    });

    cy.get('[data-testid="annotation-toolbar"]').should("exist");
    cy.get('[data-testid="annotation-handle-se"]').should("exist");

    cy.get('[data-testid="annotation-toolbar"]')
      .contains("button", "Delete")
      .click({ force: true });
    cy.get('[data-annotation-id="ann-rect"]').should("not.exist");
    cy.get('[data-testid="annotation-toolbar"]').should("not.exist");
  });

  it("duplicates an annotation via toolbar and keyboard shortcut", () => {
    const pdfBytes = pdfBytesFromBase64();

    cy.visit("/", {
      onBeforeLoad(win) {
        installMockWebSocket(win, "open");

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

    cy.get('[data-testid="status-bar"]')
      .contains("WebSocket Connected")
      .should("be.visible");

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

    cy.contains("button", "Close PDF", { timeout: 20000 }).should("be.visible");

    // Inject a rectangle annotation.
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
                id: "ann-rect",
                type: "rectangle",
                pageNumber: 1,
                x: 40,
                y: 40,
                width: 80,
                height: 50,
                content: "",
                color: "#ff0000",
                opacity: 0.8,
                strokeWidth: 2,
                created: "2026-02-12T00:00:00.000Z",
                modified: "2026-02-12T00:00:00.000Z",
                visible: true,
              },
            ],
          },
        })
      );
    });

    cy.get('[data-testid="annotation-layer"]', { timeout: 20000 }).should(
      "be.visible"
    );

    // Select (shows toolbar).
    cy.get('[data-annotation-id="ann-rect"]').then(($el) => {
      const rect = $el[0].getBoundingClientRect();
      const clientX = rect.left + rect.width / 2;
      const clientY = rect.top + rect.height / 2;
      cy.wrap($el).trigger("mousedown", {
        clientX,
        clientY,
        button: 0,
        force: true,
      });
    });
    cy.get('[data-testid="annotation-layer"]').trigger("mouseup", {
      force: true,
    });

    cy.get('[data-testid="annotation-toolbar"]').should("exist");
    cy.get('[data-annotation-type="rectangle"]').should("have.length", 1);

    // Toolbar duplicate.
    cy.get('[data-testid="annotation-toolbar"]')
      .contains("button", "Duplicate")
      .click({ force: true });
    cy.get('[data-annotation-type="rectangle"]').should("have.length", 2);

    // Keyboard duplicate (Ctrl/Cmd+D).
    const chord = Cypress.platform === "darwin" ? "{meta}d" : "{ctrl}d";
    cy.get('[data-testid="annotation-layer"]').parent().focus().type(chord);
    cy.get('[data-annotation-type="rectangle"]').should("have.length", 3);
  });

  it("moves with arrow keys and resizes with Alt+Arrow keys", () => {
    const pdfBytes = pdfBytesFromBase64();

    cy.visit("/", {
      onBeforeLoad(win) {
        installMockWebSocket(win, "open");

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

    cy.get('[data-testid="status-bar"]')
      .contains("WebSocket Connected")
      .should("be.visible");

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

    cy.contains("button", "Close PDF", { timeout: 20000 }).should("be.visible");

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
                id: "ann-rect",
                type: "rectangle",
                pageNumber: 1,
                x: 40,
                y: 40,
                width: 80,
                height: 50,
                content: "",
                color: "#ff0000",
                opacity: 0.8,
                strokeWidth: 2,
                created: "2026-02-12T00:00:00.000Z",
                modified: "2026-02-12T00:00:00.000Z",
                visible: true,
              },
            ],
          },
        })
      );
    });

    cy.get('[data-testid="annotation-layer"]', { timeout: 20000 }).should(
      "be.visible"
    );
    cy.get('[data-annotation-id="ann-rect"]').then(($el) => {
      const rect = $el[0].getBoundingClientRect();
      const clientX = rect.left + rect.width / 2;
      const clientY = rect.top + rect.height / 2;
      cy.wrap($el).trigger("mousedown", {
        clientX,
        clientY,
        button: 0,
        force: true,
      });
    });
    cy.get('[data-testid="annotation-layer"]').trigger("mouseup", {
      force: true,
    });
    cy.get('[data-testid="annotation-toolbar"]').should("exist");

    readRectGeometry('[data-annotation-id="ann-rect"]').then((before) => {
      cy.get('[data-testid="annotation-layer"]')
        .parent()
        .focus()
        .trigger("keydown", {
          key: "ArrowRight",
          code: "ArrowRight",
          force: true,
        })
        .trigger("keydown", {
          key: "ArrowDown",
          code: "ArrowDown",
          force: true,
        });

      cy.get('[data-annotation-id="ann-rect"]').should(($el) => {
        const node = $el[0];
        const nextX = Number(node.getAttribute("x"));
        const nextY = Number(node.getAttribute("y"));
        const movedX = nextX > before.x;
        const movedY = nextY > before.y;
        const regressed = nextX < before.x || nextY < before.y;
        if (regressed || (!movedX && !movedY)) {
          throw new Error(
            `Expected moved rect to increase at least one axis from (${before.x}, ${before.y}) but got (${nextX}, ${nextY})`
          );
        }
      });

      cy.get('[data-testid="annotation-layer"]')
        .parent()
        .trigger("keydown", {
          key: "ArrowRight",
          code: "ArrowRight",
          altKey: true,
          force: true,
        })
        .trigger("keydown", {
          key: "ArrowDown",
          code: "ArrowDown",
          altKey: true,
          force: true,
        });

      cy.get('[data-annotation-id="ann-rect"]').should(($el) => {
        const node = $el[0];
        const nextWidth = Number(node.getAttribute("width"));
        const nextHeight = Number(node.getAttribute("height"));
        const grewWidth = nextWidth > before.width;
        const grewHeight = nextHeight > before.height;
        const regressed =
          nextWidth < before.width || nextHeight < before.height;
        if (regressed || (!grewWidth && !grewHeight)) {
          throw new Error(
            `Expected resized rect to increase at least one axis from (${before.width}, ${before.height}) but got (${nextWidth}, ${nextHeight})`
          );
        }
      });
    });
  });
});
