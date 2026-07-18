/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * PDF.js integration and rendering utilities
 */

import * as pdfjsLib from "pdfjs-dist";
import type {
  PDFDocumentProxy,
  PDFPageProxy,
  RenderTask,
} from "pdfjs-dist/types/src/display/api";
import { convertFileSrc } from "@tauri-apps/api/core";
import { logger } from "../logger";

// Import PDF.js worker with Vite's ?url syntax
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface RenderOptions {
  scale: number;
  rotation: number;
  viewport?: {
    width: number;
    height: number;
  };
  darkMode?: boolean;
  backgroundColor?: string;
}

export interface PDFRenderResult {
  canvas: HTMLCanvasElement;
  page: PDFPageProxy;
  hasVisibleContent: boolean;
  viewport: {
    width: number;
    height: number;
    scale: number;
    rotation: number;
  };
}

export function hasMeaningfulPageContrast(
  pixels: Uint8ClampedArray,
  minimumRange = 16
): boolean {
  let minimumLuminance = 255;
  let maximumLuminance = 0;
  let visiblePixels = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 16) continue;

    const luminance =
      pixels[index] * 0.2126 +
      pixels[index + 1] * 0.7152 +
      pixels[index + 2] * 0.0722;
    minimumLuminance = Math.min(minimumLuminance, luminance);
    maximumLuminance = Math.max(maximumLuminance, luminance);
    visiblePixels += 1;
  }

  return (
    visiblePixels > 0 && maximumLuminance - minimumLuminance >= minimumRange
  );
}

export function convertPixelsToDarkMode(pixels: Uint8ClampedArray): void {
  const darkBackground = 18;
  const lightForeground = 235;
  const outputRange = lightForeground - darkBackground;

  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] === 0) continue;

    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const sourceLightness =
      (Math.max(red, green, blue) + Math.min(red, green, blue)) / 2;
    const targetLightness =
      lightForeground - (sourceLightness / 255) * outputRange;
    const shift = targetLightness - sourceLightness;

    pixels[index] = Math.max(0, Math.min(255, red + shift));
    pixels[index + 1] = Math.max(0, Math.min(255, green + shift));
    pixels[index + 2] = Math.max(0, Math.min(255, blue + shift));
  }
}

function sampleCanvasPixels(canvas: HTMLCanvasElement): Uint8ClampedArray {
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = Math.min(canvas.width, 128);
  sampleCanvas.height = Math.min(canvas.height, 128);
  const sampleContext = sampleCanvas.getContext("2d");

  if (!sampleContext) {
    return new Uint8ClampedArray();
  }

  sampleContext.drawImage(
    canvas,
    0,
    0,
    canvas.width,
    canvas.height,
    0,
    0,
    sampleCanvas.width,
    sampleCanvas.height
  );
  return sampleContext.getImageData(
    0,
    0,
    sampleCanvas.width,
    sampleCanvas.height
  ).data;
}

export class PDFRenderer {
  private document: PDFDocumentProxy | null = null;
  private renderTasks: Set<RenderTask> = new Set();
  private canvasRenderTasks: WeakMap<HTMLCanvasElement, RenderTask> =
    new WeakMap();

