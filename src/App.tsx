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
import { IntegrationMessageType } from "./types/integration.types";
import { usePDFStore } from "./stores/pdf.store";

type SidebarPanel = "files" | "annotations" | "settings";

const SIDEBAR_OPEN_KEY = "layout.sidebarOpen";
const ACTIVE_PANEL_KEY = "layout.activePanel";

const getStoredSidebarOpen = (): boolean => {
  const value = localStorage.getItem(SIDEBAR_OPEN_KEY);
  if (value === null) {
    return true;
  }
  return value === "true";
};

const getStoredPanel = (): SidebarPanel => {
  const value = localStorage.getItem(ACTIVE_PANEL_KEY);
  if (value === "files" || value === "annotations" || value === "settings") {
    return value;
  }
  return "files";
};

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  return value as Record<string, unknown>;
};

const readNumber = (
  payload: Record<string, unknown> | null,
  keys: string[]
): number | null => {
  if (!payload) {
    return null;
  }
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
};

const readBoolean = (
  payload: Record<string, unknown> | null,
  keys: string[]
): boolean | null => {
  if (!payload) {
    return null;
  }
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "boolean") {
      return value;
    }
  }
  return null;
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(getStoredSidebarOpen);
  const [activePanel, setActivePanel] = useState<SidebarPanel>(getStoredPanel);
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
  const integrationEvents = useIntegrationStore((state) => state.events);
  const markEventHandled = useIntegrationStore(
    (state) => state.markEventHandled
  );
  const { connectWebSocket, disconnectWebSocket } = useIntegrationStore();
  const { setCurrentPage, setZoom } = usePDFStore();

  // Auto-connect WebSocket on mount
  useEffect(() => {
    connectWebSocket();
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_OPEN_KEY, String(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_PANEL_KEY, activePanel);
  }, [activePanel]);

  useEffect(() => {
    for (const event of integrationEvents) {
      if (event.handled) {
        continue;
      }

      const payload = toRecord(event.data);

      if (event.type === IntegrationMessageType.PAGE_CHANGED) {
        const page = readNumber(payload, ["page"]);
        if (page !== null && page >= 1) {
          setCurrentPage(Math.floor(page));
        }
      }

      if (event.type === IntegrationMessageType.CONNECTION_STATUS) {
        const page = readNumber(payload, ["page"]);
        if (page !== null && page >= 1) {
          setCurrentPage(Math.floor(page));
        }

        const zoom = readNumber(payload, ["zoom"]);
        if (zoom !== null && zoom > 0) {
          setZoom(zoom);
        }
      }

      if (
        event.type === IntegrationMessageType.PRESENTER_MODE_TOGGLED ||
        event.type === IntegrationMessageType.CONNECTION_STATUS
      ) {
        const presenterActive = readBoolean(payload, [
          "active",
          "presenter_active",
        ]);
        if (presenterActive !== null) {
          setPresenterMode(presenterActive);
        }
      }

      markEventHandled(event.id);
    }
  }, [
    integrationEvents,
    markEventHandled,
    setCurrentPage,
    setPresenterMode,
    setZoom,
  ]);

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
