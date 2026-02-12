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

interface BorderlessUIProps {
  onToggleSidebar: () => void;
  onEnterPresenterMode: () => void;
  onExitBorderlessMode: () => void;
}

export const BorderlessUI: React.FC<BorderlessUIProps> = ({
  onToggleSidebar,
  onEnterPresenterMode,
  onExitBorderlessMode,
}) => {
  return (
    <div className="absolute top-4 right-4 z-20 flex items-center gap-3 rounded-xl border border-border-primary bg-surface-primary/90 px-4 py-2 text-text-primary shadow-lg backdrop-blur-sm opacity-25 transition-all duration-200 hover:opacity-100">
      <button
        onClick={onToggleSidebar}
        className="rounded-lg p-1.5 text-text-secondary transition-all hover:bg-bg-tertiary hover:text-text-primary"
        title="Toggle Sidebar"
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
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      <div className="h-5 w-px bg-border-secondary"></div>
      <button
        onClick={onEnterPresenterMode}
        className="rounded-lg p-1.5 text-text-secondary transition-all hover:bg-bg-tertiary hover:text-text-primary"
        title="Presenter Mode"
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
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </button>
      <div className="h-5 w-px bg-border-secondary"></div>
      <button
        onClick={onExitBorderlessMode}
        className="rounded-lg p-1.5 text-text-secondary transition-all hover:bg-bg-tertiary hover:text-text-primary"
        title="Exit Borderless"
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
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
      </button>
    </div>
  );
};
