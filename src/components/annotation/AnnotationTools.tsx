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
  USE_CASE_TEMPLATES,
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
  const [openPanel, setOpenPanel] = useState<"templates" | "settings" | null>(
    null
  );
  const [showTemplatePacks, setShowTemplatePacks] = useState(false);
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
  const toolbarRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!openPanel) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!toolbarRef.current?.contains(event.target as Node)) {
        setOpenPanel(null);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPanel(null);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openPanel]);

  useEffect(() => {
    if (!activeTool && openPanel === "settings") setOpenPanel(null);
  }, [activeTool, openPanel]);

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
    setOpenPanel(null);
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
      ref={toolbarRef}
      data-testid="annotation-tools"
      className={`relative z-20 flex max-w-full flex-nowrap items-center gap-2 rounded-xl border border-border-primary bg-surface-primary p-2 shadow-lg ${className}`}
    >
      <ToolSelector activeTool={activeTool} onToolClick={handleToolClick} />

      <div
        aria-hidden="true"
        className="h-7 w-px bg-[rgb(var(--color-border-primary))]"
      />

      <button
        type="button"
        onClick={() =>
          setOpenPanel((current) =>
            current === "templates" ? null : "templates"
          )
        }
        aria-expanded={openPanel === "templates"}
        aria-controls="annotation-templates-panel"
        className={`h-10 rounded-lg border px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          openPanel === "templates"
            ? "border-primary bg-primary/10 text-primary"
            : "border-border-primary bg-bg-tertiary text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
        }`}
      >
        Templates
      </button>

      {activeTool && (
        <button
          type="button"
          onClick={() =>
            setOpenPanel((current) =>
              current === "settings" ? null : "settings"
            )
          }
          aria-expanded={openPanel === "settings"}
          aria-controls="annotation-settings-panel"
          className={`h-10 rounded-lg border px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
            openPanel === "settings"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border-primary bg-bg-tertiary text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
          }`}
        >
          Tool Settings
        </button>
      )}

      {openPanel === "templates" && (
        <div
          id="annotation-templates-panel"
          data-testid="annotation-tools-popover"
          role="dialog"
          aria-label="Annotation templates"
          className="absolute left-0 top-full z-30 mt-2 max-h-[min(70vh,36rem)] w-[min(42rem,calc(100vw-3rem))] overflow-y-auto rounded-xl border border-border-primary bg-surface-primary p-4 shadow-xl"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-text-primary">
                Use-Case Templates
              </div>
              <div className="mt-0.5 text-xs text-text-tertiary">
                Apply a ready-made annotation style without covering the PDF.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpenPanel(null)}
              aria-label="Close annotation templates"
              className="rounded-lg p-2 text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {USE_CASE_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => applyTemplate(template)}
                className={`rounded-lg border px-3 py-2 text-left transition-colors ${
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

          <div className="mt-4 border-t border-border-primary pt-3">
            <button
              type="button"
              onClick={() => setShowTemplatePacks((current) => !current)}
              aria-expanded={showTemplatePacks}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            >
              <span>Template Packs</span>
              <svg
                className={`h-4 w-4 transform transition-transform ${showTemplatePacks ? "rotate-180" : ""}`}
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

            {showTemplatePacks && (
              <div className="mt-3 rounded-lg bg-bg-tertiary p-4">
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
              </div>
            )}
          </div>
        </div>
      )}

      {openPanel === "settings" && activeTool && (
        <div
          id="annotation-settings-panel"
          data-testid="annotation-tools-popover"
          role="dialog"
          aria-label="Annotation tool settings"
          className="absolute left-0 top-full z-30 mt-2 max-h-[min(70vh,36rem)] w-[min(24rem,calc(100vw-3rem))] overflow-y-auto rounded-xl border border-border-primary bg-surface-primary p-4 shadow-xl"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-semibold text-text-primary">
              Tool Settings
            </div>
            <button
              type="button"
              onClick={() => setOpenPanel(null)}
              aria-label="Close tool settings"
              className="rounded-lg p-2 text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <ToolSettings
            activeTool={activeTool}
            toolConfig={toolConfig}
            onColorChange={(color) => onToolConfigChange({ color })}
            onOpacityChange={(opacity) => onToolConfigChange({ opacity })}
            onStrokeWidthChange={(strokeWidth) =>
              onToolConfigChange({ strokeWidth })
            }
          />
        </div>
      )}
    </div>
  );
};
