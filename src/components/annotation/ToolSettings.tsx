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
 * Tool configuration panel: color picker, opacity slider, stroke width.
 * Extracted from AnnotationTools.tsx.
 */

import React from "react";
import { AnnotationType, type ToolConfig } from "../../types/pdf.types";
import { PRESET_COLORS } from "../../lib/annotations/presets";

interface ToolSettingsProps {
  activeTool: AnnotationType;
  toolConfig: ToolConfig;
  onColorChange: (color: string) => void;
  onOpacityChange: (opacity: number) => void;
  onStrokeWidthChange: (strokeWidth: number) => void;
}

export const ToolSettings: React.FC<ToolSettingsProps> = ({
  activeTool,
  toolConfig,
  onColorChange,
  onOpacityChange,
  onStrokeWidthChange,
}) => {
  return (
    <div className="mt-3 space-y-4 bg-bg-tertiary rounded-lg p-4">
      {/* Color */}
      <div>
        <label className="block text-xs font-semibold text-text-tertiary mb-2 uppercase tracking-wider">
          Color
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
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
              onChange={(e) => onColorChange(e.target.value)}
              className="w-8 h-8 rounded-lg border-2 border-border-primary bg-transparent cursor-pointer hover:border-border-secondary transition-colors"
              title="Custom color"
            />
          </div>
        </div>
      </div>

      {/* Opacity */}
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
          onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-bg-tertiary rounded-full appearance-none cursor-pointer slider hover:bg-surface-tertiary transition-colors"
        />
      </div>

      {/* Stroke Width (not for highlights) */}
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
            onChange={(e) => onStrokeWidthChange(parseInt(e.target.value))}
            className="w-full h-2 bg-bg-tertiary rounded-full appearance-none cursor-pointer slider hover:bg-surface-tertiary transition-colors"
          />
        </div>
      )}
    </div>
  );
};
