import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PresenterView } from "./PresenterView";

const { listenMock } = vi.hoisted(() => ({
  listenMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: listenMock,
}));

vi.mock("../../lib/pdf/renderer", () => ({
  pdfRenderer: {
    loadDocument: vi.fn(),
    getPageDimensions: vi.fn(),
    renderPage: vi.fn(),
  },
}));

vi.mock("../../lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

interface RenderHandle {
  container: HTMLDivElement;
  root: Root;
}

const mounted: RenderHandle[] = [];
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  url: string;
  readyState = 1;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  close(): void {
    this.readyState = 3;
  }
}

async function render(element: React.ReactElement): Promise<RenderHandle> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(element);
  });

  const handle = { container, root };
  mounted.push(handle);
  return handle;
}

afterEach(async () => {
  while (mounted.length > 0) {
    const handle = mounted.pop();
    if (!handle) break;
    await act(async () => {
      handle.root.unmount();
    });
    handle.container.remove();
  }
});

beforeEach(() => {
  listenMock.mockReset();
  MockWebSocket.instances = [];
  vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);
  delete (window as Window & { __TAURI__?: unknown }).__TAURI__;
});

describe("PresenterView", () => {
  it("shows the waiting state and opens a local presenter websocket outside Tauri", async () => {
    const { container } = await render(<PresenterView />);

    expect(container.textContent).toContain("Presenter Mode");
    expect(container.textContent).toContain(
      "Waiting for PDF from main window..."
    );
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0]?.url).toBe("ws://127.0.0.1:11451");
    expect(listenMock).not.toHaveBeenCalled();
  });
});
