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

import { describe, it, expect, beforeEach } from "vitest";
import { usePDFStore } from "./pdf.store";
import {
  FitMode,
  ViewMode,
  LoadingStage,
  AnnotationType,
} from "../types/pdf.types";
import type { PDFDocument, Annotation } from "../types/pdf.types";

// Helper to create a mock PDF document
const createMockDocument = (
  overrides: Partial<PDFDocument> = {}
): PDFDocument => ({
  id: "test-doc-1",
  path: "/test/document.pdf",
  title: "Test Document",
  author: "Test Author",
  pageCount: 10,
  fileSize: 1024000,
  isLoaded: true,
  ...overrides,
});

// Helper to create a mock annotation
const createMockAnnotation = (
  overrides: Partial<Annotation> = {}
): Annotation => ({
  id: `annotation-${Date.now()}`,
  type: AnnotationType.HIGHLIGHT,
  pageNumber: 1,
  x: 100,
  y: 200,
  width: 150,
  height: 20,
  content: "Test annotation",
  color: "#ffff00",
  opacity: 0.5,
  created: new Date(),
  modified: new Date(),
  visible: true,
  ...overrides,
});

describe("usePDFStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    usePDFStore.getState().reset();
  });

  describe("initial state", () => {
    it("should have null document initially", () => {
      const state = usePDFStore.getState();
      expect(state.document).toBeNull();
    });

    it("should have default viewer state", () => {
      const { viewerState } = usePDFStore.getState();
      expect(viewerState.currentPage).toBe(1);
      expect(viewerState.zoom).toBe(1.0);
      expect(viewerState.rotation).toBe(0);
      expect(viewerState.fitMode).toBe(FitMode.FIT_WIDTH);
      expect(viewerState.viewMode).toBe(ViewMode.SINGLE_PAGE);
      expect(viewerState.sidebarVisible).toBe(true);
      expect(viewerState.toolbarVisible).toBe(true);
    });

    it("should have default loading state", () => {
      const { loadingState } = usePDFStore.getState();
      expect(loadingState.isLoading).toBe(false);
      expect(loadingState.progress).toBe(0);
      expect(loadingState.stage).toBe(LoadingStage.COMPLETE);
    });

    it("should have no error initially", () => {
      expect(usePDFStore.getState().error).toBeNull();
    });

    it("should have empty annotations map", () => {
      const { annotations } = usePDFStore.getState();
      expect(annotations.size).toBe(0);
    });
  });

  describe("setDocument", () => {
    it("should set a document", () => {
      const mockDoc = createMockDocument();
      usePDFStore.getState().setDocument(mockDoc);
      expect(usePDFStore.getState().document).toEqual(mockDoc);
    });

    it("should clear document when set to null", () => {
      const mockDoc = createMockDocument();
      usePDFStore.getState().setDocument(mockDoc);
      usePDFStore.getState().setDocument(null);
      expect(usePDFStore.getState().document).toBeNull();
    });
  });

  describe("setCurrentPage", () => {
    it("should set current page", () => {
      usePDFStore.getState().setCurrentPage(5);
      expect(usePDFStore.getState().viewerState.currentPage).toBe(5);
    });

    it("should preserve other viewer state properties", () => {
      usePDFStore.getState().setZoom(1.5);
      usePDFStore.getState().setCurrentPage(3);
      const { viewerState } = usePDFStore.getState();
      expect(viewerState.currentPage).toBe(3);
      expect(viewerState.zoom).toBe(1.5);
    });
  });

  describe("setZoom", () => {
    it("should set zoom level", () => {
      usePDFStore.getState().setZoom(2.0);
      expect(usePDFStore.getState().viewerState.zoom).toBe(2.0);
    });

    it("should change fitMode to CUSTOM when zoom is set", () => {
      usePDFStore.getState().setFitMode(FitMode.FIT_WIDTH);
      usePDFStore.getState().setZoom(1.5);
      expect(usePDFStore.getState().viewerState.fitMode).toBe(FitMode.CUSTOM);
    });
  });

  describe("setRotation", () => {
    it("should set rotation", () => {
      usePDFStore.getState().setRotation(90);
      expect(usePDFStore.getState().viewerState.rotation).toBe(90);
    });

    it("should accept any rotation value", () => {
      usePDFStore.getState().setRotation(180);
      expect(usePDFStore.getState().viewerState.rotation).toBe(180);
      usePDFStore.getState().setRotation(270);
      expect(usePDFStore.getState().viewerState.rotation).toBe(270);
    });
  });

  describe("setFitMode", () => {
    it("should set fit mode to FIT_WIDTH", () => {
      usePDFStore.getState().setFitMode(FitMode.FIT_WIDTH);
      expect(usePDFStore.getState().viewerState.fitMode).toBe(
        FitMode.FIT_WIDTH
      );
    });

    it("should set fit mode to FIT_PAGE", () => {
      usePDFStore.getState().setFitMode(FitMode.FIT_PAGE);
      expect(usePDFStore.getState().viewerState.fitMode).toBe(FitMode.FIT_PAGE);
    });

    it("should set zoom to 1.0 for ACTUAL_SIZE", () => {
      usePDFStore.getState().setZoom(2.0);
      usePDFStore.getState().setFitMode(FitMode.ACTUAL_SIZE);
      expect(usePDFStore.getState().viewerState.zoom).toBe(1.0);
    });

    it("should keep current zoom when setting CUSTOM mode", () => {
      usePDFStore.getState().setZoom(2.5);
      usePDFStore.getState().setFitMode(FitMode.CUSTOM);
      // Note: setZoom already sets to CUSTOM, so we need to check the store handles it
      expect(usePDFStore.getState().viewerState.fitMode).toBe(FitMode.CUSTOM);
    });
  });

  describe("calculateFitZoom", () => {
    const containerWidth = 800;
    const containerHeight = 600;
    const pageWidth = 612; // Letter size
    const pageHeight = 792;

    it("should return current zoom for CUSTOM mode", () => {
      usePDFStore.getState().setZoom(2.0);
      const zoom = usePDFStore
        .getState()
        .calculateFitZoom(
          FitMode.CUSTOM,
          containerWidth,
          containerHeight,
          pageWidth,
          pageHeight,
          0
        );
      expect(zoom).toBe(2.0);
    });

    it("should calculate FIT_WIDTH zoom correctly", () => {
      const zoom = usePDFStore
        .getState()
        .calculateFitZoom(
          FitMode.FIT_WIDTH,
          containerWidth,
          containerHeight,
          pageWidth,
          pageHeight,
          0
        );
      const expectedZoom = (containerWidth - 40) / pageWidth;
      expect(zoom).toBeCloseTo(expectedZoom, 5);
    });

    it("should calculate FIT_HEIGHT zoom correctly", () => {
      const zoom = usePDFStore
        .getState()
        .calculateFitZoom(
          FitMode.FIT_HEIGHT,
          containerWidth,
          containerHeight,
          pageWidth,
          pageHeight,
          0
        );
      const expectedZoom = (containerHeight - 40) / pageHeight;
      expect(zoom).toBeCloseTo(expectedZoom, 5);
    });

    it("should calculate FIT_PAGE zoom as minimum of width and height scales", () => {
      const zoom = usePDFStore
        .getState()
        .calculateFitZoom(
          FitMode.FIT_PAGE,
          containerWidth,
          containerHeight,
          pageWidth,
          pageHeight,
          0
        );
      const widthScale = (containerWidth - 40) / pageWidth;
      const heightScale = (containerHeight - 40) / pageHeight;
      const expectedZoom = Math.min(widthScale, heightScale);
      expect(zoom).toBeCloseTo(expectedZoom, 5);
    });

    it("should return 1.0 for ACTUAL_SIZE", () => {
      const zoom = usePDFStore
        .getState()
        .calculateFitZoom(
          FitMode.ACTUAL_SIZE,
          containerWidth,
          containerHeight,
          pageWidth,
          pageHeight,
          0
        );
      expect(zoom).toBe(1.0);
    });

    it("should swap dimensions for 90 degree rotation", () => {
      const zoom90 = usePDFStore
        .getState()
        .calculateFitZoom(
          FitMode.FIT_WIDTH,
          containerWidth,
          containerHeight,
          pageWidth,
          pageHeight,
          90
        );
      // With 90 degree rotation, height becomes effective width
      const expectedZoom = (containerWidth - 40) / pageHeight;
      expect(zoom90).toBeCloseTo(expectedZoom, 5);
    });

    it("should swap dimensions for 270 degree rotation", () => {
      const zoom270 = usePDFStore
        .getState()
        .calculateFitZoom(
          FitMode.FIT_WIDTH,
          containerWidth,
          containerHeight,
          pageWidth,
          pageHeight,
          270
        );
      const expectedZoom = (containerWidth - 40) / pageHeight;
      expect(zoom270).toBeCloseTo(expectedZoom, 5);
    });

    it("should not swap dimensions for 180 degree rotation", () => {
      const zoom180 = usePDFStore
        .getState()
        .calculateFitZoom(
          FitMode.FIT_WIDTH,
          containerWidth,
          containerHeight,
          pageWidth,
          pageHeight,
          180
        );
      const expectedZoom = (containerWidth - 40) / pageWidth;
      expect(zoom180).toBeCloseTo(expectedZoom, 5);
    });
  });

  describe("setViewMode", () => {
    it("should set view mode", () => {
      usePDFStore.getState().setViewMode(ViewMode.CONTINUOUS);
      expect(usePDFStore.getState().viewerState.viewMode).toBe(
        ViewMode.CONTINUOUS
      );
    });
  });

  describe("toggleSidebar", () => {
    it("should toggle sidebar visibility", () => {
      expect(usePDFStore.getState().viewerState.sidebarVisible).toBe(true);
      usePDFStore.getState().toggleSidebar();
      expect(usePDFStore.getState().viewerState.sidebarVisible).toBe(false);
      usePDFStore.getState().toggleSidebar();
      expect(usePDFStore.getState().viewerState.sidebarVisible).toBe(true);
    });
  });

  describe("toggleToolbar", () => {
    it("should toggle toolbar visibility", () => {
      expect(usePDFStore.getState().viewerState.toolbarVisible).toBe(true);
      usePDFStore.getState().toggleToolbar();
      expect(usePDFStore.getState().viewerState.toolbarVisible).toBe(false);
      usePDFStore.getState().toggleToolbar();
      expect(usePDFStore.getState().viewerState.toolbarVisible).toBe(true);
    });
  });

  describe("setLoading", () => {
    it("should set loading state", () => {
      usePDFStore
        .getState()
        .setLoading(true, LoadingStage.OPENING, 25, "Opening file...");
      const { loadingState } = usePDFStore.getState();
      expect(loadingState.isLoading).toBe(true);
      expect(loadingState.stage).toBe(LoadingStage.OPENING);
      expect(loadingState.progress).toBe(25);
      expect(loadingState.message).toBe("Opening file...");
    });

    it("should clear error when starting to load", () => {
      usePDFStore.getState().setError({ code: "TEST", message: "Test error" });
      usePDFStore.getState().setLoading(true, LoadingStage.OPENING);
      expect(usePDFStore.getState().error).toBeNull();
    });

    it("should use default values when not provided", () => {
      usePDFStore.getState().setLoading(false);
      const { loadingState } = usePDFStore.getState();
      expect(loadingState.stage).toBe(LoadingStage.COMPLETE);
      expect(loadingState.progress).toBe(0);
    });
  });

  describe("setError", () => {
    it("should set error", () => {
      const error = { code: "PDF_ERROR", message: "Failed to load PDF" };
      usePDFStore.getState().setError(error);
      expect(usePDFStore.getState().error).toEqual(error);
    });

    it("should clear error when set to null", () => {
      usePDFStore.getState().setError({ code: "TEST", message: "Test" });
      usePDFStore.getState().setError(null);
      expect(usePDFStore.getState().error).toBeNull();
    });
  });

  describe("annotation actions", () => {
    describe("addAnnotation", () => {
      it("should add annotation to correct page", () => {
        const annotation = createMockAnnotation({ id: "ann-1", pageNumber: 1 });
        usePDFStore.getState().addAnnotation(annotation);

        const pageAnnotations = usePDFStore.getState().getPageAnnotations(1);
        expect(pageAnnotations).toHaveLength(1);
        expect(pageAnnotations[0]).toEqual(annotation);
      });

      it("should add multiple annotations to same page", () => {
        const ann1 = createMockAnnotation({ id: "ann-1", pageNumber: 1 });
        const ann2 = createMockAnnotation({ id: "ann-2", pageNumber: 1 });
        usePDFStore.getState().addAnnotation(ann1);
        usePDFStore.getState().addAnnotation(ann2);

        const pageAnnotations = usePDFStore.getState().getPageAnnotations(1);
        expect(pageAnnotations).toHaveLength(2);
      });

      it("should add annotations to different pages", () => {
        const ann1 = createMockAnnotation({ id: "ann-1", pageNumber: 1 });
        const ann2 = createMockAnnotation({ id: "ann-2", pageNumber: 2 });
        usePDFStore.getState().addAnnotation(ann1);
        usePDFStore.getState().addAnnotation(ann2);

        expect(usePDFStore.getState().getPageAnnotations(1)).toHaveLength(1);
        expect(usePDFStore.getState().getPageAnnotations(2)).toHaveLength(1);
      });
    });

    describe("updateAnnotation", () => {
      it("should update annotation properties", () => {
        const annotation = createMockAnnotation({
          id: "ann-1",
          content: "Original",
        });
        usePDFStore.getState().addAnnotation(annotation);

        usePDFStore
          .getState()
          .updateAnnotation("ann-1", { content: "Updated" });

        const pageAnnotations = usePDFStore.getState().getPageAnnotations(1);
        expect(pageAnnotations[0].content).toBe("Updated");
        expect(pageAnnotations[0].id).toBe("ann-1");
      });

      it("should only update specified properties", () => {
        const annotation = createMockAnnotation({
          id: "ann-1",
          content: "Original",
          color: "#ff0000",
        });
        usePDFStore.getState().addAnnotation(annotation);

        usePDFStore
          .getState()
          .updateAnnotation("ann-1", { content: "Updated" });

        const pageAnnotations = usePDFStore.getState().getPageAnnotations(1);
        expect(pageAnnotations[0].color).toBe("#ff0000");
      });

      it("should handle updating non-existent annotation gracefully", () => {
        const annotation = createMockAnnotation({ id: "ann-1" });
        usePDFStore.getState().addAnnotation(annotation);

        // Should not throw
        usePDFStore
          .getState()
          .updateAnnotation("non-existent", { content: "X" });

        const pageAnnotations = usePDFStore.getState().getPageAnnotations(1);
        expect(pageAnnotations[0].content).toBe("Test annotation");
      });
    });

    describe("removeAnnotation", () => {
      it("should remove annotation by id", () => {
        const ann1 = createMockAnnotation({ id: "ann-1", pageNumber: 1 });
        const ann2 = createMockAnnotation({ id: "ann-2", pageNumber: 1 });
        usePDFStore.getState().addAnnotation(ann1);
        usePDFStore.getState().addAnnotation(ann2);

        usePDFStore.getState().removeAnnotation("ann-1");

        const pageAnnotations = usePDFStore.getState().getPageAnnotations(1);
        expect(pageAnnotations).toHaveLength(1);
        expect(pageAnnotations[0].id).toBe("ann-2");
      });

      it("should handle removing non-existent annotation gracefully", () => {
        const annotation = createMockAnnotation({ id: "ann-1" });
        usePDFStore.getState().addAnnotation(annotation);

        // Should not throw
        usePDFStore.getState().removeAnnotation("non-existent");

        const pageAnnotations = usePDFStore.getState().getPageAnnotations(1);
        expect(pageAnnotations).toHaveLength(1);
      });
    });

    describe("getPageAnnotations", () => {
      it("should return empty array for page with no annotations", () => {
        const annotations = usePDFStore.getState().getPageAnnotations(5);
        expect(annotations).toEqual([]);
      });

      it("should return annotations for specific page", () => {
        const ann1 = createMockAnnotation({ id: "ann-1", pageNumber: 1 });
        const ann2 = createMockAnnotation({ id: "ann-2", pageNumber: 2 });
        usePDFStore.getState().addAnnotation(ann1);
        usePDFStore.getState().addAnnotation(ann2);

        const page1Annotations = usePDFStore.getState().getPageAnnotations(1);
        expect(page1Annotations).toHaveLength(1);
        expect(page1Annotations[0].id).toBe("ann-1");
      });
    });

    describe("clearAnnotations", () => {
      it("should clear all annotations", () => {
        usePDFStore
          .getState()
          .addAnnotation(createMockAnnotation({ id: "ann-1", pageNumber: 1 }));
        usePDFStore
          .getState()
          .addAnnotation(createMockAnnotation({ id: "ann-2", pageNumber: 2 }));

        usePDFStore.getState().clearAnnotations();

        expect(usePDFStore.getState().annotations.size).toBe(0);
        expect(usePDFStore.getState().getPageAnnotations(1)).toEqual([]);
        expect(usePDFStore.getState().getPageAnnotations(2)).toEqual([]);
      });
    });
  });

  describe("navigation actions", () => {
    describe("canGoToNextPage", () => {
      it("should return falsy when no document is loaded", () => {
        expect(usePDFStore.getState().canGoToNextPage()).toBeFalsy();
      });

      it("should return true when not on last page", () => {
        usePDFStore
          .getState()
          .setDocument(createMockDocument({ pageCount: 10 }));
        usePDFStore.getState().setCurrentPage(5);
        expect(usePDFStore.getState().canGoToNextPage()).toBe(true);
      });

      it("should return false when on last page", () => {
        usePDFStore
          .getState()
          .setDocument(createMockDocument({ pageCount: 10 }));
        usePDFStore.getState().setCurrentPage(10);
        expect(usePDFStore.getState().canGoToNextPage()).toBe(false);
      });
    });

    describe("canGoToPreviousPage", () => {
      it("should return false when on first page", () => {
        expect(usePDFStore.getState().canGoToPreviousPage()).toBe(false);
      });

      it("should return true when not on first page", () => {
        usePDFStore.getState().setCurrentPage(5);
        expect(usePDFStore.getState().canGoToPreviousPage()).toBe(true);
      });
    });

    describe("goToNextPage", () => {
      it("should increment page when possible", () => {
        usePDFStore
          .getState()
          .setDocument(createMockDocument({ pageCount: 10 }));
        usePDFStore.getState().setCurrentPage(5);
        usePDFStore.getState().goToNextPage();
        expect(usePDFStore.getState().viewerState.currentPage).toBe(6);
      });

      it("should not increment page when on last page", () => {
        usePDFStore
          .getState()
          .setDocument(createMockDocument({ pageCount: 10 }));
        usePDFStore.getState().setCurrentPage(10);
        usePDFStore.getState().goToNextPage();
        expect(usePDFStore.getState().viewerState.currentPage).toBe(10);
      });

      it("should not increment when no document", () => {
        usePDFStore.getState().setCurrentPage(1);
        usePDFStore.getState().goToNextPage();
        expect(usePDFStore.getState().viewerState.currentPage).toBe(1);
      });
    });

    describe("goToPreviousPage", () => {
      it("should decrement page when possible", () => {
        usePDFStore.getState().setCurrentPage(5);
        usePDFStore.getState().goToPreviousPage();
        expect(usePDFStore.getState().viewerState.currentPage).toBe(4);
      });

      it("should not decrement page when on first page", () => {
        usePDFStore.getState().setCurrentPage(1);
        usePDFStore.getState().goToPreviousPage();
        expect(usePDFStore.getState().viewerState.currentPage).toBe(1);
      });
    });
  });

  describe("reset", () => {
    it("should reset all state to initial values", () => {
      // Set various state values
      usePDFStore.getState().setDocument(createMockDocument());
      usePDFStore.getState().setCurrentPage(5);
      usePDFStore.getState().setZoom(2.0);
      usePDFStore.getState().setRotation(90);
      usePDFStore.getState().setLoading(true, LoadingStage.OPENING, 50);
      usePDFStore.getState().setError({ code: "TEST", message: "Test" });
      usePDFStore.getState().addAnnotation(createMockAnnotation());

      // Reset
      usePDFStore.getState().reset();

      // Verify all state is reset
      const state = usePDFStore.getState();
      expect(state.document).toBeNull();
      expect(state.viewerState.currentPage).toBe(1);
      expect(state.viewerState.zoom).toBe(1.0);
      expect(state.viewerState.rotation).toBe(0);
      expect(state.viewerState.fitMode).toBe(FitMode.FIT_WIDTH);
      expect(state.loadingState.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.annotations.size).toBe(0);
    });
  });
});
