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
import {
  NDIQuality,
  IntegrationMessageType,
  IntegrationSource,
} from "../types/integration.types";
import {
  getWebSocketClient,
  resetWebSocketClient,
} from "../lib/websocket/client";
import { registerWebSocketHandlers } from "../lib/events/message-map";
import { OBSCommands } from "../lib/tauri/obs";
import type {
  WebSocketState,
  OBSIntegration,
  StreamDeckIntegration,
  NDIIntegration,
  SyphonIntegration,
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
  syphon: SyphonIntegration;
  config: IntegrationConfig;
  errors: IntegrationError[];
  events: IntegrationEvent[];

  // Actions
  setWebSocketState: (state: Partial<WebSocketState>) => void;
  setOBSState: (state: Partial<OBSIntegration>) => void;
  setStreamDeckState: (state: Partial<StreamDeckIntegration>) => void;
  setNDIState: (state: Partial<NDIIntegration>) => void;
  setSyphonState: (state: Partial<SyphonIntegration>) => void;
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
  disconnectOBS: () => Promise<void>;
  setOBSCurrentScene: (sceneName: string) => Promise<void>;
  setOBSSourceVisibility: (
    sceneName: string,
    sourceName: string,
    visible: boolean
  ) => Promise<void>;
  startOBSRecording: () => Promise<void>;
  stopOBSRecording: () => Promise<void>;
  startOBSStreaming: () => Promise<void>;
  stopOBSStreaming: () => Promise<void>;

  // Utility
  reset: () => void;
  isAnyIntegrationConnected: () => boolean;
}

const initialWebSocketState: WebSocketState = {
  connected: false,
  port: 11451,
  lastError: null,
  connectionTime: null,
  capabilities: null,
  capabilityNegotiated: false,
  legacyFallback: false,
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

const initialSyphonState: SyphonIntegration = {
  enabled: false,
  outputEnabled: false,
  outputName: "StreamSlate Syphon",
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
  syphon: {
    enabled: false,
    outputName: "StreamSlate Syphon",
  },
  websocket: {
    enabled: true,
    port: 11451,
    allowExternalConnections: false,
    apiKey: "",
  },
};

let websocketClient: ReturnType<typeof getWebSocketClient> | null = null;
let websocketStateHandler: ((state: WebSocketState) => void) | null = null;

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
}

function createOBSIntegrationError(
  code: "OBS_CONNECTION_FAILED" | "OBS_COMMAND_FAILED",
  error: unknown,
  fallback: string
): IntegrationError {
  return {
    code,
    message: getErrorMessage(error, fallback),
    source: IntegrationSource.OBS,
    timestamp: new Date(),
    details: error,
  };
}

