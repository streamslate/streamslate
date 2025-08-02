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

import {
  IntegrationMessage,
  WebSocketState,
} from "../../types/integration.types";

export class StreamSlateWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers = new Map<string, (data: any) => void>();
  private stateChangeHandlers: ((state: WebSocketState) => void)[] = [];

  constructor(private port: number = 11451) {}

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`ws://localhost:${this.port}`);

        this.ws.onopen = () => {
          console.log("WebSocket connected");
          this.reconnectAttempts = 0;
          this.notifyStateChange({
            connected: true,
            port: this.port,
            lastError: null,
            connectionTime: new Date(),
          });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: IntegrationMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        this.ws.onclose = (event) => {
          console.log("WebSocket disconnected:", event.code, event.reason);
          this.notifyStateChange({
            connected: false,
            port: this.port,
            lastError: `Connection closed: ${event.reason}`,
            connectionTime: null,
          });

          if (
            !event.wasClean &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.notifyStateChange({
            connected: false,
            port: this.port,
            lastError: "Connection error",
            connectionTime: null,
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
  }

  /**
   * Send a message to the server
   */
  send(message: IntegrationMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected, cannot send message");
    }
  }

  /**
   * Register a message handler for a specific type
   */
  onMessage(type: string, handler: (data: any) => void): void {
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
    return {
      connected: this.ws?.readyState === WebSocket.OPEN,
      port: this.port,
      lastError: null,
      connectionTime:
        this.ws?.readyState === WebSocket.OPEN ? new Date() : null,
    };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private handleMessage(message: IntegrationMessage): void {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.data);
    } else {
      console.log("Unhandled WebSocket message:", message);
    }
  }

  private notifyStateChange(state: WebSocketState): void {
    this.stateChangeHandlers.forEach((handler) => handler(state));
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
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
