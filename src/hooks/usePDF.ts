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

import { useCallback, useEffect, useRef } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { PDFCommands, AnnotationCommands } from "../lib/tauri/commands";
import { exportPDF } from "../lib/pdf/exporter";
import type { AnnotationDTO } from "../lib/tauri/commands";
import {
  annotationToDTO,
  dtoToAnnotation,
} from "../lib/annotations/converters";
import { usePDFStore } from "../stores/pdf.store";
import { LoadingStage } from "../types/pdf.types";
import type { PDFDocument, PDFError, Annotation } from "../types/pdf.types";
import {
  emitPageChanged,
  emitPdfOpened,
  emitPdfClosed,
  emitZoomChanged,
} from "../lib/tauri/events";

export const usePDF = () => {
  const {
    document,
    viewerState,
    loadingState,
    error,
    annotations,
    setDocument,
    setLoading,
    setError,
    reset,
    recordHistorySnapshot,
    beginHistoryGroup,
    endHistoryGroup,
    undo,
    redo,
    undoStack,
    redoStack,
    canGoToNextPage,
    canGoToPreviousPage,
    goToNextPage: storeGoToNextPage,
    goToPreviousPage: storeGoToPreviousPage,
    setCurrentPage,
    setZoom,
    setRotation,
    setFitMode,
    setViewMode,
    toggleSidebar,
    toggleToolbar,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    clearAnnotations: storeClearAnnotations,
  } = usePDFStore();

  // Track if we have unsaved changes
  const hasUnsavedChanges = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      // Emit event for cross-window sync (presenter mode)
      await emitPdfOpened({
        path: pdfDocument.path,
        pageCount: pdfDocument.pageCount,
        title: pdfDocument.title,
      });
      await emitPageChanged({
        page: 1,
        totalPages: pdfDocument.pageCount,
        pdfPath: pdfDocument.path,
      });

      // Load saved annotations if they exist
      try {
        const savedAnnotations = await AnnotationCommands.loadAnnotations();
        // Convert DTOs to Annotation objects and add to store
        for (const pageAnnotations of Object.values(savedAnnotations)) {
          for (const dto of pageAnnotations) {
            addAnnotation(dtoToAnnotation(dto));
          }
        }
      } catch {
        // Annotations not loading is not critical - may not exist yet
      }

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
  }, [setDocument, setLoading, setError, setCurrentPage, addAnnotation]);

  /**
   * Save annotations to the sidecar file
   */
  const saveAnnotations = useCallback(async () => {
    if (!document || annotations.size === 0) return;

    try {
      // Convert Map to Record<number, AnnotationDTO[]>
      const annotationsRecord: Record<number, AnnotationDTO[]> = {};
      for (const [pageNum, pageAnnotations] of annotations.entries()) {
        annotationsRecord[pageNum] = pageAnnotations.map(annotationToDTO);
      }

      await AnnotationCommands.saveAnnotations(annotationsRecord);
      hasUnsavedChanges.current = false;
    } catch {
      // Failed to save annotations - will retry on next change
    }
  }, [document, annotations]);

  /**
   * Close the currently open PDF
   */
  const closePDF = useCallback(async () => {
    try {
      // Save annotations before closing
      if (annotations.size > 0) {
        await saveAnnotations();
      }

      await PDFCommands.closePdf();
      reset();

      // Emit event for cross-window sync (presenter mode)
      await emitPdfClosed();
    } catch (err) {
      const error: PDFError = {
        code: "CLOSE_ERROR",
        message: err instanceof Error ? err.message : "Failed to close PDF",
        details: err,
      };
      setError(error);
    }
  }, [reset, setError, annotations, saveAnnotations]);

  /**
   * Debounced auto-save for annotations
   */
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    hasUnsavedChanges.current = true;
    saveTimeoutRef.current = setTimeout(() => {
      saveAnnotations();
    }, 1000); // 1 second debounce
  }, [saveAnnotations]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Add annotation with auto-save
   */
  const addAnnotationWithSave = useCallback(
    (annotation: Annotation) => {
      recordHistorySnapshot();
      addAnnotation(annotation);
      debouncedSave();
    },
    [addAnnotation, debouncedSave, recordHistorySnapshot]
  );

  /**
   * Update annotation with auto-save
   */
  const updateAnnotationWithSave = useCallback(
    (id: string, updates: Partial<Annotation>) => {
      recordHistorySnapshot();
      updateAnnotation(id, updates);
      debouncedSave();
    },
    [updateAnnotation, debouncedSave, recordHistorySnapshot]
  );

  /**
   * Remove annotation with auto-save
   */
  const removeAnnotationWithSave = useCallback(
    (id: string) => {
      recordHistorySnapshot();
      removeAnnotation(id);
      debouncedSave();
    },
    [removeAnnotation, debouncedSave, recordHistorySnapshot]
  );

  const undoWithSave = useCallback(() => {
    undo();
    debouncedSave();
  }, [debouncedSave, undo]);

  const redoWithSave = useCallback(() => {
    redo();
    debouncedSave();
  }, [debouncedSave, redo]);

  /**
   * Clear all annotations with save
   */
  const clearAnnotations = useCallback(async () => {
    recordHistorySnapshot();
    storeClearAnnotations();
    try {
      await AnnotationCommands.clearAnnotations();
    } catch {
      // Failed to clear annotations file - not critical
    }
  }, [recordHistorySnapshot, storeClearAnnotations]);

  /**
   * Navigate to a specific page
   */
  const goToPage = useCallback(
    async (pageNumber: number) => {
      if (!document) return;

      const page = Math.max(1, Math.min(pageNumber, document.pageCount));
      setCurrentPage(page);

      // Emit event for cross-window sync (presenter mode)
      await emitPageChanged({
        page,
        totalPages: document.pageCount,
        pdfPath: document.path,
      });
    },
    [document, setCurrentPage]
  );

  /**
   * Zoom to a specific level
   */
  const zoomTo = useCallback(
    async (zoomLevel: number) => {
      const zoom = Math.max(0.1, Math.min(zoomLevel, 5.0));
      setZoom(zoom);

      // Emit event for cross-window sync (presenter mode)
      await emitZoomChanged({ zoom });
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

  /**
   * Go to next page with event emission
   */
  const goToNextPage = useCallback(async () => {
    if (!document || !canGoToNextPage()) return;

    storeGoToNextPage();
    const newPage = viewerState.currentPage + 1;

    // Emit event for cross-window sync (presenter mode)
    await emitPageChanged({
      page: newPage,
      totalPages: document.pageCount,
      pdfPath: document.path,
    });
  }, [document, viewerState.currentPage, canGoToNextPage, storeGoToNextPage]);

  /**
   * Go to previous page with event emission
   */
  const goToPreviousPage = useCallback(async () => {
    if (!document || !canGoToPreviousPage()) return;

    storeGoToPreviousPage();
    const newPage = viewerState.currentPage - 1;

    // Emit event for cross-window sync (presenter mode)
    await emitPageChanged({
      page: newPage,
      totalPages: document.pageCount,
      pdfPath: document.path,
    });
  }, [
    document,
    viewerState.currentPage,
    canGoToPreviousPage,
    storeGoToPreviousPage,
  ]);

  return {
    // State
    document,
    viewerState,
    loadingState,
    error,
    isLoaded,
    isLoading,
    currentPageInfo,
    annotations,

    // Navigation actions
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

    // Annotation actions
    addAnnotation: addAnnotationWithSave,
    updateAnnotation: updateAnnotationWithSave,
    removeAnnotation: removeAnnotationWithSave,
    clearAnnotations,
    saveAnnotations,
    // Undo/redo
    beginHistoryGroup,
    endHistoryGroup,
    undo: undoWithSave,
    redo: redoWithSave,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    exportDocument: async () => {
      if (!document) return;

      try {
        setLoading(true, LoadingStage.RENDERING, 0, "Generating PDF...");

        // Open save dialog
        const filePath = await save({
          filters: [
            {
              name: "PDF Document",
              extensions: ["pdf"],
            },
          ],
          defaultPath: document.title
            ? `${document.title}_annotated.pdf`
            : "exported.pdf",
        });

        if (!filePath) {
          setLoading(false);
          return;
        }

        // Generate PDF
        setLoading(
          true,
          LoadingStage.RENDERING,
          50,
          "Embedding annotations..."
        );
        const pdfBytes = await exportPDF(document.path, annotations);

        // Write to file
        setLoading(true, LoadingStage.RENDERING, 80, "Saving file...");
        await writeFile(filePath, pdfBytes);

        setLoading(true, LoadingStage.COMPLETE, 100, "Export complete");
        setTimeout(() => setLoading(false), 1000);
      } catch (err) {
        const error: PDFError = {
          code: "EXPORT_ERROR",
          message: err instanceof Error ? err.message : "Failed to export PDF",
          details: err,
        };
        setError(error);
        setLoading(false, LoadingStage.ERROR, 0, error.message);
      }
    },
  };
};
