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

import React, { useMemo } from "react";
import { usePDF } from "../../hooks/usePDF";
import { AnnotationType } from "../../types/pdf.types";
import type { Annotation } from "../../types/pdf.types";
import { NDIControls } from "../debug/NDIControls";

type Panel = "files" | "annotations" | "settings";

/** Get a human-readable label for an annotation type */
function getAnnotationTypeLabel(type: AnnotationType): string {
  const labels: Record<AnnotationType, string> = {
    [AnnotationType.TEXT]: "Text",
    [AnnotationType.HIGHLIGHT]: "Highlight",
    [AnnotationType.UNDERLINE]: "Underline",
    [AnnotationType.STRIKETHROUGH]: "Strikethrough",
    [AnnotationType.ARROW]: "Arrow",
    [AnnotationType.RECTANGLE]: "Rectangle",
    [AnnotationType.CIRCLE]: "Circle",
    [AnnotationType.FREE_DRAW]: "Drawing",
    [AnnotationType.STAMP]: "Stamp",
    [AnnotationType.NOTE]: "Note",
  };
  return labels[type] || type;
}

/** Get an icon for an annotation type */
function getAnnotationIcon(type: AnnotationType): React.ReactElement {
  switch (type) {
    case AnnotationType.HIGHLIGHT:
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
      );
    case AnnotationType.RECTANGLE:
      return (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
        </svg>
      );
    case AnnotationType.CIRCLE:
      return (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="9" strokeWidth={2} />
        </svg>
      );
    case AnnotationType.ARROW:
      return (
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
            d="M17 8l4 4m0 0l-4 4m4-4H3"
          />
        </svg>
      );
    case AnnotationType.FREE_DRAW:
      return (
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
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      );
    case AnnotationType.TEXT:
    case AnnotationType.NOTE:
      return (
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
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      );
    default:
      return (
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
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      );
  }
}

