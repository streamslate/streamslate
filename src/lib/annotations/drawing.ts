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
 * Drawing utilities, types, and constants for annotation interaction.
 * Extracted from AnnotationLayer.tsx for reusability and testability.
 */

import { AnnotationType } from "../../types/pdf.types";
import type { Annotation } from "../../types/pdf.types";

// Re-export geometry primitives so consumers don't need a separate import
export { type Point, pointsToSmoothPath } from "../utils/geometry";
import type { Point } from "../utils/geometry";

// ── Constants ──────────────────────────────────────────────────────────

export const PRESET_COLORS = [
  "#ffff00",
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ff8c00",
  "#800080",
  "#ff69b4",
  "#000000",
  "#ffffff",
];

export const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28];

export const TEXT_BACKGROUND_COLORS = [
  "#ffffff",
  "#fef3c7",
  "#dbeafe",
  "#dcfce7",
  "#fee2e2",
  "#e2e8f0",
  "#1f2937",
  "#000000",
];

export const MIN_ANNOTATION_SIZE = 5;

// ── Types ──────────────────────────────────────────────────────────────

export interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  points: Point[];
}

export type ResizeHandle =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "start"
  | "end";

export interface DragState {
  id: string;
  start: Point;
  origin: Annotation;
  hasMoved: boolean;
}

export interface ResizeState {
  id: string;
  handle: ResizeHandle;
  start: Point;
  origin: Annotation;
  hasMoved: boolean;
}

// ── Color helpers ──────────────────────────────────────────────────────

export function getTextDefaults() {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  return {
    textColor: isDark ? "#f5f5f5" : "#0a0a0a",
    backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
    backgroundOpacity: isDark ? 0.72 : 0.82,
  };
}

export function normalizeHexColor(hex: string | undefined): string | null {
  if (!hex) {
    return null;
  }

  const trimmed = hex.trim();
  if (/^#[a-f\d]{6}$/i.test(trimmed)) {
    return trimmed;
  }

  if (/^#[a-f\d]{3}$/i.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  return null;
}

export function clampOpacity(
  opacity: number | undefined,
  fallback: number
): number {
  if (typeof opacity !== "number" || !Number.isFinite(opacity)) {
    return fallback;
  }

  return Math.max(0, Math.min(1, opacity));
}

export function hexToRgba(
  hex: string | undefined,
  opacity: number | undefined,
  fallbackHex: string
): string {
  const normalized = normalizeHexColor(hex) ?? fallbackHex;
  const alpha = clampOpacity(opacity, 1);
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Annotation data helpers ────────────────────────────────────────────

export function getPointsFromAnnotation(
  annotation: Annotation
): Point[] | null {
  if (annotation.points && annotation.points.length > 0) {
    return annotation.points;
  }

  try {
    const parsed = JSON.parse(annotation.content || "[]");
    if (!Array.isArray(parsed)) {
      return null;
    }
    const points: Point[] = [];
    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) {
        continue;
      }

      const payload = entry as Record<string, unknown>;
      const x = payload.x;
      const y = payload.y;

      if (typeof x !== "number" || !Number.isFinite(x)) {
        continue;
      }
      if (typeof y !== "number" || !Number.isFinite(y)) {
        continue;
      }

      points.push({ x, y });
    }
    return points.length > 0 ? points : null;
  } catch {
    return null;
  }
}

export function bboxFromPoints(points: Point[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function moveAnnotationBy(
  annotation: Annotation,
  dx: number,
  dy: number
): Partial<Annotation> {
  const next: Partial<Annotation> = {
    x: annotation.x + dx,
    y: annotation.y + dy,
  };

  if (annotation.type === AnnotationType.FREE_DRAW) {
    const points = getPointsFromAnnotation(annotation) ?? [];
    if (points.length > 0) {
      const movedPoints = points.map((p) => ({
        x: p.x + dx,
        y: p.y + dy,
      }));
      const bbox = bboxFromPoints(movedPoints);
      Object.assign(next, {
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
        points: movedPoints,
        content: JSON.stringify(movedPoints),
      });
    }
  }

  return next;
}
