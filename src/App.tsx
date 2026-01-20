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

import { useState, useEffect } from "react";
import { PDFViewer } from "./components/pdf/PDFViewer";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { BorderlessWindowControls } from "./components/layout/BorderlessWindowControls";
import { PresenterUI } from "./components/layout/PresenterUI";
import { BorderlessUI } from "./components/layout/BorderlessUI";
import { useIntegrationStore } from "./stores/integration.store";
import { usePDF } from "./hooks/usePDF";
import { useRemoteControl } from "./hooks/useRemoteControl";
import { useTheme } from "./hooks/useTheme";
import { useViewModes } from "./hooks/useViewModes";
import { StatusBar } from "./components/layout/StatusBar";
import { UpdateBanner } from "./components/layout/UpdateBanner";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<
    "files" | "annotations" | "settings"
  >("files");
  const { darkMode, setDarkMode, toggleDarkMode } = useTheme();
  const {
    presenterMode,
    setPresenterMode,
    transparentBg,
    setTransparentBg,
    borderlessMode,
    setBorderlessMode,
  } = useViewModes();

  // Get PDF state and functions
  const { openPDF, isLoaded } = usePDF();

  // Enable remote control (Stream Deck / WebSocket)
  useRemoteControl(setPresenterMode);

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

  return (
    <div
      className={`h-screen w-screen overflow-hidden flex flex-col ${
        transparentBg ? "bg-transparent" : "bg-bg-primary"
      }`}
    >
      <UpdateBanner />
      {borderlessMode && !presenterMode && (
        <BorderlessWindowControls transparentBg={transparentBg} />
      )}

      <Header
        transparentBg={transparentBg}
        presenterMode={presenterMode}
        borderlessMode={borderlessMode}
        sidebarOpen={sidebarOpen}
        isLoaded={isLoaded}
        darkMode={darkMode}
        websocketState={websocketState}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenPDF={openPDF}
        onToggleDarkMode={toggleDarkMode}
        onTogglePresenterMode={() => setPresenterMode(!presenterMode)}
      />

      {/* Main Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar
          transparentBg={transparentBg}
          sidebarOpen={sidebarOpen}
          presenterMode={presenterMode}
          activePanel={activePanel}
          isLoaded={isLoaded}
          darkMode={darkMode}
          onSetActivePanel={setActivePanel}
          onOpenPDF={openPDF}
          onSetDarkMode={setDarkMode}
          onSetTransparentBg={setTransparentBg}
          onSetBorderlessMode={setBorderlessMode}
          borderlessMode={borderlessMode}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 relative">
          <PDFViewer className="flex-1" transparentBg={transparentBg} />

          <StatusBar
            transparentBg={transparentBg}
            presenterMode={presenterMode}
            borderlessMode={borderlessMode}
            websocketState={websocketState}
          />

          {presenterMode && (
            <PresenterUI onExit={() => setPresenterMode(false)} />
          )}
          {borderlessMode && !presenterMode && (
            <BorderlessUI
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              onEnterPresenterMode={() => setPresenterMode(true)}
              onExitBorderlessMode={() => setBorderlessMode(false)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
