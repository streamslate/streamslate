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
import {
  PDFDocument,
  ViewerState,
  Annotation,
  LoadingState,
  PDFError,
  FitMode,
  ViewMode,
  LoadingStage,
} from "../types/pdf.types";

interface PDFStore {
  // State
  document: PDFDocument | null;
  viewerState: ViewerState;
  loadingState: LoadingState;
  error: PDFError | null;
  annotations: Map<number, Annotation[]>; // pageNumber -> annotations

  // Actions
  setDocument: (document: PDFDocument | null) => void;
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  setRotation: (rotation: number) => void;
  setFitMode: (fitMode: FitMode) => void;
  setViewMode: (viewMode: ViewMode) => void;
  toggleSidebar: () => void;
  toggleToolbar: () => void;

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
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  getPageAnnotations: (pageNumber: number) => Annotation[];
  clearAnnotations: () => void;

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

      // Document actions
      setDocument: (document) => set({ document }),

      // Viewer state actions
      setCurrentPage: (page) =>
        set((state) => ({
          viewerState: { ...state.viewerState, currentPage: page },
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
        set((state) => ({
          viewerState: { ...state.viewerState, fitMode },
        })),

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
          return { annotations: newAnnotations };
        }),

      getPageAnnotations: (pageNumber) => {
        return get().annotations.get(pageNumber) || [];
      },

      clearAnnotations: () => set({ annotations: new Map() }),

      // Utility actions
      reset: () =>
        set({
          document: null,
          viewerState: initialViewerState,
          loadingState: initialLoadingState,
          error: null,
          annotations: new Map(),
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
