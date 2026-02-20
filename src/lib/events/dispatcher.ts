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
 * Event dispatcher: routes unhandled IntegrationEvents to the correct
 * handler from the HANDLER_MAP registry, then marks them handled.
 */

import type { IntegrationEvent } from "../../types/integration.types";
import { HANDLER_MAP } from "./handlers";
import type { EventActions } from "./handlers";

/**
 * Process all unhandled events in order, routing each to its registered
 * handler and marking it handled afterwards.
 */
export function processUnhandledEvents(
  events: IntegrationEvent[],
  actions: EventActions,
  markHandled: (id: string) => void
): void {
  for (const event of events) {
    if (event.handled) {
      continue;
    }

    const handler = HANDLER_MAP.get(event.type);
    if (handler) {
      handler(event, actions);
    }

    markHandled(event.id);
  }
}

export { HANDLER_MAP } from "./handlers";
export { getStatusMessage } from "./handlers";
export type { EventActions, EventDocument, EventHandler } from "./handlers";
export { toRecord, readNumber, readBoolean, readString } from "./payload";
