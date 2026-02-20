/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Declarative mapping from WebSocket message type strings to
 * IntegrationMessageType values, plus a registration function
 * that replaces the 11 inline onMessage calls in the integration store.
 */

import {
  IntegrationMessageType,
  IntegrationSource,
} from "../../types/integration.types";
import type { IntegrationEvent } from "../../types/integration.types";
import type { StreamSlateWebSocketClient } from "../websocket/client";

/**
 * Map from raw WebSocket message type string to IntegrationMessageType.
 * To support a new message, add one entry here.
 */
export const WS_MESSAGE_MAP: ReadonlyArray<
  readonly [string, IntegrationMessageType]
> = [
  ["CONNECTED", IntegrationMessageType.CONNECTION_STATUS],
  ["STATE", IntegrationMessageType.CONNECTION_STATUS],
  ["PAGE_CHANGED", IntegrationMessageType.PAGE_CHANGED],
  ["ZOOM_CHANGED", IntegrationMessageType.ZOOM_CHANGED],
  ["PDF_OPENED", IntegrationMessageType.PDF_OPENED],
  ["PDF_CLOSED", IntegrationMessageType.PDF_CLOSED],
  ["PRESENTER_CHANGED", IntegrationMessageType.PRESENTER_MODE_TOGGLED],
  ["ANNOTATIONS_UPDATED", IntegrationMessageType.ANNOTATIONS_UPDATED],
  ["ANNOTATIONS_CLEARED", IntegrationMessageType.ANNOTATIONS_CLEARED],
  ["PONG", IntegrationMessageType.PONG],
  ["ERROR", IntegrationMessageType.ERROR],
] as const;

/** All WebSocket message type strings that we register listeners for. */
export const WS_MESSAGE_TYPES = WS_MESSAGE_MAP.map(([type]) => type);

const createIntegrationEvent = (
  type: IntegrationMessageType,
  source: IntegrationSource,
  data: unknown
): IntegrationEvent => ({
  id:
    globalThis.crypto?.randomUUID?.() ||
    `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  type,
  source,
  timestamp: new Date(),
  data,
  handled: false,
});

/**
 * Register WebSocket message listeners that convert incoming messages
 * into IntegrationEvents and push them into the store event queue.
 *
 * Handles the ERROR message specially (extracts error message and
 * calls `onError` to update WebSocket state).
 */
export function registerWebSocketHandlers(
  client: StreamSlateWebSocketClient,
  addEvent: (event: IntegrationEvent) => void,
  onError?: (message: string) => void
): void {
  // Clean up any previous registrations
  for (const [wsType] of WS_MESSAGE_MAP) {
    client.offMessage(wsType);
  }

  for (const [wsType, eventType] of WS_MESSAGE_MAP) {
    if (wsType === "ERROR") {
      client.onMessage(wsType, (payload) => {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "message" in payload &&
          typeof (payload as { message?: unknown }).message === "string"
            ? (payload as { message: string }).message
            : "WebSocket server error";

        onError?.(message);
        addEvent(
          createIntegrationEvent(
            eventType,
            IntegrationSource.STREAMSLATE,
            payload
          )
        );
      });
    } else {
      client.onMessage(wsType, (payload) => {
        addEvent(
          createIntegrationEvent(
            eventType,
            IntegrationSource.STREAMSLATE,
            payload
          )
        );
      });
    }
  }
}
