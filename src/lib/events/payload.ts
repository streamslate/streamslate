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
 * Null-safe helpers for extracting typed values from unknown event payloads.
 */

export function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function readNumber(
  payload: Record<string, unknown> | null,
  keys: string[]
): number | null {
  if (!payload) {
    return null;
  }
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}

export function readBoolean(
  payload: Record<string, unknown> | null,
  keys: string[]
): boolean | null {
  if (!payload) {
    return null;
  }
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "boolean") {
      return value;
    }
  }
  return null;
}

export function readString(
  payload: Record<string, unknown> | null,
  keys: string[]
): string | null {
  if (!payload) {
    return null;
  }
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return null;
}
