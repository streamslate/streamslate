/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 */

import type { AnnotationDTO } from "../tauri/commands";
import type { Annotation } from "../../types/pdf.types";

type Point = { x: number; y: number };

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  return value as Record<string, unknown>;
};

const parsePoints = (value: unknown): Point[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const points: Point[] = [];
  for (const entry of value) {
    const payload = asRecord(entry);
    if (!payload) {
      continue;
    }

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
};

const tryParsePointsFromContent = (
  content: string | null | undefined
): Point[] | null => {
  if (!content) {
    return null;
  }

  try {
    const parsed = JSON.parse(content);
    return parsePoints(parsed);
  } catch {
    return null;
  }
};

// Convert frontend Annotation to backend DTO
export function annotationToDTO(annotation: Annotation): AnnotationDTO {
  const points =
    annotation.points ??
    (annotation.type === "free_draw"
      ? tryParsePointsFromContent(annotation.content)
      : null);

  return {
    id: annotation.id,
    type: annotation.type,
    pageNumber: annotation.pageNumber,
    x: annotation.x,
    y: annotation.y,
    width: annotation.width,
    height: annotation.height,
    content: annotation.content,
    color: annotation.color,
    opacity: annotation.opacity,
    strokeWidth: annotation.strokeWidth,
    fontSize: annotation.fontSize,
    created: annotation.created.toISOString(),
    modified: annotation.modified.toISOString(),
    visible: annotation.visible,
    points: points ?? undefined,
  };
}

// Convert backend DTO to frontend Annotation
export function dtoToAnnotation(dto: AnnotationDTO): Annotation {
  const points =
    dto.points ??
    (dto.type === "free_draw" ? tryParsePointsFromContent(dto.content) : null);

  return {
    id: dto.id,
    type: dto.type as Annotation["type"],
    pageNumber: dto.pageNumber,
    x: dto.x,
    y: dto.y,
    width: dto.width,
    height: dto.height,
    content: dto.content,
    color: dto.color,
    opacity: dto.opacity,
    strokeWidth: dto.strokeWidth,
    fontSize: dto.fontSize,
    points: points ?? undefined,
    created: new Date(dto.created),
    modified: new Date(dto.modified),
    visible: dto.visible,
  };
}

const readString = (
  payload: Record<string, unknown>,
  keys: string[]
): string | null => {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string") {
      return value;
    }
  }
  return null;
};

const readNumber = (
  payload: Record<string, unknown>,
  keys: string[]
): number | null => {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
};

const readBoolean = (
  payload: Record<string, unknown>,
  keys: string[]
): boolean | null => {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "boolean") {
      return value;
    }
  }
  return null;
};

export function parseAnnotationDTO(value: unknown): AnnotationDTO | null {
  const payload = asRecord(value);
  if (!payload) {
    return null;
  }

  const id = readString(payload, ["id"]);
  const type = readString(payload, ["type"]);
  const pageNumber =
    readNumber(payload, ["pageNumber", "page_number"]) ??
    readNumber(payload, ["page"]);
  const x = readNumber(payload, ["x"]);
  const y = readNumber(payload, ["y"]);
  const width = readNumber(payload, ["width"]);
  const height = readNumber(payload, ["height"]);
  const content = readString(payload, ["content"]) ?? "";
  const color = readString(payload, ["color"]) ?? "#ffff00";
  const opacity = readNumber(payload, ["opacity"]) ?? 1;
  const strokeWidth =
    readNumber(payload, ["strokeWidth", "stroke_width"]) ?? undefined;
  const fontSize = readNumber(payload, ["fontSize", "font_size"]) ?? undefined;
  const created = readString(payload, ["created"]) ?? new Date().toISOString();
  const modified =
    readString(payload, ["modified"]) ?? new Date().toISOString();
  const visible = readBoolean(payload, ["visible"]) ?? true;
  const points =
    parsePoints(payload.points) ??
    (type === "free_draw" ? tryParsePointsFromContent(content) : null);

  if (
    !id ||
    !type ||
    pageNumber === null ||
    x === null ||
    y === null ||
    width === null ||
    height === null
  ) {
    return null;
  }

  return {
    id,
    type,
    pageNumber: Math.floor(pageNumber),
    x,
    y,
    width,
    height,
    content,
    color,
    opacity,
    strokeWidth,
    fontSize,
    created,
    modified,
    visible,
    points: points ?? undefined,
  };
}
