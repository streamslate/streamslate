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
 * Annotation tool panel: tool selector, use-case templates,
 * template packs (profile CRUD), and tool settings.
 *
 * State management and localStorage helpers live in
 * `src/lib/annotations/presets.ts`. UI sub-sections are in
 * `ToolSelector`, `TemplatePacks`, and `ToolSettings`.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { type AnnotationType, type ToolConfig } from "../../types/pdf.types";
import {
  BUILT_IN_PROFILE,
  BUILT_IN_PROFILE_ID,
  MAX_CUSTOM_PROFILES,
  MAX_PRESETS_PER_PROFILE,
  PROFILE_STORAGE_KEY,
  DOCUMENT_PROFILE_STORAGE_KEY,
  type TemplateProfile,
  type ToolPreset,
  type UseCaseTemplate,
  readCustomProfiles,
  readDocumentProfileMap,
  pickPresetForProfile,
  makeUniqueProfileName,
  createId,
  sanitizePreset,
  parseImportProfiles,
  exportProfiles,
} from "../../lib/annotations/presets";
import { ToolSelector } from "./ToolSelector";
import { TemplatePacks } from "./TemplatePacks";
import { ToolSettings } from "./ToolSettings";

interface AnnotationToolsProps {
  activeTool?: AnnotationType;
  toolConfig: ToolConfig;
  onToolSelect: (tool: AnnotationType | undefined) => void;
  onToolConfigChange: (config: Partial<ToolConfig>) => void;
  documentPath?: string;
  className?: string;
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
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [customProfiles, setCustomProfiles] = useState<TemplateProfile[]>(
    INITIAL_CUSTOM_PROFILES
  );
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    INITIAL_CUSTOM_PROFILES[0]?.id ?? BUILT_IN_PROFILE_ID
  );
  const [documentProfileMap, setDocumentProfileMap] = useState<
    Record<string, string>
  >(() => readDocumentProfileMap());
  const [activeDocumentProfileId, setActiveDocumentProfileId] = useState<
    string | null
  >(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
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

  // ── Persist to localStorage ──────────────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined") return;
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
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        DOCUMENT_PROFILE_STORAGE_KEY,
        JSON.stringify(documentProfileMap)
      );
    } catch {
      // Ignore storage write errors to keep annotation UX functional.
    }
  }, [documentProfileMap]);

  // ── Sync selected profile ────────────────────────────────────────────

  useEffect(() => {
    const exists = allProfiles.some(
      (profile) => profile.id === selectedProfileId
    );
    if (!exists) {
      setSelectedProfileId(allProfiles[0]?.id ?? BUILT_IN_PROFILE_ID);
    }
  }, [allProfiles, selectedProfileId]);

  // ── Clean stale document-profile entries ──────────────────────────────

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

  // ── Auto-apply document profile ──────────────────────────────────────

  useEffect(() => {
    if (!documentPath) {
      setActiveDocumentProfileId(null);
      autoAppliedDocumentRef.current = null;
      return;
    }

    const mappedProfileId = documentProfileMap[documentPath] ?? null;
    setActiveDocumentProfileId(mappedProfileId);

    if (autoAppliedDocumentRef.current === documentPath) return;
    autoAppliedDocumentRef.current = documentPath;

    if (!mappedProfileId) return;

    const mappedProfile = allProfiles.find(
      (profile) => profile.id === mappedProfileId
    );
    if (!mappedProfile) return;

    const preset =
      pickPresetForProfile(mappedProfile, activeTool) ??
      pickPresetForProfile(BUILT_IN_PROFILE, activeTool);
    if (!preset) return;

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

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleToolClick = (toolType: AnnotationType) => {
    onToolSelect(activeTool === toolType ? undefined : toolType);
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
      allProfiles.map((p) => p.name)
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
  };

  const renameSelectedProfile = (newName: string) => {
    if (selectedProfile.builtIn) return;
    const trimmed = newName.trim();
    if (!trimmed) return;

    const uniqueName = makeUniqueProfileName(
      trimmed,
      allProfiles.filter((p) => p.id !== selectedProfile.id).map((p) => p.name)
    );

    setCustomProfiles((prev) =>
      prev.map((p) =>
        p.id === selectedProfile.id
          ? { ...p, name: uniqueName, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const deleteSelectedProfile = () => {
    if (selectedProfile.builtIn) return;
    const deletedId = selectedProfile.id;
    setCustomProfiles((prev) => prev.filter((p) => p.id !== deletedId));
    setSelectedProfileId(BUILT_IN_PROFILE_ID);
    setDocumentProfileMap((prev) => {
      const next = { ...prev };
      for (const [doc, profileId] of Object.entries(next)) {
        if (profileId === deletedId) delete next[doc];
      }
      return next;
    });
  };

  const saveCurrentAsPreset = (presetName: string) => {
    if (!activeTool || !presetName) return;

    const newPreset: ToolPreset = {
      id: createId("preset"),
      name: presetName.slice(0, 32),
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
          allProfiles.map((p) => p.name)
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
      }

      return profiles.map((p) =>
        p.id === targetProfileId
          ? {
              ...p,
              presets: [newPreset, ...p.presets].slice(
                0,
                MAX_PRESETS_PER_PROFILE
              ),
              updatedAt: new Date().toISOString(),
            }
          : p
      );
    });
  };

  const deletePresetFromSelectedProfile = (presetId: string) => {
    if (selectedProfile.builtIn) return;
    setCustomProfiles((prev) =>
      prev.map((p) =>
        p.id === selectedProfile.id
          ? {
              ...p,
              presets: p.presets.filter((ps) => ps.id !== presetId),
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
  };

  const applySelectedProfileToDocument = () => {
    if (!documentPath) return;
    setDocumentProfileMap((prev) => ({
      ...prev,
      [documentPath]: selectedProfile.id,
    }));
    setActiveDocumentProfileId(selectedProfile.id);

    const preset =
      pickPresetForProfile(selectedProfile, activeTool) ??
      pickPresetForProfile(BUILT_IN_PROFILE, activeTool);
    if (preset) applyPreset(preset);
  };

  const clearDocumentProfile = () => {
    if (!documentPath) return;
    setDocumentProfileMap((prev) => {
      const next = { ...prev };
      delete next[documentPath];
      return next;
    });
    setActiveDocumentProfileId(null);
  };

  const exportSelectedProfile = () => {
    if (typeof window === "undefined") return;
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
    if (typeof window === "undefined" || customProfiles.length === 0) return;
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
    if (!file) return;

    try {
      const raw = await file.text();
      const importedProfiles = parseImportProfiles(raw);
      if (importedProfiles.length === 0) {
        setImportMessage("No valid template profiles found in JSON.");
        return;
      }

      let firstImportedId: string | null = null;

      setCustomProfiles((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const existingNames = new Set(
          [...allProfiles, ...prev].map((p) => p.name.toLowerCase())
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
              .map((ps) => sanitizePreset(ps))
              .filter((ps): ps is ToolPreset => Boolean(ps))
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

      if (firstImportedId) setSelectedProfileId(firstImportedId);
      setImportMessage(`Imported ${importedProfiles.length} profile(s).`);
    } catch {
      setImportMessage("Invalid JSON file. Import failed.");
    }
  };

  // ── Derived values ───────────────────────────────────────────────────

  const activeDocumentProfileName = activeDocumentProfileId
    ? (allProfiles.find((p) => p.id === activeDocumentProfileId)?.name ?? null)
    : null;

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div
      className={`flex flex-col bg-surface-primary border border-border-primary rounded-xl shadow-lg p-4 ${className}`}
    >
      <ToolSelector
        activeTool={activeTool}
        activeTemplateId={activeTemplateId}
        onToolClick={handleToolClick}
        onTemplateApply={applyTemplate}
      />

      {/* Template Packs collapsible */}
      <div className="border-t border-border-primary mt-4 pt-4">
        <button
          onClick={() => setShowTemplatePanel((prev) => !prev)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-all duration-200"
        >
          <span className="flex items-center gap-2">Template Packs</span>
          <svg
            className={`w-4 h-4 transform transition-transform ${showTemplatePanel ? "rotate-180" : ""}`}
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

        {showTemplatePanel && (
          <TemplatePacks
            activeTool={activeTool}
            documentPath={documentPath}
            allProfiles={allProfiles}
            selectedProfile={selectedProfile}
            selectedProfileId={selectedProfileId}
            onSelectProfile={setSelectedProfileId}
            onCreateProfile={createProfile}
            onRenameProfile={renameSelectedProfile}
            onDeleteProfile={deleteSelectedProfile}
            onApplyPreset={applyPreset}
            onSavePreset={saveCurrentAsPreset}
            onDeletePreset={deletePresetFromSelectedProfile}
            onApplyProfileToDocument={applySelectedProfileToDocument}
            onClearDocumentProfile={clearDocumentProfile}
            onExportSelected={exportSelectedProfile}
            onExportAll={exportAllCustomProfiles}
            onImportFile={importProfilesFromFile}
            activeDocumentProfileName={activeDocumentProfileName}
            importMessage={importMessage}
            customProfileCount={customProfiles.length}
          />
        )}
      </div>

      {/* Tool Settings collapsible */}
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
            <ToolSettings
              activeTool={activeTool}
              toolConfig={toolConfig}
              onColorChange={(color) => onToolConfigChange({ color })}
              onOpacityChange={(opacity) => onToolConfigChange({ opacity })}
              onStrokeWidthChange={(strokeWidth) =>
                onToolConfigChange({ strokeWidth })
              }
            />
          )}
        </div>
      )}
    </div>
  );
};
