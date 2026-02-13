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
 * Basic PDFViewer component structure
 * This is a foundation component that will be enhanced with PDF.js integration in future phases
 */

import React, { useRef, useEffect, useState } from "react";
import { usePDF } from "../../hooks/usePDF";
import { useTheme } from "../../hooks/useTheme";
import {
  LoadingStage,
  type Annotation,
  type AnnotationType,
  type PDFDocument,
} from "../../types/pdf.types";
import { pdfRenderer } from "../../lib/pdf/renderer";
import AnnotationLayer from "./AnnotationLayer";
import { AnnotationTools } from "../annotation/AnnotationTools";
import { PageNavigation } from "./PageNavigation";
import { ZoomControls } from "./ZoomControls";
import { FitMode } from "../../types/pdf.types";

interface PDFViewerProps {
  className?: string;
  transparentBg?: boolean;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  className = "",
  transparentBg = false,
}) => {
  const { darkMode } = useTheme();
  const {
    document,
    viewerState,
    loadingState,
    error,
    isLoaded,
    isLoading,
    currentPageInfo,
    annotations,
    openPDF,
    closePDF,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    zoomIn,
    zoomOut,
    zoomTo,
    rotate,
    setFitMode,
    addAnnotation: addAnnotation,
    updateAnnotation: updateAnnotation,
    removeAnnotation: removeAnnotation,
    undo,
    redo,
  } = usePDF();

  // Annotation tool state
  const [activeTool, setActiveTool] = useState<AnnotationType | undefined>(
    undefined
  );
  const [toolConfig, setToolConfig] = useState({
    color: "#ffff00",
    opacity: 0.5,
    strokeWidth: 2,
  });

  // Handle tool config changes
  const handleToolConfigChange = (config: Partial<typeof toolConfig>) => {
    setToolConfig((prev) => ({ ...prev, ...config }));
  };

  // Canvas size state for annotation layer
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Container ref for fit mode calculations
  const containerRef = useRef<HTMLDivElement>(null);

  // Get annotations for current page
  const currentPageAnnotations = annotations.get(viewerState.currentPage) ?? [];

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-bg-secondary">
          <div className="bg-surface-primary p-8 max-w-sm rounded-lg border border-border-primary animate-scale-in">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary text-center mb-2">
              Error Loading PDF
            </h3>
            <p className="text-sm text-text-secondary text-center mb-4">
              {error.message}
            </p>
            <button onClick={openPDF} className="btn btn-primary w-full">
              Try Again
            </button>
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-bg-secondary">
          <div className="bg-surface-primary p-8 rounded-lg border border-border-primary animate-fade-in">
            <div className="animate-pulse">
              <div className="w-8 h-8 bg-primary rounded-full mx-auto mb-4"></div>
              <div className="h-2 bg-bg-tertiary rounded w-32 mx-auto mb-2"></div>
              <div className="h-2 bg-bg-tertiary rounded w-24 mx-auto"></div>
            </div>
            <p className="text-sm text-text-secondary text-center mt-4">
              {loadingState.stage === LoadingStage.OPENING && "Opening PDF..."}
              {loadingState.stage === LoadingStage.PARSING && "Parsing PDF..."}
              {loadingState.stage === LoadingStage.RENDERING &&
                "Rendering PDF..."}
              {loadingState.stage === LoadingStage.COMPLETE &&
                "PDF Loaded Successfully!"}
            </p>
            {loadingState.message && (
              <p className="text-xs text-text-tertiary text-center mt-2">
                {loadingState.message}
              </p>
            )}
            <div className="w-full bg-bg-tertiary rounded-full h-2 mt-4">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${loadingState.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      );
    }

    if (!isLoaded || !document) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-bg-secondary">
          <div
            data-testid="pdf-empty-state"
            className="bg-surface-primary p-12 max-w-lg text-center rounded-lg border border-border-primary animate-scale-in"
          >
            <div className="w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-text-tertiary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              No PDF Loaded
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              Open a PDF file to start annotating and presenting
            </p>
            <button
              onClick={openPDF}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Open PDF File
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`flex flex-col h-full ${
          transparentBg ? "bg-transparent" : "bg-bg-secondary"
        }`}
      >
        {/* Top Toolbar */}
        <div
          className={`${
            transparentBg
              ? "bg-surface-primary/95 backdrop-blur-md"
              : "bg-surface-primary"
          } border-b border-border-primary px-6 py-3 shadow-sm`}
        >
          <div className="flex items-center justify-between gap-4">
            <AnnotationTools
              activeTool={activeTool}
              onToolSelect={setActiveTool}
              toolConfig={toolConfig}
              onToolConfigChange={handleToolConfigChange}
              className="flex-1 max-w-fit"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => rotate(true)}
                className="p-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-all duration-150"
                title="Rotate Clockwise"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <div className="w-px h-6 bg-[rgb(var(--color-border-primary))]"></div>
              <button
                onClick={closePDF}
                className="px-4 py-2 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-all duration-150"
              >
                Close PDF
              </button>
            </div>
          </div>
        </div>

        {/* PDF Content Area with Annotation Layer */}
        <div
          className={`flex-1 relative overflow-auto ${
            transparentBg ? "bg-transparent" : "bg-bg-tertiary"
          }`}
        >
          <div
            className="h-full w-full flex items-start justify-center p-8 overflow-auto"
            ref={containerRef}
          >
            <div className="relative inline-block animate-fade-in">
              <PDFCanvasRenderer
                pdfDocument={document}
                currentPage={currentPageInfo.current}
                zoom={viewerState.zoom}
                rotation={viewerState.rotation}
                onCanvasSizeChange={setCanvasSize}
                transparentBg={transparentBg}
                darkMode={darkMode}
                fitMode={viewerState.fitMode}
              />

              {/* Annotation Layer Overlay */}
              {canvasSize.width > 0 && canvasSize.height > 0 && (
                <AnnotationLayer
                  pageNumber={viewerState.currentPage}
                  annotations={currentPageAnnotations}
                  viewport={{
                    width: canvasSize.width,
                    height: canvasSize.height,
                    scale: viewerState.zoom,
                  }}
                  activeTool={activeTool}
                  toolConfig={toolConfig}
                  onAnnotationCreate={(annotation) => {
                    if (annotation.id && annotation.type) {
                      addAnnotation(annotation as Annotation);
                    }
                  }}
                  onAnnotationUpdate={updateAnnotation}
                  onAnnotationDelete={removeAnnotation}
                  onUndo={undo}
                  onRedo={redo}
                  className="absolute inset-0"
                />
              )}
            </div>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div
          className={`flex items-center justify-between gap-4 ${
            transparentBg
              ? "bg-surface-primary/95 backdrop-blur-md"
              : "bg-surface-primary"
          } px-6 py-3 border-t border-border-primary shadow-sm`}
        >
          {/* Page Navigation */}
          <div className="flex-1">
            <PageNavigation
              currentPage={viewerState.currentPage}
              totalPages={document?.pageCount || 0}
              onPageChange={goToPage}
              onNextPage={goToNextPage}
              onPreviousPage={goToPreviousPage}
              canNext={currentPageInfo.canNext}
              canPrevious={currentPageInfo.canPrevious}
            />
          </div>

          {/* Zoom Controls */}
          <div className="flex-1 flex justify-end">
            <ZoomControls
              zoom={viewerState.zoom}
              fitMode={viewerState.fitMode || FitMode.FIT_WIDTH}
              onZoomIn={() => zoomIn()}
              onZoomOut={() => zoomOut()}
              onZoomChange={zoomTo}
              onFitModeChange={setFitMode}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      data-testid="pdf-viewer"
      className={`pdf-viewer h-full flex flex-col ${className}`}
    >
      {renderContent()}
    </div>
  );
};

