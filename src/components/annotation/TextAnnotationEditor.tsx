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
 * Modal editor for text annotations with rich formatting options
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Annotation } from "../../types/pdf.types";

interface TextAnnotationEditorProps {
  annotation: Annotation;
  onSave: (updates: Partial<Annotation>) => void;
  onCancel: () => void;
  onDelete: () => void;
}

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48];
const PRESET_COLORS = [
  "#000000",
  "#333333",
  "#666666",
  "#ff0000",
  "#ff8c00",
  "#ffff00",
  "#00ff00",
  "#0000ff",
  "#800080",
  "#ffffff",
];

const PRESET_BACKGROUND_COLORS = [
  "#ffffff",
  "#fef3c7",
  "#dbeafe",
  "#dcfce7",
  "#fee2e2",
  "#e2e8f0",
  "#1f2937",
  "#000000",
];

function defaultTextBackground(): { color: string; opacity: number } {
  const isDark = document.documentElement.classList.contains("dark");
  return {
    color: isDark ? "#0a0a0a" : "#ffffff",
    opacity: isDark ? 0.72 : 0.82,
  };
}

function normalizeHexColor(hex: string): string {
  if (/^#[a-f\d]{6}$/i.test(hex)) {
    return hex;
  }

  if (/^#[a-f\d]{3}$/i.test(hex)) {
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  return "#ffffff";
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = normalizeHexColor(hex);
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const clamped = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${clamped})`;
}

export const TextAnnotationEditor: React.FC<TextAnnotationEditorProps> = ({
  annotation,
  onSave,
  onCancel,
  onDelete,
}) => {
  const [content, setContent] = useState(annotation.content || "");
  const [color, setColor] = useState(annotation.color || "#000000");
  const [fontSize, setFontSize] = useState(annotation.fontSize ?? 16);
  const [backgroundColor, setBackgroundColor] = useState(
    annotation.backgroundColor ?? defaultTextBackground().color
  );
  const [backgroundOpacity, setBackgroundOpacity] = useState(
    annotation.backgroundOpacity ?? defaultTextBackground().opacity
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    onSave({
      content,
      color,
      fontSize,
      backgroundColor,
      backgroundOpacity,
      modified: new Date(),
    });
  }, [backgroundColor, backgroundOpacity, content, color, fontSize, onSave]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        handleSave();
      }
    },
    [onCancel, handleSave]
  );

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    },
    [onCancel]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-surface-primary rounded-xl shadow-2xl border border-border-primary w-full max-w-md mx-4 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary">
          <h3 className="text-lg font-semibold text-text-primary">
            Edit Text Annotation
          </h3>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Text input */}
          <div>
            <label className="block text-xs font-semibold text-text-tertiary mb-2 uppercase tracking-wider">
              Text Content
            </label>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your text here..."
              className="w-full h-32 px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
              style={{ color, fontSize }}
            />
            <p className="mt-1 text-xs text-text-tertiary">
              Press Cmd/Ctrl + Enter to save
            </p>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-semibold text-text-tertiary mb-2 uppercase tracking-wider">
              Text Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  onClick={() => setColor(presetColor)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
                    color === presetColor
                      ? "border-primary shadow-lg scale-110 ring-2 ring-primary/20"
                      : "border-border-primary hover:border-border-secondary hover:scale-105"
                  }`}
                  style={{ backgroundColor: presetColor }}
                  title={presetColor}
                />
              ))}
              <div className="relative">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border-2 border-border-primary bg-transparent cursor-pointer hover:border-border-secondary transition-colors"
                  title="Custom color"
                />
              </div>
            </div>
          </div>

          {/* Font size */}
          <div>
            <label className="block text-xs font-semibold text-text-tertiary mb-2 uppercase tracking-wider">
              Font Size
            </label>
            <div className="flex flex-wrap gap-2">
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                    fontSize === size
                      ? "bg-primary text-white"
                      : "bg-bg-tertiary text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Background */}
          <div>
            <label className="block text-xs font-semibold text-text-tertiary mb-2 uppercase tracking-wider">
              Background
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_BACKGROUND_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  onClick={() => setBackgroundColor(presetColor)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
                    backgroundColor === presetColor
                      ? "border-primary shadow-lg scale-110 ring-2 ring-primary/20"
                      : "border-border-primary hover:border-border-secondary hover:scale-105"
                  }`}
                  style={{ backgroundColor: presetColor }}
                  title={presetColor}
                />
              ))}
              <div className="relative">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border-2 border-border-primary bg-transparent cursor-pointer hover:border-border-secondary transition-colors"
                  title="Custom background color"
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="flex items-center justify-between text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">
                <span>Background Opacity</span>
                <span className="normal-case text-text-secondary font-normal">
                  {Math.round(backgroundOpacity * 100)}%
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={backgroundOpacity}
                onChange={(e) =>
                  setBackgroundOpacity(parseFloat(e.target.value))
                }
                className="w-full h-2 bg-bg-tertiary rounded-full appearance-none cursor-pointer slider hover:bg-surface-tertiary transition-colors"
              />
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-xs font-semibold text-text-tertiary mb-2 uppercase tracking-wider">
              Preview
            </label>
            <div className="p-4 bg-bg-tertiary rounded-lg border border-border-primary min-h-[60px]">
              <p
                style={{
                  color,
                  fontSize: `${fontSize}px`,
                  lineHeight: 1.4,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  backgroundColor: hexToRgba(
                    backgroundColor,
                    backgroundOpacity
                  ),
                  padding: "6px 8px",
                  borderRadius: "6px",
                  display: "inline-block",
                }}
              >
                {content || "Your text will appear here..."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-primary bg-bg-tertiary/50 rounded-b-xl">
          <button
            onClick={onDelete}
            className="rounded-lg px-3 py-2 text-sm font-medium text-error transition-colors hover:bg-error/10"
          >
            Delete
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextAnnotationEditor;
