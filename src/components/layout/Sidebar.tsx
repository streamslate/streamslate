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

type Panel = "files" | "annotations" | "settings";

interface SidebarProps {
  transparentBg: boolean;
  sidebarOpen: boolean;
  presenterMode: boolean;
  activePanel: Panel;
  isLoaded: boolean;
  darkMode: boolean;
  onSetActivePanel: (panel: Panel) => void;
  onOpenPDF: () => void;
  onSetDarkMode: (value: boolean) => void;
  onSetTransparentBg: (value: boolean) => void;
  onSetBorderlessMode: (value: boolean) => void;
  borderlessMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  transparentBg,
  sidebarOpen,
  presenterMode,
  activePanel,
  isLoaded,
  darkMode,
  onSetActivePanel,
  onOpenPDF,
  onSetDarkMode,
  onSetTransparentBg,
  onSetBorderlessMode,
  borderlessMode,
}) => {
  return (
    <aside
      className={`${
        transparentBg
          ? "bg-[rgb(var(--color-surface-primary))]/90 backdrop-blur-md"
          : "bg-[rgb(var(--color-surface-primary))]"
      } border-r border-[rgb(var(--color-border-primary))] transition-all duration-300 flex-shrink-0 ${
        sidebarOpen && !presenterMode ? "w-72" : "w-0"
      } overflow-hidden`}
    >
      <div className="h-full flex flex-col overflow-hidden">
        {/* Panel Tabs */}
        <div className="flex border-b border-[rgb(var(--color-border-primary))] p-2 gap-2">
          <button
            onClick={() => onSetActivePanel("files")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
              activePanel === "files"
                ? "bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] border border-[rgb(var(--color-primary))]/20"
                : "text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))] hover:bg-[rgb(var(--color-bg-tertiary))]"
            }`}
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Files</span>
          </button>
          <button
            onClick={() => onSetActivePanel("annotations")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
              activePanel === "annotations"
                ? "bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] border border-[rgb(var(--color-primary))]/20"
                : "text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))] hover:bg-[rgb(var(--color-bg-tertiary))]"
            }`}
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
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
              />
            </svg>
            <span>Annotations</span>
          </button>
          <button
            onClick={() => onSetActivePanel("settings")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
              activePanel === "settings"
                ? "bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] border border-[rgb(var(--color-primary))]/20"
                : "text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))] hover:bg-[rgb(var(--color-bg-tertiary))]"
            }`}
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>Settings</span>
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 p-6 overflow-y-auto animate-fade-in">
          {activePanel === "files" && (
            <div className="space-y-4">
              <div className="bg-[rgb(var(--color-surface-secondary))] p-6 rounded-lg border border-[rgb(var(--color-border-primary))] animate-slide-up">
                <div className="flex items-center gap-3 mb-4">
                  <svg
                    className="w-6 h-6 text-[rgb(var(--color-primary))]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-[rgb(var(--color-text-primary))]">
                    PDF Files
                  </h3>
                </div>

                {/* Open PDF Button */}
                <div className="mb-4">
                  <button onClick={onOpenPDF} className="btn-dashed">
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
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="font-medium">Open PDF File</span>
                  </button>
                </div>

                <div className="p-4 bg-[rgb(var(--color-bg-tertiary))] rounded-md border border-[rgb(var(--color-border-primary))]">
                  <p className="text-sm text-[rgb(var(--color-text-tertiary))] text-center">
                    {isLoaded ? "PDF loaded successfully" : "No PDF loaded"}
                  </p>
                </div>
              </div>
            </div>
          )}
          {activePanel === "annotations" && (
            <div className="space-y-4">
              <div className="bg-[rgb(var(--color-surface-secondary))] p-6 rounded-lg border border-[rgb(var(--color-border-primary))] animate-slide-up">
                <div className="flex items-center gap-3 mb-4">
                  <svg
                    className="w-6 h-6 text-[rgb(var(--color-primary))]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-[rgb(var(--color-text-primary))]">
                    Annotations List
                  </h3>
                </div>
                <div className="p-4 bg-[rgb(var(--color-bg-tertiary))] rounded-md border border-[rgb(var(--color-border-primary))]">
                  <p className="text-sm text-[rgb(var(--color-text-tertiary))] text-center">
                    No annotations yet
                  </p>
                </div>
              </div>
            </div>
          )}
          {activePanel === "settings" && (
            <div className="space-y-4">
              <div className="bg-[rgb(var(--color-surface-secondary))] p-6 rounded-lg border border-[rgb(var(--color-border-primary))] animate-slide-up">
                <div className="flex items-center gap-3 mb-6">
                  <svg
                    className="w-6 h-6 text-[rgb(var(--color-primary))]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-[rgb(var(--color-text-primary))]">
                    Settings
                  </h3>
                </div>
                <div className="space-y-4">
                  <label className="flex items-center p-3 bg-[rgb(var(--color-bg-tertiary))] rounded-lg border border-[rgb(var(--color-border-primary))] hover:bg-[rgb(var(--color-surface-tertiary))] transition-all cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-[rgb(var(--color-primary))] bg-[rgb(var(--color-surface-primary))] border-[rgb(var(--color-border-secondary))] rounded focus:ring-[rgb(var(--color-primary))] focus:ring-2 mr-3"
                      checked={darkMode}
                      onChange={(e) => onSetDarkMode(e.target.checked)}
                    />
                    <span className="text-sm font-medium text-[rgb(var(--color-text-primary))]">
                      Dark Theme
                    </span>
                  </label>
                  <label className="flex items-center p-3 bg-[rgb(var(--color-bg-tertiary))] rounded-lg border border-[rgb(var(--color-border-primary))] hover:bg-[rgb(var(--color-surface-tertiary))] transition-all cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-[rgb(var(--color-primary))] bg-[rgb(var(--color-surface-primary))] border-[rgb(var(--color-border-secondary))] rounded focus:ring-[rgb(var(--color-primary))] focus:ring-2 mr-3"
                      defaultChecked
                    />
                    <span className="text-sm font-medium text-[rgb(var(--color-text-primary))]">
                      Auto-save
                    </span>
                  </label>
                  <label className="flex items-center p-3 bg-[rgb(var(--color-bg-tertiary))] rounded-lg border border-[rgb(var(--color-border-primary))] hover:bg-[rgb(var(--color-surface-tertiary))] transition-all cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-[rgb(var(--color-primary))] bg-[rgb(var(--color-surface-primary))] border-[rgb(var(--color-border-secondary))] rounded focus:ring-[rgb(var(--color-primary))] focus:ring-2 mr-3"
                      checked={transparentBg}
                      onChange={(e) => onSetTransparentBg(e.target.checked)}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-[rgb(var(--color-text-primary))]">
                        Transparent Background
                      </span>
                      <p className="text-xs text-[rgb(var(--color-text-tertiary))] mt-1">
                        Enable window capture in OBS with transparency support
                      </p>
                    </div>
                  </label>
                  {transparentBg && (
                    <div className="ml-4 p-3 bg-[rgb(var(--color-primary))]/10 border border-[rgb(var(--color-primary))]/30 rounded-lg animate-slide-up">
                      <p className="text-sm text-[rgb(var(--color-primary))]">
                        ✨ Transparent mode is active! Perfect for stream
                        overlays.
                      </p>
                    </div>
                  )}
                  <label className="flex items-center p-3 bg-[rgb(var(--color-bg-tertiary))] rounded-lg border border-[rgb(var(--color-border-primary))] hover:bg-[rgb(var(--color-surface-tertiary))] transition-all cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-[rgb(var(--color-primary))] bg-[rgb(var(--color-surface-primary))] border-[rgb(var(--color-border-secondary))] rounded focus:ring-[rgb(var(--color-primary))] focus:ring-2 mr-3"
                      checked={borderlessMode}
                      onChange={(e) => onSetBorderlessMode(e.target.checked)}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-[rgb(var(--color-text-primary))]">
                        Borderless Window
                      </span>
                      <p className="text-xs text-[rgb(var(--color-text-tertiary))] mt-1">
                        Clean window mode for streaming
                      </p>
                    </div>
                  </label>
                  {borderlessMode && (
                    <div className="ml-4 p-3 bg-[rgb(var(--color-primary))]/10 border border-[rgb(var(--color-primary))]/30 rounded-lg animate-slide-up">
                      <p className="text-sm text-[rgb(var(--color-primary))]">
                        🖼️ Borderless mode enabled! Minimal UI for streaming.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
