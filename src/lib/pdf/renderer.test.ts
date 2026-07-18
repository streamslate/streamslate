import { describe, expect, it, vi } from "vitest";
import type {
  PDFDocumentProxy,
  RenderTask,
} from "pdfjs-dist/types/src/display/api";
import {
  convertPixelsToDarkMode,
  hasMeaningfulPageContrast,
  PDFRenderer,
} from "./renderer";

vi.mock("../logger", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("hasMeaningfulPageContrast", () => {
  it("rejects an opaque solid background", () => {
    expect(
      hasMeaningfulPageContrast(
        new Uint8ClampedArray([255, 255, 255, 255, 255, 255, 255, 255])
      )
    ).toBe(false);
  });

  it("accepts contrasting page content", () => {
    expect(
      hasMeaningfulPageContrast(
        new Uint8ClampedArray([255, 255, 255, 255, 20, 20, 20, 255])
      )
    ).toBe(true);
  });
});

describe("convertPixelsToDarkMode", () => {
  it("maps a white page to dark and black text to light", () => {
    const pixels = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]);

    convertPixelsToDarkMode(pixels);

    expect(Array.from(pixels)).toEqual([18, 18, 18, 255, 235, 235, 235, 255]);
  });

  it("preserves mid-tone color identity while inverting lightness", () => {
    const pixels = new Uint8ClampedArray([220, 40, 40, 255]);

    convertPixelsToDarkMode(pixels);

    expect(pixels[0]).toBeGreaterThan(pixels[1]);
    expect(pixels[0]).toBeGreaterThan(pixels[2]);
  });
});

describe("PDFRenderer render coordination", () => {
  it("awaits cancellation before reusing the same canvas", async () => {
    let rejectFirstRender: ((error: Error) => void) | undefined;
    const firstTask = {
      promise: new Promise<void>((_resolve, reject) => {
        rejectFirstRender = reject;
      }),
      cancel: vi.fn(() => {
        const error = new Error("cancelled");
        error.name = "RenderingCancelledException";
        rejectFirstRender?.(error);
      }),
    } as unknown as RenderTask;
    const secondTask = {
      promise: Promise.resolve(),
      cancel: vi.fn(),
    } as unknown as RenderTask;
    const page = {
      getViewport: vi.fn(() => ({
        width: 10,
        height: 10,
        scale: 1,
        rotation: 0,
      })),
      render: vi
        .fn()
        .mockReturnValueOnce(firstTask)
        .mockReturnValue(secondTask),
    };
    const renderer = new PDFRenderer();
    (
      renderer as unknown as {
        document: Pick<PDFDocumentProxy, "getPage" | "numPages">;
      }
    ).document = {
      numPages: 1,
      getPage: vi.fn().mockResolvedValue(page),
    };
    const context = {
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]),
      })),
      putImageData: vi.fn(),
    };
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D
    );

    const firstRender = renderer.renderPage(1, canvas, {
      scale: 1,
      rotation: 0,
      darkMode: true,
    });
    await Promise.resolve();
    const secondRender = renderer.renderPage(1, canvas, {
      scale: 1,
      rotation: 0,
      darkMode: true,
    });

    await expect(firstRender).rejects.toMatchObject({
      name: "RenderingCancelledException",
    });
    await expect(secondRender).resolves.toMatchObject({
      hasVisibleContent: true,
    });
    expect(firstTask.cancel).toHaveBeenCalledTimes(1);
    expect(page.render).toHaveBeenCalledTimes(2);
  });
});
