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
 * Annotation tool presets, template profiles, and localStorage helpers.
 * Extracted from AnnotationTools.tsx for reusability and testability.
 */

import {
  AnnotationType,
  type Tool,
  type ToolConfig,
} from "../../types/pdf.types";

// ── Types ──────────────────────────────────────────────────────────────

export type ToolPreset = {
  id: string;
  name: string;
  tool: AnnotationType;
  config: Partial<ToolConfig>;
  builtIn?: boolean;
};

export type UseCaseTemplate = {
  id: string;
  name: string;
  description: string;
  preset: ToolPreset;
};

export type TemplateProfile = {
  id: string;
  name: string;
  presets: ToolPreset[];
  createdAt: string;
  updatedAt: string;
  builtIn?: boolean;
};

export type TemplateProfileExport = {
  version: number;
  exportedAt: string;
  profiles: TemplateProfile[];
};

// ── Constants ──────────────────────────────────────────────────────────

export const LEGACY_PRESET_STORAGE_KEY = "streamslate.annotation-presets.v1";
export const PROFILE_STORAGE_KEY =
  "streamslate.annotation-template-profiles.v1";
export const DOCUMENT_PROFILE_STORAGE_KEY =
  "streamslate.annotation-document-profile-map.v1";
export const TEMPLATE_PROFILE_EXPORT_VERSION = 1;
export const MAX_PRESETS_PER_PROFILE = 12;
export const MAX_CUSTOM_PROFILES = 12;
export const BUILT_IN_PROFILE_ID = "profile-built-in";

export const TOOLS: Tool[] = [
  {
    id: "highlight",
    name: "Highlight",
    type: AnnotationType.HIGHLIGHT,
    icon: "\u{1F58D}\uFE0F",
    active: false,
    config: { color: "#ffff00", opacity: 0.5, strokeWidth: 2 },
  },
  {
    id: "rectangle",
    name: "Rectangle",
    type: AnnotationType.RECTANGLE,
    icon: "\u2B1C",
    active: false,
    config: { color: "#ff0000", opacity: 0.8, strokeWidth: 2 },
  },
  {
    id: "circle",
    name: "Circle",
    type: AnnotationType.CIRCLE,
    icon: "\u2B55",
    active: false,
    config: { color: "#00ff00", opacity: 0.8, strokeWidth: 2 },
  },
  {
    id: "arrow",
    name: "Arrow",
    type: AnnotationType.ARROW,
    icon: "\u2197\uFE0F",
    active: false,
    config: { color: "#0000ff", opacity: 0.8, strokeWidth: 3 },
  },
  {
    id: "free-draw",
    name: "Draw",
    type: AnnotationType.FREE_DRAW,
    icon: "\u270F\uFE0F",
    active: false,
    config: { color: "#ff0000", opacity: 1.0, strokeWidth: 3 },
  },
  {
    id: "text",
    name: "Text",
    type: AnnotationType.TEXT,
    icon: "\u{1F4DD}",
    active: false,
    config: {
      color: "#000000",
      opacity: 1.0,
      strokeWidth: 1,
      fontSize: 16,
      fontFamily: "Arial",
    },
  },
];

export const BUILT_IN_PRESETS: ToolPreset[] = [
  {
    id: "builtin-highlight-focus",
    name: "Focus Highlight",
    tool: AnnotationType.HIGHLIGHT,
    config: { color: "#ffff00", opacity: 0.45, strokeWidth: 2 },
    builtIn: true,
  },
  {
    id: "builtin-rectangle-callout",
    name: "Callout Box",
    tool: AnnotationType.RECTANGLE,
    config: { color: "#ff0000", opacity: 0.95, strokeWidth: 3 },
    builtIn: true,
  },
  {
    id: "builtin-arrow-flow",
    name: "Flow Arrow",
    tool: AnnotationType.ARROW,
    config: { color: "#2563eb", opacity: 1, strokeWidth: 4 },
    builtIn: true,
  },
  {
    id: "builtin-text-note",
    name: "Readable Text",
    tool: AnnotationType.TEXT,
    config: { color: "#111827", opacity: 1, strokeWidth: 1, fontSize: 16 },
    builtIn: true,
  },
];

