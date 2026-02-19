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
 * Template profile manager: profile selector, presets CRUD,
 * import/export, and document-to-profile mapping.
 * Extracted from AnnotationTools.tsx.
 */

import React, { useRef, useState } from "react";
import type { AnnotationType } from "../../types/pdf.types";
import type {
  ToolPreset,
  TemplateProfile,
} from "../../lib/annotations/presets";

interface TemplatePacksProps {
  activeTool?: AnnotationType;
  documentPath?: string;
  allProfiles: TemplateProfile[];
  selectedProfile: TemplateProfile;
  selectedProfileId: string;
  onSelectProfile: (id: string) => void;
  onCreateProfile: () => void;
  onRenameProfile: (name: string) => void;
  onDeleteProfile: () => void;
  onApplyPreset: (preset: ToolPreset) => void;
  onSavePreset: (name: string) => void;
  onDeletePreset: (presetId: string) => void;
  onApplyProfileToDocument: () => void;
  onClearDocumentProfile: () => void;
  onExportSelected: () => void;
  onExportAll: () => void;
  onImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  activeDocumentProfileName: string | null;
  importMessage: string | null;
  customProfileCount: number;
}

export const TemplatePacks: React.FC<TemplatePacksProps> = ({
  activeTool,
  documentPath,
  allProfiles,
  selectedProfile,
  selectedProfileId,
  onSelectProfile,
  onCreateProfile,
  onRenameProfile,
  onDeleteProfile,
  onApplyPreset,
  onSavePreset,
  onDeletePreset,
  onApplyProfileToDocument,
  onClearDocumentProfile,
  onExportSelected,
  onExportAll,
  onImportFile,
  activeDocumentProfileName,
  importMessage,
  customProfileCount,
}) => {
  const [showPresetCreator, setShowPresetCreator] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [profileNameInput, setProfileNameInput] = useState(
    selectedProfile.name
  );
  const importInputRef = useRef<HTMLInputElement>(null);

  const documentLabel = documentPath
    ? documentPath.split(/[\\/]/).pop() || documentPath
    : "No PDF loaded";

  // Keep profile name input synced when selection changes
  React.useEffect(() => {
    setProfileNameInput(selectedProfile.name);
  }, [selectedProfile.id, selectedProfile.name]);

  const handleSavePreset = () => {
    const trimmed = presetName.trim();
    if (!trimmed || !activeTool) return;
    onSavePreset(trimmed);
    setPresetName("");
    setShowPresetCreator(false);
  };

  return (
    <div className="mt-3 space-y-4 bg-bg-tertiary rounded-lg p-4">
      {/* Profile selector */}
      <div>
        <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
          Template Profiles
        </div>
        <div className="mt-2 flex items-center gap-2">
          <select
            value={selectedProfileId}
            onChange={(event) => onSelectProfile(event.target.value)}
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
            onClick={onCreateProfile}
            className="rounded-md px-2 py-1.5 text-xs font-semibold bg-surface-secondary text-text-secondary hover:text-text-primary"
          >
            New
          </button>
          {!selectedProfile.builtIn && (
            <button
              onClick={onDeleteProfile}
              className="rounded-md px-2 py-1.5 text-xs font-semibold text-error hover:bg-error/10"
            >
              Delete
            </button>
          )}
        </div>

        {/* Rename */}
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
            onClick={() => onRenameProfile(profileNameInput)}
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

        {/* Import / Export */}
        <div className="mt-2 flex items-center flex-wrap gap-1.5">
          <button
            onClick={onExportSelected}
            className="rounded-md px-2 py-1 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
          >
            Export Pack
          </button>
          {customProfileCount > 0 && (
            <button
              onClick={onExportAll}
              className="rounded-md px-2 py-1 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
            >
              Export All
            </button>
          )}
          <button
            onClick={() => importInputRef.current?.click()}
            className="rounded-md px-2 py-1 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
          >
            Import JSON
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            onChange={onImportFile}
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

      {/* Document mapping */}
      <div>
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
            onClick={onApplyProfileToDocument}
            disabled={!documentPath}
            className="rounded-md px-2 py-1.5 text-xs font-semibold bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply Selected Pack
          </button>
          <button
            onClick={onClearDocumentProfile}
            disabled={!documentPath || !activeDocumentProfileName}
            className="rounded-md px-2 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed"
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

      {/* Presets in profile */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            Presets In Profile
          </div>
          <button
            onClick={() => setShowPresetCreator((prev) => !prev)}
            disabled={!activeTool}
            className="rounded-md px-2 py-1 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed"
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
              onClick={handleSavePreset}
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
              className="inline-flex items-center rounded-md border border-border-primary bg-surface-secondary"
            >
              <button
                onClick={() => onApplyPreset(preset)}
                className="px-2 py-1 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-l-md transition-colors"
                title={`Apply ${preset.name}`}
              >
                {preset.name}
              </button>
              {!selectedProfile.builtIn && (
                <button
                  onClick={() => onDeletePreset(preset.id)}
                  className="px-1.5 py-1 text-xs text-text-tertiary hover:text-error hover:bg-error/10 rounded-r-md transition-colors border-l border-border-primary"
                  title={`Delete ${preset.name}`}
                  aria-label={`Delete preset ${preset.name}`}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          {selectedProfile.presets.length === 0 && (
            <div className="text-xs text-text-tertiary">
              This profile has no presets yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