  /**
   * Load a PDF document from a file path
   */
  async loadDocument(filePath: string): Promise<PDFDocumentProxy> {
    logger.debug("[PDFRenderer] Loading document from path:", filePath);

    try {
      // Convert the file path to a URL that Tauri can serve
      const fileUrl = convertFileSrc(filePath);
      logger.debug("[PDFRenderer] Converted file path to URL:", fileUrl);

      const response = await fetch(fileUrl);
      logger.debug(
        "[PDFRenderer] Fetch response:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch PDF: ${response.status} ${response.statusText}`
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      logger.debug("[PDFRenderer] ArrayBuffer size:", arrayBuffer.byteLength);

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: new URL("pdfjs-dist/cmaps/", import.meta.url).toString(),
        cMapPacked: true,
      });

      this.document = await loadingTask.promise;
      logger.debug(
        "[PDFRenderer] Document loaded successfully, pages:",
        this.document.numPages
      );
      return this.document;
    } catch (error) {
      logger.error("[PDFRenderer] Failed to load PDF:", error);
      throw new Error(
        `Failed to load PDF: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get a specific page from the loaded document
   */
  async getPage(pageNumber: number): Promise<PDFPageProxy> {
    if (!this.document) {
      throw new Error("No PDF document loaded");
    }

    if (pageNumber < 1 || pageNumber > this.document.numPages) {
      throw new Error(
        `Page ${pageNumber} is out of range (1-${this.document.numPages})`
      );
    }

    return await this.document.getPage(pageNumber);
  }

  /**
   * Render a PDF page to a canvas
   */
  async renderPage(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    options: RenderOptions
  ): Promise<PDFRenderResult> {
    logger.debug(
      "[PDFRenderer] Rendering page",
      pageNumber,
      "with options:",
      options
    );

    const page = await this.getPage(pageNumber);
    const existingTask = this.canvasRenderTasks.get(canvas);
    if (existingTask) {
      logger.debug("[PDFRenderer] Cancelling existing canvas render task");
      existingTask.cancel();
      try {
        await existingTask.promise;
      } catch (error) {
        if (
          !(error instanceof Error) ||
          error.name !== "RenderingCancelledException"
        ) {
          logger.warn("Prior canvas render failed during cancellation", error);
        }
      } finally {
        this.renderTasks.delete(existingTask);
        if (this.canvasRenderTasks.get(canvas) === existingTask) {
          this.canvasRenderTasks.delete(canvas);
        }
      }
    }

    const viewport = page.getViewport({
      scale: options.scale,
      rotation: options.rotation,
    });

    logger.debug(
      "[PDFRenderer] Viewport dimensions:",
      viewport.width,
      "x",
      viewport.height
    );

    // Set canvas dimensions
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get canvas context");
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Set canvas style dimensions to match
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    logger.debug(
      "[PDFRenderer] Canvas dimensions set to:",
      canvas.width,
      "x",
      canvas.height
    );
    logger.debug(
      "[PDFRenderer] Canvas style dimensions set to:",
      canvas.style.width,
      "x",
      canvas.style.height
    );

    // Clear canvas before rendering
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Start rendering
    const renderTask = page.render({
      canvasContext: context,
      viewport: viewport,
      background: options.backgroundColor ?? "#ffffff",
    });

    this.renderTasks.add(renderTask);
    this.canvasRenderTasks.set(canvas, renderTask);

    try {
      logger.debug("[PDFRenderer] Starting render for page", pageNumber);
      logger.debug(
        `[PDFRenderer] Canvas context type:`,
        context ? "2d" : "unknown"
      );
      logger.debug(
        `[PDFRenderer] Canvas style dimensions:`,
        canvas.style.width,
        "x",
        canvas.style.height
      );

      await renderTask.promise;
      this.renderTasks.delete(renderTask);
      if (this.canvasRenderTasks.get(canvas) === renderTask) {
        this.canvasRenderTasks.delete(canvas);
      }

      let contrastPixels: Uint8ClampedArray;
      if (options.darkMode) {
        const pagePixels = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        convertPixelsToDarkMode(pagePixels.data);
        context.putImageData(pagePixels, 0, 0);
        contrastPixels = pagePixels.data;
      } else {
        contrastPixels = sampleCanvasPixels(canvas);
      }

      // A solid page background is not a successful PDF render. Require
      // visible luminance contrast from the converted or sampled page pixels.
      const hasContent = hasMeaningfulPageContrast(contrastPixels);
      logger.debug(`[PDFRenderer] Canvas has visible content:`, hasContent);
      logger.debug(
        `[PDFRenderer] Sample pixel data (first 16 bytes):`,
        Array.from(contrastPixels.slice(0, 16))
      );

      logger.debug("[PDFRenderer] Successfully rendered page", pageNumber);

      return {
        canvas,
        page,
        hasVisibleContent: hasContent,
        viewport,
      };
    } catch (error) {
      logger.error(
        "[PDFRenderer] Render error for page",
        pageNumber,
        ":",
        error
      );
      this.renderTasks.delete(renderTask);
      if (this.canvasRenderTasks.get(canvas) === renderTask) {
        this.canvasRenderTasks.delete(canvas);
      }
      throw error;
    }
  }

  /**
   * Get page dimensions without rendering
   */
  async getPageDimensions(
    pageNumber: number,
    scale: number = 1
  ): Promise<{ width: number; height: number }> {
    const page = await this.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    return {
      width: viewport.width,
      height: viewport.height,
    };
  }

  /**
   * Get text content from a page
   */
  async getPageText(pageNumber: number): Promise<string> {
    const page = await this.getPage(pageNumber);
    const textContent = await page.getTextContent();

    return textContent.items
      .map((item) => (item as { str: string }).str)
      .join(" ");
  }

  /**
   * Search for text in the document
   */
  async searchText(
    query: string,
    caseSensitive: boolean = false
  ): Promise<
    Array<{
      pageNumber: number;
      text: string;
      matches: number;
    }>
  > {
    if (!this.document) {
      throw new Error("No PDF document loaded");
    }

    const results: Array<{
      pageNumber: number;
      text: string;
      matches: number;
    }> = [];
    const searchRegex = new RegExp(query, caseSensitive ? "g" : "gi");

    for (let pageNum = 1; pageNum <= this.document.numPages; pageNum++) {
      try {
        const pageText = await this.getPageText(pageNum);
        const matches = pageText.match(searchRegex);

        if (matches && matches.length > 0) {
          results.push({
            pageNumber: pageNum,
            text: pageText,
            matches: matches.length,
          });
        }
      } catch (error) {
        logger.warn(`Failed to search page ${pageNum}:`, error);
      }
    }

    return results;
  }

  /**
   * Cancel all ongoing render tasks
   */
  cancelAllRenderTasks(): void {
    this.renderTasks.forEach((task) => {
      task.cancel();
    });
    this.renderTasks.clear();
    this.canvasRenderTasks = new WeakMap();
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.cancelAllRenderTasks();

    if (this.document) {
      this.document.destroy();
      this.document = null;
    }
  }

  /**
   * Get document metadata
   */
  async getMetadata(): Promise<Record<string, unknown>> {
    if (!this.document) {
      throw new Error("No PDF document loaded");
    }

    try {
      const metadata = await this.document.getMetadata();
      return metadata.info as Record<string, unknown>;
    } catch (error) {
      logger.warn("Failed to get PDF metadata:", error);
      return {};
    }
  }

  /**
   * Get the number of pages in the document
   */
  get pageCount(): number {
    return this.document?.numPages ?? 0;
  }

  /**
   * Check if a document is loaded
   */
  get isLoaded(): boolean {
    return this.document !== null;
  }
}

// Global renderer instance
export const pdfRenderer = new PDFRenderer();
