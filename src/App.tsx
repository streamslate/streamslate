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
          className={`flex items-center justify-between ${transparentBg ? "bg-gray-800/90 backdrop-blur-sm" : "bg-gray-800"} px-2 py-1`}
        >
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600 cursor-pointer"
              title="Close"
              onClick={() => window.close()}
            ></div>
            <div
              className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-600 cursor-pointer"
              title="Minimize"
            ></div>
            <div
              className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-600 cursor-pointer"
              title="Maximize"
            ></div>
          </div>
          <div className="flex-1 text-center text-xs text-gray-400 -ml-16">
            StreamSlate
          </div>
        </div>
      )}

      {/* Header */}
      <header
        className={`${transparentBg ? "bg-gray-800/90 backdrop-blur-sm" : "bg-gray-800"} border-b border-gray-700 px-4 py-2 flex-shrink-0 ${presenterMode || borderlessMode ? "hidden" : ""}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
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
            <h1 className="text-xl font-bold text-white">StreamSlate</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setPresenterMode(!presenterMode)}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                presenterMode
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
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
            <span className="text-sm text-gray-400">
              PDF Annotation Tool for Streamers
            </span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${transparentBg ? "bg-gray-800/90 backdrop-blur-sm" : "bg-gray-800"} border-r border-gray-700 transition-all duration-300 flex-shrink-0 ${
            sidebarOpen && !presenterMode ? "w-64" : "w-0"
          } overflow-hidden`}
        >
          <div className="h-full flex flex-col">
            {/* Panel Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setActivePanel("files")}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  activePanel === "files"
                    ? "text-white bg-gray-700 border-b-2 border-blue-500"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                Files
              </button>
              <button
                onClick={() => setActivePanel("annotations")}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  activePanel === "annotations"
                    ? "text-white bg-gray-700 border-b-2 border-blue-500"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                Annotations
              </button>
              <button
                onClick={() => setActivePanel("settings")}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  activePanel === "settings"
                    ? "text-white bg-gray-700 border-b-2 border-blue-500"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                Settings
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              {activePanel === "files" && (
                <div className="text-gray-300">
                  <h3 className="text-sm font-semibold mb-3">Recent Files</h3>
                  <p className="text-xs text-gray-500">No recent files</p>
                </div>
              )}
              {activePanel === "annotations" && (
                <div className="text-gray-300">
                  <h3 className="text-sm font-semibold mb-3">
                    Annotations List
                  </h3>
                  <p className="text-xs text-gray-500">No annotations yet</p>
                </div>
              )}
              {activePanel === "settings" && (
                <div className="text-gray-300">
                  <h3 className="text-sm font-semibold mb-3">Settings</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between text-sm">
                      <span>Dark Theme</span>
                      <input
                        type="checkbox"
                        className="rounded"
                        defaultChecked
                      />
                    </label>
                    <label className="flex items-center justify-between text-sm">
                      <span>Auto-save</span>
                      <input
                        type="checkbox"
                        className="rounded"
                        defaultChecked
                      />
                    </label>
                    <label className="flex items-center justify-between text-sm">
                      <span>Transparent Background</span>
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={transparentBg}
                        onChange={(e) => setTransparentBg(e.target.checked)}
                      />
                    </label>
                    {transparentBg && (
                      <p className="text-xs text-yellow-400 mt-1">
                        Enable window capture in OBS with transparency support
                      </p>
                    )}
                    <label className="flex items-center justify-between text-sm">
                      <span>Borderless Window</span>
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={borderlessMode}
                        onChange={(e) => setBorderlessMode(e.target.checked)}
                      />
                    </label>
                    {borderlessMode && (
                      <p className="text-xs text-yellow-400 mt-1">
                        Clean window mode for streaming
                      </p>
                    )}
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
            className={`${transparentBg ? "bg-gray-800/90 backdrop-blur-sm" : "bg-gray-800"} border-t border-gray-700 px-4 py-1 flex items-center justify-between text-xs text-gray-400 ${presenterMode || borderlessMode ? "hidden" : ""}`}
          >
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
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
              <span>Ready</span>
            </div>
            <div className="flex items-center space-x-4">
              {presenterMode && (
                <span className="flex items-center space-x-1 text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Presenter Mode Active</span>
                </span>
              )}
              <span>StreamSlate v0.0.1</span>
            </div>
          </div>

          {/* Floating Presenter Mode Exit Button */}
          {presenterMode && (
            <button
              onClick={() => setPresenterMode(false)}
              className="absolute bottom-4 right-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg shadow-lg flex items-center space-x-2 transition-all opacity-30 hover:opacity-100"
              title="Exit Presenter Mode (ESC)"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span>Exit Presenter Mode</span>
            </button>
          )}

          {/* Floating Toolbar for Borderless Mode */}
          {borderlessMode && !presenterMode && (
            <div className="absolute top-2 right-2 flex items-center space-x-2 bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-1.5 opacity-20 hover:opacity-100 transition-opacity">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Toggle Sidebar"
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <div className="w-px h-4 bg-gray-600"></div>
              <button
                onClick={() => setPresenterMode(true)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Presenter Mode"
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
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
              <div className="w-px h-4 bg-gray-600"></div>
              <button
                onClick={() => setBorderlessMode(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Exit Borderless"
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
