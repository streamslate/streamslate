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

import React, { useState } from "react";
import { AnnotationType, Tool, ToolConfig } from "../../types/pdf.types";

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

export const AnnotationTools: React.FC<AnnotationToolsProps> = ({
  activeTool,
  toolConfig,
  onToolSelect,
  onToolConfigChange,
  className = "",
}) => {
  const [showConfig, setShowConfig] = useState(false);

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
      className={`flex flex-col bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-3 ${className}`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.type)}
            className={`group relative p-2.5 rounded-lg border text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
              activeTool === tool.type
                ? "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/25 scale-105"
                : "bg-gray-700/80 border-gray-600/50 text-gray-300 hover:bg-gray-600/80 hover:border-gray-500/50 hover:shadow-md"
            }`}
            title={tool.name}
          >
            <div className="flex items-center justify-center">
              <span className="text-xl">{tool.icon}</span>
              <span
                className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] font-medium whitespace-nowrap transition-opacity duration-200 pointer-events-none ${
                  activeTool === tool.type
                    ? "text-blue-400 opacity-100"
                    : "text-gray-400 opacity-0 group-hover:opacity-100"
                }`}
              >
                {tool.name}
              </span>
            </div>
          </button>
        ))}
      </div>

      {activeTool && (
        <div className="border-t border-gray-700/50 mt-3 pt-3">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
          >
            <span className="flex items-center gap-2">
              <svg
                className="w-3 h-3"
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
              className={`w-3 h-3 transform transition-transform ${showConfig ? "rotate-180" : ""}`}
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
            <div className="mt-3 space-y-4 bg-gray-900/50 rounded-lg p-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                  Color
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`w-7 h-7 rounded-lg border-2 transition-all duration-200 ${
                        toolConfig.color === color
                          ? "border-white shadow-lg scale-110 ring-2 ring-white/20"
                          : "border-gray-600/50 hover:border-gray-400/50 hover:scale-105"
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
                      className="w-7 h-7 rounded-lg border-2 border-gray-600/50 bg-transparent cursor-pointer hover:border-gray-400/50 transition-colors"
                      title="Custom color"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                  <span>Opacity</span>
                  <span className="text-gray-500 normal-case font-normal">
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
                  className="w-full h-1.5 bg-gray-700/50 rounded-full appearance-none cursor-pointer slider hover:bg-gray-700 transition-colors"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${toolConfig.opacity * 100}%, rgb(55 65 81 / 0.5) ${toolConfig.opacity * 100}%, rgb(55 65 81 / 0.5) 100%)`,
                  }}
                />
              </div>

              {activeTool !== AnnotationType.HIGHLIGHT && (
                <div>
                  <label className="flex items-center justify-between text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    <span>Stroke Width</span>
                    <span className="text-gray-500 normal-case font-normal">
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
                    className="w-full h-1.5 bg-gray-700/50 rounded-full appearance-none cursor-pointer slider hover:bg-gray-700 transition-colors"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(toolConfig.strokeWidth - 1) * 11.11}%, rgb(55 65 81 / 0.5) ${(toolConfig.strokeWidth - 1) * 11.11}%, rgb(55 65 81 / 0.5) 100%)`,
                    }}
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
