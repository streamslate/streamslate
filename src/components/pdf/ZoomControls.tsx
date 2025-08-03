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
 * Zoom controls for PDF viewer
 */

import React, { useState, useCallback } from "react";
import { FitMode } from "../../types/pdf.types";

interface ZoomControlsProps {
  zoom: number;
  fitMode: FitMode;
  onZoomChange: (zoom: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitModeChange: (fitMode: FitMode) => void;
  className?: string;
}

const PRESET_ZOOMS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0];

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  fitMode,
  onZoomChange,
  onZoomIn,
  onZoomOut,
  onFitModeChange,
  className = "",
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleZoomSelect = useCallback(
    (selectedZoom: number) => {
      onZoomChange(selectedZoom);
      onFitModeChange(FitMode.CUSTOM);
      setIsDropdownOpen(false);
    },
    [onZoomChange, onFitModeChange]
  );

  const handleFitModeSelect = useCallback(
    (selectedFitMode: FitMode) => {
      onFitModeChange(selectedFitMode);
      setIsDropdownOpen(false);
    },
    [onFitModeChange]
  );

  const formatZoomPercentage = (zoomValue: number) => {
    return `${Math.round(zoomValue * 100)}%`;
  };

  const getFitModeLabel = (mode: FitMode) => {
    switch (mode) {
      case FitMode.FIT_WIDTH:
        return "Fit Width";
      case FitMode.FIT_HEIGHT:
        return "Fit Height";
      case FitMode.FIT_PAGE:
        return "Fit Page";
      case FitMode.ACTUAL_SIZE:
        return "Actual Size";
      case FitMode.CUSTOM:
        return formatZoomPercentage(zoom);
      default:
        return formatZoomPercentage(zoom);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Zoom Out Button */}
      <button
        onClick={onZoomOut}
        disabled={zoom <= 0.1}
        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded transition-colors"
        title="Zoom Out (Ctrl + -)"
        aria-label="Zoom out"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
          />
        </svg>
      </button>

      {/* Zoom Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="min-w-20 px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
        >
          {getFitModeLabel(fitMode)}
        </button>

        {isDropdownOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />

            {/* Dropdown Menu */}
            <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-lg z-20">
              {/* Fit Mode Options */}
              <div className="border-b border-gray-200 dark:border-gray-600">
                <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Fit Mode
                </div>
                {Object.values(FitMode)
                  .filter((mode) => mode !== FitMode.CUSTOM)
                  .map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleFitModeSelect(mode)}
                      className={`w-full px-3 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        fitMode === mode
                          ? "bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {getFitModeLabel(mode)}
                    </button>
                  ))}
              </div>

              {/* Preset Zoom Levels */}
              <div>
                <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Zoom Level
                </div>
                {PRESET_ZOOMS.map((presetZoom) => (
                  <button
                    key={presetZoom}
                    onClick={() => handleZoomSelect(presetZoom)}
                    className={`w-full px-3 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      Math.abs(zoom - presetZoom) < 0.01 &&
                      fitMode === FitMode.CUSTOM
                        ? "bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {formatZoomPercentage(presetZoom)}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Zoom In Button */}
      <button
        onClick={onZoomIn}
        disabled={zoom >= 5.0}
        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded transition-colors"
        title="Zoom In (Ctrl + +)"
        aria-label="Zoom in"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
          />
        </svg>
      </button>

      {/* Reset to 100% Button */}
      <button
        onClick={() => handleZoomSelect(1.0)}
        className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        title="Reset to 100%"
      >
        100%
      </button>
    </div>
  );
};

export default ZoomControls;
