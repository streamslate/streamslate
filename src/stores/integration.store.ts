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
 * Integration state management for streaming tools (OBS, Stream Deck, NDI, etc.)
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { NDIQuality, IntegrationSource } from "../types/integration.types";
import type {
  WebSocketState,
  OBSIntegration,
  StreamDeckIntegration,
  NDIIntegration,
  IntegrationConfig,
  IntegrationError,
  IntegrationEvent,
} from "../types/integration.types";

interface IntegrationStore {
  // State
  websocket: WebSocketState;
  obs: OBSIntegration;
  streamDeck: StreamDeckIntegration;
  ndi: NDIIntegration;
  config: IntegrationConfig;
  errors: IntegrationError[];
  events: IntegrationEvent[];

  // Actions
  setWebSocketState: (state: Partial<WebSocketState>) => void;
  setOBSState: (state: Partial<OBSIntegration>) => void;
  setStreamDeckState: (state: Partial<StreamDeckIntegration>) => void;
  setNDIState: (state: Partial<NDIIntegration>) => void;
  updateConfig: (config: Partial<IntegrationConfig>) => void;

  // Error handling
  addError: (error: IntegrationError) => void;
  clearErrors: () => void;
  removeError: (id: string) => void;

  // Event handling
  addEvent: (event: IntegrationEvent) => void;
  markEventHandled: (id: string) => void;
  clearEvents: () => void;
  getUnhandledEvents: () => IntegrationEvent[];

  // Connection management
  connectWebSocket: () => Promise<void>;
  disconnectWebSocket: () => void;
  connectOBS: () => Promise<void>;
  disconnectOBS: () => void;

  // Utility
  reset: () => void;
  isAnyIntegrationConnected: () => boolean;
}

const initialWebSocketState: WebSocketState = {
  connected: false,
  port: 11451,
  lastError: null,
  connectionTime: null,
};

const initialOBSState: OBSIntegration = {
  connected: false,
  version: null,
  scenes: [],
  currentScene: null,
  isRecording: false,
  isStreaming: false,
  stats: null,
};

const initialStreamDeckState: StreamDeckIntegration = {
  connected: false,
  deviceInfo: null,
  buttons: [],
};

const initialNDIState: NDIIntegration = {
  enabled: false,
  sources: [],
  outputEnabled: false,
  outputName: "StreamSlate",
};

const initialConfig: IntegrationConfig = {
  obs: {
    enabled: false,
    host: "localhost",
    port: 4455,
    password: "",
    autoConnect: false,
  },
  streamDeck: {
    enabled: false,
    autoConnect: false,
    buttonLayout: [],
  },
  ndi: {
    enabled: false,
    outputName: "StreamSlate",
    quality: NDIQuality.HIGH,
    framerate: 30,
  },
  websocket: {
    enabled: true,
    port: 11451,
    allowExternalConnections: false,
    apiKey: "",
  },
};

export const useIntegrationStore = create<IntegrationStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      websocket: initialWebSocketState,
      obs: initialOBSState,
      streamDeck: initialStreamDeckState,
      ndi: initialNDIState,
      config: initialConfig,
      errors: [],
      events: [],

      // State setters
      setWebSocketState: (state) =>
        set((current) => ({
          websocket: { ...current.websocket, ...state },
        })),

      setOBSState: (state) =>
        set((current) => ({
          obs: { ...current.obs, ...state },
        })),

      setStreamDeckState: (state) =>
        set((current) => ({
          streamDeck: { ...current.streamDeck, ...state },
        })),

      setNDIState: (state) =>
        set((current) => ({
          ndi: { ...current.ndi, ...state },
        })),

      updateConfig: (config) =>
        set((current) => ({
          config: {
            ...current.config,
            ...config,
            obs: { ...current.config.obs, ...config.obs },
            streamDeck: { ...current.config.streamDeck, ...config.streamDeck },
            ndi: { ...current.config.ndi, ...config.ndi },
            websocket: { ...current.config.websocket, ...config.websocket },
          },
        })),

      // Error handling
      addError: (error) =>
        set((state) => ({
          errors: [...state.errors, error],
        })),

      clearErrors: () => set({ errors: [] }),

      removeError: (id) =>
        set((state) => ({
          errors: state.errors.filter((error) => error.code !== id),
        })),

      // Event handling
      addEvent: (event) =>
        set((state) => ({
          events: [...state.events.slice(-99), event], // Keep last 100 events
        })),

      markEventHandled: (id) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, handled: true } : event
          ),
        })),

      clearEvents: () => set({ events: [] }),

      getUnhandledEvents: () => {
        return get().events.filter((event) => !event.handled);
      },

      // Connection management
      connectWebSocket: async () => {
        try {
          set((state) => ({
            websocket: {
              ...state.websocket,
              connected: false,
              lastError: null,
            },
          }));

          // WebSocket connection logic would be implemented here
          // For now, just simulate connection
          await new Promise((resolve) => setTimeout(resolve, 1000));

          set((state) => ({
            websocket: {
              ...state.websocket,
              connected: true,
              connectionTime: new Date(),
            },
          }));
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          set((state) => ({
            websocket: {
              ...state.websocket,
              connected: false,
              lastError: errorMessage,
            },
          }));
        }
      },

      disconnectWebSocket: () => {
        set((state) => ({
          websocket: {
            ...state.websocket,
            connected: false,
            connectionTime: null,
          },
        }));
      },

      connectOBS: async () => {
        try {
          set((state) => ({
            obs: { ...state.obs, connected: false },
          }));

          // OBS connection logic would be implemented here
          // For now, just simulate connection
          await new Promise((resolve) => setTimeout(resolve, 1500));

          set((state) => ({
            obs: {
              ...state.obs,
              connected: true,
              version: "30.0.0", // Simulated version
            },
          }));
        } catch (error) {
          // Handle OBS connection error
          const integrationError: IntegrationError = {
            code: "OBS_CONNECTION_FAILED",
            message:
              error instanceof Error
                ? error.message
                : "Failed to connect to OBS",
            source: IntegrationSource.OBS,
            timestamp: new Date(),
            details: error,
          };
          get().addError(integrationError);
        }
      },

      disconnectOBS: () => {
        set((state) => ({
          obs: {
            ...state.obs,
            connected: false,
            version: null,
            scenes: [],
            currentScene: null,
            isRecording: false,
            isStreaming: false,
            stats: null,
          },
        }));
      },

      // Utility
      reset: () =>
        set({
          websocket: initialWebSocketState,
          obs: initialOBSState,
          streamDeck: initialStreamDeckState,
          ndi: initialNDIState,
          config: initialConfig,
          errors: [],
          events: [],
        }),

      isAnyIntegrationConnected: () => {
        const state = get();
        return (
          state.websocket.connected ||
          state.obs.connected ||
          state.streamDeck.connected
        );
      },
    }),
    {
      name: "integration-store",
    }
  )
);
