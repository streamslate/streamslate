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

import React, { useRef, useCallback, useMemo, useState } from "react";
import { AnnotationType } from "../../types/pdf.types";
import type { Annotation } from "../../types/pdf.types";
import { TextAnnotationEditor } from "../annotation/TextAnnotationEditor";
import { usePDFStore } from "../../stores/pdf.store";

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

/**
 * Convert an array of points to a smooth SVG path using Catmull-Rom splines.
 * This creates smooth curves through all points rather than jagged polylines.
 */
function pointsToSmoothPath(points: Point[], scale: number): string {
  if (points.length < 2) return "";
  if (points.length === 2) {
    // Just draw a line for 2 points
    return `M ${points[0].x * scale},${points[0].y * scale} L ${points[1].x * scale},${points[1].y * scale}`;
  }

  // Simplify points if there are too many (performance optimization)
  const simplified = simplifyPoints(points, 1.5);
  if (simplified.length < 2) return "";

  const scaledPoints = simplified.map((p) => ({
    x: p.x * scale,
    y: p.y * scale,
  }));

  // Start the path
  let path = `M ${scaledPoints[0].x},${scaledPoints[0].y}`;

  // Use Catmull-Rom spline interpolation
  for (let i = 0; i < scaledPoints.length - 1; i++) {
    const p0 = scaledPoints[Math.max(0, i - 1)];
    const p1 = scaledPoints[i];
    const p2 = scaledPoints[Math.min(scaledPoints.length - 1, i + 1)];
    const p3 = scaledPoints[Math.min(scaledPoints.length - 1, i + 2)];

    // Calculate control points for cubic bezier
    const tension = 0.5;
    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 3;
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 3;
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 3;
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 3;

    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return path;
}

/**
 * Douglas-Peucker algorithm for point simplification.
 * Reduces the number of points while preserving the shape.
 */
function simplifyPoints(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points;

  // Find the point with maximum distance from the line between start and end
  let maxDist = 0;
  let maxIndex = 0;

  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDist > tolerance) {
    const left = simplifyPoints(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPoints(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  // Otherwise, just return start and end
  return [start, end];
}

/**
 * Calculate perpendicular distance from a point to a line.
 */
function perpendicularDistance(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lineLengthSq = dx * dx + dy * dy;

  if (lineLengthSq === 0) {
    // Start and end are the same point
    return Math.sqrt(
      (point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2
    );
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
        lineLengthSq
    )
  );

  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;

  return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
}

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  points: Point[]; // For free-draw
}

function getPointsFromAnnotation(annotation: Annotation): Point[] | null {
  if (annotation.points && annotation.points.length > 0) {
    return annotation.points;
  }

  try {
    const parsed = JSON.parse(annotation.content || "[]");
    if (!Array.isArray(parsed)) {
      return null;
    }
    const points: Point[] = [];
    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) {
        continue;
      }

      const payload = entry as Record<string, unknown>;
      const x = payload.x;
      const y = payload.y;

      if (typeof x !== "number" || !Number.isFinite(x)) {
        continue;
      }
      if (typeof y !== "number" || !Number.isFinite(y)) {
        continue;
      }

      points.push({ x, y });
    }
    return points.length > 0 ? points : null;
  } catch {
    return null;
  }
}

