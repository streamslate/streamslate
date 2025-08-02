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
import {
  LoadingStage,
  Annotation,
  AnnotationType,
} from "../../types/pdf.types";
import { pdfRenderer } from "../../lib/pdf/renderer";
import { usePDFStore } from "../../stores/pdf.store";
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
  const {
    document,
    viewerState,
    loadingState,
    error,
    isLoaded,
    isLoading,
    currentPageInfo,
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
  } = usePDF();

  // Get annotation methods directly from store
  const {
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    getPageAnnotations,
  } = usePDFStore();

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

  // Get annotations for current page
  const currentPageAnnotations = getPageAnnotations(viewerState.currentPage);

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-600 dark:text-red-400 bg-gray-50 dark:bg-gray-900">
          <div className="text-2xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Error Loading PDF</h3>
          <p className="text-sm text-gray-300 mb-4">{error.message}</p>
          <button
            onClick={openPDF}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">
            {loadingState.stage === LoadingStage.OPENING && "Opening PDF..."}
            {loadingState.stage === LoadingStage.PARSING && "Parsing PDF..."}
            {loadingState.stage === LoadingStage.RENDERING &&
              "Rendering PDF..."}
            {loadingState.stage === LoadingStage.COMPLETE &&
              "PDF Loaded Successfully!"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {loadingState.message}
          </p>
          <div className="w-64 bg-gray-300 dark:bg-gray-700 rounded-full h-2 mt-4">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${loadingState.progress}%` }}
            ></div>
          </div>
        </div>
      );
    }

    if (!isLoaded || !document) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">
          <div className="text-6xl mb-6">📄</div>
          <h2 className="text-2xl font-bold mb-4">Welcome to StreamSlate</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
            Open a PDF document to start annotating and presenting. Perfect for
            live streaming and content creation.
          </p>
          <button
            onClick={openPDF}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Open PDF
          </button>
        </div>
      );
    }

    return (
      <div
        className={`flex flex-col h-full ${transparentBg ? "bg-transparent" : "bg-white dark:bg-gray-800"}`}
      >
        {/* Top Toolbar */}
        <div
          className={`${transparentBg ? "bg-gray-100/95 dark:bg-gray-900/95 backdrop-blur-md" : "bg-gray-100 dark:bg-gray-900"} border-b border-gray-300/50 dark:border-gray-700/50 px-6 py-3 shadow-sm`}
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
                className="p-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-all duration-200"
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
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-700"></div>
              <button
                onClick={closePDF}
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                Close PDF
              </button>
            </div>
          </div>
        </div>

        {/* PDF Content Area with Annotation Layer */}
        <div
          className={`flex-1 relative overflow-auto ${transparentBg ? "bg-transparent" : "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"}`}
        >
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative inline-block animate-fade-in">
              <PDFCanvasRenderer
                document={document}
                currentPage={currentPageInfo.current}
                zoom={viewerState.zoom}
                rotation={viewerState.rotation}
                onCanvasSizeChange={setCanvasSize}
                transparentBg={transparentBg}
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
                  className="absolute inset-0"
                />
              )}
            </div>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div
          className={`flex items-center justify-between gap-4 ${transparentBg ? "bg-gray-100/95 dark:bg-gray-900/95 backdrop-blur-md" : "bg-gray-100 dark:bg-gray-900"} px-6 py-3 border-t border-gray-300/50 dark:border-gray-700/50 shadow-lg`}
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

  return <div className={`pdf-viewer ${className}`}>{renderContent()}</div>;
};

/**
 * PDF Canvas Renderer Component
 * Handles the actual PDF.js rendering to canvas
 */
interface PDFCanvasRendererProps {
  document: any;
  currentPage: number;
  zoom: number;
  rotation: number;
  onCanvasSizeChange?: (size: { width: number; height: number }) => void;
  transparentBg?: boolean;
}

const PDFCanvasRenderer: React.FC<PDFCanvasRendererProps> = ({
  document,
  currentPage,
  zoom,
  rotation,
  onCanvasSizeChange,
  transparentBg,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const renderPage = async () => {
      console.log("[PDFCanvasRenderer] renderPage called", {
        hasCanvas: !!canvasRef.current,
        documentPath: document?.path,
        currentPage,
        zoom,
        rotation,
      });

      if (!canvasRef.current || !document?.path) {
        console.log(
          "[PDFCanvasRenderer] Early return - missing canvas or document path"
        );
        return;
      }

      setIsRendering(true);
      setRenderError(null);

      try {
        // Load document if not already loaded
        if (!pdfRenderer.isLoaded) {
          console.log("[PDFCanvasRenderer] Loading document...");
          await pdfRenderer.loadDocument(document.path);
        } else {
          console.log("[PDFCanvasRenderer] Document already loaded");
        }

        // Render the current page
        console.log("[PDFCanvasRenderer] Rendering page", currentPage);
        await pdfRenderer.renderPage(currentPage, canvasRef.current, {
          scale: zoom,
          rotation: rotation,
        });

        if (isMounted) {
          setIsRendering(false);
          // Update canvas size for annotation layer
          if (canvasRef.current && onCanvasSizeChange) {
            console.log("[PDFCanvasRenderer] Updating canvas size:", {
              width: canvasRef.current.width,
              height: canvasRef.current.height,
            });
            onCanvasSizeChange({
              width: canvasRef.current.width,
              height: canvasRef.current.height,
            });
          }
        }
      } catch (error) {
        console.error("[PDFCanvasRenderer] Error rendering PDF:", error);
        if (isMounted) {
          setRenderError(
            error instanceof Error ? error.message : "Failed to render PDF"
          );
          setIsRendering(false);
        }
      }
    };

    renderPage();

    return () => {
      isMounted = false;
    };
  }, [document?.path, currentPage, zoom, rotation]);

  if (renderError) {
    return (
      <div
        className={`flex-1 ${transparentBg ? "bg-transparent" : "bg-gray-50 dark:bg-gray-900"} relative`}
      >
        <div className="absolute inset-0 flex items-center justify-center text-red-400">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold mb-2">Render Error</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {renderError}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {isRendering && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${transparentBg ? "bg-gray-100/50 dark:bg-gray-900/50" : "bg-gray-100 dark:bg-gray-900"} bg-opacity-75 z-10`}
        >
          <div className="flex flex-col items-center text-gray-700 dark:text-gray-300">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-sm">Rendering page {currentPage}...</p>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="border border-gray-300/50 dark:border-gray-600/50 shadow-2xl block bg-white rounded-lg animate-scale-in"
        style={{
          filter: "drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3))",
          boxShadow:
            "0 0 0 1px rgba(0, 0, 0, 0.05), 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      />
    </div>
  );
};

export default PDFViewer;
