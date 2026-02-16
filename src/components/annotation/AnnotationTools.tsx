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

import React, { useEffect, useMemo, useState } from "react";
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

const PRESET_STORAGE_KEY = "streamslate.annotation-presets.v1";
const MAX_CUSTOM_PRESETS = 12;

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

function readCustomPresets(): ToolPreset[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(PRESET_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((entry) => {
        return (
          entry &&
          typeof entry === "object" &&
          typeof entry.id === "string" &&
          typeof entry.name === "string" &&
          typeof entry.tool === "string" &&
          entry.config &&
          typeof entry.config === "object"
        );
      })
      .slice(0, MAX_CUSTOM_PRESETS) as ToolPreset[];
  } catch {
    return [];
  }
}

export const AnnotationTools: React.FC<AnnotationToolsProps> = ({
  activeTool,
  toolConfig,
  onToolSelect,
  onToolConfigChange,
  className = "",
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [showPresetCreator, setShowPresetCreator] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [customPresets, setCustomPresets] = useState<ToolPreset[]>(() =>
    readCustomPresets()
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        PRESET_STORAGE_KEY,
        JSON.stringify(customPresets)
      );
    } catch {
      // Ignore storage write errors to keep annotation UX functional.
    }
  }, [customPresets]);

  const allPresets = useMemo(
    () => [...BUILT_IN_PRESETS, ...customPresets],
    [customPresets]
  );

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

    setCustomPresets((prev) =>
      [newPreset, ...prev].slice(0, MAX_CUSTOM_PRESETS)
    );
    setPresetName("");
    setShowPresetCreator(false);
  };

  const deleteCustomPreset = (id: string) => {
    setCustomPresets((prev) => prev.filter((preset) => preset.id !== id));
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
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            Presets
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
          {allPresets.map((preset) => {
            const isCustom = !preset.builtIn;
            return (
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
                {isCustom && (
                  <button
                    onClick={() => deleteCustomPreset(preset.id)}
                    className="px-1.5 py-1 text-xs text-text-tertiary hover:text-error hover:bg-error/10 rounded-r-md transition-colors border-l border-border-primary"
                    title={`Delete ${preset.name}`}
                    aria-label={`Delete preset ${preset.name}`}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
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
