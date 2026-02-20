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
 * Typed event handler functions for each IntegrationMessageType.
 * Each handler is a pure function operating on payload + actions,
 * independently testable without store or component dependencies.
 */

import { IntegrationMessageType } from "../../types/integration.types";
import type { IntegrationEvent } from "../../types/integration.types";
import type { Annotation } from "../../types/pdf.types";
import { dtoToAnnotation, parseAnnotationDTO } from "../annotations/converters";
import { toRecord, readNumber, readBoolean, readString } from "./payload";

/** Minimal document shape needed by event handlers. */
export interface EventDocument {
  id: string;
  path: string;
  title?: string;
  pageCount: number;
  fileSize: number;
  isLoaded: boolean;
}

/** Actions that event handlers may invoke. */
export interface EventActions {
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  setPresenterMode: (active: boolean) => void;
  setDocument: (doc: EventDocument | null) => void;
  setPageAnnotations: (page: number, annotations: Annotation[]) => void;
  clearAnnotations: () => void;
  getCurrentDocument: () => EventDocument | null;
}

export type EventHandler = (
  event: IntegrationEvent,
  actions: EventActions
) => void;

// ── Individual handlers ────────────────────────────────────────────────

function handlePageChanged(
  event: IntegrationEvent,
  actions: EventActions
): void {
  const payload = toRecord(event.data);
  const page = readNumber(payload, ["page"]);
  if (page !== null && page >= 1) {
    actions.setCurrentPage(Math.floor(page));
  }
}

function handleZoomChanged(
  event: IntegrationEvent,
  actions: EventActions
): void {
  const payload = toRecord(event.data);

  const page = readNumber(payload, ["page"]);
  if (page !== null && page >= 1) {
    actions.setCurrentPage(Math.floor(page));
  }

  const zoom = readNumber(payload, ["zoom"]);
  if (zoom !== null && zoom > 0) {
    actions.setZoom(zoom);
  }
}

function handlePresenterModeToggled(
  event: IntegrationEvent,
  actions: EventActions
): void {
  const payload = toRecord(event.data);
  const presenterActive = readBoolean(payload, ["active", "presenter_active"]);
  if (presenterActive !== null) {
    actions.setPresenterMode(presenterActive);
  }
}

function handleConnectionStatus(
  event: IntegrationEvent,
  actions: EventActions
): void {
  const payload = toRecord(event.data);

  // Page + zoom
  const page = readNumber(payload, ["page"]);
  if (page !== null && page >= 1) {
    actions.setCurrentPage(Math.floor(page));
  }

  const zoom = readNumber(payload, ["zoom"]);
  if (zoom !== null && zoom > 0) {
    actions.setZoom(zoom);
  }

  // Presenter
  const presenterActive = readBoolean(payload, ["active", "presenter_active"]);
  if (presenterActive !== null) {
    actions.setPresenterMode(presenterActive);
  }

  // Document sync
  const isLoaded = readBoolean(payload, ["pdf_loaded"]);
  const path = readString(payload, ["pdf_path"]);
  const totalPages = readNumber(payload, ["total_pages", "totalPages"]);

  if (isLoaded && path && totalPages !== null && totalPages > 0) {
    const nextPageCount = Math.floor(totalPages);
    const current = actions.getCurrentDocument();
    const shouldSet =
      current === null ||
      current.path !== path ||
      current.pageCount !== nextPageCount;

    if (shouldSet) {
      actions.setDocument({
        id: globalThis.crypto?.randomUUID?.() ?? `pdf-${Date.now()}`,
        path,
        title: readString(payload, ["pdf_title"]) ?? undefined,
        pageCount: nextPageCount,
        fileSize: 0,
        isLoaded: true,
      });
    }
  }
}

function handlePdfOpened(event: IntegrationEvent, actions: EventActions): void {
  const payload = toRecord(event.data);
  const path = readString(payload, ["path", "pdf_path"]);
  const pageCount = readNumber(payload, ["page_count", "pageCount"]);
  if (path && pageCount !== null && pageCount > 0) {
    actions.setDocument({
      id: globalThis.crypto?.randomUUID?.() ?? `pdf-${Date.now()}`,
      path,
      title: readString(payload, ["title"]) ?? undefined,
      pageCount: Math.floor(pageCount),
      fileSize: 0,
      isLoaded: true,
    });
    actions.setCurrentPage(1);
  }
}

