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
 * Tool selector grid and use-case template buttons.
 * Extracted from AnnotationTools.tsx.
 */

import React from "react";
import type { AnnotationType } from "../../types/pdf.types";
import {
  TOOLS,
  USE_CASE_TEMPLATES,
  type UseCaseTemplate,
} from "../../lib/annotations/presets";

interface ToolSelectorProps {
  activeTool?: AnnotationType;
  activeTemplateId: string | null;
  onToolClick: (toolType: AnnotationType) => void;
  onTemplateApply: (template: UseCaseTemplate) => void;
}

export const ToolSelector: React.FC<ToolSelectorProps> = ({
  activeTool,
  activeTemplateId,
  onToolClick,
  onTemplateApply,
}) => {
  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolClick(tool.type)}
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
              onClick={() => onTemplateApply(template)}
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
    </>
  );
};
