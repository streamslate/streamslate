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
import { TOOLS } from "../../lib/annotations/presets";

const TOOL_GROUPS = [
  { id: "markup", label: "Markup" },
  { id: "shape", label: "Shapes" },
  { id: "freeform", label: "Notes" },
] as const;

interface ToolSelectorProps {
  activeTool?: AnnotationType;
  onToolClick: (toolType: AnnotationType) => void;
}

export const ToolSelector: React.FC<ToolSelectorProps> = ({
  activeTool,
  onToolClick,
}) => {
  return (
    <div className="flex min-w-0 max-w-full items-center gap-2 overflow-x-auto">
      {TOOL_GROUPS.map((group, groupIndex) => {
        const groupTools = TOOLS.filter((tool) => tool.category === group.id);
        if (groupTools.length === 0) return null;

        return (
          <React.Fragment key={group.id}>
            {groupIndex > 0 && (
              <div
                aria-hidden="true"
                className="h-7 w-px shrink-0 bg-[rgb(var(--color-border-primary))]"
              />
            )}
            <div
              role="group"
              aria-label={group.label}
              className="flex shrink-0 items-center gap-1.5"
            >
              {groupTools.map((tool) => {
                const selected = activeTool === tool.type;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => onToolClick(tool.type)}
                    aria-label={tool.name}
                    aria-pressed={selected}
                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
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
          </React.Fragment>
        );
      })}
    </div>
  );
};
