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
 * WebSocket client for streaming integration
 * Handles communication with OBS, Stream Deck, and other streaming tools
 */

import type {
  IntegrationMessage,
  WebSocketCapabilities,
  WebSocketState,
} from "../../types/integration.types";
import { logger } from "../logger";

const PROTOCOL_VERSION = "2.0";
const CAPABILITIES_COMMAND = "GET_CAPABILITIES";
const CAPABILITIES_EVENT = "CAPABILITIES";
const ERROR_EVENT = "ERROR";

const createInitialState = (port: number): WebSocketState => ({
  connected: false,
  port,
  lastError: null,
  connectionTime: null,
  capabilities: null,
  capabilityNegotiated: false,
  legacyFallback: false,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readStringArray = (
  record: Record<string, unknown>,
  key: string
): string[] | null => {
  const value = record[key];
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : null;
};

export class StreamSlateWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers = new Map<string, (data: unknown) => void>();
  private stateChangeHandlers: ((state: WebSocketState) => void)[] = [];
  private state: WebSocketState;
  private capabilitiesRequestId: string | null = null;

  constructor(private port: number = 11451) {
    this.state = createInitialState(port);
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`ws://localhost:${this.port}`);

        this.ws.onopen = () => {
          logger.debug("WebSocket connected");
          this.reconnectAttempts = 0;
          this.updateState({
            connected: true,
            port: this.port,
            lastError: null,
            connectionTime: new Date(),
            capabilities: null,
            capabilityNegotiated: false,
            legacyFallback: false,
          });
          this.requestCapabilities();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as {
              type?: unknown;
              data?: unknown;
              [key: string]: unknown;
            };
            this.handleMessage(message);
          } catch (error) {
            logger.error("Failed to parse WebSocket message:", error);
          }
        };

        this.ws.onclose = (event) => {
          logger.debug("WebSocket disconnected:", event.code, event.reason);
          this.capabilitiesRequestId = null;
          this.updateState({
            connected: false,
            port: this.port,
            lastError: `Connection closed: ${event.reason}`,
            connectionTime: null,
            capabilities: null,
            capabilityNegotiated: false,
            legacyFallback: false,
          });

          if (
            !event.wasClean &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          logger.error("WebSocket error:", error);
          this.capabilitiesRequestId = null;
          this.updateState({
            connected: false,
            port: this.port,
            lastError: "Connection error",
            connectionTime: null,
            capabilities: null,
            capabilityNegotiated: false,
            legacyFallback: false,
          });
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, "User disconnected");
      this.ws = null;
    }
    this.capabilitiesRequestId = null;
    this.updateState({
      connected: false,
      connectionTime: null,
      capabilities: null,
      capabilityNegotiated: false,
      legacyFallback: false,
    });
  }

  /**
   * Send a message to the server
   */
  send(message: IntegrationMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      logger.warn("WebSocket not connected, cannot send message");
    }
  }

  /**
   * Register a message handler for a specific type
   */
  onMessage(type: string, handler: (data: unknown) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Remove a message handler
   */
  offMessage(type: string): void {
    this.messageHandlers.delete(type);
  }

  /**
   * Register a state change handler
   */
  onStateChange(handler: (state: WebSocketState) => void): void {
    this.stateChangeHandlers.push(handler);
  }

  /**
   * Remove a state change handler
   */
  offStateChange(handler: (state: WebSocketState) => void): void {
    const index = this.stateChangeHandlers.indexOf(handler);
    if (index > -1) {
      this.stateChangeHandlers.splice(index, 1);
    }
  }

  /**
   * Get current connection state
   */
  getState(): WebSocketState {
    return { ...this.state };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN || false;
  }

  private handleMessage(message: {
    type?: unknown;
    data?: unknown;
    [key: string]: unknown;
  }): void {
    const messageType = typeof message.type === "string" ? message.type : "";
    if (!messageType) {
      logger.debug("WebSocket message missing type:", message);
      return;
    }

    if (messageType === CAPABILITIES_EVENT) {
      const capabilities = this.readCapabilities(message);
      if (capabilities) {
        this.capabilitiesRequestId = null;
        this.updateState({
          capabilities,
          capabilityNegotiated: true,
          legacyFallback: false,
          lastError: null,
        });
      } else {
        logger.debug("Invalid CAPABILITIES payload:", message);
      }
      return;
    }

    if (
      messageType === ERROR_EVENT &&
      this.isUnsupportedCapabilities(message)
    ) {
      this.capabilitiesRequestId = null;
      this.updateState({
        capabilities: null,
        capabilityNegotiated: true,
        legacyFallback: true,
        lastError: null,
      });
      return;
    }

    const handler = this.messageHandlers.get(messageType);
    if (handler) {
      handler(message.data ?? message);
    } else {
      logger.debug("Unhandled WebSocket message:", message);
    }
  }

  private updateState(state: Partial<WebSocketState>): void {
    this.state = { ...this.state, ...state, port: this.port };
    this.stateChangeHandlers.forEach((handler) => handler({ ...this.state }));
  }

  private requestCapabilities(): void {
    this.capabilitiesRequestId =
      globalThis.crypto?.randomUUID?.() ??
      `capabilities-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    this.sendJson({
      type: CAPABILITIES_COMMAND,
      protocolVersion: PROTOCOL_VERSION,
      request_id: this.capabilitiesRequestId,
    });
  }

  private sendJson(message: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      logger.warn("WebSocket not connected, cannot send message");
    }
  }

  private readCapabilities(
    message: Record<string, unknown>
  ): WebSocketCapabilities | null {
    const payload = isRecord(message.data) ? message.data : message;
    if (!isRecord(payload)) {
      return null;
    }

    const protocolVersion = payload.protocolVersion;
    const supportedCommands = readStringArray(payload, "supported_commands");
    const supportedEvents = readStringArray(payload, "supported_events");
    const features = readStringArray(payload, "features");

    if (
      typeof protocolVersion !== "string" ||
      !supportedCommands ||
      !supportedEvents ||
      !features
    ) {
      return null;
    }

    return {
      protocolVersion,
      supported_commands: supportedCommands,
      supported_events: supportedEvents,
      features,
    };
  }

  private isUnsupportedCapabilities(message: Record<string, unknown>): boolean {
    if (!this.capabilitiesRequestId) {
      return false;
    }

    const payload = isRecord(message.data) ? message.data : message;
    const requestId = payload.request_id;
    const code = typeof payload.code === "string" ? payload.code : "";
    const command = typeof payload.command === "string" ? payload.command : "";
    const details = isRecord(payload.details) ? payload.details : {};
    const detailsCommand =
      typeof details.command === "string" ? details.command : "";
    const messageText =
      typeof payload.message === "string" ? payload.message.toLowerCase() : "";

    return (
      requestId === this.capabilitiesRequestId ||
      code === "UNSUPPORTED_COMMAND" ||
      command === CAPABILITIES_COMMAND ||
      detailsCommand === CAPABILITIES_COMMAND ||
      ((messageText.includes("unsupported") ||
        messageText.includes("unknown") ||
        messageText.includes("unrecognized") ||
        messageText.includes("invalid command")) &&
        (messageText.includes("capabilities") ||
          messageText.includes(CAPABILITIES_COMMAND.toLowerCase())))
    );
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    logger.debug(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`
    );

    setTimeout(() => {
      this.connect().catch(() => {
        // Reconnection failed, will try again if under limit
      });
    }, delay);
  }
}

// Singleton instance
let clientInstance: StreamSlateWebSocketClient | null = null;

/**
 * Get the singleton WebSocket client instance
 */
export const getWebSocketClient = (
  port: number = 11451
): StreamSlateWebSocketClient => {
  if (!clientInstance) {
    clientInstance = new StreamSlateWebSocketClient(port);
  }
  return clientInstance;
};

/**
 * Close and reset the singleton instance
 */
export const resetWebSocketClient = (): void => {
  if (clientInstance) {
    clientInstance.disconnect();
    clientInstance = null;
  }
};
