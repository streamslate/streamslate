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

import React from "react";
import { usePDF } from "../../hooks/usePDF";
import { LoadingStage } from "../../types/pdf.types";

interface PDFViewerProps {
  className?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ className = "" }) => {
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
    zoomIn,
    zoomOut,
    rotate,
  } = usePDF();

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-400 bg-gray-900">
          <div className="text-2xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Error Loading PDF</h3>
          <p className="text-sm text-gray-300 mb-4">{error.message}</p>
          <button
            onClick={openPDF}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-300 bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">
            {loadingState.stage === LoadingStage.OPENING && "Opening PDF..."}
            {loadingState.stage === LoadingStage.PARSING && "Parsing PDF..."}
            {loadingState.stage === LoadingStage.RENDERING &&
              "Rendering PDF..."}
            {loadingState.stage === LoadingStage.COMPLETE &&
              "PDF Loaded Successfully!"}
          </h3>
          <p className="text-sm text-gray-400">{loadingState.message}</p>
          <div className="w-64 bg-gray-700 rounded-full h-2 mt-4">
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
        <div className="flex flex-col items-center justify-center h-full text-gray-300 bg-gray-900">
          <div className="text-6xl mb-6">📄</div>
          <h2 className="text-2xl font-bold mb-4">Welcome to StreamSlate</h2>
          <p className="text-gray-400 mb-6 text-center max-w-md">
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
      <div className="flex flex-col h-full bg-gray-800">
        {/* PDF Content Area - Placeholder for PDF.js integration */}
        <div className="flex-1 bg-gray-100 relative">
          <div className="absolute inset-0 flex items-center justify-center text-gray-600">
            <div className="text-center">
              <div className="text-8xl mb-4">📄</div>
              <h3 className="text-xl font-semibold mb-2">
                {document.title || "PDF Document"}
              </h3>
              <p className="text-sm text-gray-500">
                Page {currentPageInfo.current} of {currentPageInfo.total}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                PDF.js integration will be implemented in the next phase
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="flex items-center justify-between bg-gray-900 px-4 py-2 border-t border-gray-700">
          {/* Page Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousPage}
              disabled={!currentPageInfo.canPrevious}
              className="p-1 text-gray-300 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"
            >
              ⬅️
            </button>
            <span className="text-sm text-gray-300 min-w-20 text-center">
              {currentPageInfo.current} / {currentPageInfo.total}
            </span>
            <button
              onClick={goToNextPage}
              disabled={!currentPageInfo.canNext}
              className="p-1 text-gray-300 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"
            >
              ➡️
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => zoomOut()}
              className="p-1 text-gray-300 hover:text-white"
              title="Zoom Out"
            >
              🔍-
            </button>
            <span className="text-sm text-gray-300 min-w-16 text-center">
              {Math.round(viewerState.zoom * 100)}%
            </span>
            <button
              onClick={() => zoomIn()}
              className="p-1 text-gray-300 hover:text-white"
              title="Zoom In"
            >
              🔍+
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => rotate(true)}
              className="p-1 text-gray-300 hover:text-white"
              title="Rotate Clockwise"
            >
              🔄
            </button>
            <button
              onClick={closePDF}
              className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return <div className={`pdf-viewer ${className}`}>{renderContent()}</div>;
};

export default PDFViewer;
