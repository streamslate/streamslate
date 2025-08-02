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
 * Page navigation controls for PDF viewer
 */

import React, { useState, useCallback } from "react";

interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  canPrevious: boolean;
  canNext: boolean;
  className?: string;
}

export const PageNavigation: React.FC<PageNavigationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  onPreviousPage,
  onNextPage,
  canPrevious,
  canNext,
  className = "",
}) => {
  const [inputValue, setInputValue] = useState(currentPage.toString());
  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleInputSubmit = useCallback(() => {
    const pageNumber = parseInt(inputValue, 10);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
    }
    setInputValue(currentPage.toString());
    setIsEditing(false);
  }, [inputValue, totalPages, onPageChange, currentPage]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleInputSubmit();
      } else if (e.key === "Escape") {
        setInputValue(currentPage.toString());
        setIsEditing(false);
      }
    },
    [handleInputSubmit, currentPage]
  );

  const handleInputFocus = useCallback(() => {
    setIsEditing(true);
    setInputValue(currentPage.toString());
  }, [currentPage]);

  const handleInputBlur = useCallback(() => {
    handleInputSubmit();
  }, [handleInputSubmit]);

  // Update input value when current page changes externally
  React.useEffect(() => {
    if (!isEditing) {
      setInputValue(currentPage.toString());
    }
  }, [currentPage, isEditing]);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Previous Page Button */}
      <button
        onClick={onPreviousPage}
        disabled={!canPrevious}
        className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded transition-colors"
        title="Previous Page (Left Arrow)"
        aria-label="Previous page"
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Page Input */}
      <div className="flex items-center space-x-1 text-sm">
        <span className="text-gray-400">Page</span>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="w-12 px-1 py-0.5 text-center bg-gray-700 border border-gray-600 rounded text-gray-200 focus:outline-none focus:border-blue-500 focus:bg-gray-600"
          min="1"
          max={totalPages}
        />
        <span className="text-gray-400">of {totalPages}</span>
      </div>

      {/* Next Page Button */}
      <button
        onClick={onNextPage}
        disabled={!canNext}
        className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded transition-colors"
        title="Next Page (Right Arrow)"
        aria-label="Next page"
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
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Quick Navigation Buttons */}
      <div className="flex items-center space-x-1 ml-2 border-l border-gray-600 pl-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded transition-colors"
          title="First Page"
        >
          First
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded transition-colors"
          title="Last Page"
        >
          Last
        </button>
      </div>
    </div>
  );
};

export default PageNavigation;
