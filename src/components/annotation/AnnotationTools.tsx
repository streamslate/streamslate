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
      className={`flex flex-col bg-gray-800 border border-gray-700 rounded-lg p-2 ${className}`}
    >
      <div className="flex flex-wrap gap-1 mb-2">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.type)}
            className={`p-2 rounded-md border text-sm font-medium transition-all duration-200 ${activeTool === tool.type ? "bg-blue-600 border-blue-500 text-white shadow-md" : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500"}`}
            title={tool.name}
          >
            <div className="flex flex-col items-center space-y-1">
              <span className="text-lg">{tool.icon}</span>
              <span className="text-xs">{tool.name}</span>
            </div>
          </button>
        ))}
      </div>

      {activeTool && (
        <div className="border-t border-gray-700 pt-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full flex items-center justify-between p-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <span>Tool Settings</span>
            <span
              className={`transform transition-transform ${showConfig ? "rotate-180" : ""}`}
            >
              ▼
            </span>
          </button>

          {showConfig && (
            <div className="mt-2 space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Color
                </label>
                <div className="flex flex-wrap gap-1">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`w-6 h-6 rounded border-2 transition-all ${toolConfig.color === color ? "border-white shadow-md scale-110" : "border-gray-600 hover:border-gray-400"}`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  <div className="relative">
                    <input
                      type="color"
                      value={toolConfig.color}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-6 h-6 rounded border-2 border-gray-600 bg-transparent cursor-pointer"
                      title="Custom color"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Opacity: {Math.round(toolConfig.opacity * 100)}%
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
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {activeTool !== AnnotationType.HIGHLIGHT && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Stroke Width: {toolConfig.strokeWidth}px
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
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
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
