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

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AnnotationType,
  type Tool,
  type ToolConfig,
} from "../../types/pdf.types";

interface AnnotationToolsProps {
  activeTool?: AnnotationType;
  toolConfig: ToolConfig;
  onToolSelect: (tool: AnnotationType | undefined) => void;
  onToolConfigChange: (config: Partial<ToolConfig>) => void;
  documentPath?: string;
  className?: string;
}

const TOOLS: Tool[] = [
  {
    id: "highlight",
    name: "Highlight",
    type: AnnotationType.HIGHLIGHT,
    icon: "🖍️",
    active: false,
    config: { color: "#ffff00", opacity: 0.5, strokeWidth: 2 },
  },
  {
    id: "rectangle",
    name: "Rectangle",
    type: AnnotationType.RECTANGLE,
    icon: "⬜",
    active: false,
    config: { color: "#ff0000", opacity: 0.8, strokeWidth: 2 },
  },
  {
    id: "circle",
    name: "Circle",
    type: AnnotationType.CIRCLE,
    icon: "⭕",
    active: false,
    config: { color: "#00ff00", opacity: 0.8, strokeWidth: 2 },
  },
  {
    id: "arrow",
    name: "Arrow",
    type: AnnotationType.ARROW,
    icon: "↗️",
    active: false,
    config: { color: "#0000ff", opacity: 0.8, strokeWidth: 3 },
  },
  {
    id: "free-draw",
    name: "Draw",
    type: AnnotationType.FREE_DRAW,
    icon: "✏️",
    active: false,
    config: { color: "#ff0000", opacity: 1.0, strokeWidth: 3 },
  },
  {
    id: "text",
    name: "Text",
    type: AnnotationType.TEXT,
    icon: "📝",
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

type ToolPreset = {
  id: string;
  name: string;
  tool: AnnotationType;
  config: Partial<ToolConfig>;
  builtIn?: boolean;
};

type UseCaseTemplate = {
  id: string;
  name: string;
  description: string;
  preset: ToolPreset;
};

type TemplateProfile = {
  id: string;
  name: string;
  presets: ToolPreset[];
  createdAt: string;
  updatedAt: string;
  builtIn?: boolean;
};

type TemplateProfileExport = {
  version: number;
  exportedAt: string;
  profiles: TemplateProfile[];
};

const LEGACY_PRESET_STORAGE_KEY = "streamslate.annotation-presets.v1";
const PROFILE_STORAGE_KEY = "streamslate.annotation-template-profiles.v1";
const DOCUMENT_PROFILE_STORAGE_KEY =
  "streamslate.annotation-document-profile-map.v1";
const TEMPLATE_PROFILE_EXPORT_VERSION = 1;
const MAX_PRESETS_PER_PROFILE = 12;
const MAX_CUSTOM_PROFILES = 12;
const BUILT_IN_PROFILE_ID = "profile-built-in";

const BUILT_IN_PRESETS: ToolPreset[] = [
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

const BUILT_IN_PROFILE: TemplateProfile = {
  id: BUILT_IN_PROFILE_ID,
  name: "Built-in Essentials",
  presets: BUILT_IN_PRESETS,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  builtIn: true,
};

const USE_CASE_TEMPLATES: UseCaseTemplate[] = [
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

const ANNOTATION_TYPE_SET = new Set(Object.values(AnnotationType));

function isAnnotationType(value: unknown): value is AnnotationType {
  return typeof value === "string" && ANNOTATION_TYPE_SET.has(value as never);
}

function createId(prefix: string): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sanitizeConfig(config: unknown): Partial<ToolConfig> {
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

function sanitizePreset(input: unknown): ToolPreset | null {
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

function sanitizeProfile(input: unknown): TemplateProfile | null {
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

function readDocumentProfileMap(): Record<string, string> {
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

function readCustomProfiles(): TemplateProfile[] {
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

function pickPresetForProfile(
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

function makeUniqueProfileName(
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

function parseImportProfiles(rawJson: string): TemplateProfile[] {
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

function exportProfiles(profiles: TemplateProfile[]): TemplateProfileExport {
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

const INITIAL_CUSTOM_PROFILES = readCustomProfiles();

export const AnnotationTools: React.FC<AnnotationToolsProps> = ({
  activeTool,
  toolConfig,
  onToolSelect,
  onToolConfigChange,
  documentPath,
  className = "",
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [showPresetCreator, setShowPresetCreator] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [customProfiles, setCustomProfiles] = useState<TemplateProfile[]>(
    INITIAL_CUSTOM_PROFILES
  );
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    INITIAL_CUSTOM_PROFILES[0]?.id ?? BUILT_IN_PROFILE_ID
  );
  const [profileNameInput, setProfileNameInput] = useState("");
  const [documentProfileMap, setDocumentProfileMap] = useState<
    Record<string, string>
  >(() => readDocumentProfileMap());
  const [activeDocumentProfileId, setActiveDocumentProfileId] = useState<
    string | null
  >(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const autoAppliedDocumentRef = useRef<string | null>(null);

  const allProfiles = useMemo(
    () => [BUILT_IN_PROFILE, ...customProfiles],
    [customProfiles]
  );

  const selectedProfile = useMemo(
    () =>
      allProfiles.find((profile) => profile.id === selectedProfileId) ??
      BUILT_IN_PROFILE,
    [allProfiles, selectedProfileId]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify(customProfiles)
      );
    } catch {
      // Ignore storage write errors to keep annotation UX functional.
    }
  }, [customProfiles]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        DOCUMENT_PROFILE_STORAGE_KEY,
        JSON.stringify(documentProfileMap)
      );
    } catch {
      // Ignore storage write errors to keep annotation UX functional.
    }
  }, [documentProfileMap]);

  useEffect(() => {
    const exists = allProfiles.some(
      (profile) => profile.id === selectedProfileId
    );
    if (!exists) {
      setSelectedProfileId(allProfiles[0]?.id ?? BUILT_IN_PROFILE_ID);
    }
  }, [allProfiles, selectedProfileId]);

  useEffect(() => {
    setProfileNameInput(selectedProfile.name);
  }, [selectedProfile.id, selectedProfile.name]);

  useEffect(() => {
    const validProfileIds = new Set(allProfiles.map((profile) => profile.id));
    let changed = false;
    const nextMap: Record<string, string> = {};

    for (const [doc, profileId] of Object.entries(documentProfileMap)) {
      if (validProfileIds.has(profileId)) {
        nextMap[doc] = profileId;
      } else {
        changed = true;
      }
    }

    if (changed) {
      setDocumentProfileMap(nextMap);
    }
  }, [allProfiles, documentProfileMap]);

  useEffect(() => {
    if (!documentPath) {
      setActiveDocumentProfileId(null);
      autoAppliedDocumentRef.current = null;
      return;
    }

    const mappedProfileId = documentProfileMap[documentPath] ?? null;
    setActiveDocumentProfileId(mappedProfileId);

    if (autoAppliedDocumentRef.current === documentPath) {
      return;
    }

    autoAppliedDocumentRef.current = documentPath;

    if (!mappedProfileId) {
      return;
    }

    const mappedProfile = allProfiles.find(
      (profile) => profile.id === mappedProfileId
    );
    if (!mappedProfile) {
      return;
    }

    const preset =
      pickPresetForProfile(mappedProfile, activeTool) ??
      pickPresetForProfile(BUILT_IN_PROFILE, activeTool);
    if (!preset) {
      return;
    }

    onToolSelect(preset.tool);
    onToolConfigChange(preset.config);
  }, [
    activeTool,
    allProfiles,
    documentPath,
    documentProfileMap,
    onToolConfigChange,
    onToolSelect,
  ]);

  const handleToolClick = (toolType: AnnotationType) => {
    if (activeTool === toolType) {
      onToolSelect(undefined);
    } else {
      onToolSelect(toolType);
    }
  };

  const handleColorChange = (color: string) => {
    onToolConfigChange({ color });
  };

  const handleOpacityChange = (opacity: number) => {
    onToolConfigChange({ opacity });
  };

  const handleStrokeWidthChange = (strokeWidth: number) => {
    onToolConfigChange({ strokeWidth });
  };

  const applyPreset = (preset: ToolPreset) => {
    onToolSelect(preset.tool);
    onToolConfigChange(preset.config);
  };

  const applyTemplate = (template: UseCaseTemplate) => {
    setActiveTemplateId(template.id);
    applyPreset(template.preset);
  };

  const createProfile = () => {
    const name = makeUniqueProfileName(
      "Template Pack",
      allProfiles.map((profile) => profile.name)
    );
    const now = new Date().toISOString();
    const profile: TemplateProfile = {
      id: createId("profile"),
      name,
      presets: [],
      createdAt: now,
      updatedAt: now,
      builtIn: false,
    };

    setCustomProfiles((prev) =>
      [profile, ...prev].slice(0, MAX_CUSTOM_PROFILES)
    );
    setSelectedProfileId(profile.id);
    setProfileNameInput(name);
  };

  const renameSelectedProfile = () => {
    if (selectedProfile.builtIn) {
      return;
    }

    const trimmed = profileNameInput.trim();
    if (!trimmed) {
      return;
    }

    const uniqueName = makeUniqueProfileName(
      trimmed,
      allProfiles
        .filter((profile) => profile.id !== selectedProfile.id)
        .map((profile) => profile.name)
    );

    setCustomProfiles((prev) =>
      prev.map((profile) =>
        profile.id === selectedProfile.id
          ? {
              ...profile,
              name: uniqueName,
              updatedAt: new Date().toISOString(),
            }
          : profile
      )
    );
    setProfileNameInput(uniqueName);
  };

  const deleteSelectedProfile = () => {
    if (selectedProfile.builtIn) {
      return;
    }

    const deletedId = selectedProfile.id;
    setCustomProfiles((prev) =>
      prev.filter((profile) => profile.id !== deletedId)
    );
    setSelectedProfileId(BUILT_IN_PROFILE_ID);
    setDocumentProfileMap((prev) => {
      const next = { ...prev };
      for (const [doc, profileId] of Object.entries(next)) {
        if (profileId === deletedId) {
          delete next[doc];
        }
      }
      return next;
    });
  };

  const saveCurrentAsPreset = () => {
    const trimmedName = presetName.trim();
    if (!activeTool || !trimmedName) {
      return;
    }

    const newPreset: ToolPreset = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `preset-${Date.now()}`,
      name: trimmedName.slice(0, 32),
      tool: activeTool,
      config: {
        color: toolConfig.color,
        opacity: toolConfig.opacity,
        strokeWidth: toolConfig.strokeWidth,
        fontSize: toolConfig.fontSize,
        fontFamily: toolConfig.fontFamily,
      },
      builtIn: false,
    };

    setCustomProfiles((prev) => {
      let profiles = [...prev];
      let targetProfileId = selectedProfile.id;

      if (selectedProfile.builtIn) {
        const name = makeUniqueProfileName(
          "My Template Pack",
          allProfiles.map((profile) => profile.name)
        );
        const now = new Date().toISOString();
        const autoProfile: TemplateProfile = {
          id: createId("profile"),
          name,
          presets: [],
          createdAt: now,
          updatedAt: now,
          builtIn: false,
        };
        profiles = [autoProfile, ...profiles].slice(0, MAX_CUSTOM_PROFILES);
        targetProfileId = autoProfile.id;
        setSelectedProfileId(targetProfileId);
        setProfileNameInput(name);
      }

      return profiles.map((profile) =>
        profile.id === targetProfileId
          ? {
              ...profile,
              presets: [newPreset, ...profile.presets].slice(
                0,
                MAX_PRESETS_PER_PROFILE
              ),
              updatedAt: new Date().toISOString(),
            }
          : profile
      );
    });
    setPresetName("");
    setShowPresetCreator(false);
  };

  const deletePresetFromSelectedProfile = (presetId: string) => {
    if (selectedProfile.builtIn) {
      return;
    }

    setCustomProfiles((prev) =>
      prev.map((profile) =>
        profile.id === selectedProfile.id
          ? {
              ...profile,
              presets: profile.presets.filter(
                (preset) => preset.id !== presetId
              ),
              updatedAt: new Date().toISOString(),
            }
          : profile
      )
    );
  };

  const applySelectedProfileToDocument = () => {
    if (!documentPath) {
      return;
    }

    const profileId = selectedProfile.id;
    setDocumentProfileMap((prev) => ({
      ...prev,
      [documentPath]: profileId,
    }));
    setActiveDocumentProfileId(profileId);

    const preset =
      pickPresetForProfile(selectedProfile, activeTool) ??
      pickPresetForProfile(BUILT_IN_PROFILE, activeTool);
    if (preset) {
      applyPreset(preset);
    }
  };

  const clearDocumentProfile = () => {
    if (!documentPath) {
      return;
    }

    setDocumentProfileMap((prev) => {
      const next = { ...prev };
      delete next[documentPath];
      return next;
    });
    setActiveDocumentProfileId(null);
  };

  const exportSelectedProfile = () => {
    if (typeof window === "undefined") {
      return;
    }

    const payload = exportProfiles([selectedProfile]);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${
      selectedProfile.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "template-pack"
    }.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportAllCustomProfiles = () => {
    if (typeof window === "undefined" || customProfiles.length === 0) {
      return;
    }

    const payload = exportProfiles(customProfiles);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "streamslate-template-packs.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importProfilesFromFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const importedProfiles = parseImportProfiles(raw);
      if (importedProfiles.length === 0) {
        setImportMessage("No valid template profiles found in JSON.");
        return;
      }

      let firstImportedId: string | null = null;

      setCustomProfiles((prev) => {
        const existingIds = new Set(prev.map((profile) => profile.id));
        const existingNames = new Set(
          [...allProfiles, ...prev].map((profile) => profile.name.toLowerCase())
        );
        const merged = [...prev];

        for (const profile of importedProfiles) {
          let nextId = profile.id;
          if (existingIds.has(nextId) || nextId === BUILT_IN_PROFILE_ID) {
            nextId = createId("profile");
          }

          const nextName = makeUniqueProfileName(profile.name, [
            ...Array.from(existingNames.values()),
          ]);

          const normalizedProfile: TemplateProfile = {
            ...profile,
            id: nextId,
            name: nextName,
            builtIn: false,
            presets: profile.presets
              .map((preset) => sanitizePreset(preset))
              .filter((preset): preset is ToolPreset => Boolean(preset))
              .slice(0, MAX_PRESETS_PER_PROFILE),
            updatedAt: new Date().toISOString(),
          };

          existingIds.add(nextId);
          existingNames.add(nextName.toLowerCase());
          merged.unshift(normalizedProfile);
          firstImportedId = firstImportedId ?? nextId;
        }

        return merged.slice(0, MAX_CUSTOM_PROFILES);
      });

      if (firstImportedId) {
        setSelectedProfileId(firstImportedId);
      }
      setImportMessage(`Imported ${importedProfiles.length} profile(s).`);
    } catch {
      setImportMessage("Invalid JSON file. Import failed.");
    }
  };

  const PRESET_COLORS = [
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

  const selectedProfileHasPresets = selectedProfile.presets.length > 0;
  const activeDocumentProfileName = activeDocumentProfileId
    ? allProfiles.find((profile) => profile.id === activeDocumentProfileId)
        ?.name
    : null;
  const documentLabel = documentPath
    ? documentPath.split(/[\\/]/).pop() || documentPath
    : "No PDF loaded";

  return (
    <div
      className={`flex flex-col bg-surface-primary border border-border-primary rounded-xl shadow-lg p-4 ${className}`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.type)}
            className={`group relative p-3 rounded-lg border transition-all duration-200 transform hover:scale-105 ${
              activeTool === tool.type
                ? "bg-primary border-primary text-white shadow-lg scale-105"
                : "bg-bg-tertiary border-border-primary text-text-secondary hover:bg-surface-secondary hover:border-border-secondary hover:text-text-primary"
            }`}
            title={tool.name}
          >
            <div className="flex items-center justify-center">
              <span className="text-xl">{tool.icon}</span>
              <span
                className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] font-medium whitespace-nowrap transition-opacity duration-200 pointer-events-none ${
                  activeTool === tool.type
                    ? "text-primary opacity-100"
                    : "text-text-tertiary opacity-0 group-hover:opacity-100"
                }`}
              >
                {tool.name}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="border-t border-border-primary mt-4 pt-4">
        <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
          Use-Case Templates
        </div>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {USE_CASE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => applyTemplate(template)}
              className={`text-left rounded-lg border px-2.5 py-2 transition-colors ${
                activeTemplateId === template.id
                  ? "border-primary bg-primary/10"
                  : "border-border-primary bg-bg-tertiary/70 hover:bg-surface-secondary"
              }`}
              title={template.description}
            >
              <div className="text-xs font-semibold text-text-primary">
                {template.name}
              </div>
              <div className="mt-0.5 text-[11px] leading-4 text-text-tertiary">
                {template.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border-primary mt-4 pt-4">
        <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
          Template Profiles
        </div>
        <div className="mt-2 flex items-center gap-2">
          <select
            value={selectedProfile.id}
            onChange={(event) => setSelectedProfileId(event.target.value)}
            className="flex-1 min-w-0 rounded-md border border-border-primary bg-surface-primary px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {allProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
                {profile.builtIn ? " (built-in)" : ""}
              </option>
            ))}
          </select>
          <button
            onClick={createProfile}
            className="rounded-md px-2 py-1.5 text-xs font-semibold bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
          >
            New
          </button>
          {!selectedProfile.builtIn && (
            <button
              onClick={deleteSelectedProfile}
              className="rounded-md px-2 py-1.5 text-xs font-semibold text-error hover:bg-error/10"
            >
              Delete
            </button>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <input
            type="text"
            value={profileNameInput}
            onChange={(event) => setProfileNameInput(event.target.value)}
            maxLength={48}
            disabled={selectedProfile.builtIn}
            className="flex-1 min-w-0 rounded-md border border-border-primary bg-surface-primary px-2.5 py-1.5 text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
            placeholder="Profile name"
          />
          <button
            onClick={renameSelectedProfile}
            disabled={
              selectedProfile.builtIn ||
              !profileNameInput.trim() ||
              profileNameInput.trim() === selectedProfile.name
            }
            className="rounded-md px-2 py-1.5 text-xs font-semibold bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Rename
          </button>
        </div>

        <div className="mt-2 flex items-center flex-wrap gap-1.5">
          <button
            onClick={exportSelectedProfile}
            className="rounded-md px-2 py-1 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
          >
            Export Pack
          </button>
          {customProfiles.length > 0 && (
            <button
              onClick={exportAllCustomProfiles}
              className="rounded-md px-2 py-1 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
            >
              Export All
            </button>
          )}
          <button
            onClick={() => importInputRef.current?.click()}
            className="rounded-md px-2 py-1 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
          >
            Import JSON
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            onChange={importProfilesFromFile}
            className="hidden"
          />
        </div>

        {importMessage && (
          <div className="mt-1 text-[11px] text-text-tertiary">
            {importMessage}
          </div>
        )}

        {selectedProfile.builtIn && (
          <div className="mt-1 text-[11px] text-text-tertiary">
            Built-in profile is read-only. Saving a preset creates a new custom
            profile automatically.
          </div>
        )}
      </div>

      <div className="border-t border-border-primary mt-4 pt-4">
        <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
          Current Document
        </div>
        <div
          className="mt-2 text-xs text-text-secondary truncate"
          title={documentPath}
        >
          {documentLabel}
        </div>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <button
            onClick={applySelectedProfileToDocument}
            disabled={!documentPath}
            className="rounded-md px-2 py-1.5 text-xs font-semibold bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply Selected Pack
          </button>
          <button
            onClick={clearDocumentProfile}
            disabled={!documentPath || !activeDocumentProfileId}
            className="rounded-md px-2 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>
        <div className="mt-1 text-[11px] text-text-tertiary">
          {activeDocumentProfileName
            ? `Applied profile: ${activeDocumentProfileName}`
            : "No profile mapped for this document yet."}
        </div>
      </div>

      <div className="border-t border-border-primary mt-4 pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            Presets In Profile
          </div>
          <button
            onClick={() => setShowPresetCreator((prev) => !prev)}
            disabled={!activeTool}
            className="rounded-md px-2 py-1 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-40 disabled:cursor-not-allowed"
            title={
              activeTool
                ? "Save current tool settings as preset"
                : "Select a tool to save a preset"
            }
          >
            Save Current
          </button>
        </div>

        {showPresetCreator && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset name"
              maxLength={32}
              className="flex-1 min-w-0 rounded-md border border-border-primary bg-surface-primary px-2.5 py-1.5 text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={saveCurrentAsPreset}
              disabled={!presetName.trim() || !activeTool}
              className="rounded-md px-2 py-1.5 text-xs font-semibold bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        )}

        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedProfile.presets.map((preset) => (
            <div
              key={preset.id}
              className="inline-flex items-center rounded-md border border-border-primary bg-bg-tertiary/80"
            >
              <button
                onClick={() => applyPreset(preset)}
                className="px-2 py-1 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-l-md transition-colors"
                title={`Apply ${preset.name}`}
              >
                {preset.name}
              </button>
              {!selectedProfile.builtIn && (
                <button
                  onClick={() => deletePresetFromSelectedProfile(preset.id)}
                  className="px-1.5 py-1 text-xs text-text-tertiary hover:text-error hover:bg-error/10 rounded-r-md transition-colors border-l border-border-primary"
                  title={`Delete ${preset.name}`}
                  aria-label={`Delete preset ${preset.name}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {!selectedProfileHasPresets && (
            <div className="text-xs text-text-tertiary">
              This profile has no presets yet.
            </div>
          )}
        </div>
      </div>

      {activeTool && (
        <div className="border-t border-border-primary mt-4 pt-4">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-all duration-200"
          >
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              Tool Settings
            </span>
            <svg
              className={`w-4 h-4 transform transition-transform ${showConfig ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showConfig && (
            <div className="mt-3 space-y-4 bg-bg-tertiary rounded-lg p-4">
              <div>
                <label className="block text-xs font-semibold text-text-tertiary mb-2 uppercase tracking-wider">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
                        toolConfig.color === color
                          ? "border-primary shadow-lg scale-110 ring-2 ring-primary/20"
                          : "border-border-primary hover:border-border-secondary hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  <div className="relative">
                    <input
                      type="color"
                      value={toolConfig.color}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-8 h-8 rounded-lg border-2 border-border-primary bg-transparent cursor-pointer hover:border-border-secondary transition-colors"
                      title="Custom color"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-text-tertiary mb-2 uppercase tracking-wider">
                  <span>Opacity</span>
                  <span className="text-text-secondary normal-case font-normal">
                    {Math.round(toolConfig.opacity * 100)}%
                  </span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={toolConfig.opacity}
                  onChange={(e) =>
                    handleOpacityChange(parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-bg-tertiary rounded-full appearance-none cursor-pointer slider hover:bg-surface-tertiary transition-colors"
                />
              </div>

              {activeTool !== AnnotationType.HIGHLIGHT && (
                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-text-tertiary mb-2 uppercase tracking-wider">
                    <span>Stroke Width</span>
                    <span className="text-text-secondary normal-case font-normal">
                      {toolConfig.strokeWidth}px
                    </span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={toolConfig.strokeWidth}
                    onChange={(e) =>
                      handleStrokeWidthChange(parseInt(e.target.value))
                    }
                    className="w-full h-2 bg-bg-tertiary rounded-full appearance-none cursor-pointer slider hover:bg-surface-tertiary transition-colors"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