function handlePdfClosed(
  _event: IntegrationEvent,
  actions: EventActions
): void {
  actions.setDocument(null);
  actions.clearAnnotations();
  actions.setCurrentPage(1);
}

function handleAnnotationsUpdated(
  event: IntegrationEvent,
  actions: EventActions
): void {
  const payload = toRecord(event.data);
  const updates = payload?.annotations;
  const record = updates ? toRecord(updates) : payload;
  if (!record) {
    return;
  }

  for (const [pageKey, items] of Object.entries(record)) {
    const page = Number.parseInt(pageKey, 10);
    if (!Number.isFinite(page) || page < 1) {
      continue;
    }
    if (!Array.isArray(items)) {
      continue;
    }

    const next = items
      .map(parseAnnotationDTO)
      .filter((dto): dto is NonNullable<typeof dto> => dto !== null)
      .map(dtoToAnnotation)
      .map((annotation) => ({ ...annotation, pageNumber: page }));

    actions.setPageAnnotations(page, next);
  }
}

function handleAnnotationsCleared(
  _event: IntegrationEvent,
  actions: EventActions
): void {
  actions.clearAnnotations();
}

// ── Handler registry ───────────────────────────────────────────────────

/**
 * Map from IntegrationMessageType to handler function.
 * To support a new message type, add one entry here and one handler above.
 */
export const HANDLER_MAP = new Map<IntegrationMessageType, EventHandler>([
  [IntegrationMessageType.PAGE_CHANGED, handlePageChanged],
  [IntegrationMessageType.ZOOM_CHANGED, handleZoomChanged],
  [IntegrationMessageType.PRESENTER_MODE_TOGGLED, handlePresenterModeToggled],
  [IntegrationMessageType.CONNECTION_STATUS, handleConnectionStatus],
  [IntegrationMessageType.PDF_OPENED, handlePdfOpened],
  [IntegrationMessageType.PDF_CLOSED, handlePdfClosed],
  [IntegrationMessageType.ANNOTATIONS_UPDATED, handleAnnotationsUpdated],
  [IntegrationMessageType.ANNOTATIONS_CLEARED, handleAnnotationsCleared],
]);

// ── Status message derivation ──────────────────────────────────────────

/**
 * Derive a human-readable status string from the most recent relevant event.
 * Pure function — no store dependency.
 */
export function getStatusMessage(events: IntegrationEvent[]): string {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    const payload = toRecord(event.data);

    if (event.type === IntegrationMessageType.PAGE_CHANGED) {
      const page = readNumber(payload, ["page"]);
      if (page !== null && page >= 1) {
        return `Remote page ${Math.floor(page)}`;
      }
    }

    if (event.type === IntegrationMessageType.PRESENTER_MODE_TOGGLED) {
      const active = readBoolean(payload, ["active", "presenter_active"]);
      if (active !== null) {
        return active
          ? "Presenter mode enabled remotely"
          : "Presenter mode disabled remotely";
      }
    }

    if (event.type === IntegrationMessageType.ZOOM_CHANGED) {
      const zoom = readNumber(payload, ["zoom"]);
      if (zoom !== null && zoom > 0) {
        return `Remote zoom ${Math.round(zoom * 100)}%`;
      }
    }

    if (event.type === IntegrationMessageType.ANNOTATIONS_UPDATED) {
      return "Remote annotations updated";
    }

    if (event.type === IntegrationMessageType.ANNOTATIONS_CLEARED) {
      return "Remote annotations cleared";
    }

    if (event.type === IntegrationMessageType.PDF_OPENED) {
      return "Remote PDF opened";
    }

    if (event.type === IntegrationMessageType.PDF_CLOSED) {
      return "Remote PDF closed";
    }

    if (event.type === IntegrationMessageType.ERROR) {
      const message = readString(payload, ["message"]);
      return message ? `Remote error: ${message}` : "Remote error";
    }
  }

  return "Ready";
}