function bboxFromPoints(points: Point[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

type ResizeHandle =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "start"
  | "end";

interface DragState {
  id: string;
  start: Point; // pdf coords
  origin: Annotation;
  hasMoved: boolean;
}

interface ResizeState {
  id: string;
  handle: ResizeHandle;
  start: Point; // pdf coords
  origin: Annotation;
  hasMoved: boolean;
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    points: [],
  });
  const selectedAnnotationId = usePDFStore(
    (state) => state.selectedAnnotationId
  );
  const selectAnnotation = usePDFStore((state) => state.selectAnnotation);
  const [editingTextAnnotation, setEditingTextAnnotation] =
    useState<Annotation | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);

  const selectedAnnotation = useMemo(() => {
    if (!selectedAnnotationId) {
      return null;
    }
    return (
      annotations.find(
        (annotation) => annotation.id === selectedAnnotationId
      ) ?? null
    );
  }, [annotations, selectedAnnotationId]);

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
      event.preventDefault();
      wrapperRef.current?.focus();
      selectAnnotation(null);

      if (!activeTool) {
        return;
      }
      const { x, y } = screenToPdfCoords(event.clientX, event.clientY);

      // TEXT annotation: create immediately on click and open editor
      if (activeTool === AnnotationType.TEXT) {
        const newAnnotation: Annotation = {
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
          fontSize: 16,
          created: new Date(),
          modified: new Date(),
          visible: true,
        };
        onAnnotationCreate(newAnnotation);
        // Open the text editor modal for the new annotation
        setEditingTextAnnotation(newAnnotation);
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
    [
      activeTool,
      screenToPdfCoords,
      pageNumber,
      toolConfig,
      onAnnotationCreate,
      selectAnnotation,
    ]
  );

  // Handle mouse move for updating annotation preview
  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      // Resize has highest priority
      if (resizeState && selectedAnnotation) {
        const { x, y } = screenToPdfCoords(event.clientX, event.clientY);

        const minSize = 5;
        const origin = resizeState.origin;

        if (origin.type === AnnotationType.ARROW) {
          const endX = origin.x + origin.width;
          const endY = origin.y + origin.height;

          if (resizeState.handle === "start") {
            onAnnotationUpdate(origin.id, {
              x,
              y,
              width: endX - x,
              height: endY - y,
            });
          } else if (resizeState.handle === "end") {
            onAnnotationUpdate(origin.id, {
              width: x - origin.x,
              height: y - origin.y,
            });
          }
          return;
        }

        const left = origin.x;
        const top = origin.y;
        const right = origin.x + origin.width;
        const bottom = origin.y + origin.height;

        let nextLeft = left;
        let nextTop = top;
        let nextRight = right;
        let nextBottom = bottom;

        switch (resizeState.handle) {
          case "nw":
            nextLeft = x;
            nextTop = y;
            break;
          case "n":
            nextTop = y;
            break;
          case "ne":
            nextRight = x;
            nextTop = y;
            break;
          case "e":
            nextRight = x;
            break;
          case "se":
            nextRight = x;
            nextBottom = y;
            break;
          case "s":
            nextBottom = y;
            break;
          case "sw":
            nextLeft = x;
            nextBottom = y;
            break;
          case "w":
            nextLeft = x;
            break;
        }

        // Enforce minimum size
        if (nextRight - nextLeft < minSize) {
          if (
            resizeState.handle === "w" ||
            resizeState.handle === "nw" ||
            resizeState.handle === "sw"
          ) {
            nextLeft = nextRight - minSize;
          } else {
            nextRight = nextLeft + minSize;
          }
        }
        if (nextBottom - nextTop < minSize) {
          if (
            resizeState.handle === "n" ||
            resizeState.handle === "nw" ||
            resizeState.handle === "ne"
          ) {
            nextTop = nextBottom - minSize;
          } else {
            nextBottom = nextTop + minSize;
          }
        }

        onAnnotationUpdate(origin.id, {
          x: nextLeft,
          y: nextTop,
          width: nextRight - nextLeft,
          height: nextBottom - nextTop,
        });
        if (!resizeState.hasMoved) {
          setResizeState((prev) => (prev ? { ...prev, hasMoved: true } : prev));
        }
        return;
      }

      if (dragState && selectedAnnotation) {
        const { x, y } = screenToPdfCoords(event.clientX, event.clientY);
        const dx = x - dragState.start.x;
        const dy = y - dragState.start.y;

        const origin = dragState.origin;
        const next: Partial<Annotation> = {
          x: origin.x + dx,
          y: origin.y + dy,
        };

        if (origin.type === AnnotationType.FREE_DRAW) {
          const points = getPointsFromAnnotation(origin) ?? [];
          if (points.length > 0) {
            const movedPoints = points.map((p) => ({
              x: p.x + dx,
              y: p.y + dy,
            }));
            const bbox = bboxFromPoints(movedPoints);
            Object.assign(next, {
              x: bbox.x,
              y: bbox.y,
              width: bbox.width,
              height: bbox.height,
              points: movedPoints,
              content: JSON.stringify(movedPoints),
            });
          }
        }

        onAnnotationUpdate(origin.id, next);
        if (!dragState.hasMoved && (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1)) {
          setDragState((prev) => (prev ? { ...prev, hasMoved: true } : prev));
        }
        return;
      }

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
    [
      drawingState.isDrawing,
      screenToPdfCoords,
      activeTool,
      dragState,
      onAnnotationUpdate,
      resizeState,
      selectedAnnotation,
    ]
  );

  // Handle mouse up for completing annotation creation
  const handleMouseUp = useCallback(() => {
    if (resizeState) {
      if (resizeState.hasMoved) {
        onAnnotationUpdate(resizeState.id, { modified: new Date() });
      }
      setResizeState(null);
      return;
    }

    if (dragState) {
      if (dragState.hasMoved) {
        onAnnotationUpdate(dragState.id, { modified: new Date() });
      }
      setDragState(null);
      return;
    }

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
        content: JSON.stringify(points), // Legacy/back-compat
        color: toolConfig.color,
        opacity: toolConfig.opacity,
        strokeWidth: toolConfig.strokeWidth,
        created: new Date(),
        modified: new Date(),
        visible: true,
        points,
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
        strokeWidth: toolConfig.strokeWidth,
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
  }, [
    activeTool,
    dragState,
    drawingState,
    onAnnotationCreate,
    onAnnotationUpdate,
    pageNumber,
    resizeState,
    toolConfig,
  ]);

  const handleAnnotationMouseDown = useCallback(
    (annotation: Annotation, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      wrapperRef.current?.focus();

      selectAnnotation(annotation.id);

      // Only start drag on primary button.
      if (event.button !== 0) {
        return;
      }

      const start = screenToPdfCoords(event.clientX, event.clientY);
      setDragState({
        id: annotation.id,
        start,
        origin: annotation,
        hasMoved: false,
      });
    },
    [screenToPdfCoords, selectAnnotation]
  );

  const handleDeleteSelected = useCallback(() => {
    if (!selectedAnnotationId) {
      return;
    }
    onAnnotationDelete(selectedAnnotationId);
  }, [onAnnotationDelete, selectedAnnotationId]);

  // Render annotation based on type
  const renderAnnotation = (annotation: Annotation) => {
    const key = annotation.id;
    const isSelected = selectedAnnotationId === annotation.id;
    const strokeWidth = annotation.strokeWidth ?? 2;
    const selectionStroke = "rgb(var(--color-primary))";

    const commonProps = {
      key,
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
        annotation.type === AnnotationType.HIGHLIGHT
          ? annotation.color
          : "none",
      fillOpacity:
        annotation.type === AnnotationType.HIGHLIGHT ? annotation.opacity : 0,
      strokeOpacity: annotation.opacity,
      cursor: "pointer",
      onMouseDown: (e: React.MouseEvent) =>
        handleAnnotationMouseDown(annotation, e),
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

        return (
          <g key={key}>
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
              onMouseDown={(e: React.MouseEvent) =>
                handleAnnotationMouseDown(annotation, e)
              }
            />
            <line
              {...commonProps}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              markerEnd="url(#arrowhead)"
              pointerEvents="none"
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
        const fontSize = (annotation.fontSize ?? 14) * viewport.scale;
        const selectionStroke = "rgb(var(--color-primary))";

        return (
          <g
            key={key}
            data-annotation-id={annotation.id}
            data-annotation-type={annotation.type}
            onMouseDown={(e: React.MouseEvent) =>
              handleAnnotationMouseDown(annotation, e)
            }
            onDoubleClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              handleTextEdit(annotation.id);
            }}
          >
            {/* Background for text visibility */}
            <rect
              x={x - 2}
              y={y - fontSize}
              width={annotation.width * viewport.scale + 4}
              height={fontSize + 8}
              fill="rgba(255, 255, 255, 0.8)"
              stroke={isSelected ? selectionStroke : "transparent"}
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
        const points = getPointsFromAnnotation(annotation) ?? [];

        if (points.length < 2) return null;

        // Convert points to smooth SVG path
        const pathData = pointsToSmoothPath(points, viewport.scale);
        const hitStrokeWidth = Math.max(12, (annotation.strokeWidth ?? 2) + 8);
        const selectionStroke = "rgb(var(--color-primary))";

        return (
          <g key={key}>
            {/* Wide invisible hit target */}
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
              onMouseDown={(e: React.MouseEvent) =>
                handleAnnotationMouseDown(annotation, e)
              }
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
        // Use smooth path for preview as well
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

  // Handle text annotation editing - open the modal
  const handleTextEdit = useCallback(
    (annotationId: string) => {
      const annotation = annotations.find((a) => a.id === annotationId);
      if (annotation && annotation.type === AnnotationType.TEXT) {
        setEditingTextAnnotation(annotation);
      }
    },
    [annotations]
  );

  // Handle saving text annotation from modal
  const handleTextEditorSave = useCallback(
    (updates: Partial<Annotation>) => {
      if (editingTextAnnotation) {
        onAnnotationUpdate(editingTextAnnotation.id, updates);
        setEditingTextAnnotation(null);
      }
    },
    [editingTextAnnotation, onAnnotationUpdate]
  );

  // Handle canceling text editor
  const handleTextEditorCancel = useCallback(() => {
    // If the annotation was just created and has no content, delete it
    if (editingTextAnnotation && !editingTextAnnotation.content) {
      onAnnotationDelete(editingTextAnnotation.id);
    }
    setEditingTextAnnotation(null);
  }, [editingTextAnnotation, onAnnotationDelete]);

  // Handle deleting from text editor
  const handleTextEditorDelete = useCallback(() => {
    if (editingTextAnnotation) {
      onAnnotationDelete(editingTextAnnotation.id);
      setEditingTextAnnotation(null);
    }
  }, [editingTextAnnotation, onAnnotationDelete]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        (target?.isContentEditable ?? false);

      if (event.key === "Escape") {
        event.preventDefault();
        if (drawingState.isDrawing) {
          setDrawingState({
            isDrawing: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            points: [],
          });
        }
        setDragState(null);
        setResizeState(null);
        selectAnnotation(null);
        return;
      }

      if (isTyping) {
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        handleDeleteSelected();
      }
    },
    [
      drawingState.isDrawing,
      handleDeleteSelected,
      selectAnnotation,
      setDrawingState,
    ]
  );

  const handleResizeHandleMouseDown = useCallback(
    (handle: ResizeHandle, event: React.MouseEvent) => {
      if (!selectedAnnotation) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      wrapperRef.current?.focus();
      selectAnnotation(selectedAnnotation.id);

      const start = screenToPdfCoords(event.clientX, event.clientY);
      setResizeState({
        id: selectedAnnotation.id,
        handle,
        start,
        origin: selectedAnnotation,
        hasMoved: false,
      });
    },
    [screenToPdfCoords, selectAnnotation, selectedAnnotation]
  );

  const selectionBox = useMemo(() => {
    if (!selectedAnnotation) {
      return null;
    }

    const x = selectedAnnotation.x * viewport.scale;
    const y = selectedAnnotation.y * viewport.scale;
    const width = selectedAnnotation.width * viewport.scale;
    const height = selectedAnnotation.height * viewport.scale;
    return { x, y, width, height };
  }, [selectedAnnotation, viewport.scale]);

  const toolbarPosition = useMemo(() => {
    if (!selectionBox) {
      return null;
    }

    // Anchor top-right and clamp into viewport.
    const padding = 8;
    const approxWidth = 88;
    const approxHeight = 32;

    const rawLeft = selectionBox.x + selectionBox.width + padding;
    const rawTop = selectionBox.y - approxHeight - padding;

    const left = Math.max(
      padding,
      Math.min(rawLeft, viewport.width - approxWidth - padding)
    );
    const top = Math.max(
      padding,
      Math.min(rawTop, viewport.height - approxHeight - padding)
    );

    return { left, top };
  }, [selectionBox, viewport.height, viewport.width]);

  const renderSelectionHandles = () => {
    if (!selectedAnnotation || !selectionBox) {
      return null;
    }

    const primary = "rgb(var(--color-primary))";
    const surface = "rgb(var(--color-surface-primary))";
    const r = 5;

    if (selectedAnnotation.type === AnnotationType.FREE_DRAW) {
      // Move-only for now.
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
            onMouseDown={(e) => handleResizeHandleMouseDown("start", e)}
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
            onMouseDown={(e) => handleResizeHandleMouseDown("end", e)}
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
            onMouseDown={(e) => handleResizeHandleMouseDown(handle.id, e)}
          />
        ))}
      </g>
    );
  };

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`absolute inset-0 pointer-events-auto ${className} focus:outline-none`}
    >
      <svg
        ref={svgRef}
        width={viewport.width}
        height={viewport.height}
        className="absolute inset-0"
        data-testid="annotation-layer"
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

        {/* Selection outline + resize handles */}
        {renderSelectionHandles()}

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

      {/* Floating contextual toolbar */}
      {selectedAnnotation && toolbarPosition && (
        <div
          data-testid="annotation-toolbar"
          className="absolute z-10 flex items-center gap-1 rounded-lg border border-border-primary bg-surface-primary/95 backdrop-blur-md shadow-lg px-1.5 py-1"
          style={{ left: toolbarPosition.left, top: toolbarPosition.top }}
        >
          {selectedAnnotation.type === AnnotationType.TEXT && (
            <button
              onClick={() => handleTextEdit(selectedAnnotation.id)}
              className="rounded-md px-2 py-1 text-xs font-semibold text-text-primary hover:bg-bg-tertiary transition-colors"
              title="Edit text"
            >
              Edit
            </button>
          )}
          <button
            onClick={handleDeleteSelected}
            className="rounded-md px-2 py-1 text-xs font-semibold text-error hover:bg-error/10 transition-colors"
            title="Delete annotation"
          >
            Delete
          </button>
        </div>
      )}

      {/* Text annotation editor modal */}
      {editingTextAnnotation && (
        <TextAnnotationEditor
          annotation={editingTextAnnotation}
          onSave={handleTextEditorSave}
          onCancel={handleTextEditorCancel}
          onDelete={handleTextEditorDelete}
        />
      )}
    </div>
  );
};

export default AnnotationLayer;
