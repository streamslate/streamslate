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
 * Custom hooks for PDF operations
 */

import { useCallback } from "react";
import { open } from "@tauri-apps/api/dialog";
import { PDFCommands } from "../lib/tauri/commands";
import { usePDFStore } from "../stores/pdf.store";
import { LoadingStage } from "../types/pdf.types";
import type { PDFDocument, PDFError } from "../types/pdf.types";

export const usePDF = () => {
  const {
    document,
    viewerState,
    loadingState,
    error,
    setDocument,
    setLoading,
    setError,
    reset,
    canGoToNextPage,
    canGoToPreviousPage,
    goToNextPage,
    goToPreviousPage,
    setCurrentPage,
    setZoom,
    setRotation,
    setFitMode,
    setViewMode,
    toggleSidebar,
    toggleToolbar,
  } = usePDFStore();

  /**
   * Open a PDF file dialog and load the selected file
   */
  const openPDF = useCallback(async () => {
    try {
      setLoading(true, LoadingStage.OPENING, 0, "Opening file dialog...");

      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "PDF Documents",
            extensions: ["pdf"],
          },
        ],
      });

      if (!selected || Array.isArray(selected)) {
        setLoading(false);
        return;
      }

      setLoading(true, LoadingStage.PARSING, 25, "Parsing PDF file...");

      const pdfInfo = await PDFCommands.openPdf(selected);

      const pdfDocument: PDFDocument = {
        id: crypto.randomUUID(),
        path: pdfInfo.path,
        title: pdfInfo.title,
        author: pdfInfo.author,
        pageCount: pdfInfo.page_count,
        fileSize: pdfInfo.file_size,
        created: pdfInfo.created
          ? new Date(parseInt(pdfInfo.created) * 1000)
          : undefined,
        modified: pdfInfo.modified
          ? new Date(parseInt(pdfInfo.modified) * 1000)
          : undefined,
        isLoaded: true,
      };

      setLoading(true, LoadingStage.COMPLETE, 100, "PDF loaded successfully");
      setDocument(pdfDocument);
      setCurrentPage(1);
      setError(null);

      // Complete loading after a brief delay to show success message
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (err) {
      const error: PDFError = {
        code: "LOAD_ERROR",
        message: err instanceof Error ? err.message : "Failed to load PDF",
        details: err,
      };
      setError(error);
      setLoading(false, LoadingStage.ERROR, 0, error.message);
    }
  }, [setDocument, setLoading, setError, setCurrentPage]);

  /**
   * Close the currently open PDF
   */
  const closePDF = useCallback(async () => {
    try {
      await PDFCommands.closePdf();
      reset();
    } catch (err) {
      const error: PDFError = {
        code: "CLOSE_ERROR",
        message: err instanceof Error ? err.message : "Failed to close PDF",
        details: err,
      };
      setError(error);
    }
  }, [reset, setError]);

  /**
   * Navigate to a specific page
   */
  const goToPage = useCallback(
    (pageNumber: number) => {
      if (!document) return;

      const page = Math.max(1, Math.min(pageNumber, document.pageCount));
      setCurrentPage(page);
    },
    [document, setCurrentPage]
  );

  /**
   * Zoom to a specific level
   */
  const zoomTo = useCallback(
    (zoomLevel: number) => {
      const zoom = Math.max(0.1, Math.min(zoomLevel, 5.0));
      setZoom(zoom);
    },
    [setZoom]
  );

  /**
   * Zoom in by a factor
   */
  const zoomIn = useCallback(
    (factor: number = 1.2) => {
      if (!viewerState) return;
      zoomTo(viewerState.zoom * factor);
    },
    [viewerState, zoomTo]
  );

  /**
   * Zoom out by a factor
   */
  const zoomOut = useCallback(
    (factor: number = 1.2) => {
      if (!viewerState) return;
      zoomTo(viewerState.zoom / factor);
    },
    [viewerState, zoomTo]
  );

  /**
   * Rotate the document by 90 degrees
   */
  const rotate = useCallback(
    (clockwise: boolean = true) => {
      const currentRotation = viewerState.rotation;
      const newRotation = clockwise
        ? (currentRotation + 90) % 360
        : (currentRotation - 90 + 360) % 360;
      setRotation(newRotation);
    },
    [viewerState.rotation, setRotation]
  );

  /**
   * Check if a PDF is currently loaded
   */
  const isLoaded = document?.isLoaded ?? false;

  /**
   * Check if the PDF is currently loading
   */
  const isLoading = loadingState.isLoading;

  /**
   * Get current page info
   */
  const currentPageInfo = {
    current: viewerState.currentPage,
    total: document?.pageCount ?? 0,
    canNext: canGoToNextPage(),
    canPrevious: canGoToPreviousPage(),
  };

  return {
    // State
    document,
    viewerState,
    loadingState,
    error,
    isLoaded,
    isLoading,
    currentPageInfo,

    // Actions
    openPDF,
    closePDF,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    zoomTo,
    zoomIn,
    zoomOut,
    rotate,
    setFitMode,
    setViewMode,
    toggleSidebar,
    toggleToolbar,
  };
};
