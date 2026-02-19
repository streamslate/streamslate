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
 * Annotation layer overlay for PDF viewer.
 *
 * Orchestrates drawing interaction (useAnnotationDraw hook),
 * SVG shape rendering, selection handles, floating toolbar,
 * and the text-annotation editor modal.
 */

import React from "react";
import { AnnotationType } from "../../types/pdf.types";
import type { Annotation } from "../../types/pdf.types";
import { TextAnnotationEditor } from "../annotation/TextAnnotationEditor";
import { AnnotationToolbar } from "../annotation/AnnotationToolbar";
import { useAnnotationDraw } from "../../hooks/useAnnotationDraw";
import {
  type Point,
  pointsToSmoothPath,
  getTextDefaults,
  clampOpacity,
  hexToRgba,
  getPointsFromAnnotation,
  type ResizeHandle,
} from "../../lib/annotations/drawing";

interface AnnotationLayerProps {
  pageNumber: number;
  annotations: Annotation[];
  viewport: {
    width: number;
    height: number;
    scale: number;
  };
  activeTool?: AnnotationType;
  toolConfig?: {
    color: string;
    opacity: number;
    strokeWidth: number;
  };
  onAnnotationCreate: (annotation: Partial<Annotation>) => void;
  onAnnotationUpdate: (id: string, updates: Partial<Annotation>) => void;
  onAnnotationDelete: (id: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  className?: string;
}

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  pageNumber,
  annotations,
  viewport,
  activeTool,
  toolConfig = { color: "#ffff00", opacity: 0.5, strokeWidth: 2 },
  onAnnotationCreate,
  onAnnotationUpdate,
  onAnnotationDelete,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  className = "",
}) => {
  const draw = useAnnotationDraw({
    annotations,
    viewport,
    activeTool,
    toolConfig,
    pageNumber,
    onAnnotationCreate,
    onAnnotationUpdate,
    onAnnotationDelete,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
  });

  return (
    <div
      ref={draw.wrapperRef}
      tabIndex={0}
      onKeyDown={draw.handleKeyDown}
      className={`absolute inset-0 pointer-events-auto ${className} focus:outline-none`}
    >
      <svg
        ref={draw.svgRef}
        width={viewport.width}
        height={viewport.height}
        className="absolute inset-0"
        data-testid="annotation-layer"
        style={{ cursor: draw.getCursorStyle() }}
        onMouseDown={draw.handleMouseDown}
        onMouseMove={draw.handleMouseMove}
        onMouseUp={draw.handleMouseUp}
        onMouseLeave={draw.handleMouseUp}
      >
        {/* Existing annotations */}
        {annotations
          .filter((a) => a.pageNumber === pageNumber && a.visible)
          .map((annotation) => (
            <AnnotationShape
              key={annotation.id}
              annotation={annotation}
              viewport={viewport}
              isSelected={draw.selectedAnnotationId === annotation.id}
              onMouseDown={draw.handleAnnotationMouseDown}
              onTextEdit={draw.handleTextEdit}
            />
          ))}

        {/* Drawing preview */}
        <DrawingPreview
          drawingState={draw.drawingState}
          activeTool={activeTool}
          toolConfig={toolConfig}
          viewport={viewport}
        />

        {/* Selection handles */}
        <SelectionHandles
          selectedAnnotation={draw.selectedAnnotation}
          selectionBox={draw.selectionBox}
          viewport={viewport}
          onResizeHandleMouseDown={draw.handleResizeHandleMouseDown}
        />

        {/* Arrow marker for preview */}
        <defs>
          <marker
            id="arrowhead-preview"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={toolConfig.color}
              opacity={toolConfig.opacity}
            />
          </marker>
        </defs>
      </svg>

      {/* Floating toolbar */}
      {draw.selectedAnnotation && draw.toolbarPosition && (
        <AnnotationToolbar
          selectedAnnotation={draw.selectedAnnotation}
          toolbarPosition={draw.toolbarPosition}
          toolbarRef={draw.toolbarRef}
          showStylePanel={draw.showStylePanel}
          onToggleStylePanel={() => draw.setShowStylePanel((prev) => !prev)}
          onUndo={onUndo}
          onRedo={onRedo}
          canUndo={draw.canUndoAction}
          canRedo={draw.canRedoAction}
          onDuplicate={draw.handleDuplicateSelected}
          onDelete={draw.handleDeleteSelected}
          onTextEdit={draw.handleTextEdit}
          onUpdateAnnotation={draw.updateSelectedAnnotation}
          beginHistoryGroup={draw.beginHistoryGroup}
          endHistoryGroup={draw.endHistoryGroup}
          disabled={draw.toolbarDisabled}
        />
      )}

      {/* Text editor modal */}
      {draw.editingTextAnnotation && (
        <TextAnnotationEditor
          annotation={draw.editingTextAnnotation}
          onSave={draw.handleTextEditorSave}
          onCancel={draw.handleTextEditorCancel}
          onDelete={draw.handleTextEditorDelete}
        />
      )}
    </div>
  );
};

