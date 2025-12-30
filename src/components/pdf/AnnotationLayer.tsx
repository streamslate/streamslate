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

interface Point {
  x: number;
  y: number;
}

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  points: Point[]; // For free-draw
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
  className = "",
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    points: [],
  });
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(
    null
  );
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");

  // Get cursor style based on active tool
  const getCursorStyle = () => {
    if (!activeTool) return "default";

    switch (activeTool) {
      case AnnotationType.HIGHLIGHT:
        return "text";
      case AnnotationType.RECTANGLE:
      case AnnotationType.CIRCLE:
      case AnnotationType.ARROW:
        return "crosshair";
      case AnnotationType.FREE_DRAW:
        return "crosshair";
      case AnnotationType.TEXT:
        return "text";
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

      // TEXT annotation: create immediately on click
      if (activeTool === AnnotationType.TEXT) {
        const annotation: Partial<Annotation> = {
          id: crypto.randomUUID(),
          type: AnnotationType.TEXT,
          pageNumber,
          x,
          y,
          width: 200, // Default width for text box
          height: 30, // Default height for text box
          content: "",
          color: toolConfig.color,
          opacity: 1.0,
          created: new Date(),
          modified: new Date(),
          visible: true,
        };
        onAnnotationCreate(annotation);
        // Start editing the newly created text annotation
        setEditingTextId(annotation.id!);
        setTextInput("");
        return;
      }

      // FREE_DRAW: start collecting points
      if (activeTool === AnnotationType.FREE_DRAW) {
        setDrawingState({
          isDrawing: true,
          startX: x,
          startY: y,
          currentX: x,
          currentY: y,
          points: [{ x, y }],
        });
        return;
      }

      // Other tools: standard rectangle-based drawing
      setDrawingState({
        isDrawing: true,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
        points: [],
      });
    },
    [activeTool, screenToPdfCoords, pageNumber, toolConfig, onAnnotationCreate]
  );

  // Handle mouse move for updating annotation preview
  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!drawingState.isDrawing) return;

      const { x, y } = screenToPdfCoords(event.clientX, event.clientY);

      // FREE_DRAW: add point to the path
      if (activeTool === AnnotationType.FREE_DRAW) {
        setDrawingState((prev) => ({
          ...prev,
          currentX: x,
          currentY: y,
          points: [...prev.points, { x, y }],
        }));
        return;
      }

      // Other tools: update current position
      setDrawingState((prev) => ({
        ...prev,
        currentX: x,
        currentY: y,
      }));
    },
    [drawingState.isDrawing, screenToPdfCoords, activeTool]
  );

  // Handle mouse up for completing annotation creation
  const handleMouseUp = useCallback(() => {
    if (!drawingState.isDrawing || !activeTool) return;

    const { startX, startY, currentX, currentY, points } = drawingState;

    // FREE_DRAW: create annotation with points
    if (activeTool === AnnotationType.FREE_DRAW && points.length > 2) {
      // Calculate bounding box from points
      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const annotation: Partial<Annotation> & { points?: Point[] } = {
        id: crypto.randomUUID(),
        type: AnnotationType.FREE_DRAW,
        pageNumber,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        content: JSON.stringify(points), // Store points in content as JSON
        color: toolConfig.color,
        opacity: toolConfig.opacity,
        created: new Date(),
        modified: new Date(),
        visible: true,
      };

      onAnnotationCreate(annotation);

      setDrawingState({
        isDrawing: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        points: [],
      });
      return;
    }

    // Other tools: rectangle-based
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
      points: [],
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

      case AnnotationType.TEXT: {
        const x = annotation.x * viewport.scale;
        const y = annotation.y * viewport.scale;
        const fontSize = 14 * viewport.scale;

        return (
          <g
            key={key}
            onClick={(e: React.MouseEvent) =>
              handleAnnotationClick(annotation.id, e)
            }
          >
            {/* Background for text visibility */}
            <rect
              x={x - 2}
              y={y - fontSize}
              width={annotation.width * viewport.scale + 4}
              height={fontSize + 8}
              fill="rgba(255, 255, 255, 0.8)"
              stroke={isSelected ? "#00ff00" : "transparent"}
              strokeWidth={isSelected ? 2 : 0}
              rx={3}
              cursor="pointer"
            />
            <text
              x={x}
              y={y}
              fill={annotation.color}
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
        // Parse points from content JSON
        let points: Point[] = [];
        try {
          points = JSON.parse(annotation.content || "[]");
        } catch {
          points = [];
        }

        if (points.length < 2) return null;

        // Convert points to SVG polyline format
        const pointsString = points
          .map((p) => `${p.x * viewport.scale},${p.y * viewport.scale}`)
          .join(" ");

        return (
          <polyline
            key={key}
            points={pointsString}
            stroke={isSelected ? "#00ff00" : annotation.color}
            strokeWidth={isSelected ? strokeWidth + 1 : strokeWidth}
            fill="none"
            strokeOpacity={annotation.opacity}
            strokeLinecap="round"
            strokeLinejoin="round"
            cursor="pointer"
            onClick={(e: React.MouseEvent) =>
              handleAnnotationClick(annotation.id, e)
            }
          />
        );
      }

      default:
        return null;
    }
  };

  // Render preview while drawing
  const renderDrawingPreview = () => {
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
        const pointsString = points
          .map((p) => `${p.x * viewport.scale},${p.y * viewport.scale}`)
          .join(" ");
        return (
          <polyline
            points={pointsString}
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

  // Handle text annotation editing
  const handleTextEdit = useCallback(
    (annotationId: string) => {
      const annotation = annotations.find((a) => a.id === annotationId);
      if (annotation && annotation.type === AnnotationType.TEXT) {
        setEditingTextId(annotationId);
        setTextInput(annotation.content);
      }
    },
    [annotations]
  );

  // Handle text input change
  const handleTextInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTextInput(e.target.value);
    },
    []
  );

  // Handle text input submit
  const handleTextInputSubmit = useCallback(() => {
    if (editingTextId) {
      onAnnotationUpdate(editingTextId, {
        content: textInput,
        modified: new Date(),
      });
      setEditingTextId(null);
      setTextInput("");
    }
  }, [editingTextId, textInput, onAnnotationUpdate]);

  // Handle text input key press
  const handleTextInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleTextInputSubmit();
      } else if (e.key === "Escape") {
        setEditingTextId(null);
        setTextInput("");
      }
    },
    [handleTextInputSubmit]
  );

  // Get editing text annotation position
  const getEditingAnnotation = useCallback(() => {
    return annotations.find((a) => a.id === editingTextId);
  }, [annotations, editingTextId]);

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

      {/* Action buttons for selected annotation */}
      {selectedAnnotation && (
        <div className="absolute top-2 right-2 flex gap-1">
          {/* Edit button for text annotations */}
          {annotations.find(
            (a) => a.id === selectedAnnotation && a.type === AnnotationType.TEXT
          ) && (
            <button
              onClick={() => handleTextEdit(selectedAnnotation)}
              className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
              title="Edit text"
            >
              ✎
            </button>
          )}
          <button
            onClick={() => handleDeleteAnnotation(selectedAnnotation)}
            className="p-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
            title="Delete annotation"
          >
            ✕
          </button>
        </div>
      )}

      {/* Text editing overlay */}
      {editingTextId &&
        (() => {
          const editingAnnotation = getEditingAnnotation();
          if (!editingAnnotation) return null;

          return (
            <div
              className="absolute"
              style={{
                left: editingAnnotation.x * viewport.scale,
                top: editingAnnotation.y * viewport.scale - 14 * viewport.scale,
              }}
            >
              <input
                type="text"
                value={textInput}
                onChange={handleTextInputChange}
                onKeyDown={handleTextInputKeyDown}
                onBlur={handleTextInputSubmit}
                autoFocus
                className="px-2 py-1 text-sm border border-blue-500 rounded shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{
                  color: editingAnnotation.color,
                  minWidth: "200px",
                }}
                placeholder="Enter text..."
              />
            </div>
          );
        })()}
    </div>
  );
};

export default AnnotationLayer;
