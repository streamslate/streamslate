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

const TOOL_GROUPS = [
  { id: "markup", label: "Markup" },
  { id: "shape", label: "Shapes" },
  { id: "freeform", label: "Notes" },
] as const;

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
      <div className="space-y-3">
        {TOOL_GROUPS.map((group) => {
          const groupTools = TOOLS.filter((tool) => tool.category === group.id);
          if (groupTools.length === 0) return null;

          return (
            <div key={group.id} className="space-y-1.5">
              <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                {group.label}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {groupTools.map((tool) => {
                  const selected = activeTool === tool.type;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => onToolClick(tool.type)}
                      aria-label={tool.name}
                      aria-pressed={selected}
                      className={`relative flex h-14 min-w-0 items-center justify-center rounded-lg border text-xl transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                        selected
                          ? "border-primary bg-primary text-white shadow-sm"
                          : "border-border-primary bg-bg-tertiary text-text-secondary hover:border-border-secondary hover:bg-surface-secondary hover:text-text-primary"
                      }`}
                      title={`${tool.name}: ${tool.description}`}
                    >
                      <span aria-hidden="true">{tool.icon}</span>
                      {selected && (
                        <span className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-white/80" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
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