export default AnnotationLayer;

// ── SVG sub-components ─────────────────────────────────────────────────

interface AnnotationShapeProps {
  annotation: Annotation;
  viewport: { width: number; height: number; scale: number };
  isSelected: boolean;
  onMouseDown: (annotation: Annotation, event: React.MouseEvent) => void;
  onTextEdit: (id: string) => void;
}

const AnnotationShape: React.FC<AnnotationShapeProps> = ({
  annotation,
  viewport,
  isSelected,
  onMouseDown,
  onTextEdit,
}) => {
  const strokeWidth = annotation.strokeWidth ?? 2;
  const selectionStroke = "rgb(var(--color-primary))";

  const commonProps = {
    "data-annotation-id": annotation.id,
    "data-annotation-type": annotation.type,
    stroke:
      annotation.type === AnnotationType.HIGHLIGHT
        ? isSelected
          ? selectionStroke
          : "transparent"
        : isSelected
          ? selectionStroke
          : annotation.color,
    strokeWidth: isSelected ? strokeWidth + 1 : strokeWidth,
    fill:
      annotation.type === AnnotationType.HIGHLIGHT ? annotation.color : "none",
    fillOpacity:
      annotation.type === AnnotationType.HIGHLIGHT ? annotation.opacity : 0,
    strokeOpacity: annotation.opacity,
    cursor: "pointer" as const,
    onMouseDown: (e: React.MouseEvent) => onMouseDown(annotation, e),
  };

  switch (annotation.type) {
    case AnnotationType.RECTANGLE:
    case AnnotationType.HIGHLIGHT:
      return (
        <rect
          {...commonProps}
          x={annotation.x * viewport.scale}
          y={annotation.y * viewport.scale}
          width={annotation.width * viewport.scale}
          height={annotation.height * viewport.scale}
        />
      );

    case AnnotationType.CIRCLE:
      return (
        <ellipse
          {...commonProps}
          cx={(annotation.x + annotation.width / 2) * viewport.scale}
          cy={(annotation.y + annotation.height / 2) * viewport.scale}
          rx={(annotation.width / 2) * viewport.scale}
          ry={(annotation.height / 2) * viewport.scale}
        />
      );

    case AnnotationType.ARROW: {
      const startX = annotation.x * viewport.scale;
      const startY = annotation.y * viewport.scale;
      const endX = (annotation.x + annotation.width) * viewport.scale;
      const endY = (annotation.y + annotation.height) * viewport.scale;
      const hitStrokeWidth = Math.max(12, (annotation.strokeWidth ?? 2) + 8);
      const markerId = `arrowhead-${annotation.id}`;

      return (
        <g>
          <line
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            data-annotation-id={annotation.id}
            data-annotation-type={annotation.type}
            stroke="transparent"
            strokeWidth={hitStrokeWidth}
            cursor="pointer"
            pointerEvents="stroke"
            onMouseDown={(e: React.MouseEvent) => onMouseDown(annotation, e)}
          />
          <line
            {...commonProps}
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            markerEnd={`url(#${markerId})`}
            pointerEvents="none"
          />
          <defs>
            <marker
              id={markerId}
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill={isSelected ? selectionStroke : annotation.color}
                opacity={annotation.opacity}
              />
            </marker>
          </defs>
        </g>
      );
    }

    case AnnotationType.TEXT: {
      const x = annotation.x * viewport.scale;
      const y = annotation.y * viewport.scale;
      const fontSize = (annotation.fontSize ?? 14) * viewport.scale;
      const defaults = getTextDefaults();
      const backgroundColor =
        annotation.backgroundColor ?? defaults.backgroundColor;
      const backgroundOpacity = clampOpacity(
        annotation.backgroundOpacity,
        defaults.backgroundOpacity
      );
      const textBoxHeight = Math.max(
        annotation.height * viewport.scale,
        fontSize + 8
      );

      return (
        <g
          data-annotation-id={annotation.id}
          data-annotation-type={annotation.type}
          onMouseDown={(e: React.MouseEvent) => onMouseDown(annotation, e)}
          onDoubleClick={(e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            onTextEdit(annotation.id);
          }}
        >
          <rect
            x={x - 2}
            y={y - fontSize}
            width={annotation.width * viewport.scale + 4}
            height={textBoxHeight}
            fill={hexToRgba(
              backgroundColor,
              backgroundOpacity,
              defaults.backgroundColor
            )}
            stroke={isSelected ? selectionStroke : "transparent"}
            strokeWidth={isSelected ? 2 : 0}
            rx={3}
            cursor="pointer"
          />
          <text
            x={x}
            y={y}
            fill={annotation.color}
            opacity={annotation.opacity}
            fontSize={fontSize}
            fontFamily="system-ui, sans-serif"
            cursor="pointer"
            style={{ userSelect: "none" }}
          >
            {annotation.content || "Click to edit..."}
          </text>
        </g>
      );
    }

    case AnnotationType.FREE_DRAW: {
      const points = getPointsFromAnnotation(annotation) ?? [];
      if (points.length < 2) return null;

      const pathData = pointsToSmoothPath(points, viewport.scale);
      const hitStrokeWidth = Math.max(12, (annotation.strokeWidth ?? 2) + 8);

      return (
        <g>
          <path
            data-annotation-id={annotation.id}
            data-annotation-type={annotation.type}
            d={pathData}
            stroke="transparent"
            strokeWidth={hitStrokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            cursor="pointer"
            pointerEvents="stroke"
            onMouseDown={(e: React.MouseEvent) => onMouseDown(annotation, e)}
          />
          <path
            d={pathData}
            stroke={isSelected ? selectionStroke : annotation.color}
            strokeWidth={isSelected ? strokeWidth + 1 : strokeWidth}
            fill="none"
            strokeOpacity={annotation.opacity}
            strokeLinecap="round"
            strokeLinejoin="round"
            cursor="pointer"
            pointerEvents="none"
          />
        </g>
      );
    }

    default:
      return null;
  }
};

// ── Drawing Preview ────────────────────────────────────────────────────

interface DrawingPreviewProps {
  drawingState: {
    isDrawing: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    points: Point[];
  };
  activeTool?: AnnotationType;
  toolConfig: { color: string; opacity: number; strokeWidth: number };
  viewport: { scale: number };
}

const DrawingPreview: React.FC<DrawingPreviewProps> = ({
  drawingState,
  activeTool,
  toolConfig,
  viewport,
}) => {
  if (!drawingState.isDrawing || !activeTool) return null;

  const { startX, startY, currentX, currentY, points } = drawingState;
  const x = Math.min(startX, currentX) * viewport.scale;
  const y = Math.min(startY, currentY) * viewport.scale;
  const width = Math.abs(currentX - startX) * viewport.scale;
  const height = Math.abs(currentY - startY) * viewport.scale;

  const previewProps = {
    stroke: toolConfig.color,
    strokeWidth: toolConfig.strokeWidth,
    fill: activeTool === AnnotationType.HIGHLIGHT ? toolConfig.color : "none",
    fillOpacity:
      activeTool === AnnotationType.HIGHLIGHT ? toolConfig.opacity : 0,
    strokeOpacity: toolConfig.opacity,
    strokeDasharray: "5,5",
  };

  switch (activeTool) {
    case AnnotationType.RECTANGLE:
    case AnnotationType.HIGHLIGHT:
      return (
        <rect {...previewProps} x={x} y={y} width={width} height={height} />
      );

    case AnnotationType.CIRCLE:
      return (
        <ellipse
          {...previewProps}
          cx={x + width / 2}
          cy={y + height / 2}
          rx={width / 2}
          ry={height / 2}
        />
      );

    case AnnotationType.ARROW:
      return (
        <line
          {...previewProps}
          x1={startX * viewport.scale}
          y1={startY * viewport.scale}
          x2={currentX * viewport.scale}
          y2={currentY * viewport.scale}
          markerEnd="url(#arrowhead-preview)"
        />
      );

    case AnnotationType.FREE_DRAW: {
      if (points.length < 2) return null;
      const pathData = pointsToSmoothPath(points, viewport.scale);
      return (
        <path
          d={pathData}
          stroke={toolConfig.color}
          strokeWidth={toolConfig.strokeWidth}
          fill="none"
          strokeOpacity={toolConfig.opacity}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }

    default:
      return null;
  }
};

// ── Selection Handles ──────────────────────────────────────────────────

interface SelectionHandlesProps {
  selectedAnnotation: Annotation | null;
  selectionBox: { x: number; y: number; width: number; height: number } | null;
  viewport: { scale: number };
  onResizeHandleMouseDown: (
    handle: ResizeHandle,
    event: React.MouseEvent
  ) => void;
}

const SelectionHandles: React.FC<SelectionHandlesProps> = ({
  selectedAnnotation,
  selectionBox,
  viewport,
  onResizeHandleMouseDown,
}) => {
  if (!selectedAnnotation || !selectionBox) return null;

  const primary = "rgb(var(--color-primary))";
  const surface = "rgb(var(--color-surface-primary))";
  const r = 5;

  if (selectedAnnotation.type === AnnotationType.FREE_DRAW) {
    return (
      <rect
        x={selectionBox.x}
        y={selectionBox.y}
        width={selectionBox.width}
        height={selectionBox.height}
        fill="none"
        stroke={primary}
        strokeWidth={1}
        strokeDasharray="4,2"
        pointerEvents="none"
      />
    );
  }

  if (selectedAnnotation.type === AnnotationType.ARROW) {
    const startX = selectedAnnotation.x * viewport.scale;
    const startY = selectedAnnotation.y * viewport.scale;
    const endX =
      (selectedAnnotation.x + selectedAnnotation.width) * viewport.scale;
    const endY =
      (selectedAnnotation.y + selectedAnnotation.height) * viewport.scale;

    return (
      <g>
        <circle
          data-testid="annotation-handle-start"
          cx={startX}
          cy={startY}
          r={r}
          fill={primary}
          stroke={surface}
          strokeWidth={1}
          cursor="nwse-resize"
          onMouseDown={(e) => onResizeHandleMouseDown("start", e)}
        />
        <circle
          data-testid="annotation-handle-end"
          cx={endX}
          cy={endY}
          r={r}
          fill={primary}
          stroke={surface}
          strokeWidth={1}
          cursor="nwse-resize"
          onMouseDown={(e) => onResizeHandleMouseDown("end", e)}
        />
      </g>
    );
  }

  const cx = selectionBox.x;
  const cy = selectionBox.y;
  const cw = selectionBox.width;
  const ch = selectionBox.height;

  const handles: Array<{
    id: ResizeHandle;
    x: number;
    y: number;
    cursor: string;
  }> = [
    { id: "nw", x: cx, y: cy, cursor: "nwse-resize" },
    { id: "n", x: cx + cw / 2, y: cy, cursor: "ns-resize" },
    { id: "ne", x: cx + cw, y: cy, cursor: "nesw-resize" },
    { id: "e", x: cx + cw, y: cy + ch / 2, cursor: "ew-resize" },
    { id: "se", x: cx + cw, y: cy + ch, cursor: "nwse-resize" },
    { id: "s", x: cx + cw / 2, y: cy + ch, cursor: "ns-resize" },
    { id: "sw", x: cx, y: cy + ch, cursor: "nesw-resize" },
    { id: "w", x: cx, y: cy + ch / 2, cursor: "ew-resize" },
  ];

  return (
    <g>
      <rect
        x={selectionBox.x}
        y={selectionBox.y}
        width={selectionBox.width}
        height={selectionBox.height}
        fill="none"
        stroke={primary}
        strokeWidth={1}
        strokeDasharray="4,2"
        pointerEvents="none"
      />
      {handles.map((handle) => (
        <circle
          key={handle.id}
          data-testid={`annotation-handle-${handle.id}`}
          cx={handle.x}
          cy={handle.y}
          r={r}
          fill={primary}
          stroke={surface}
          strokeWidth={1}
          cursor={handle.cursor}
          onMouseDown={(e) => onResizeHandleMouseDown(handle.id, e)}
        />
      ))}
    </g>
  );
};
