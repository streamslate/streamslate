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
 * Annotation layer overlay for PDF viewer
 */

import React, { useRef, useCallback, useState } from "react";
import { AnnotationType } from "../../types/pdf.types";
import type { Annotation } from "../../types/pdf.types";

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
  className?: string;
}

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  pageNumber,
  annotations,
  viewport,
  activeTool,
  toolConfig = { color: "#ffff00", opacity: 0.5, strokeWidth: 2 },
  onAnnotationCreate,
  onAnnotationUpdate: _onAnnotationUpdate,
  onAnnotationDelete,
  className = "",
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(
    null
  );

  // Get cursor style based on active tool
  const getCursorStyle = () => {
    if (!activeTool) return "default";

    switch (activeTool) {
      case AnnotationType.HIGHLIGHT:
        return "text";
      case AnnotationType.RECTANGLE:
      case AnnotationType.CIRCLE:
        return "crosshair";
      case AnnotationType.FREE_DRAW:
        return "crosshair";
      case AnnotationType.ARROW:
        return "crosshair";
      default:
        return "default";
    }
  };

  // Convert screen coordinates to PDF coordinates
  const screenToPdfCoords = useCallback(
    (screenX: number, screenY: number) => {
      if (!svgRef.current) return { x: 0, y: 0 };

      const rect = svgRef.current.getBoundingClientRect();
      const x = (screenX - rect.left) / viewport.scale;
      const y = (screenY - rect.top) / viewport.scale;

      return { x, y };
    },
    [viewport.scale]
  );

  // Handle mouse down for starting annotation creation
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (!activeTool) return;

      event.preventDefault();
      const { x, y } = screenToPdfCoords(event.clientX, event.clientY);

      setDrawingState({
        isDrawing: true,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
      });
    },
    [activeTool, screenToPdfCoords]
  );

  // Handle mouse move for updating annotation preview
  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!drawingState.isDrawing) return;

      const { x, y } = screenToPdfCoords(event.clientX, event.clientY);

      setDrawingState((prev) => ({
        ...prev,
        currentX: x,
        currentY: y,
      }));
    },
    [drawingState.isDrawing, screenToPdfCoords]
  );

  // Handle mouse up for completing annotation creation
  const handleMouseUp = useCallback(() => {
    if (!drawingState.isDrawing || !activeTool) return;

    const { startX, startY, currentX, currentY } = drawingState;
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    // Only create annotation if it has meaningful size
    if (width > 5 && height > 5) {
      const annotation: Partial<Annotation> = {
        id: crypto.randomUUID(),
        type: activeTool,
        pageNumber,
        x: Math.min(startX, currentX),
        y: Math.min(startY, currentY),
        width,
        height,
        content: "",
        color: toolConfig.color,
        opacity: toolConfig.opacity,
        created: new Date(),
        modified: new Date(),
        visible: true,
      };

      onAnnotationCreate(annotation);
    }

    setDrawingState({
      isDrawing: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });
  }, [drawingState, activeTool, pageNumber, toolConfig, onAnnotationCreate]);

  // Handle annotation selection
  const handleAnnotationClick = useCallback(
    (annotationId: string, event: React.MouseEvent) => {
      event.stopPropagation();
      setSelectedAnnotation(annotationId);
    },
    []
  );

  // Handle annotation deletion
  const handleDeleteAnnotation = useCallback(
    (annotationId: string) => {
      onAnnotationDelete(annotationId);
      setSelectedAnnotation(null);
    },
    [onAnnotationDelete]
  );

  // Render annotation based on type
  const renderAnnotation = (annotation: Annotation) => {
    const key = annotation.id;
    const isSelected = selectedAnnotation === annotation.id;
    const strokeWidth = toolConfig.strokeWidth;

    const commonProps = {
      key,
      stroke: isSelected ? "#00ff00" : annotation.color,
      strokeWidth: isSelected ? strokeWidth + 1 : strokeWidth,
      fill:
        annotation.type === AnnotationType.HIGHLIGHT
          ? annotation.color
          : "none",
      fillOpacity:
        annotation.type === AnnotationType.HIGHLIGHT ? annotation.opacity : 0,
      strokeOpacity: annotation.opacity,
      cursor: "pointer",
      onClick: (e: React.MouseEvent) => handleAnnotationClick(annotation.id, e),
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

        return (
          <g key={key}>
            <line
              {...commonProps}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              markerEnd="url(#arrowhead)"
            />
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill={annotation.color} />
              </marker>
            </defs>
          </g>
        );
      }

      default:
        return null;
    }
  };

  // Render preview while drawing
  const renderDrawingPreview = () => {
    if (!drawingState.isDrawing || !activeTool) return null;

    const { startX, startY, currentX, currentY } = drawingState;
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

      default:
        return null;
    }
  };

  return (
    <div className={`absolute inset-0 pointer-events-auto ${className}`}>
      <svg
        ref={svgRef}
        width={viewport.width}
        height={viewport.height}
        className="absolute inset-0"
        style={{ cursor: getCursorStyle() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Render existing annotations */}
        {annotations
          .filter(
            (annotation) =>
              annotation.pageNumber === pageNumber && annotation.visible
          )
          .map(renderAnnotation)}

        {/* Render drawing preview */}
        {renderDrawingPreview()}

        {/* Arrow marker definition for preview */}
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

      {/* Delete button for selected annotation */}
      {selectedAnnotation && (
        <button
          onClick={() => handleDeleteAnnotation(selectedAnnotation)}
          className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
          title="Delete annotation"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default AnnotationLayer;
