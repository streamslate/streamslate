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
 * PresenterView - Minimal PDF display for OBS/external capture
 *
 * This component runs in a separate Tauri window and displays the PDF
 * without any chrome or controls. It syncs with the main window via
 * Tauri events.
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { pdfRenderer } from "../../lib/pdf/renderer";

interface PageChangedPayload {
  page: number;
  totalPages?: number;
  pdfPath?: string;
}

interface PdfOpenedPayload {
  path: string;
  pageCount: number;
}

export const PresenterView: React.FC = () => {
  // State for PDF display
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderedImage, setRenderedImage] = useState<string | null>(null);

  // Canvas ref for rendering
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Render the current page
  const renderPage = useCallback(async () => {
    if (!pdfPath || !canvasRef.current || !containerRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load the document if needed
      await pdfRenderer.loadDocument(pdfPath);

      // Get container dimensions for fit calculation
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Get page dimensions
      const pageDims = await pdfRenderer.getPageDimensions(currentPage);

      // Calculate scale to fit page in container
      const scaleX = containerWidth / pageDims.width;
      const scaleY = containerHeight / pageDims.height;
      const scale = Math.min(scaleX, scaleY, 2); // Cap at 2x for performance

      // Render the page to the canvas
      const result = await pdfRenderer.renderPage(
        currentPage,
        canvasRef.current,
        {
          scale,
          rotation: 0,
        }
      );

      // Convert canvas to data URL for display
      setRenderedImage(result.canvas.toDataURL("image/png"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to render page");
    } finally {
      setIsLoading(false);
    }
  }, [pdfPath, currentPage]);

  // Set up Tauri event listeners
  // Set up event listeners (Tauri or WebSocket)
  useEffect(() => {
    let unlistenFns: UnlistenFn[] = [];
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const setupTauriListeners = async () => {
      try {
        // Listen for page changes from main window
        const unlistenPageChanged = await listen<PageChangedPayload>(
          "page-changed",
          (event) => {
            setCurrentPage(event.payload.page);
            if (event.payload.totalPages) {
              setTotalPages(event.payload.totalPages);
            }
            if (event.payload.pdfPath) {
              setPdfPath(event.payload.pdfPath);
            }
          }
        );
        unlistenFns.push(unlistenPageChanged);

        // Listen for PDF opened events
        const unlistenPdfOpened = await listen<PdfOpenedPayload>(
          "pdf-opened",
          (event) => {
            setPdfPath(event.payload.path);
            setTotalPages(event.payload.pageCount);
            setCurrentPage(1);
          }
        );
        unlistenFns.push(unlistenPdfOpened);

        // Listen for PDF closed events
        const unlistenPdfClosed = await listen("pdf-closed", () => {
          setPdfPath(null);
          setTotalPages(0);
          setCurrentPage(1);
          setRenderedImage(null);
        });
        unlistenFns.push(unlistenPdfClosed);

        // Listen for zoom changes
        const unlistenZoomChanged = await listen<{ zoom: number }>(
          "zoom-changed",
          () => {
            // Re-render with new zoom
            renderPage();
          }
        );
        unlistenFns.push(unlistenZoomChanged);
      } catch (err) {
        console.warn(
          "Failed to setup Tauri listeners, falling back to WebSocket",
          err
        );
        setupWebSocket();
      }
    };

    const setupWebSocket = () => {
      // Connect to local WebSocket server
      ws = new WebSocket("ws://127.0.0.1:11451");

      ws.onopen = () => {
        console.log("Connected to Presenter WebSocket");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "STATE":
              setCurrentPage(data.page);
              setTotalPages(data.total_pages);
              if (data.pdf_path) setPdfPath(data.pdf_path);
              break;

            case "PAGE_CHANGED":
              setCurrentPage(data.page);
              setTotalPages(data.total_pages);
              break;

            case "PDF_OPENED":
              setPdfPath(data.path);
              setTotalPages(data.page_count);
              setCurrentPage(1);
              break;

            case "PDF_CLOSED":
              setPdfPath(null);
              setTotalPages(0);
              setCurrentPage(1);
              setRenderedImage(null);
              break;

            case "ZOOM_CHANGED":
              // Trigger re-render
              renderPage();
              break;
          }
        } catch (e) {
          console.error("Failed to parse WebSocket message", e);
        }
      };

      ws.onclose = () => {
        console.log("Presenter WebSocket closed, reconnecting in 3s...");
        reconnectTimeout = setTimeout(setupWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.error("Presenter WebSocket error", err);
      };
    };

    // Detect environment
    if (window.__TAURI__) {
      setupTauriListeners();
    } else {
      setupWebSocket();
    }

    // Cleanup listeners on unmount
    return () => {
      unlistenFns.forEach((unlisten) => unlisten());
      if (ws) {
        ws.onclose = null; // Prevent reconnect on cleanup
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [renderPage]);

  // Re-render when page or PDF changes
  useEffect(() => {
    if (pdfPath && currentPage > 0) {
      renderPage();
    }
  }, [pdfPath, currentPage, renderPage]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (pdfPath) {
        renderPage();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [pdfPath, renderPage]);

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen flex items-center justify-center bg-transparent overflow-hidden"
    >
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white text-lg">Loading...</div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/50 z-10">
          <div className="text-white text-lg p-4 text-center">
            <p>Error: {error}</p>
          </div>
        </div>
      )}

      {/* No PDF loaded state */}
      {!pdfPath && !isLoading && (
        <div className="text-white/50 text-center p-8">
          <p className="text-2xl mb-2">Presenter Mode</p>
          <p className="text-sm">Waiting for PDF from main window...</p>
          <p className="text-xs mt-4 text-white/30">
            Open a PDF in the main StreamSlate window to begin
          </p>
        </div>
      )}

      {/* PDF Display */}
      {renderedImage && (
        <img
          src={renderedImage}
          alt={`Page ${currentPage} of ${totalPages}`}
          className="max-w-full max-h-full object-contain"
          style={{
            // Apply dark mode inversion if needed
            filter: "none",
          }}
        />
      )}

      {/* Hidden canvas for rendering */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Minimal page indicator (bottom right, semi-transparent) */}
      {pdfPath && totalPages > 0 && (
        <div className="absolute bottom-2 right-2 bg-black/30 text-white/70 text-xs px-2 py-1 rounded">
          {currentPage} / {totalPages}
        </div>
      )}
    </div>
  );
};
