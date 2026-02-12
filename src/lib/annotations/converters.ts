/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 */

import type { AnnotationDTO } from "../tauri/commands";
import type { Annotation } from "../../types/pdf.types";

// Convert frontend Annotation to backend DTO
export function annotationToDTO(annotation: Annotation): AnnotationDTO {
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
    created: annotation.created.toISOString(),
    modified: annotation.modified.toISOString(),
    visible: annotation.visible,
  };
}

// Convert backend DTO to frontend Annotation
export function dtoToAnnotation(dto: AnnotationDTO): Annotation {
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
    created: new Date(dto.created),
    modified: new Date(dto.modified),
    visible: dto.visible,
  };
}

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  return value as Record<string, unknown>;
};

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
  const created = readString(payload, ["created"]) ?? new Date().toISOString();
  const modified =
    readString(payload, ["modified"]) ?? new Date().toISOString();
  const visible = readBoolean(payload, ["visible"]) ?? true;

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
    created,
    modified,
    visible,
  };
}
