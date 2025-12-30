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
 * Tauri event utilities for cross-window communication
 *
 * These events are emitted from the main window and received by the presenter
 * window to keep both views in sync.
 */

import { emit } from "@tauri-apps/api/event";

// Event payload types
export interface PageChangedPayload {
  page: number;
  totalPages: number;
  pdfPath?: string;
}

export interface PdfOpenedPayload {
  path: string;
  pageCount: number;
  title?: string;
}

export interface ZoomChangedPayload {
  zoom: number;
}

// Event names as constants for type safety
export const EVENTS = {
  PAGE_CHANGED: "page-changed",
  PDF_OPENED: "pdf-opened",
  PDF_CLOSED: "pdf-closed",
  ZOOM_CHANGED: "zoom-changed",
} as const;

/**
 * Emit a page change event to all windows
 */
export async function emitPageChanged(
  payload: PageChangedPayload
): Promise<void> {
  try {
    await emit(EVENTS.PAGE_CHANGED, payload);
  } catch (error) {
    console.error("[Events] Failed to emit page-changed:", error);
  }
}

/**
 * Emit a PDF opened event to all windows
 */
export async function emitPdfOpened(payload: PdfOpenedPayload): Promise<void> {
  try {
    await emit(EVENTS.PDF_OPENED, payload);
  } catch (error) {
    console.error("[Events] Failed to emit pdf-opened:", error);
  }
}

/**
 * Emit a PDF closed event to all windows
 */
export async function emitPdfClosed(): Promise<void> {
  try {
    await emit(EVENTS.PDF_CLOSED, null);
  } catch (error) {
    console.error("[Events] Failed to emit pdf-closed:", error);
  }
}

/**
 * Emit a zoom change event to all windows
 */
export async function emitZoomChanged(
  payload: ZoomChangedPayload
): Promise<void> {
  try {
    await emit(EVENTS.ZOOM_CHANGED, payload);
  } catch (error) {
    console.error("[Events] Failed to emit zoom-changed:", error);
  }
}
