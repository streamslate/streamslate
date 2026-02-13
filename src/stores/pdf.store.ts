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
 * PDF state management using Zustand
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { FitMode, ViewMode, LoadingStage } from "../types/pdf.types";
import type {
  PDFDocument,
  ViewerState,
  Annotation,
  LoadingState,
  PDFError,
} from "../types/pdf.types";

const DEFAULT_MAX_UNDO_HISTORY = 50;

type AnnotationSnapshot = {
  annotations: Map<number, Annotation[]>;
  selectedAnnotationId: string | null;
};

function cloneAnnotation(annotation: Annotation): Annotation {
  return {
    ...annotation,
    points: annotation.points?.map((p) => ({ ...p })),
  };
}

function cloneAnnotationsMap(
  annotations: Map<number, Annotation[]>
): Map<number, Annotation[]> {
  const next = new Map<number, Annotation[]>();
  for (const [pageNumber, items] of annotations.entries()) {
    next.set(
      pageNumber,
      items.map((annotation) => cloneAnnotation(annotation))
    );
  }
  return next;
}

interface PDFStore {
  // State
  document: PDFDocument | null;
  viewerState: ViewerState;
  loadingState: LoadingState;
  error: PDFError | null;
  annotations: Map<number, Annotation[]>; // pageNumber -> annotations
  selectedAnnotationId: string | null;
  undoStack: AnnotationSnapshot[];
  redoStack: AnnotationSnapshot[];
  historyGroupActive: boolean;
  historyGroupSnapshotTaken: boolean;

  // Actions
  setDocument: (document: PDFDocument | null) => void;
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  setRotation: (rotation: number) => void;
  setFitMode: (fitMode: FitMode) => void;
  setViewMode: (viewMode: ViewMode) => void;
  toggleSidebar: () => void;
  toggleToolbar: () => void;

  // Helper to calculate zoom for fit modes
  calculateFitZoom: (
    fitMode: FitMode,
    containerWidth: number,
    containerHeight: number,
    pageWidth: number,
    pageHeight: number,
    rotation: number
  ) => number;

  // Loading state actions
  setLoading: (
    isLoading: boolean,
    stage?: LoadingStage,
    progress?: number,
    message?: string
  ) => void;
  setError: (error: PDFError | null) => void;

  // Annotation actions
  addAnnotation: (annotation: Annotation) => void;
  setPageAnnotations: (pageNumber: number, annotations: Annotation[]) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  getPageAnnotations: (pageNumber: number) => Annotation[];
  clearAnnotations: () => void;
  selectAnnotation: (id: string | null) => void;

  // Undo/redo actions
  beginHistoryGroup: () => void;
  endHistoryGroup: () => void;
  recordHistorySnapshot: () => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;

  // Utility actions
  reset: () => void;
  canGoToNextPage: () => boolean;
  canGoToPreviousPage: () => boolean;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
}

const initialViewerState: ViewerState = {
  currentPage: 1,
  zoom: 1.0,
  rotation: 0,
  fitMode: FitMode.FIT_WIDTH,
  viewMode: ViewMode.SINGLE_PAGE,
  sidebarVisible: true,
  toolbarVisible: true,
};

const initialLoadingState: LoadingState = {
  isLoading: false,
  progress: 0,
  stage: LoadingStage.COMPLETE,
};

