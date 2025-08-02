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

import React, { useState, useEffect } from "react";
import { PDFViewer } from "./components/pdf/PDFViewer";
import { useIntegrationStore } from "./stores/integration.store";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<
    "files" | "annotations" | "settings"
  >("files");
  const [presenterMode, setPresenterMode] = useState(false);
  const [transparentBg, setTransparentBg] = useState(false);
  const [borderlessMode, setBorderlessMode] = useState(false);

  // Get WebSocket state from integration store
  const websocketState = useIntegrationStore((state) => state.websocket);
  const { connectWebSocket, disconnectWebSocket } = useIntegrationStore();

  // Auto-connect WebSocket on mount
  useEffect(() => {
    connectWebSocket();
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  // Handle ESC key to exit presenter mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && presenterMode) {
        setPresenterMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [presenterMode]);

  return (
    <div
      className={`h-screen flex flex-col ${transparentBg ? "bg-transparent" : "bg-gray-900"}`}
    >
      {/* Window Controls for Borderless Mode */}
      {borderlessMode && !presenterMode && (
        <div
          className={`flex items-center justify-between ${transparentBg ? "bg-gray-800/90 backdrop-blur-sm" : "bg-gray-800"} px-3 py-2 animate-fade-in`}
        >
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600 cursor-pointer transition-colors"
              title="Close"
              onClick={() => window.close()}
            ></div>
            <div
              className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-600 cursor-pointer transition-colors"
              title="Minimize"
            ></div>
            <div
              className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-600 cursor-pointer transition-colors"
              title="Maximize"
            ></div>
          </div>
          <div className="flex-1 text-center text-sm font-medium bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent -ml-16">
            StreamSlate
          </div>
        </div>
      )}

      {/* Header */}
      <header
        className={`${transparentBg ? "bg-gray-800/90 backdrop-blur-md" : "bg-gray-800/95 backdrop-blur-sm"} border-b border-gray-700/50 px-6 py-3 flex-shrink-0 ${presenterMode || borderlessMode ? "hidden" : ""} animate-fade-in`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 hover:scale-105"
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
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              StreamSlate
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setPresenterMode(!presenterMode)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                presenterMode
                  ? "bg-green-600 hover:bg-green-700 text-white hover:shadow-green-600/20"
                  : "bg-gray-700/70 hover:bg-gray-600 text-gray-300 hover:text-white"
              }`}
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
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-700/30 rounded-lg">
              <div
                className={`w-2 h-2 rounded-full ${websocketState.connected ? "bg-green-500" : "bg-red-500 animate-pulse"}`}
              ></div>
              <span className="text-sm text-gray-400">
                PDF Annotation Tool for Streamers
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${transparentBg ? "bg-gray-800/90 backdrop-blur-md" : "bg-gray-800/95 backdrop-blur-sm"} border-r border-gray-700/50 transition-all duration-300 flex-shrink-0 ${
            sidebarOpen && !presenterMode ? "w-72" : "w-0"
          } overflow-hidden`}
        >
          <div className="h-full flex flex-col">
            {/* Panel Tabs */}
            <div className="flex border-b border-gray-700/50 p-2 gap-2">
              <button
                onClick={() => setActivePanel("files")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activePanel === "files"
                    ? "text-blue-400 bg-blue-600/20 border border-blue-600/30 shadow-lg shadow-blue-600/10"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50 border border-transparent"
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
                onClick={() => setActivePanel("annotations")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activePanel === "annotations"
                    ? "text-purple-400 bg-purple-600/20 border border-purple-600/30 shadow-lg shadow-purple-600/10"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50 border border-transparent"
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
                onClick={() => setActivePanel("settings")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activePanel === "settings"
                    ? "text-blue-400 bg-blue-600/20 border border-blue-600/30 shadow-lg shadow-blue-600/10"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50 border border-transparent"
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
                <div className="text-gray-300">
                  <div className="bg-gray-700/30 rounded-xl border border-gray-600/30 p-6 animate-slide-up">
                    <div className="flex items-center gap-3 mb-4">
                      <svg
                        className="w-6 h-6 text-blue-400"
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
                      <h3 className="text-lg font-semibold">Recent Files</h3>
                    </div>
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600/20">
                      <p className="text-sm text-gray-500 text-center">
                        No recent files
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {activePanel === "annotations" && (
                <div className="text-gray-300">
                  <div className="bg-gray-700/30 rounded-xl border border-gray-600/30 p-6 animate-slide-up">
                    <div className="flex items-center gap-3 mb-4">
                      <svg
                        className="w-6 h-6 text-purple-400"
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
                      <h3 className="text-lg font-semibold">
                        Annotations List
                      </h3>
                    </div>
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600/20">
                      <p className="text-sm text-gray-500 text-center">
                        No annotations yet
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {activePanel === "settings" && (
                <div className="text-gray-300">
                  <div className="bg-gray-700/30 rounded-xl border border-gray-600/30 p-6 animate-slide-up">
                    <div className="flex items-center gap-3 mb-6">
                      <svg
                        className="w-6 h-6 text-blue-400"
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
                      <h3 className="text-lg font-semibold">Settings</h3>
                    </div>
                    <div className="space-y-4">
                      <label className="flex items-center p-3 bg-gray-700/40 rounded-lg border border-gray-600/30 hover:bg-gray-700/60 transition-all cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mr-3"
                          defaultChecked
                        />
                        <span className="text-sm font-medium group-hover:text-blue-400 transition-colors">
                          Dark Theme
                        </span>
                      </label>
                      <label className="flex items-center p-3 bg-gray-700/40 rounded-lg border border-gray-600/30 hover:bg-gray-700/60 transition-all cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mr-3"
                          defaultChecked
                        />
                        <span className="text-sm font-medium group-hover:text-blue-400 transition-colors">
                          Auto-save
                        </span>
                      </label>
                      <label className="flex items-center p-3 bg-gray-700/40 rounded-lg border border-gray-600/30 hover:bg-gray-700/60 transition-all cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mr-3"
                          checked={transparentBg}
                          onChange={(e) => setTransparentBg(e.target.checked)}
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium group-hover:text-blue-400 transition-colors">
                            Transparent Background
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            Enable window capture in OBS with transparency
                            support
                          </p>
                        </div>
                      </label>
                      {transparentBg && (
                        <div className="ml-4 p-3 bg-blue-600/10 border border-blue-600/30 rounded-lg animate-slide-up">
                          <p className="text-sm text-blue-400">
                            ✨ Transparent mode is active! Perfect for stream
                            overlays.
                          </p>
                        </div>
                      )}
                      <label className="flex items-center p-3 bg-gray-700/40 rounded-lg border border-gray-600/30 hover:bg-gray-700/60 transition-all cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mr-3"
                          checked={borderlessMode}
                          onChange={(e) => setBorderlessMode(e.target.checked)}
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium group-hover:text-blue-400 transition-colors">
                            Borderless Window
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            Clean window mode for streaming
                          </p>
                        </div>
                      </label>
                      {borderlessMode && (
                        <div className="ml-4 p-3 bg-purple-600/10 border border-purple-600/30 rounded-lg animate-slide-up">
                          <p className="text-sm text-purple-400">
                            🖼️ Borderless mode enabled! Minimal UI for
                            streaming.
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

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <PDFViewer className="flex-1" transparentBg={transparentBg} />

          {/* Status Bar */}
          <div
            className={`${transparentBg ? "bg-gray-800/90 backdrop-blur-sm" : "bg-gray-800/95"} border-t border-gray-700/50 px-6 py-2 flex items-center justify-between text-xs text-gray-400 ${presenterMode || borderlessMode ? "hidden" : ""}`}
          >
            <div className="flex items-center space-x-6">
              <span className="flex items-center space-x-2 px-3 py-1 bg-gray-700/30 rounded-full">
                <div
                  className={`w-2 h-2 rounded-full ${
                    websocketState.connected
                      ? "bg-green-500"
                      : "bg-red-500 animate-pulse"
                  }`}
                ></div>
                <span>
                  {websocketState.connected
                    ? "WebSocket Connected"
                    : "WebSocket Disconnected"}
                </span>
              </span>
              <span className="text-gray-500">Ready</span>
            </div>
            <div className="flex items-center space-x-6">
              {presenterMode && (
                <span className="flex items-center space-x-2 text-green-400 px-3 py-1 bg-green-600/10 border border-green-600/30 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Presenter Mode Active</span>
                </span>
              )}
              <span className="text-gray-500">StreamSlate v0.0.1</span>
            </div>
          </div>

          {/* Floating Presenter Mode Exit Button */}
          {presenterMode && (
            <button
              onClick={() => setPresenterMode(false)}
              className="absolute bottom-6 right-6 px-5 py-3 bg-gray-700/90 hover:bg-gray-600 backdrop-blur-sm text-white rounded-xl shadow-2xl flex items-center space-x-3 transition-all opacity-30 hover:opacity-100 hover:scale-105"
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
          )}

          {/* Floating Toolbar for Borderless Mode */}
          {borderlessMode && !presenterMode && (
            <div className="absolute top-4 right-4 flex items-center space-x-3 bg-gray-800/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-xl opacity-20 hover:opacity-100 transition-all duration-200">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
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
              <div className="w-px h-5 bg-gray-600/50"></div>
              <button
                onClick={() => setPresenterMode(true)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
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
              <div className="w-px h-5 bg-gray-600/50"></div>
              <button
                onClick={() => setBorderlessMode(false)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
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
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