export const BUILT_IN_PROFILE: TemplateProfile = {
  id: BUILT_IN_PROFILE_ID,
  name: "Built-in Essentials",
  presets: BUILT_IN_PRESETS,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  builtIn: true,
};

export const USE_CASE_TEMPLATES: UseCaseTemplate[] = [
  {
    id: "template-lecture-focus",
    name: "Lecture Focus",
    description: "Soft highlight for following key lines live.",
    preset: BUILT_IN_PRESETS[0],
  },
  {
    id: "template-live-review",
    name: "Live Review",
    description: "Bold red boxes for visual QA callouts.",
    preset: BUILT_IN_PRESETS[1],
  },
  {
    id: "template-process-walkthrough",
    name: "Process Walkthrough",
    description: "Stronger arrows for step-by-step flow narration.",
    preset: BUILT_IN_PRESETS[2],
  },
  {
    id: "template-commentary-notes",
    name: "Commentary Notes",
    description: "Readable text annotations for presenter context.",
    preset: BUILT_IN_PRESETS[3],
  },
];

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

// ── Validation helpers ─────────────────────────────────────────────────

const ANNOTATION_TYPE_SET = new Set(Object.values(AnnotationType));

export function isAnnotationType(value: unknown): value is AnnotationType {
  return typeof value === "string" && ANNOTATION_TYPE_SET.has(value as never);
}

export function createId(prefix: string): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function sanitizeConfig(config: unknown): Partial<ToolConfig> {
  if (!config || typeof config !== "object") {
    return {};
  }

  const source = config as Partial<ToolConfig>;
  const normalized: Partial<ToolConfig> = {};

  if (typeof source.color === "string") {
    normalized.color = source.color.slice(0, 32);
  }
  if (typeof source.opacity === "number" && Number.isFinite(source.opacity)) {
    normalized.opacity = Math.max(0.05, Math.min(1, source.opacity));
  }
  if (
    typeof source.strokeWidth === "number" &&
    Number.isFinite(source.strokeWidth)
  ) {
    normalized.strokeWidth = Math.max(1, Math.min(12, source.strokeWidth));
  }
  if (typeof source.fontSize === "number" && Number.isFinite(source.fontSize)) {
    normalized.fontSize = Math.max(8, Math.min(96, source.fontSize));
  }
  if (typeof source.fontFamily === "string") {
    normalized.fontFamily = source.fontFamily.slice(0, 64);
  }

  return normalized;
}

export function sanitizePreset(input: unknown): ToolPreset | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const entry = input as ToolPreset;
  if (!isAnnotationType(entry.tool)) {
    return null;
  }
  if (typeof entry.name !== "string" || !entry.name.trim()) {
    return null;
  }

  return {
    id:
      typeof entry.id === "string" && entry.id.trim()
        ? entry.id
        : createId("preset"),
    name: entry.name.trim().slice(0, 32),
    tool: entry.tool,
    config: sanitizeConfig(entry.config),
    builtIn: entry.builtIn === true,
  };
}

export function sanitizeProfile(input: unknown): TemplateProfile | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const entry = input as TemplateProfile;
  if (typeof entry.name !== "string" || !entry.name.trim()) {
    return null;
  }

  const presets = Array.isArray(entry.presets)
    ? entry.presets
        .map((preset) => sanitizePreset(preset))
        .filter((preset): preset is ToolPreset => Boolean(preset))
        .slice(0, MAX_PRESETS_PER_PROFILE)
    : [];

  const now = new Date().toISOString();
  return {
    id:
      typeof entry.id === "string" && entry.id.trim()
        ? entry.id
        : createId("profile"),
    name: entry.name.trim().slice(0, 48),
    presets,
    createdAt:
      typeof entry.createdAt === "string" && entry.createdAt
        ? entry.createdAt
        : now,
    updatedAt:
      typeof entry.updatedAt === "string" && entry.updatedAt
        ? entry.updatedAt
        : now,
    builtIn: false,
  };
}

