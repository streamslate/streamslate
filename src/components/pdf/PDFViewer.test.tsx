import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FitMode, type PDFDocument } from "../../types/pdf.types";
import { PDFCanvasRenderer } from "./PDFViewer";

const { pdfRendererMock } = vi.hoisted(() => ({
  pdfRendererMock: {
    isLoaded: true,
    loadDocument: vi.fn(),
    renderPage: vi.fn(),
  },
}));

vi.mock("../../lib/pdf/renderer", () => ({
  pdfRenderer: pdfRendererMock,
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

const pdfDocument: PDFDocument = {
  id: "pdf-render-regression",
  path: "/tmp/render-regression.pdf",
  title: "Render regression",
  pageCount: 2,
  fileSize: 1024,
  isLoaded: true,
};

async function renderCanvas(): Promise<RenderHandle> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <PDFCanvasRenderer
        pdfDocument={pdfDocument}
        currentPage={1}
        zoom={1}
        rotation={0}
        darkMode
        fitMode={FitMode.CUSTOM}
      />
    );
  });

  const handle = { container, root };
  mounted.push(handle);
  return handle;
}

beforeEach(() => {
  vi.useFakeTimers();
  pdfRendererMock.loadDocument.mockReset();
  pdfRendererMock.renderPage.mockReset();
  pdfRendererMock.renderPage.mockImplementation(
    async (_page: number, canvas: HTMLCanvasElement) => {
      canvas.width = 612;
      canvas.height = 792;
      return {
        canvas,
        hasVisibleContent: true,
        page: {},
        viewport: { width: 612, height: 792 },
      };
    }
  );
});

afterEach(async () => {
  vi.useRealTimers();
  while (mounted.length > 0) {
    const handle = mounted.pop();
    if (!handle) break;
    await act(async () => {
      handle.root.unmount();
    });
    handle.container.remove();
  }
});

describe("PDFCanvasRenderer", () => {
  it("keeps the PDF.js canvas visible while and after rendering", async () => {
    const { container } = await renderCanvas();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas?.classList.contains("hidden")).toBe(false);
    expect(canvas?.style.display).toBe("block");
    expect(canvas?.getAttribute("aria-label")).toBe("PDF page 1 rendered");
    expect(container.querySelector('img[alt="PDF page 1"]')).toBeNull();
    expect(pdfRendererMock.renderPage).toHaveBeenCalledWith(
      1,
      canvas,
      expect.objectContaining({
        scale: 1,
        rotation: 0,
        backgroundColor: "#ffffff",
        darkMode: true,
      })
    );
  });
});