/**
 * PDF Canvas Renderer Component
 * Handles the actual PDF.js rendering to canvas
 */
interface PDFCanvasRendererProps {
  pdfDocument: PDFDocument;
  currentPage: number;
  zoom: number;
  rotation: number;
  onCanvasSizeChange?: (size: { width: number; height: number }) => void;
  transparentBg?: boolean;
  darkMode?: boolean;
  fitMode?: FitMode;
}

const PDFCanvasRenderer: React.FC<PDFCanvasRendererProps> = ({
  pdfDocument,
  currentPage,
  zoom,
  rotation,
  onCanvasSizeChange,
  transparentBg,
  darkMode = false,
  fitMode = FitMode.CUSTOM,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{
    cancel?: () => void;
    canvas: HTMLCanvasElement;
    viewport: { width: number; height: number };
  } | null>(null); // Track current render task
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let renderTimeout: ReturnType<typeof setTimeout>;

    const renderPage = async () => {
      if (!canvasRef.current || !pdfDocument?.path) {
        return;
      }

      // Cancel any existing render task to prevent overlap
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel?.();
        } catch {
          // Ignore cancellation errors
        }
        renderTaskRef.current = null;
      }

      setIsRendering(true);
      setRenderError(null);

      try {
        // Load document if not already loaded
        if (!pdfRenderer.isLoaded) {
          await pdfRenderer.loadDocument(pdfDocument.path);
        }

        // Render the current page
        const result = await pdfRenderer.renderPage(
          currentPage,
          canvasRef.current,
          {
            scale: zoom,
            rotation: rotation,
          }
        );

        // Store render task reference for potential cancellation
        renderTaskRef.current = result;

        if (isMounted) {
          setIsRendering(false);

          // WORKAROUND: Convert canvas to image for Tauri WebView compatibility
          if (canvasRef.current) {
            try {
              const dataUrl = canvasRef.current.toDataURL("image/png");
              setImageDataUrl(dataUrl);
            } catch {
              // Fallback image creation failed - canvas rendering will still work
            }
          }

          // Update canvas size for annotation layer
          if (canvasRef.current && onCanvasSizeChange) {
            const size = {
              width: canvasRef.current.width,
              height: canvasRef.current.height,
            };
            onCanvasSizeChange(size);
          }
        }
      } catch (error) {
        // Ignore rendering cancellation errors
        if (
          error instanceof Error &&
          error.name === "RenderingCancelledException"
        ) {
          return;
        }
        if (isMounted) {
          setRenderError(
            error instanceof Error ? error.message : "Failed to render PDF"
          );
          setIsRendering(false);
        }
      } finally {
        renderTaskRef.current = null;
      }
    };

    // Debounce rendering to avoid rapid re-renders
    renderTimeout = setTimeout(renderPage, 100);

    return () => {
      isMounted = false;
      clearTimeout(renderTimeout);

      // Cancel any ongoing render task on cleanup
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel?.();
        } catch {
          // Ignore cleanup errors
        }
        renderTaskRef.current = null;
      }
    };
  }, [
    pdfDocument?.path,
    currentPage,
    zoom,
    rotation,
    onCanvasSizeChange,
    fitMode,
  ]);

  if (renderError) {
    return (
      <div
        className={`flex-1 ${
          transparentBg ? "bg-transparent" : "bg-bg-secondary"
        } relative`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-surface-primary p-8 text-center rounded-lg border border-border-primary">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">
              Render Error
            </h3>
            <p className="text-sm text-text-secondary">{renderError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-auto ${
        transparentBg ? "bg-transparent" : "bg-bg-secondary"
      }`}
      style={{
        // Force hardware acceleration and compositing for Tauri WebView
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
        perspective: "1000px",
      }}
    >
      {isRendering && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${
            transparentBg ? "bg-bg-tertiary/50" : "bg-bg-tertiary"
          } bg-opacity-75 z-10 rounded-lg pointer-events-none`}
        >
          <div className="flex flex-col items-center text-text-primary">
            <div className="relative">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-border-primary"></div>
              <div className="absolute inset-0 animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            </div>
            <p className="text-sm mt-2">Rendering page {currentPage}...</p>
          </div>
        </div>
      )}

      {/* Canvas element (hidden for WebView compatibility) */}
      <canvas
        ref={canvasRef}
        className="hidden"
        style={{
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
        }}
      />

      {/* Fallback image for Tauri WebView */}
      {imageDataUrl ? (
        <img
          src={imageDataUrl}
          alt={`PDF page ${currentPage}`}
          className={`block mx-auto max-w-full h-auto ${
            darkMode ? "pdf-dark-mode" : ""
          }`}
          style={{
            display: "block",
            visibility: "visible",
            opacity: "1",
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
            WebkitTransform: "translateZ(0)",
            WebkitBackfaceVisibility: "hidden",
          }}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-64 bg-bg-tertiary text-text-tertiary border border-border-secondary rounded-lg">
          No image data available
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
