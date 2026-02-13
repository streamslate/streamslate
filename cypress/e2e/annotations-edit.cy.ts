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

describe("Annotations UX (Canvas)", () => {
  it("selects, moves, and resizes a rectangle annotation", () => {
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
    cy.get('[data-testid="annotation-layer"]').trigger("mouseup");

    cy.get('[data-testid="annotation-toolbar"]').should("be.visible");
    cy.get('[data-testid="annotation-handle-se"]').should("exist");

    // Keyboard nudge: ArrowRight should move the selection by ~1px (screen space).
    cy.get('[data-annotation-id="ann-rect"]')
      .invoke("attr", "x")
      .then((beforeX) => {
        cy.focused().type("{rightarrow}");
        cy.get('[data-annotation-id="ann-rect"]')
          .invoke("attr", "x")
          .then((afterX) => {
            cy.wrap(Number(afterX)).should("be.gt", Number(beforeX));
          });
      });

    // Alt + drag should duplicate the annotation and drag the copy.
    cy.get('[data-annotation-type="rectangle"]').should("have.length", 1);
    cy.get('[data-annotation-id="ann-rect"]').then(($el) => {
      const rect = $el[0].getBoundingClientRect();
      const clientX = rect.left + rect.width / 2;
      const clientY = rect.top + rect.height / 2;
      cy.wrap($el).trigger("mousedown", {
        clientX,
        clientY,
        button: 0,
        altKey: true,
        force: true,
      });
      cy.get('[data-testid="annotation-layer"]').trigger("mousemove", {
        clientX: clientX + 20,
        clientY: clientY + 5,
      });
      cy.get('[data-testid="annotation-layer"]').trigger("mouseup");
    });
    cy.get('[data-annotation-type="rectangle"]').should("have.length", 2);

    // Move: drag the rectangle by ~30px.
    cy.get('[data-annotation-id="ann-rect"]')
      .invoke("attr", "x")
      .then((beforeX) => {
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
          cy.get('[data-testid="annotation-layer"]').trigger("mousemove", {
            clientX: clientX + 30,
            clientY: clientY + 10,
          });
          cy.get('[data-testid="annotation-layer"]').trigger("mouseup");
        });

        cy.get('[data-annotation-id="ann-rect"]')
          .invoke("attr", "x")
          .then((afterX) => {
            cy.wrap(Number(afterX)).should("be.gt", Number(beforeX));
          });
      });

    // Resize (Shift locks aspect ratio): drag the SE handle.
    cy.get('[data-annotation-id="ann-rect"]')
      .invoke("attr", "width")
      .then((beforeW) => {
        cy.get('[data-annotation-id="ann-rect"]')
          .invoke("attr", "height")
          .then((beforeH) => {
            cy.get('[data-testid="annotation-handle-se"]').then(($handle) => {
              const rect = $handle[0].getBoundingClientRect();
              const hx = rect.left + rect.width / 2;
              const hy = rect.top + rect.height / 2;
              cy.wrap($handle).trigger("mousedown", {
                clientX: hx,
                clientY: hy,
                button: 0,
                force: true,
              });
              cy.get('[data-testid="annotation-layer"]').trigger("mousemove", {
                clientX: hx + 40,
                clientY: hy + 10,
                shiftKey: true,
              });
              cy.get('[data-testid="annotation-layer"]').trigger("mouseup");
            });

            cy.get('[data-annotation-id="ann-rect"]')
              .invoke("attr", "width")
              .then((afterW) => {
                cy.wrap(Number(afterW)).should("be.gt", Number(beforeW));
                cy.get('[data-annotation-id="ann-rect"]')
                  .invoke("attr", "height")
                  .then((afterH) => {
                    const ratioBefore = Number(beforeW) / Number(beforeH);
                    const ratioAfter = Number(afterW) / Number(afterH);
                    cy.wrap(Math.abs(ratioAfter - ratioBefore)).should(
                      "be.lessThan",
                      0.05
                    );
                  });
              });
          });
      });
  });
});
