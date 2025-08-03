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

interface HeaderProps {
  transparentBg: boolean;
  presenterMode: boolean;
  borderlessMode: boolean;
  sidebarOpen: boolean;
  isLoaded: boolean;
  darkMode: boolean;
  websocketState: { connected: boolean };
  onToggleSidebar: () => void;
  onOpenPDF: () => void;
  onToggleDarkMode: () => void;
  onTogglePresenterMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  transparentBg,
  presenterMode,
  borderlessMode,
  isLoaded,
  darkMode,
  websocketState,
  onToggleSidebar,
  onOpenPDF,
  onToggleDarkMode,
  onTogglePresenterMode,
}) => {
  return (
    <header
      className={`${
        transparentBg
          ? "bg-surface-primary/90 backdrop-blur-md"
          : "bg-surface-primary"
      } border-b border-border-primary px-6 py-3 flex-shrink-0 ${
        presenterMode || borderlessMode ? "hidden" : ""
      } animate-fade-in`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="btn btn-ghost"
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
          <h1 className="text-2xl font-bold text-primary">
            StreamSlate
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          {!isLoaded && (
            <button onClick={onOpenPDF} className="btn btn-primary">
              <div className="flex items-center space-x-2">
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
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <span>Open PDF</span>
              </div>
            </button>
          )}
          <button
            onClick={onToggleDarkMode}
            className="btn btn-ghost"
            title={darkMode ? "Light Mode" : "Dark Mode"}
          >
            {darkMode ? (
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
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
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
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
          <button
            onClick={onTogglePresenterMode}
            className={`btn ${presenterMode ? "btn-primary" : "btn-secondary"}`}
            title={
              presenterMode ? "Exit Presenter Mode" : "Enter Presenter Mode"
            }
          >
            <div className="flex items-center space-x-2">
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
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span>{presenterMode ? "Exit" : "Presenter"}</span>
            </div>
          </button>
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-bg-tertiary rounded-lg border border-border-secondary">
            <div
              className={`w-2 h-2 rounded-full ${
                websocketState.connected
                  ? "bg-green-500"
                  : "bg-red-500 animate-pulse"
              }`}
            ></div>
            <span className="text-sm text-text-secondary">
              {websocketState.connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
