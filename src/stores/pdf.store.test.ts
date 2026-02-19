import { describe, it, expect, beforeEach } from "vitest";
import { usePDFStore } from "./pdf.store";
import {
  FitMode,
  ViewMode,
  LoadingStage,
  AnnotationType,
} from "../types/pdf.types";
import type { Annotation, PDFDocument } from "../types/pdf.types";

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: `ann-${Math.random().toString(16).slice(2)}`,
    type: AnnotationType.HIGHLIGHT,
    pageNumber: 1,
    x: 10,
    y: 20,
    width: 100,
    height: 30,
    content: "",
    color: "#ffff00",
    opacity: 1,
    created: new Date("2025-01-01"),
    modified: new Date("2025-01-01"),
    visible: true,
    ...overrides,
  };
}

function makeDocument(overrides: Partial<PDFDocument> = {}): PDFDocument {
  return {
    id: "test-doc",
    path: "/test/file.pdf",
    pageCount: 5,
    fileSize: 1024,
    isLoaded: true,
    ...overrides,
  };
}

describe("pdf.store", () => {
  beforeEach(() => {
    usePDFStore.getState().reset();
  });

  describe("page navigation", () => {
    it("setCurrentPage updates page and clears selection", () => {
      const store = usePDFStore.getState();
      store.selectAnnotation("some-id");
      store.setCurrentPage(3);

      const state = usePDFStore.getState();
      expect(state.viewerState.currentPage).toBe(3);
      expect(state.selectedAnnotationId).toBeNull();
    });

    it("canGoToNextPage returns false without a document", () => {
      expect(usePDFStore.getState().canGoToNextPage()).toBeFalsy();
    });

    it("canGoToNextPage returns true when not on last page", () => {
      usePDFStore.getState().setDocument(makeDocument({ pageCount: 5 }));
      usePDFStore.getState().setCurrentPage(3);
      expect(usePDFStore.getState().canGoToNextPage()).toBe(true);
    });

    it("canGoToNextPage returns false on last page", () => {
      usePDFStore.getState().setDocument(makeDocument({ pageCount: 5 }));
      usePDFStore.getState().setCurrentPage(5);
      expect(usePDFStore.getState().canGoToNextPage()).toBeFalsy();
    });

    it("canGoToPreviousPage returns false on page 1", () => {
      expect(usePDFStore.getState().canGoToPreviousPage()).toBe(false);
    });

    it("canGoToPreviousPage returns true on page > 1", () => {
      usePDFStore.getState().setCurrentPage(2);
      expect(usePDFStore.getState().canGoToPreviousPage()).toBe(true);
    });

    it("goToNextPage increments page", () => {
      usePDFStore.getState().setDocument(makeDocument({ pageCount: 5 }));
      usePDFStore.getState().setCurrentPage(2);
      usePDFStore.getState().goToNextPage();
      expect(usePDFStore.getState().viewerState.currentPage).toBe(3);
    });

    it("goToNextPage does nothing on last page", () => {
      usePDFStore.getState().setDocument(makeDocument({ pageCount: 3 }));
      usePDFStore.getState().setCurrentPage(3);
      usePDFStore.getState().goToNextPage();
      expect(usePDFStore.getState().viewerState.currentPage).toBe(3);
    });

    it("goToPreviousPage decrements page", () => {
      usePDFStore.getState().setCurrentPage(3);
      usePDFStore.getState().goToPreviousPage();
      expect(usePDFStore.getState().viewerState.currentPage).toBe(2);
    });

    it("goToPreviousPage does nothing on page 1", () => {
      usePDFStore.getState().goToPreviousPage();
      expect(usePDFStore.getState().viewerState.currentPage).toBe(1);
    });
  });

  describe("zoom and fit modes", () => {
    it("setZoom updates zoom and switches to CUSTOM fit mode", () => {
      usePDFStore.getState().setZoom(2.5);
      const state = usePDFStore.getState();
      expect(state.viewerState.zoom).toBe(2.5);
      expect(state.viewerState.fitMode).toBe(FitMode.CUSTOM);
    });

    it("setFitMode to FIT_WIDTH resets zoom to 1.0", () => {
      usePDFStore.getState().setZoom(2.0);
      usePDFStore.getState().setFitMode(FitMode.FIT_WIDTH);
      const state = usePDFStore.getState();
      expect(state.viewerState.fitMode).toBe(FitMode.FIT_WIDTH);
      expect(state.viewerState.zoom).toBe(1.0);
    });

    it("setFitMode to CUSTOM preserves current zoom", () => {
      usePDFStore.getState().setZoom(2.5);
      usePDFStore.getState().setFitMode(FitMode.CUSTOM);
      expect(usePDFStore.getState().viewerState.zoom).toBe(2.5);
    });

    it("calculateFitZoom handles FIT_WIDTH", () => {
      const zoom = usePDFStore
        .getState()
        .calculateFitZoom(FitMode.FIT_WIDTH, 840, 600, 800, 1000, 0);
      // (840 - 40) / 800 = 1.0
      expect(zoom).toBe(1.0);
    });

    it("calculateFitZoom handles FIT_PAGE", () => {
      const zoom = usePDFStore
        .getState()
        .calculateFitZoom(FitMode.FIT_PAGE, 840, 1040, 800, 1000, 0);
      // widthScale = 800/800 = 1.0, heightScale = 1000/1000 = 1.0
      expect(zoom).toBe(1.0);
    });

    it("calculateFitZoom handles 90-degree rotation", () => {
      const zoom = usePDFStore
        .getState()
        .calculateFitZoom(FitMode.FIT_WIDTH, 1040, 840, 800, 1000, 90);
      // After rotation: effectiveWidth = 1000, effectiveHeight = 800
      // (1040 - 40) / 1000 = 1.0
      expect(zoom).toBe(1.0);
    });

    it("calculateFitZoom returns ACTUAL_SIZE = 1.0", () => {
      const zoom = usePDFStore
        .getState()
        .calculateFitZoom(FitMode.ACTUAL_SIZE, 500, 500, 800, 1000, 0);
      expect(zoom).toBe(1.0);
    });

    it("calculateFitZoom CUSTOM returns current zoom", () => {
      usePDFStore.getState().setZoom(3.0);
      const zoom = usePDFStore
        .getState()
        .calculateFitZoom(FitMode.CUSTOM, 500, 500, 800, 1000, 0);
      expect(zoom).toBe(3.0);
    });
  });

  describe("viewer toggles", () => {
    it("toggleSidebar flips visibility", () => {
      expect(usePDFStore.getState().viewerState.sidebarVisible).toBe(true);
      usePDFStore.getState().toggleSidebar();
      expect(usePDFStore.getState().viewerState.sidebarVisible).toBe(false);
      usePDFStore.getState().toggleSidebar();
      expect(usePDFStore.getState().viewerState.sidebarVisible).toBe(true);
    });

    it("toggleToolbar flips visibility", () => {
      expect(usePDFStore.getState().viewerState.toolbarVisible).toBe(true);
      usePDFStore.getState().toggleToolbar();
      expect(usePDFStore.getState().viewerState.toolbarVisible).toBe(false);
    });

    it("setViewMode updates view mode", () => {
      usePDFStore.getState().setViewMode(ViewMode.CONTINUOUS);
      expect(usePDFStore.getState().viewerState.viewMode).toBe(
        ViewMode.CONTINUOUS
      );
    });

    it("setRotation updates rotation", () => {
      usePDFStore.getState().setRotation(90);
      expect(usePDFStore.getState().viewerState.rotation).toBe(90);
    });
  });

  describe("loading state", () => {
    it("setLoading updates loading state", () => {
      usePDFStore
        .getState()
        .setLoading(true, LoadingStage.PARSING, 50, "Parsing pages...");
      const state = usePDFStore.getState().loadingState;
      expect(state.isLoading).toBe(true);
      expect(state.stage).toBe(LoadingStage.PARSING);
      expect(state.progress).toBe(50);
      expect(state.message).toBe("Parsing pages...");
    });

    it("setLoading clears error when starting to load", () => {
      usePDFStore.getState().setError({ code: "TEST", message: "test error" });
      usePDFStore.getState().setLoading(true, LoadingStage.OPENING);
      expect(usePDFStore.getState().error).toBeNull();
    });
  });

  describe("annotations", () => {
    it("addAnnotation adds to the correct page", () => {
      const ann = makeAnnotation({ pageNumber: 2 });
      usePDFStore.getState().addAnnotation(ann);
      expect(usePDFStore.getState().getPageAnnotations(2)).toHaveLength(1);
      expect(usePDFStore.getState().getPageAnnotations(1)).toHaveLength(0);
    });

    it("updateAnnotation modifies properties", () => {
      const ann = makeAnnotation({ id: "a1", pageNumber: 1 });
      usePDFStore.getState().addAnnotation(ann);
      usePDFStore.getState().updateAnnotation("a1", { color: "#ff0000" });
      const updated = usePDFStore.getState().getPageAnnotations(1)[0];
      expect(updated.color).toBe("#ff0000");
    });

    it("removeAnnotation removes and clears selection if matched", () => {
      const ann = makeAnnotation({ id: "a1" });
      usePDFStore.getState().addAnnotation(ann);
      usePDFStore.getState().selectAnnotation("a1");
      usePDFStore.getState().removeAnnotation("a1");
      expect(usePDFStore.getState().getPageAnnotations(1)).toHaveLength(0);
      expect(usePDFStore.getState().selectedAnnotationId).toBeNull();
    });

    it("removeAnnotation preserves selection for other annotations", () => {
      const a1 = makeAnnotation({ id: "a1" });
      const a2 = makeAnnotation({ id: "a2" });
      usePDFStore.getState().addAnnotation(a1);
      usePDFStore.getState().addAnnotation(a2);
      usePDFStore.getState().selectAnnotation("a2");
      usePDFStore.getState().removeAnnotation("a1");
      expect(usePDFStore.getState().selectedAnnotationId).toBe("a2");
    });

    it("setPageAnnotations replaces page annotations", () => {
      usePDFStore.getState().addAnnotation(makeAnnotation({ pageNumber: 1 }));
      usePDFStore.getState().addAnnotation(makeAnnotation({ pageNumber: 1 }));
      const replacement = [makeAnnotation({ id: "new", pageNumber: 1 })];
      usePDFStore.getState().setPageAnnotations(1, replacement);
      expect(usePDFStore.getState().getPageAnnotations(1)).toHaveLength(1);
      expect(usePDFStore.getState().getPageAnnotations(1)[0].id).toBe("new");
    });

    it("clearAnnotations removes all and clears selection", () => {
      usePDFStore.getState().addAnnotation(makeAnnotation({ pageNumber: 1 }));
      usePDFStore.getState().addAnnotation(makeAnnotation({ pageNumber: 2 }));
      usePDFStore.getState().selectAnnotation("something");
      usePDFStore.getState().clearAnnotations();
      expect(usePDFStore.getState().annotations.size).toBe(0);
      expect(usePDFStore.getState().selectedAnnotationId).toBeNull();
    });

    it("getPageAnnotations returns empty array for unknown page", () => {
      expect(usePDFStore.getState().getPageAnnotations(99)).toEqual([]);
    });
  });

  describe("undo/redo", () => {
    it("recordHistorySnapshot + undo restores previous state", () => {
      const a1 = makeAnnotation({ id: "a1", pageNumber: 1 });
      usePDFStore.getState().addAnnotation(a1);

      usePDFStore.getState().recordHistorySnapshot();
      usePDFStore.getState().removeAnnotation("a1");

      expect(usePDFStore.getState().getPageAnnotations(1)).toHaveLength(0);

      usePDFStore.getState().undo();
      expect(usePDFStore.getState().getPageAnnotations(1)).toHaveLength(1);
      expect(usePDFStore.getState().getPageAnnotations(1)[0].id).toBe("a1");
    });

    it("redo restores state after undo", () => {
      const a1 = makeAnnotation({ id: "a1", pageNumber: 1 });
      usePDFStore.getState().addAnnotation(a1);
      usePDFStore.getState().recordHistorySnapshot();
      usePDFStore.getState().removeAnnotation("a1");

      usePDFStore.getState().undo();
      expect(usePDFStore.getState().getPageAnnotations(1)).toHaveLength(1);

      usePDFStore.getState().redo();
      expect(usePDFStore.getState().getPageAnnotations(1)).toHaveLength(0);
    });

    it("undo with empty stack is a no-op", () => {
      const before = usePDFStore.getState().viewerState.currentPage;
      usePDFStore.getState().undo();
      expect(usePDFStore.getState().viewerState.currentPage).toBe(before);
    });

    it("redo with empty stack is a no-op", () => {
      usePDFStore.getState().redo();
      expect(usePDFStore.getState().redoStack).toHaveLength(0);
    });

    it("new snapshot clears redo stack", () => {
      usePDFStore.getState().addAnnotation(makeAnnotation({ id: "a1" }));
      usePDFStore.getState().recordHistorySnapshot();
      usePDFStore.getState().removeAnnotation("a1");
      usePDFStore.getState().undo();
      expect(usePDFStore.getState().redoStack).toHaveLength(1);

      usePDFStore.getState().recordHistorySnapshot();
      expect(usePDFStore.getState().redoStack).toHaveLength(0);
    });

    it("history group only records one snapshot", () => {
      usePDFStore.getState().beginHistoryGroup();
      usePDFStore.getState().recordHistorySnapshot();
      usePDFStore.getState().recordHistorySnapshot();
      usePDFStore.getState().recordHistorySnapshot();
      usePDFStore.getState().endHistoryGroup();

      expect(usePDFStore.getState().undoStack).toHaveLength(1);
    });

    it("clearHistory empties both stacks", () => {
      usePDFStore.getState().recordHistorySnapshot();
      usePDFStore.getState().recordHistorySnapshot();
      usePDFStore.getState().clearHistory();
      expect(usePDFStore.getState().undoStack).toHaveLength(0);
      expect(usePDFStore.getState().redoStack).toHaveLength(0);
    });

    it("undo caps at max history size", () => {
      for (let i = 0; i < 60; i++) {
        usePDFStore.getState().recordHistorySnapshot();
      }
      // Default max is 50
      expect(usePDFStore.getState().undoStack.length).toBeLessThanOrEqual(50);
    });
  });

  describe("document lifecycle", () => {
    it("setDocument clears undo/redo stacks", () => {
      usePDFStore.getState().recordHistorySnapshot();
      usePDFStore.getState().setDocument(makeDocument());
      expect(usePDFStore.getState().undoStack).toHaveLength(0);
      expect(usePDFStore.getState().redoStack).toHaveLength(0);
    });

    it("reset returns to initial state", () => {
      usePDFStore.getState().setDocument(makeDocument());
      usePDFStore.getState().setCurrentPage(3);
      usePDFStore.getState().setZoom(2.0);
      usePDFStore.getState().addAnnotation(makeAnnotation());

      usePDFStore.getState().reset();

      const state = usePDFStore.getState();
      expect(state.document).toBeNull();
      expect(state.viewerState.currentPage).toBe(1);
      expect(state.viewerState.zoom).toBe(1.0);
      expect(state.viewerState.fitMode).toBe(FitMode.FIT_WIDTH);
      expect(state.annotations.size).toBe(0);
    });
  });
});
