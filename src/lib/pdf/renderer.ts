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

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

export interface RenderOptions {
  scale: number;
  rotation: number;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface PDFRenderResult {
  canvas: HTMLCanvasElement;
  page: PDFPageProxy;
  viewport: any;
}

export class PDFRenderer {
  private document: PDFDocumentProxy | null = null;
  private renderTasks: Map<number, RenderTask> = new Map();

  /**
   * Load a PDF document from a file path
   */
  async loadDocument(filePath: string): Promise<PDFDocumentProxy> {
    try {
      // Convert file path to data URL for PDF.js
      const response = await fetch(`file://${filePath}`);
      const arrayBuffer = await response.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: new URL("pdfjs-dist/cmaps/", import.meta.url).toString(),
        cMapPacked: true,
      });

      this.document = await loadingTask.promise;
      return this.document;
    } catch (error) {
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
    const page = await this.getPage(pageNumber);
    const viewport = page.getViewport({
      scale: options.scale,
      rotation: options.rotation,
    });

    // Set canvas dimensions
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get canvas context");
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Cancel any existing render task for this page
    const existingTask = this.renderTasks.get(pageNumber);
    if (existingTask) {
      existingTask.cancel();
      this.renderTasks.delete(pageNumber);
    }

    // Start rendering
    const renderTask = page.render({
      canvasContext: context,
      viewport: viewport,
    });

    this.renderTasks.set(pageNumber, renderTask);

    try {
      await renderTask.promise;
      this.renderTasks.delete(pageNumber);

      return {
        canvas,
        page,
        viewport,
      };
    } catch (error) {
      this.renderTasks.delete(pageNumber);
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

    return textContent.items.map((item: any) => item.str).join(" ");
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
        console.warn(`Failed to search page ${pageNum}:`, error);
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
  async getMetadata(): Promise<any> {
    if (!this.document) {
      throw new Error("No PDF document loaded");
    }

    try {
      const metadata = await this.document.getMetadata();
      return metadata.info;
    } catch (error) {
      console.warn("Failed to get PDF metadata:", error);
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