function createOBSEvent(
  type: IntegrationMessageType,
  data: unknown
): IntegrationEvent {
  return {
    id: `obs-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    source: IntegrationSource.OBS,
    timestamp: new Date(),
    data,
    handled: false,
  };
}

export const useIntegrationStore = create<IntegrationStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      websocket: initialWebSocketState,
      obs: initialOBSState,
      streamDeck: initialStreamDeckState,
      ndi: initialNDIState,
      syphon: initialSyphonState,
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

      setSyphonState: (state) =>
        set((current) => ({
          syphon: { ...current.syphon, ...state },
        })),

      updateConfig: (config) =>
        set((current) => ({
          config: {
            ...current.config,
            ...config,
            obs: { ...current.config.obs, ...config.obs },
            streamDeck: { ...current.config.streamDeck, ...config.streamDeck },
            ndi: { ...current.config.ndi, ...config.ndi },
            syphon: { ...current.config.syphon, ...config.syphon },
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
        const port = get().config.websocket.port || initialWebSocketState.port;

        try {
          if (!websocketClient) {
            websocketClient = getWebSocketClient(port);
          } else if (websocketClient.getState().port !== port) {
            resetWebSocketClient();
            websocketClient = getWebSocketClient(port);
          }

          if (websocketStateHandler) {
            websocketClient.offStateChange(websocketStateHandler);
          }

          websocketStateHandler = (nextState) => {
            set((state) => ({
              websocket: {
                ...state.websocket,
                ...nextState,
                port,
              },
            }));
          };
          websocketClient.onStateChange(websocketStateHandler);

          set((state) => ({
            websocket: {
              ...state.websocket,
              port,
              connected: false,
              lastError: null,
            },
          }));

          registerWebSocketHandlers(
            websocketClient,
            (event) => get().addEvent(event),
            (message) => {
              set((state) => ({
                websocket: {
                  ...state.websocket,
                  connected: false,
                  lastError: message,
                },
              }));
            }
          );

          if (websocketClient.isConnected()) {
            const connectedClientState = websocketClient.getState();
            set((state) => ({
              websocket: {
                ...state.websocket,
                connected: true,
                lastError: null,
                connectionTime: state.websocket.connectionTime ?? new Date(),
                capabilities: connectedClientState.capabilities,
                capabilityNegotiated: connectedClientState.capabilityNegotiated,
                legacyFallback: connectedClientState.legacyFallback,
              },
            }));
            return;
          }

          await websocketClient.connect();
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

          const integrationError: IntegrationError = {
            code: "WEBSOCKET_CONNECTION_FAILED",
            message: errorMessage,
            source: IntegrationSource.STREAMSLATE,
            timestamp: new Date(),
            details: error,
          };
          get().addError(integrationError);

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
        if (websocketClient) {
          if (websocketStateHandler) {
            websocketClient.offStateChange(websocketStateHandler);
            websocketStateHandler = null;
          }
          resetWebSocketClient();
          websocketClient = null;
        }

        set((state) => ({
          websocket: {
            ...state.websocket,
            connected: false,
            lastError: null,
            connectionTime: null,
            capabilities: null,
            capabilityNegotiated: false,
            legacyFallback: false,
          },
        }));
      },

      connectOBS: async () => {
        set((state) => ({
          obs: { ...state.obs, connected: false },
        }));

        try {
          const { host, port, password } = get().config.obs;
          const connectionInfo = await OBSCommands.connect({
            host,
            port,
            password,
          });
          const [runtimeState, scenes, recordStatus, streamStatus] =
            await Promise.all([
              OBSCommands.getState(),
              OBSCommands.listScenes(),
              OBSCommands.getRecordStatus(),
              OBSCommands.getStreamStatus(),
            ]);

          set((state) => ({
            obs: {
              ...state.obs,
              connected:
                connectionInfo.connected ?? runtimeState.connected ?? true,
              version:
                connectionInfo.version ??
                runtimeState.version ??
                runtimeState.connection?.version ??
                null,
              scenes: runtimeState.scenes ?? scenes,
              currentScene: runtimeState.currentScene ?? null,
              isRecording: runtimeState.isRecording ?? recordStatus.isRecording,
              isStreaming: runtimeState.isStreaming ?? streamStatus.isStreaming,
              stats: runtimeState.stats ?? null,
            },
          }));
        } catch (error) {
          get().addError(
            createOBSIntegrationError(
              "OBS_CONNECTION_FAILED",
              error,
              "Failed to connect to OBS"
            )
          );

          set({ obs: initialOBSState });
        }
      },

      disconnectOBS: async () => {
        try {
          if (get().obs.connected) {
            await OBSCommands.disconnect();
          }
        } catch (error) {
          get().addError(
            createOBSIntegrationError(
              "OBS_COMMAND_FAILED",
              error,
              "Failed to disconnect from OBS"
            )
          );
        } finally {
          set({ obs: initialOBSState });
        }
      },

      setOBSCurrentScene: async (sceneName) => {
        try {
          await OBSCommands.setCurrentScene({ sceneName });

          set((state) => ({
            obs: {
              ...state.obs,
              currentScene: sceneName,
            },
          }));
          get().addEvent(
            createOBSEvent(IntegrationMessageType.OBS_SCENE_CHANGED, {
              sceneName,
            })
          );
        } catch (error) {
          get().addError(
            createOBSIntegrationError(
              "OBS_COMMAND_FAILED",
              error,
              "Failed to set the current OBS scene"
            )
          );
        }
      },

      setOBSSourceVisibility: async (sceneName, sourceName, visible) => {
        try {
          await OBSCommands.setSourceVisibility({
            sceneName,
            sourceName,
            visible,
          });

          set((state) => ({
            obs: {
              ...state.obs,
              scenes: state.obs.scenes.map((scene) =>
                scene.name === sceneName
                  ? {
                      ...scene,
                      sources: scene.sources.map((source) =>
                        source.name === sourceName
                          ? { ...source, visible }
                          : source
                      ),
                    }
                  : scene
              ),
            },
          }));
          get().addEvent(
            createOBSEvent(
              IntegrationMessageType.OBS_SOURCE_VISIBILITY_CHANGED,
              {
                sceneName,
                sourceName,
                visible,
              }
            )
          );
        } catch (error) {
          get().addError(
            createOBSIntegrationError(
              "OBS_COMMAND_FAILED",
              error,
              "Failed to update OBS source visibility"
            )
          );
        }
      },

      startOBSRecording: async () => {
        try {
          await OBSCommands.startRecord();

          set((state) => ({
            obs: { ...state.obs, isRecording: true },
          }));
          get().addEvent(
            createOBSEvent(IntegrationMessageType.OBS_RECORDING_STARTED, {})
          );
        } catch (error) {
          get().addError(
            createOBSIntegrationError(
              "OBS_COMMAND_FAILED",
              error,
              "Failed to start OBS recording"
            )
          );
        }
      },

      stopOBSRecording: async () => {
        try {
          await OBSCommands.stopRecord();

          set((state) => ({
            obs: { ...state.obs, isRecording: false },
          }));
          get().addEvent(
            createOBSEvent(IntegrationMessageType.OBS_RECORDING_STOPPED, {})
          );
        } catch (error) {
          get().addError(
            createOBSIntegrationError(
              "OBS_COMMAND_FAILED",
              error,
              "Failed to stop OBS recording"
            )
          );
        }
      },

      startOBSStreaming: async () => {
        try {
          await OBSCommands.startStream();

          set((state) => ({
            obs: { ...state.obs, isStreaming: true },
          }));
          get().addEvent(
            createOBSEvent(IntegrationMessageType.OBS_STREAMING_STARTED, {})
          );
        } catch (error) {
          get().addError(
            createOBSIntegrationError(
              "OBS_COMMAND_FAILED",
              error,
              "Failed to start OBS streaming"
            )
          );
        }
      },

      stopOBSStreaming: async () => {
        try {
          await OBSCommands.stopStream();

          set((state) => ({
            obs: { ...state.obs, isStreaming: false },
          }));
          get().addEvent(
            createOBSEvent(IntegrationMessageType.OBS_STREAMING_STOPPED, {})
          );
        } catch (error) {
          get().addError(
            createOBSIntegrationError(
              "OBS_COMMAND_FAILED",
              error,
              "Failed to stop OBS streaming"
            )
          );
        }
      },

      // Utility
      reset: () => {
        if (websocketClient) {
          if (websocketStateHandler) {
            websocketClient.offStateChange(websocketStateHandler);
            websocketStateHandler = null;
          }
          resetWebSocketClient();
          websocketClient = null;
        }

        set({
          websocket: initialWebSocketState,
          obs: initialOBSState,
          streamDeck: initialStreamDeckState,
          ndi: initialNDIState,
          syphon: initialSyphonState,
          config: initialConfig,
          errors: [],
          events: [],
        });
      },

      isAnyIntegrationConnected: () => {
        const state = get();
        return (
          state.websocket.connected ||
          state.obs.connected ||
          state.streamDeck.connected ||
          state.ndi.outputEnabled ||
          state.syphon.outputEnabled
        );
      },
    }),
    {
      name: "integration-store",
    }
  )
);
