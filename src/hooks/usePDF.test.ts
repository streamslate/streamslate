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

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePDF } from "./usePDF";
import { usePDFStore } from "../stores/pdf.store";
import { FitMode, ViewMode, LoadingStage } from "../types/pdf.types";

// Mock the Tauri dialog API
vi.mock("@tauri-apps/api/dialog", () => ({
  open: vi.fn(),
}));

// Mock the PDFCommands
vi.mock("../lib/tauri/commands", () => ({
  PDFCommands: {
    openPdf: vi.fn(),
    closePdf: vi.fn(),
    getPdfPageInfo: vi.fn(),
    getPdfPageCount: vi.fn(),
    isPdfOpen: vi.fn(),
  },
}));

// Import the mocked modules
import { open as mockOpen } from "@tauri-apps/api/dialog";
import { PDFCommands } from "../lib/tauri/commands";

// Helper to create mock PDF info
const createMockPdfInfo = (overrides = {}) => ({
  path: "/test/document.pdf",
  title: "Test Document",
  author: "Test Author",
  page_count: 10,
  file_size: 1024000,
  created: "1700000000",
  modified: "1700001000",
  ...overrides,
});

describe("usePDF", () => {
  beforeEach(() => {
    // Reset store and mocks before each test
    usePDFStore.getState().reset();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initial state", () => {
    it("should return initial state values", () => {
      const { result } = renderHook(() => usePDF());

      expect(result.current.document).toBeNull();
      expect(result.current.isLoaded).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.currentPageInfo.current).toBe(1);
      expect(result.current.currentPageInfo.total).toBe(0);
    });

    it("should return viewer state", () => {
      const { result } = renderHook(() => usePDF());

      expect(result.current.viewerState).toBeDefined();
      expect(result.current.viewerState.zoom).toBe(1.0);
      expect(result.current.viewerState.rotation).toBe(0);
      expect(result.current.viewerState.fitMode).toBe(FitMode.FIT_WIDTH);
    });
  });

  describe("openPDF", () => {
    it("should open PDF when file is selected", async () => {
      vi.useRealTimers();
      const mockPdfInfo = createMockPdfInfo();
      vi.mocked(mockOpen).mockResolvedValue("/test/document.pdf");
      vi.mocked(PDFCommands.openPdf).mockResolvedValue(mockPdfInfo);

      const { result } = renderHook(() => usePDF());

      await act(async () => {
        await result.current.openPDF();
      });

      await waitFor(() => {
        expect(result.current.document).not.toBeNull();
      });

      expect(result.current.document?.path).toBe("/test/document.pdf");
      expect(result.current.document?.title).toBe("Test Document");
      expect(result.current.document?.pageCount).toBe(10);
      expect(result.current.isLoaded).toBe(true);
    });

    it("should not load PDF when dialog is cancelled", async () => {
      vi.mocked(mockOpen).mockResolvedValue(null);

      const { result } = renderHook(() => usePDF());

      await act(async () => {
        await result.current.openPDF();
      });

      expect(result.current.document).toBeNull();
      expect(result.current.isLoaded).toBe(false);
      expect(PDFCommands.openPdf).not.toHaveBeenCalled();
    });

    it("should not load PDF when multiple files are selected", async () => {
      vi.mocked(mockOpen).mockResolvedValue(["/file1.pdf", "/file2.pdf"]);

      const { result } = renderHook(() => usePDF());

      await act(async () => {
        await result.current.openPDF();
      });

      expect(result.current.document).toBeNull();
      expect(PDFCommands.openPdf).not.toHaveBeenCalled();
    });

    it("should set error when PDF loading fails", async () => {
      vi.mocked(mockOpen).mockResolvedValue("/test/document.pdf");
      vi.mocked(PDFCommands.openPdf).mockRejectedValue(
        new Error("Failed to parse PDF")
      );

      const { result } = renderHook(() => usePDF());

      await act(async () => {
        await result.current.openPDF();
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.code).toBe("LOAD_ERROR");
      expect(result.current.error?.message).toBe("Failed to parse PDF");
    });
  });

  describe("closePDF", () => {
    it("should close PDF and reset state", async () => {
      vi.useRealTimers();
      // First open a PDF
      const mockPdfInfo = createMockPdfInfo();
      vi.mocked(mockOpen).mockResolvedValue("/test/document.pdf");
      vi.mocked(PDFCommands.openPdf).mockResolvedValue(mockPdfInfo);
      vi.mocked(PDFCommands.closePdf).mockResolvedValue(undefined);

      const { result } = renderHook(() => usePDF());

      await act(async () => {
        await result.current.openPDF();
      });

      await waitFor(() => {
        expect(result.current.document).not.toBeNull();
      });

      // Now close it
      await act(async () => {
        await result.current.closePDF();
      });

      expect(result.current.document).toBeNull();
      expect(result.current.isLoaded).toBe(false);
      expect(PDFCommands.closePdf).toHaveBeenCalled();
    });

    it("should set error when close fails", async () => {
      vi.mocked(PDFCommands.closePdf).mockRejectedValue(
        new Error("Failed to close PDF")
      );

      const { result } = renderHook(() => usePDF());

      await act(async () => {
        await result.current.closePDF();
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.code).toBe("CLOSE_ERROR");
    });
  });

  describe("goToPage", () => {
    it("should navigate to valid page", () => {
      // Setup document in store first
      usePDFStore.getState().setDocument({
        id: "test",
        path: "/test.pdf",
        pageCount: 10,
        fileSize: 1000,
        isLoaded: true,
      });

      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.goToPage(5);
      });

      expect(result.current.viewerState.currentPage).toBe(5);
    });

    it("should clamp page to valid range - minimum", () => {
      usePDFStore.getState().setDocument({
        id: "test",
        path: "/test.pdf",
        pageCount: 10,
        fileSize: 1000,
        isLoaded: true,
      });

      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.goToPage(0);
      });

      expect(result.current.viewerState.currentPage).toBe(1);
    });

    it("should clamp page to valid range - maximum", () => {
      usePDFStore.getState().setDocument({
        id: "test",
        path: "/test.pdf",
        pageCount: 10,
        fileSize: 1000,
        isLoaded: true,
      });

      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.goToPage(100);
      });

      expect(result.current.viewerState.currentPage).toBe(10);
    });

    it("should do nothing when no document is loaded", () => {
      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.goToPage(5);
      });

      // Should remain at default page
      expect(result.current.viewerState.currentPage).toBe(1);
    });
  });

  describe("goToNextPage / goToPreviousPage", () => {
    it("should go to next page", () => {
      usePDFStore.getState().setDocument({
        id: "test",
        path: "/test.pdf",
        pageCount: 10,
        fileSize: 1000,
        isLoaded: true,
      });
      usePDFStore.getState().setCurrentPage(5);

      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.goToNextPage();
      });

      expect(result.current.viewerState.currentPage).toBe(6);
    });

    it("should go to previous page", () => {
      usePDFStore.getState().setDocument({
        id: "test",
        path: "/test.pdf",
        pageCount: 10,
        fileSize: 1000,
        isLoaded: true,
      });
      usePDFStore.getState().setCurrentPage(5);

      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.goToPreviousPage();
      });

      expect(result.current.viewerState.currentPage).toBe(4);
    });

    it("should not go past last page", () => {
      usePDFStore.getState().setDocument({
        id: "test",
        path: "/test.pdf",
        pageCount: 10,
        fileSize: 1000,
        isLoaded: true,
      });
      usePDFStore.getState().setCurrentPage(10);

      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.goToNextPage();
      });

      expect(result.current.viewerState.currentPage).toBe(10);
    });

    it("should not go before first page", () => {
      usePDFStore.getState().setDocument({
        id: "test",
        path: "/test.pdf",
        pageCount: 10,
        fileSize: 1000,
        isLoaded: true,
      });
      usePDFStore.getState().setCurrentPage(1);

      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.goToPreviousPage();
      });

      expect(result.current.viewerState.currentPage).toBe(1);
    });
  });

  describe("zoom operations", () => {
    it("should zoom to specific level", () => {
      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.zoomTo(1.5);
      });

      expect(result.current.viewerState.zoom).toBe(1.5);
    });

    it("should clamp zoom to minimum 0.1", () => {
      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.zoomTo(0.01);
      });

      expect(result.current.viewerState.zoom).toBe(0.1);
    });

    it("should clamp zoom to maximum 5.0", () => {
      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.zoomTo(10);
      });

      expect(result.current.viewerState.zoom).toBe(5.0);
    });

    it("should zoom in by default factor", () => {
      const { result } = renderHook(() => usePDF());

      const initialZoom = result.current.viewerState.zoom;

      act(() => {
        result.current.zoomIn();
      });

      expect(result.current.viewerState.zoom).toBeCloseTo(initialZoom * 1.2, 5);
    });

    it("should zoom out by default factor", () => {
      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.zoomTo(1.2);
      });

      act(() => {
        result.current.zoomOut();
      });

      expect(result.current.viewerState.zoom).toBeCloseTo(1.0, 5);
    });

    it("should zoom in by custom factor", () => {
      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.zoomIn(2);
      });

      expect(result.current.viewerState.zoom).toBe(2.0);
    });
  });

  describe("rotation", () => {
    it("should rotate clockwise by default", () => {
      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.rotate();
      });

      expect(result.current.viewerState.rotation).toBe(90);
    });

    it("should rotate counter-clockwise when specified", () => {
      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.rotate(false);
      });

      expect(result.current.viewerState.rotation).toBe(270);
    });

    it("should wrap rotation at 360", () => {
      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.rotate();
      });
      act(() => {
        result.current.rotate();
      });
      act(() => {
        result.current.rotate();
      });
      act(() => {
        result.current.rotate();
      });

      expect(result.current.viewerState.rotation).toBe(0);
    });

    it("should handle negative rotation wrap", () => {
      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.rotate(false);
      });
      act(() => {
        result.current.rotate(false);
      });

      expect(result.current.viewerState.rotation).toBe(180);
    });
  });

  describe("fit mode and view mode", () => {
    it("should set fit mode", () => {
      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.setFitMode(FitMode.FIT_PAGE);
      });

      expect(result.current.viewerState.fitMode).toBe(FitMode.FIT_PAGE);
    });

    it("should set view mode", () => {
      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.setViewMode(ViewMode.CONTINUOUS);
      });

      expect(result.current.viewerState.viewMode).toBe(ViewMode.CONTINUOUS);
    });
  });

  describe("sidebar and toolbar toggles", () => {
    it("should toggle sidebar visibility", () => {
      const { result } = renderHook(() => usePDF());

      expect(result.current.viewerState.sidebarVisible).toBe(true);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.viewerState.sidebarVisible).toBe(false);
    });

    it("should toggle toolbar visibility", () => {
      const { result } = renderHook(() => usePDF());

      expect(result.current.viewerState.toolbarVisible).toBe(true);

      act(() => {
        result.current.toggleToolbar();
      });

      expect(result.current.viewerState.toolbarVisible).toBe(false);
    });
  });

  describe("currentPageInfo", () => {
    it("should provide current page info with document", () => {
      usePDFStore.getState().setDocument({
        id: "test",
        path: "/test.pdf",
        pageCount: 10,
        fileSize: 1000,
        isLoaded: true,
      });
      usePDFStore.getState().setCurrentPage(5);

      const { result } = renderHook(() => usePDF());

      expect(result.current.currentPageInfo.current).toBe(5);
      expect(result.current.currentPageInfo.total).toBe(10);
      expect(result.current.currentPageInfo.canNext).toBe(true);
      expect(result.current.currentPageInfo.canPrevious).toBe(true);
    });

    it("should report cannot navigate on first page", () => {
      usePDFStore.getState().setDocument({
        id: "test",
        path: "/test.pdf",
        pageCount: 10,
        fileSize: 1000,
        isLoaded: true,
      });
      usePDFStore.getState().setCurrentPage(1);

      const { result } = renderHook(() => usePDF());

      expect(result.current.currentPageInfo.canPrevious).toBe(false);
      expect(result.current.currentPageInfo.canNext).toBe(true);
    });

    it("should report cannot navigate on last page", () => {
      usePDFStore.getState().setDocument({
        id: "test",
        path: "/test.pdf",
        pageCount: 10,
        fileSize: 1000,
        isLoaded: true,
      });
      usePDFStore.getState().setCurrentPage(10);

      const { result } = renderHook(() => usePDF());

      expect(result.current.currentPageInfo.canNext).toBe(false);
      expect(result.current.currentPageInfo.canPrevious).toBe(true);
    });
  });
});