interface SidebarProps {
  transparentBg: boolean;
  sidebarOpen: boolean;
  presenterMode: boolean;
  activePanel: Panel;
  isLoaded: boolean;
  darkMode: boolean;
  onSetActivePanel: (panel: Panel) => void;
  onOpenPDF: () => void;
  onSetDarkMode: (value: boolean) => void;
  onSetTransparentBg: (value: boolean) => void;
  onSetBorderlessMode: (value: boolean) => void;
  borderlessMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  transparentBg,
  sidebarOpen,
  presenterMode,
  activePanel,
  isLoaded,
  darkMode,
  onSetActivePanel,
  onOpenPDF,
  onSetDarkMode,
  onSetTransparentBg,
  onSetBorderlessMode,
  borderlessMode,
}) => {
  // Access annotation state and actions from PDF hook
  const {
    annotations,
    goToPage,
    removeAnnotation,
    updateAnnotation,
    exportDocument,
  } = usePDF();

  // Compute total annotation count and grouped list
  const { totalCount, groupedAnnotations } = useMemo(() => {
    let count = 0;
    const grouped: Array<{ pageNumber: number; items: Annotation[] }> = [];

    // Sort page numbers for consistent ordering
    const pageNumbers = Array.from(annotations.keys()).sort((a, b) => a - b);

    for (const pageNum of pageNumbers) {
      const pageAnnotations = annotations.get(pageNum) || [];
      if (pageAnnotations.length > 0) {
        count += pageAnnotations.length;
        grouped.push({
          pageNumber: pageNum,
          items: [...pageAnnotations].sort(
            (a, b) => b.modified.getTime() - a.modified.getTime()
          ),
        });
      }
    }

    return { totalCount: count, groupedAnnotations: grouped };
  }, [annotations]);

  // Handle clicking on an annotation to navigate to its page
  const handleAnnotationClick = (annotation: Annotation) => {
    goToPage(annotation.pageNumber);
  };

  // Handle toggling annotation visibility
  const handleToggleVisibility = (annotation: Annotation) => {
    updateAnnotation(annotation.id, { visible: !annotation.visible });
  };

  // Handle deleting an annotation
  const handleDeleteAnnotation = (
    e: React.MouseEvent,
    annotation: Annotation
  ) => {
    e.stopPropagation();
    removeAnnotation(annotation.id);
  };

  return (
    <aside
      className={`${
        transparentBg
          ? "bg-surface-primary/90 backdrop-blur-md"
          : "bg-surface-primary"
      } border-r border-border-primary transition-all duration-300 flex-shrink-0 ${
        sidebarOpen && !presenterMode ? "w-72" : "w-0"
      } overflow-hidden`}
    >
      <div className="h-full flex flex-col overflow-hidden">
        {/* Panel Tabs */}
        <div className="flex border-b border-border-primary p-2 gap-2">
          <button
            onClick={() => onSetActivePanel("files")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
              activePanel === "files"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
            }`}
          >
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Files</span>
          </button>
          <button
            onClick={() => onSetActivePanel("annotations")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 relative ${
              activePanel === "annotations"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
            }`}
          >
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
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
              />
            </svg>
            <span>Annotations</span>
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {totalCount > 99 ? "99+" : totalCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onSetActivePanel("settings")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
              activePanel === "settings"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
            }`}
          >
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>Settings</span>
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 p-6 overflow-y-auto animate-fade-in">
          {activePanel === "files" && (
            <div className="space-y-4">
              <div className="bg-surface-secondary p-6 rounded-lg border border-border-primary animate-slide-up">
                <div className="flex items-center gap-3 mb-4">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-text-primary">
                    PDF Files
                  </h3>
                </div>

                {/* Open PDF Button */}
                <div className="mb-4">
                  <button onClick={onOpenPDF} className="btn-dashed">
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
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="font-medium">Open PDF File</span>
                  </button>
                </div>

                {/* Export PDF Button */}
                <div className="mb-4">
                  <button
                    onClick={exportDocument}
                    className="btn-dashed w-full justify-center"
                    disabled={!isLoaded}
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
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    <span className="font-medium">Export with Annotations</span>
                  </button>
                </div>

                <div className="p-4 bg-bg-tertiary rounded-md border border-border-primary">
                  <p className="text-sm text-text-tertiary text-center">
                    {isLoaded ? "PDF loaded successfully" : "No PDF loaded"}
                  </p>
                </div>
              </div>
            </div>
          )}
          {activePanel === "annotations" && (
            <div className="space-y-4">
              <div className="bg-surface-secondary p-6 rounded-lg border border-border-primary animate-slide-up">
                <div className="flex items-center gap-3 mb-4">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-text-primary">
                    Annotations
                  </h3>
                  {totalCount > 0 && (
                    <span className="ml-auto text-sm text-text-secondary">
                      {totalCount} total
                    </span>
                  )}
                </div>

                {totalCount === 0 ? (
                  <div className="p-4 bg-bg-tertiary rounded-md border border-border-primary">
                    <p className="text-sm text-text-tertiary text-center">
                      No annotations yet
                    </p>
                    <p className="text-xs text-text-tertiary text-center mt-2">
                      Use the toolbar to add highlights, shapes, or drawings
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[calc(100vh-320px)] overflow-y-auto">
                    {groupedAnnotations.map(({ pageNumber, items }) => (
                      <div key={pageNumber} className="space-y-2">
                        {/* Page header */}
                        <button
                          onClick={() => goToPage(pageNumber)}
                          className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors w-full"
                        >
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
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Page {pageNumber}
                          <span className="ml-auto text-xs text-text-tertiary">
                            {items.length} annotation
                            {items.length !== 1 ? "s" : ""}
                          </span>
                        </button>

                        {/* Annotation items */}
                        <div className="space-y-1 ml-2">
                          {items.map((annotation) => (
                            <div
                              key={annotation.id}
                              onClick={() => handleAnnotationClick(annotation)}
                              className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all group ${
                                annotation.visible
                                  ? "bg-bg-tertiary hover:bg-surface-tertiary border border-border-primary"
                                  : "bg-bg-tertiary/50 hover:bg-surface-tertiary/50 border border-border-primary/50 opacity-60"
                              }`}
                            >
                              {/* Color indicator */}
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor: annotation.color,
                                  opacity: annotation.opacity,
                                }}
                              />

                              {/* Icon and type */}
                              <span className="text-text-secondary flex-shrink-0">
                                {getAnnotationIcon(annotation.type)}
                              </span>

                              {/* Type label and content preview */}
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-text-primary truncate block">
                                  {getAnnotationTypeLabel(annotation.type)}
                                </span>
                                {annotation.content && (
                                  <span className="text-xs text-text-tertiary truncate block">
                                    {annotation.content}
                                  </span>
                                )}
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* Toggle visibility */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleVisibility(annotation);
                                  }}
                                  className="p-1 rounded hover:bg-bg-primary text-text-tertiary hover:text-text-primary transition-colors"
                                  title={
                                    annotation.visible
                                      ? "Hide annotation"
                                      : "Show annotation"
                                  }
                                >
                                  {annotation.visible ? (
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
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                      />
                                    </svg>
                                  ) : (
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
                                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                      />
                                    </svg>
                                  )}
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={(e) =>
                                    handleDeleteAnnotation(e, annotation)
                                  }
                                  className="p-1 rounded hover:bg-red-500/20 text-text-tertiary hover:text-red-500 transition-colors"
                                  title="Delete annotation"
                                >
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
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {activePanel === "settings" && (
            <div className="space-y-4">
              <div className="bg-surface-secondary p-6 rounded-lg border border-border-primary animate-slide-up">
                <div className="flex items-center gap-3 mb-6">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-text-primary">
                    Settings
                  </h3>
                </div>
                <div className="space-y-4">
                  <label className="flex items-center p-3 bg-bg-tertiary rounded-lg border border-border-primary hover:bg-surface-tertiary transition-all cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary bg-surface-primary border-border-secondary rounded focus:ring-primary focus:ring-2 mr-3"
                      checked={darkMode}
                      onChange={(e) => onSetDarkMode(e.target.checked)}
                    />
                    <span className="text-sm font-medium text-text-primary">
                      Dark Theme
                    </span>
                  </label>
                  <label className="flex items-center p-3 bg-bg-tertiary rounded-lg border border-border-primary hover:bg-surface-tertiary transition-all cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary bg-surface-primary border-border-secondary rounded focus:ring-primary focus:ring-2 mr-3"
                      defaultChecked
                    />
                    <span className="text-sm font-medium text-text-primary">
                      Auto-save
                    </span>
                  </label>
                  <label className="flex items-center p-3 bg-bg-tertiary rounded-lg border border-border-primary hover:bg-surface-tertiary transition-all cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary bg-surface-primary border-border-secondary rounded focus:ring-primary focus:ring-2 mr-3"
                      checked={transparentBg}
                      onChange={(e) => onSetTransparentBg(e.target.checked)}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-text-primary">
                        Transparent Background
                      </span>
                      <p className="text-xs text-text-tertiary mt-1">
                        Enable window capture in OBS with transparency support
                      </p>
                    </div>
                  </label>
                  {transparentBg && (
                    <div className="ml-4 p-3 bg-primary/10 border border-primary/30 rounded-lg animate-slide-up">
                      <p className="text-sm text-primary">
                        ✨ Transparent mode is active! Perfect for stream
                        overlays.
                      </p>
                    </div>
                  )}
                  <label className="flex items-center p-3 bg-bg-tertiary rounded-lg border border-border-primary hover:bg-surface-tertiary transition-all cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary bg-surface-primary border-border-secondary rounded focus:ring-primary focus:ring-2 mr-3"
                      checked={borderlessMode}
                      onChange={(e) => onSetBorderlessMode(e.target.checked)}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-text-primary">
                        Borderless Window
                      </span>
                      <p className="text-xs text-text-tertiary mt-1">
                        Clean window mode for streaming
                      </p>
                    </div>
                  </label>
                  {borderlessMode && (
                    <div className="ml-4 p-3 bg-primary/10 border border-primary/30 rounded-lg animate-slide-up">
                      <p className="text-sm text-primary">
                        🖼️ Borderless mode enabled! Minimal UI for streaming.
                      </p>
                    </div>
                  )}

                  {/* Experimental Section */}
                  <div className="pt-6 border-t border-border-secondary space-y-4">
                    <h4 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider">
                      Experimental (NDI)
                    </h4>
                    <NDIControls />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