export const usePDFStore = create<PDFStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      document: null,
      viewerState: initialViewerState,
      loadingState: initialLoadingState,
      error: null,
      annotations: new Map(),
      selectedAnnotationId: null,
      undoStack: [],
      redoStack: [],
      historyGroupActive: false,
      historyGroupSnapshotTaken: false,

      // Document actions
      setDocument: (document) =>
        set({
          document,
          undoStack: [],
          redoStack: [],
          historyGroupActive: false,
          historyGroupSnapshotTaken: false,
        }),

      // Viewer state actions
      setCurrentPage: (page) =>
        set((state) => ({
          viewerState: { ...state.viewerState, currentPage: page },
          selectedAnnotationId: null,
        })),

      setZoom: (zoom) =>
        set((state) => ({
          viewerState: { ...state.viewerState, zoom, fitMode: FitMode.CUSTOM },
        })),

      setRotation: (rotation) =>
        set((state) => ({
          viewerState: { ...state.viewerState, rotation },
        })),

      setFitMode: (fitMode) =>
        set((state) => {
          // When setting fit mode to custom, keep the current zoom
          // For other modes, the component will calculate the appropriate zoom
          if (fitMode === FitMode.CUSTOM) {
            return {
              viewerState: { ...state.viewerState, fitMode },
            };
          }

          // For fit modes, we set a default zoom of 1.0
          // The actual calculation will happen in the component
          let defaultZoom = 1.0;
          switch (fitMode) {
            case FitMode.FIT_WIDTH:
            case FitMode.FIT_HEIGHT:
            case FitMode.FIT_PAGE:
              defaultZoom = 1.0;
              break;
            case FitMode.ACTUAL_SIZE:
              defaultZoom = 1.0;
              break;
          }

          return {
            viewerState: { ...state.viewerState, fitMode, zoom: defaultZoom },
          };
        }),

      calculateFitZoom: (
        fitMode,
        containerWidth,
        containerHeight,
        pageWidth,
        pageHeight,
        rotation
      ) => {
        if (fitMode === FitMode.CUSTOM) {
          return get().viewerState.zoom;
        }

        const containerPadding = 40; // 20px padding on each side
        const availableWidth = containerWidth - containerPadding;
        const availableHeight = containerHeight - containerPadding;

        // Adjust for rotation
        let effectivePageWidth = pageWidth;
        let effectivePageHeight = pageHeight;
        if (rotation % 180 === 90) {
          [effectivePageWidth, effectivePageHeight] = [
            effectivePageHeight,
            effectivePageWidth,
          ];
        }

        switch (fitMode) {
          case FitMode.FIT_WIDTH:
            return availableWidth / effectivePageWidth;
          case FitMode.FIT_HEIGHT:
            return availableHeight / effectivePageHeight;
          case FitMode.FIT_PAGE: {
            const widthScale = availableWidth / effectivePageWidth;
            const heightScale = availableHeight / effectivePageHeight;
            return Math.min(widthScale, heightScale);
          }
          case FitMode.ACTUAL_SIZE:
            return 1.0;
          default:
            return 1.0;
        }
      },

      setViewMode: (viewMode) =>
        set((state) => ({
          viewerState: { ...state.viewerState, viewMode },
        })),

      toggleSidebar: () =>
        set((state) => ({
          viewerState: {
            ...state.viewerState,
            sidebarVisible: !state.viewerState.sidebarVisible,
          },
        })),

      toggleToolbar: () =>
        set((state) => ({
          viewerState: {
            ...state.viewerState,
            toolbarVisible: !state.viewerState.toolbarVisible,
          },
        })),

      // Loading state actions
      setLoading: (
        isLoading,
        stage = LoadingStage.COMPLETE,
        progress = 0,
        message
      ) =>
        set({
          loadingState: { isLoading, stage, progress, message },
          error: isLoading ? null : get().error, // Clear error when starting to load
        }),

      setError: (error) => set({ error }),

      // Annotation actions
      addAnnotation: (annotation) =>
        set((state) => {
          const newAnnotations = new Map(state.annotations);
          const pageAnnotations =
            newAnnotations.get(annotation.pageNumber) || [];
          pageAnnotations.push(annotation);
          newAnnotations.set(annotation.pageNumber, pageAnnotations);
          return { annotations: newAnnotations };
        }),

      setPageAnnotations: (pageNumber, nextAnnotations) =>
        set((state) => {
          const newAnnotations = new Map(state.annotations);
          newAnnotations.set(pageNumber, [...nextAnnotations]);
          return { annotations: newAnnotations };
        }),

      updateAnnotation: (id, updates) =>
        set((state) => {
          const newAnnotations = new Map(state.annotations);
          for (const [
            pageNumber,
            pageAnnotations,
          ] of newAnnotations.entries()) {
            const annotationIndex = pageAnnotations.findIndex(
              (a) => a.id === id
            );
            if (annotationIndex !== -1) {
              const updatedAnnotations = [...pageAnnotations];
              updatedAnnotations[annotationIndex] = {
                ...updatedAnnotations[annotationIndex],
                ...updates,
              };
              newAnnotations.set(pageNumber, updatedAnnotations);
              break;
            }
          }
          return { annotations: newAnnotations };
        }),

      removeAnnotation: (id) =>
        set((state) => {
          const newAnnotations = new Map(state.annotations);
          for (const [
            pageNumber,
            pageAnnotations,
          ] of newAnnotations.entries()) {
            const filteredAnnotations = pageAnnotations.filter(
              (a) => a.id !== id
            );
            if (filteredAnnotations.length !== pageAnnotations.length) {
              newAnnotations.set(pageNumber, filteredAnnotations);
              break;
            }
          }
          const selectedAnnotationId =
            state.selectedAnnotationId === id
              ? null
              : state.selectedAnnotationId;
          return { annotations: newAnnotations, selectedAnnotationId };
        }),

      getPageAnnotations: (pageNumber) => {
        return get().annotations.get(pageNumber) || [];
      },

      clearAnnotations: () =>
        set({ annotations: new Map(), selectedAnnotationId: null }),

      selectAnnotation: (id) => set({ selectedAnnotationId: id }),

      beginHistoryGroup: () =>
        set({ historyGroupActive: true, historyGroupSnapshotTaken: false }),

      endHistoryGroup: () =>
        set({ historyGroupActive: false, historyGroupSnapshotTaken: false }),

      recordHistorySnapshot: () =>
        set((state) => {
          if (state.historyGroupActive && state.historyGroupSnapshotTaken) {
            return {};
          }

          const snapshot: AnnotationSnapshot = {
            annotations: cloneAnnotationsMap(state.annotations),
            selectedAnnotationId: state.selectedAnnotationId,
          };

          const nextUndo = [...state.undoStack, snapshot].slice(
            -DEFAULT_MAX_UNDO_HISTORY
          );

          return {
            undoStack: nextUndo,
            redoStack: [],
            historyGroupSnapshotTaken: state.historyGroupActive ? true : false,
          };
        }),

      undo: () =>
        set((state) => {
          if (state.undoStack.length === 0) {
            return {};
          }

          const snapshot = state.undoStack[state.undoStack.length - 1];
          const current: AnnotationSnapshot = {
            annotations: cloneAnnotationsMap(state.annotations),
            selectedAnnotationId: state.selectedAnnotationId,
          };

          const nextSelected =
            snapshot.selectedAnnotationId &&
            Array.from(snapshot.annotations.values())
              .flat()
              .some((a) => a.id === snapshot.selectedAnnotationId)
              ? snapshot.selectedAnnotationId
              : null;

          return {
            annotations: snapshot.annotations,
            selectedAnnotationId: nextSelected,
            undoStack: state.undoStack.slice(0, -1),
            redoStack: [...state.redoStack, current].slice(
              -DEFAULT_MAX_UNDO_HISTORY
            ),
            historyGroupActive: false,
            historyGroupSnapshotTaken: false,
          };
        }),

      redo: () =>
        set((state) => {
          if (state.redoStack.length === 0) {
            return {};
          }

          const snapshot = state.redoStack[state.redoStack.length - 1];
          const current: AnnotationSnapshot = {
            annotations: cloneAnnotationsMap(state.annotations),
            selectedAnnotationId: state.selectedAnnotationId,
          };

          const nextSelected =
            snapshot.selectedAnnotationId &&
            Array.from(snapshot.annotations.values())
              .flat()
              .some((a) => a.id === snapshot.selectedAnnotationId)
              ? snapshot.selectedAnnotationId
              : null;

          return {
            annotations: snapshot.annotations,
            selectedAnnotationId: nextSelected,
            redoStack: state.redoStack.slice(0, -1),
            undoStack: [...state.undoStack, current].slice(
              -DEFAULT_MAX_UNDO_HISTORY
            ),
            historyGroupActive: false,
            historyGroupSnapshotTaken: false,
          };
        }),

      clearHistory: () =>
        set({
          undoStack: [],
          redoStack: [],
          historyGroupActive: false,
          historyGroupSnapshotTaken: false,
        }),

      // Utility actions
      reset: () =>
        set({
          document: null,
          viewerState: initialViewerState,
          loadingState: initialLoadingState,
          error: null,
          annotations: new Map(),
          selectedAnnotationId: null,
          undoStack: [],
          redoStack: [],
          historyGroupActive: false,
          historyGroupSnapshotTaken: false,
        }),

      canGoToNextPage: () => {
        const { document, viewerState } = get();
        return document && viewerState.currentPage < document.pageCount;
      },

      canGoToPreviousPage: () => {
        const { viewerState } = get();
        return viewerState.currentPage > 1;
      },

      goToNextPage: () => {
        const state = get();
        if (state.canGoToNextPage()) {
          state.setCurrentPage(state.viewerState.currentPage + 1);
        }
      },

      goToPreviousPage: () => {
        const state = get();
        if (state.canGoToPreviousPage()) {
          state.setCurrentPage(state.viewerState.currentPage - 1);
        }
      },
    }),
    {
      name: "pdf-store",
    }
  )
);
