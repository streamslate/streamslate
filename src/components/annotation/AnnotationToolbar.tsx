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
 * Floating contextual toolbar that appears when an annotation is selected.
 * Provides undo/redo, style editing, duplicate, text edit, and delete actions.
 */

import React from "react";
import { AnnotationType } from "../../types/pdf.types";
import type { Annotation } from "../../types/pdf.types";
import {
  PRESET_COLORS,
  FONT_SIZES,
  TEXT_BACKGROUND_COLORS,
  getTextDefaults,
  clampOpacity,
} from "../../lib/annotations/drawing";

export interface AnnotationToolbarProps {
  selectedAnnotation: Annotation;
  toolbarPosition: { left: number; top: number };
  toolbarRef: React.Ref<HTMLDivElement>;
  showStylePanel: boolean;
  onToggleStylePanel: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
  onTextEdit: (id: string) => void;
  onUpdateAnnotation: (updates: Partial<Annotation>) => void;
  beginHistoryGroup: () => void;
  endHistoryGroup: () => void;
  disabled: boolean;
}

export const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  selectedAnnotation,
  toolbarPosition,
  toolbarRef,
  showStylePanel,
  onToggleStylePanel,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onDuplicate,
  onDelete,
  onTextEdit,
  onUpdateAnnotation,
  beginHistoryGroup,
  endHistoryGroup,
  disabled,
}) => {
  return (
    <div
      data-testid="annotation-toolbar"
      ref={toolbarRef}
      className="absolute z-10 rounded-lg border border-border-primary bg-surface-primary/95 backdrop-blur-md shadow-lg px-1.5 py-1"
      style={{
        left: toolbarPosition.left,
        top: toolbarPosition.top,
        pointerEvents: disabled ? "none" : "auto",
        opacity: disabled ? 0.4 : 1,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1">
        <button
          onClick={() => {
            endHistoryGroup();
            onUndo?.();
          }}
          disabled={!canUndo}
          className="rounded-md px-2 py-1 text-xs font-semibold text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          title="Undo (Ctrl/Cmd+Z)"
        >
          Undo
        </button>
        <button
          onClick={() => {
            endHistoryGroup();
            onRedo?.();
          }}
          disabled={!canRedo}
          className="rounded-md px-2 py-1 text-xs font-semibold text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          title="Redo (Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y)"
        >
          Redo
        </button>
        <div className="w-px h-4 bg-[rgb(var(--color-border-primary))] mx-0.5" />
        <button
          onClick={onToggleStylePanel}
          className="rounded-md px-2 py-1 text-xs font-semibold text-text-primary hover:bg-bg-tertiary transition-colors"
          title="Style"
        >
          Style
        </button>
        <button
          onClick={onDuplicate}
          className="rounded-md px-2 py-1 text-xs font-semibold text-text-primary hover:bg-bg-tertiary transition-colors"
          title="Duplicate (Ctrl/Cmd+D)"
        >
          Duplicate
        </button>
        {selectedAnnotation.type === AnnotationType.TEXT && (
          <button
            onClick={() => onTextEdit(selectedAnnotation.id)}
            className="rounded-md px-2 py-1 text-xs font-semibold text-text-primary hover:bg-bg-tertiary transition-colors"
            title="Edit text"
          >
            Edit
          </button>
        )}
        <button
          onClick={onDelete}
          className="rounded-md px-2 py-1 text-xs font-semibold text-error hover:bg-error/10 transition-colors"
          title="Delete annotation"
        >
          Delete
        </button>
      </div>

      {showStylePanel && (
        <StylePanel
          selectedAnnotation={selectedAnnotation}
          onUpdateAnnotation={onUpdateAnnotation}
          beginHistoryGroup={beginHistoryGroup}
          endHistoryGroup={endHistoryGroup}
        />
      )}
    </div>
  );
};

// ── Style Panel (inline sub-component) ─────────────────────────────────

interface StylePanelProps {
  selectedAnnotation: Annotation;
  onUpdateAnnotation: (updates: Partial<Annotation>) => void;
  beginHistoryGroup: () => void;
  endHistoryGroup: () => void;
}

const StylePanel: React.FC<StylePanelProps> = ({
  selectedAnnotation,
  onUpdateAnnotation,
  beginHistoryGroup,
  endHistoryGroup,
}) => {
  const defaults = getTextDefaults();

  return (
    <div className="mt-1 border-t border-border-primary pt-2 px-1 pb-1 w-[240px] space-y-2">
      {/* Color */}
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
            Color
          </label>
          <input
            type="color"
            value={selectedAnnotation.color}
            onChange={(e) => onUpdateAnnotation({ color: e.target.value })}
            className="w-7 h-7 rounded-md border border-border-primary bg-transparent cursor-pointer"
            title="Custom color"
          />
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onUpdateAnnotation({ color })}
              className={`w-6 h-6 rounded-md border transition-all ${
                selectedAnnotation.color === color
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border-primary hover:border-border-secondary"
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div>
        <label className="flex items-center justify-between text-[10px] font-semibold text-text-tertiary mb-1 uppercase tracking-wider">
          <span>Opacity</span>
          <span className="text-text-secondary normal-case font-normal">
            {Math.round(selectedAnnotation.opacity * 100)}%
          </span>
        </label>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={selectedAnnotation.opacity}
          onMouseDown={beginHistoryGroup}
          onMouseUp={endHistoryGroup}
          onChange={(e) =>
            onUpdateAnnotation({ opacity: parseFloat(e.target.value) })
          }
          className="w-full h-2 bg-bg-tertiary rounded-full appearance-none cursor-pointer slider hover:bg-surface-tertiary transition-colors"
        />
      </div>

      {/* Stroke Width (not for highlights or text) */}
      {selectedAnnotation.type !== AnnotationType.HIGHLIGHT &&
        selectedAnnotation.type !== AnnotationType.TEXT && (
          <div>
            <label className="flex items-center justify-between text-[10px] font-semibold text-text-tertiary mb-1 uppercase tracking-wider">
              <span>Stroke</span>
              <span className="text-text-secondary normal-case font-normal">
                {selectedAnnotation.strokeWidth ?? 2}px
              </span>
            </label>
            <input
              type="range"
              min="1"
              max="12"
              step="1"
              value={selectedAnnotation.strokeWidth ?? 2}
              onMouseDown={beginHistoryGroup}
              onMouseUp={endHistoryGroup}
              onChange={(e) =>
                onUpdateAnnotation({
                  strokeWidth: parseInt(e.target.value, 10),
                })
              }
              className="w-full h-2 bg-bg-tertiary rounded-full appearance-none cursor-pointer slider hover:bg-surface-tertiary transition-colors"
            />
          </div>
        )}

      {/* Text-specific controls */}
      {selectedAnnotation.type === AnnotationType.TEXT && (
        <div>
          <label className="block text-[10px] font-semibold text-text-tertiary mb-1 uppercase tracking-wider">
            Font Size
          </label>
          <div className="flex flex-wrap gap-1.5">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => onUpdateAnnotation({ fontSize: size })}
                className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                  (selectedAnnotation.fontSize ?? 14) === size
                    ? "bg-primary text-white"
                    : "bg-bg-tertiary text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          {/* Text Background */}
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                Background
              </label>
              <input
                type="color"
                value={
                  selectedAnnotation.backgroundColor ?? defaults.backgroundColor
                }
                onChange={(e) =>
                  onUpdateAnnotation({ backgroundColor: e.target.value })
                }
                className="w-7 h-7 rounded-md border border-border-primary bg-transparent cursor-pointer"
                title="Text background color"
              />
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {TEXT_BACKGROUND_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdateAnnotation({ backgroundColor: color })}
                  className={`w-6 h-6 rounded-md border transition-all ${
                    (selectedAnnotation.backgroundColor ??
                      defaults.backgroundColor) === color
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border-primary hover:border-border-secondary"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Background Opacity */}
          <div className="mt-2">
            <label className="flex items-center justify-between text-[10px] font-semibold text-text-tertiary mb-1 uppercase tracking-wider">
              <span>Text Background Opacity</span>
              <span className="text-text-secondary normal-case font-normal">
                {Math.round(
                  clampOpacity(
                    selectedAnnotation.backgroundOpacity,
                    defaults.backgroundOpacity
                  ) * 100
                )}
                %
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="1.0"
              step="0.05"
              value={clampOpacity(
                selectedAnnotation.backgroundOpacity,
                defaults.backgroundOpacity
              )}
              onMouseDown={beginHistoryGroup}
              onMouseUp={endHistoryGroup}
              onChange={(e) =>
                onUpdateAnnotation({
                  backgroundOpacity: parseFloat(e.target.value),
                })
              }
              className="w-full h-2 bg-bg-tertiary rounded-full appearance-none cursor-pointer slider hover:bg-surface-tertiary transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  );
};
