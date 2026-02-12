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
      className="absolute bottom-6 right-6 z-20 flex items-center space-x-3 rounded-xl border border-border-primary bg-surface-primary/90 px-5 py-3 text-text-primary shadow-lg backdrop-blur-sm opacity-30 transition-all hover:opacity-100 hover:bg-surface-secondary/90"
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
