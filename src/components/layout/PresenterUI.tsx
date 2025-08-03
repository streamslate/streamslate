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

import React from "react";

interface PresenterUIProps {
  onExit: () => void;
}

export const PresenterUI: React.FC<PresenterUIProps> = ({ onExit }) => {
  return (
    <button
      onClick={onExit}
      className="absolute bottom-6 right-6 px-5 py-3 bg-gray-100/90 dark:bg-gray-700/90 hover:bg-gray-200/90 dark:hover:bg-gray-600/90 backdrop-blur-sm text-gray-900 dark:text-gray-100 rounded-xl shadow-lg flex items-center space-x-3 transition-all opacity-30 hover:opacity-100"
      title="Exit Presenter Mode (ESC)"
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
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
      <span className="font-medium">Exit Presenter Mode</span>
    </button>
  );
};