// ── Storage helpers ────────────────────────────────────────────────────

export function readDocumentProfileMap(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(DOCUMENT_PROFILE_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(
      parsed as Record<string, unknown>
    )) {
      if (typeof value === "string") {
        normalized[key] = value;
      }
    }
    return normalized;
  } catch {
    return {};
  }
}

export function readCustomProfiles(): TemplateProfile[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawProfiles = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (rawProfiles) {
      const parsed = JSON.parse(rawProfiles);
      if (Array.isArray(parsed)) {
        return parsed
          .map((entry) => sanitizeProfile(entry))
          .filter((entry): entry is TemplateProfile => Boolean(entry))
          .slice(0, MAX_CUSTOM_PROFILES);
      }
    }
  } catch {
    // Ignore read errors and try legacy fallback.
  }

  // Legacy migration from single preset list.
  try {
    const rawLegacy = window.localStorage.getItem(LEGACY_PRESET_STORAGE_KEY);
    if (!rawLegacy) {
      return [];
    }
    const parsedLegacy = JSON.parse(rawLegacy);
    if (!Array.isArray(parsedLegacy)) {
      return [];
    }

    const presets = parsedLegacy
      .map((entry) => sanitizePreset(entry))
      .filter((entry): entry is ToolPreset => Boolean(entry))
      .slice(0, MAX_PRESETS_PER_PROFILE);

    if (presets.length === 0) {
      return [];
    }

    const now = new Date().toISOString();
    return [
      {
        id: createId("profile"),
        name: "Imported Legacy Presets",
        presets,
        createdAt: now,
        updatedAt: now,
        builtIn: false,
      },
    ];
  } catch {
    return [];
  }
}

// ── Profile operations ─────────────────────────────────────────────────

export function pickPresetForProfile(
  profile: TemplateProfile,
  activeTool?: AnnotationType
): ToolPreset | null {
  if (profile.presets.length === 0) {
    return null;
  }

  if (!activeTool) {
    return profile.presets[0];
  }

  return (
    profile.presets.find((preset) => preset.tool === activeTool) ??
    profile.presets[0]
  );
}

export function makeUniqueProfileName(
  candidate: string,
  existingNames: string[]
): string {
  const cleaned = candidate.trim().slice(0, 48) || "Template Pack";
  const normalized = new Set(existingNames.map((name) => name.toLowerCase()));
  if (!normalized.has(cleaned.toLowerCase())) {
    return cleaned;
  }

  let suffix = 2;
  while (suffix <= 200) {
    const attempt = `${cleaned} ${suffix}`;
    if (!normalized.has(attempt.toLowerCase())) {
      return attempt;
    }
    suffix += 1;
  }

  return `${cleaned} ${Date.now()}`;
}

export function parseImportProfiles(rawJson: string): TemplateProfile[] {
  const parsed = JSON.parse(rawJson) as unknown;

  let candidates: unknown[] = [];
  if (Array.isArray(parsed)) {
    candidates = parsed;
  } else if (
    parsed &&
    typeof parsed === "object" &&
    "profiles" in parsed &&
    Array.isArray((parsed as { profiles: unknown[] }).profiles)
  ) {
    candidates = (parsed as { profiles: unknown[] }).profiles;
  } else if (parsed && typeof parsed === "object") {
    candidates = [parsed];
  }

  return candidates
    .map((entry) => sanitizeProfile(entry))
    .filter((entry): entry is TemplateProfile => Boolean(entry));
}

export function exportProfiles(
  profiles: TemplateProfile[]
): TemplateProfileExport {
  return {
    version: TEMPLATE_PROFILE_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    profiles: profiles.map((profile) => ({
      ...profile,
      builtIn: false,
      presets: profile.presets.map((preset) => ({
        ...preset,
        builtIn: false,
        config: sanitizeConfig(preset.config),
      })),
    })),
  };
}
