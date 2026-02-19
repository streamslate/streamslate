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
 * Hook encapsulating all annotation drawing, selection, drag, resize,
 * and keyboard interaction state for AnnotationLayer.
 */

import type React from "react";
import {
  useRef,
  useCallback,
  useMemo,
  useState,
  useEffect,
  useLayoutEffect,
} from "react";
import { AnnotationType } from "../types/pdf.types";
import type { Annotation } from "../types/pdf.types";
import { usePDFStore } from "../stores/pdf.store";
import {
  type Point,
  type DrawingState,
  type DragState,
  type ResizeState,
  type ResizeHandle,
  MIN_ANNOTATION_SIZE,
  getTextDefaults,
  getPointsFromAnnotation,
  bboxFromPoints,
  moveAnnotationBy,
} from "../lib/annotations/drawing";

interface UseAnnotationDrawOptions {
  annotations: Annotation[];
  viewport: { width: number; height: number; scale: number };
  activeTool?: AnnotationType;
  toolConfig: { color: string; opacity: number; strokeWidth: number };
  pageNumber: number;
  onAnnotationCreate: (annotation: Partial<Annotation>) => void;
  onAnnotationUpdate: (id: string, updates: Partial<Annotation>) => void;
  onAnnotationDelete: (id: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const INITIAL_DRAWING_STATE: DrawingState = {
  isDrawing: false,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  points: [],
};

export function useAnnotationDraw({
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
}: UseAnnotationDrawOptions) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const nudgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNudgingRef = useRef(false);

  const [drawingState, setDrawingState] = useState<DrawingState>(
    INITIAL_DRAWING_STATE
  );
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [editingTextAnnotation, setEditingTextAnnotation] =
    useState<Annotation | null>(null);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [toolbarSize, setToolbarSize] = useState({ width: 120, height: 36 });

  const selectedAnnotationId = usePDFStore(
    (state) => state.selectedAnnotationId
  );
  const selectAnnotation = usePDFStore((state) => state.selectAnnotation);
  const beginHistoryGroup = usePDFStore((state) => state.beginHistoryGroup);
  const endHistoryGroup = usePDFStore((state) => state.endHistoryGroup);

  const selectedAnnotation = useMemo(() => {
    if (!selectedAnnotationId) return null;
    return annotations.find((a) => a.id === selectedAnnotationId) ?? null;
  }, [annotations, selectedAnnotationId]);

  useEffect(() => {
    setShowStylePanel(false);
  }, [selectedAnnotationId]);

  const canUndoAction = Boolean(onUndo) && (canUndo ?? true);
  const canRedoAction = Boolean(onRedo) && (canRedo ?? true);

  // ── Toolbar sizing ───────────────────────────────────────────────────

  useLayoutEffect(() => {
    if (!selectedAnnotationId) return;
    const el = toolbarRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (!Number.isFinite(rect.width) || !Number.isFinite(rect.height)) return;

    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));
    setToolbarSize((prev) => {
      if (prev.width === nextWidth && prev.height === nextHeight) return prev;
      return { width: nextWidth, height: nextHeight };
    });
  }, [selectedAnnotation?.type, selectedAnnotationId, showStylePanel]);

  // ── Update selected annotation helper ────────────────────────────────

  const updateSelectedAnnotation = useCallback(
    (updates: Partial<Annotation>) => {
      if (!selectedAnnotation) return;

      const dedupedUpdates: Partial<Annotation> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined) continue;
        const typedKey = key as keyof Annotation;
        if (selectedAnnotation[typedKey] === value) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (dedupedUpdates as any)[typedKey] = value;
      }

      if (Object.keys(dedupedUpdates).length === 0) return;
      onAnnotationUpdate(selectedAnnotation.id, {
        ...dedupedUpdates,
        modified: new Date(),
      });
    },
    [onAnnotationUpdate, selectedAnnotation]
  );

  // ── Coordinate conversion ────────────────────────────────────────────

  const screenToPdfCoords = useCallback(
    (screenX: number, screenY: number) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      return {
        x: (screenX - rect.left) / viewport.scale,
        y: (screenY - rect.top) / viewport.scale,
      };
    },
    [viewport.scale]
  );

  // ── Cursor ───────────────────────────────────────────────────────────

  const getCursorStyle = useCallback(() => {
    if (!activeTool) return "default";
    switch (activeTool) {
      case AnnotationType.HIGHLIGHT:
      case AnnotationType.TEXT:
        return "text";
      case AnnotationType.RECTANGLE:
      case AnnotationType.CIRCLE:
      case AnnotationType.ARROW:
      case AnnotationType.FREE_DRAW:
        return "crosshair";
      default:
        return "default";
    }
  }, [activeTool]);

  // ── Mouse handlers ───────────────────────────────────────────────────

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      wrapperRef.current?.focus();
      selectAnnotation(null);

      if (!activeTool) return;
      const { x, y } = screenToPdfCoords(event.clientX, event.clientY);

      if (activeTool === AnnotationType.TEXT) {
        const defaults = getTextDefaults();
        const isLegacyHighlightYellow = /^#ffff00$/i.test(toolConfig.color);
        const newAnnotation: Annotation = {
          id: crypto.randomUUID(),
          type: AnnotationType.TEXT,
          pageNumber,
          x,
          y,
          width: 200,
          height: 30,
          content: "",
          color: isLegacyHighlightYellow
            ? defaults.textColor
            : toolConfig.color,
          opacity: 1.0,
          fontSize: 16,
          backgroundColor: defaults.backgroundColor,
          backgroundOpacity: defaults.backgroundOpacity,
          created: new Date(),
          modified: new Date(),
          visible: true,
        };
        onAnnotationCreate(newAnnotation);
        setEditingTextAnnotation(newAnnotation);
        return;
      }

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

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (resizeState && selectedAnnotation) {
        const { x, y } = screenToPdfCoords(event.clientX, event.clientY);
        const minSize = MIN_ANNOTATION_SIZE;
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

        if (
          event.shiftKey &&
          (origin.type === AnnotationType.RECTANGLE ||
            origin.type === AnnotationType.CIRCLE ||
            origin.type === AnnotationType.HIGHLIGHT) &&
          (resizeState.handle === "nw" ||
            resizeState.handle === "ne" ||
            resizeState.handle === "se" ||
            resizeState.handle === "sw")
        ) {
          const ratio =
            origin.type === AnnotationType.CIRCLE
              ? 1
              : origin.height !== 0
                ? origin.width / origin.height
                : 1;

          const currentW = Math.max(minSize, nextRight - nextLeft);
          const currentH = Math.max(minSize, nextBottom - nextTop);
          let adjustedW = currentW;
          let adjustedH = currentH;

          if (ratio > 0) {
            if (currentW / currentH > ratio) {
              adjustedW = currentH * ratio;
            } else {
              adjustedH = currentW / ratio;
            }
          }

          adjustedW = Math.max(minSize, adjustedW);
          adjustedH = Math.max(minSize, adjustedH);

          switch (resizeState.handle) {
            case "se":
              nextRight = nextLeft + adjustedW;
              nextBottom = nextTop + adjustedH;
              break;
            case "sw":
              nextLeft = nextRight - adjustedW;
              nextBottom = nextTop + adjustedH;
              break;
            case "ne":
              nextRight = nextLeft + adjustedW;
              nextTop = nextBottom - adjustedH;
              break;
            case "nw":
              nextLeft = nextRight - adjustedW;
              nextTop = nextBottom - adjustedH;
              break;
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
        const next = moveAnnotationBy(dragState.origin, dx, dy);
        onAnnotationUpdate(dragState.origin.id, next);
        if (!dragState.hasMoved && (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1)) {
          setDragState((prev) => (prev ? { ...prev, hasMoved: true } : prev));
        }
        return;
      }

      if (!drawingState.isDrawing) return;
      const { x, y } = screenToPdfCoords(event.clientX, event.clientY);

      if (activeTool === AnnotationType.FREE_DRAW) {
        setDrawingState((prev) => ({
          ...prev,
          currentX: x,
          currentY: y,
          points: [...prev.points, { x, y }],
        }));
        return;
      }

      setDrawingState((prev) => ({ ...prev, currentX: x, currentY: y }));
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

  const handleMouseUp = useCallback(() => {
    if (resizeState) {
      if (resizeState.hasMoved) {
        onAnnotationUpdate(resizeState.id, { modified: new Date() });
      }
      setResizeState(null);
      endHistoryGroup();
      return;
    }

    if (dragState) {
      if (dragState.hasMoved) {
        onAnnotationUpdate(dragState.id, { modified: new Date() });
      }
      setDragState(null);
      endHistoryGroup();
      return;
    }

    if (!drawingState.isDrawing || !activeTool) return;
    const { startX, startY, currentX, currentY, points } = drawingState;

    if (activeTool === AnnotationType.FREE_DRAW && points.length > 2) {
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
        content: JSON.stringify(points),
        color: toolConfig.color,
        opacity: toolConfig.opacity,
        strokeWidth: toolConfig.strokeWidth,
        created: new Date(),
        modified: new Date(),
        visible: true,
        points,
      };
      onAnnotationCreate(annotation);
      setDrawingState(INITIAL_DRAWING_STATE);
      return;
    }

    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

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

    setDrawingState(INITIAL_DRAWING_STATE);
  }, [
    activeTool,
    dragState,
    drawingState,
    onAnnotationCreate,
    onAnnotationUpdate,
    pageNumber,
    resizeState,
    toolConfig,
    endHistoryGroup,
  ]);

  // ── Annotation mouse-down (select / drag / alt-duplicate) ────────────

  const handleAnnotationMouseDown = useCallback(
    (annotation: Annotation, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      wrapperRef.current?.focus();

      if (event.altKey && event.button === 0) {
        beginHistoryGroup();
        const copied: Annotation = {
          ...annotation,
          id: crypto.randomUUID(),
          created: new Date(),
          modified: new Date(),
        };
        onAnnotationCreate(copied);
        selectAnnotation(copied.id);
        const start = screenToPdfCoords(event.clientX, event.clientY);
        setDragState({ id: copied.id, start, origin: copied, hasMoved: false });
        return;
      }

      selectAnnotation(annotation.id);
      if (event.button !== 0) return;

      beginHistoryGroup();
      const start = screenToPdfCoords(event.clientX, event.clientY);
      setDragState({
        id: annotation.id,
        start,
        origin: annotation,
        hasMoved: false,
      });
    },
    [beginHistoryGroup, onAnnotationCreate, screenToPdfCoords, selectAnnotation]
  );

  // ── Resize handle mouse-down ─────────────────────────────────────────

  const handleResizeHandleMouseDown = useCallback(
    (handle: ResizeHandle, event: React.MouseEvent) => {
      if (!selectedAnnotation) return;
      event.preventDefault();
      event.stopPropagation();
      wrapperRef.current?.focus();
      selectAnnotation(selectedAnnotation.id);

      beginHistoryGroup();
      const start = screenToPdfCoords(event.clientX, event.clientY);
      setResizeState({
        id: selectedAnnotation.id,
        handle,
        start,
        origin: selectedAnnotation,
        hasMoved: false,
      });
    },
    [beginHistoryGroup, screenToPdfCoords, selectAnnotation, selectedAnnotation]
  );

  // ── Delete / Duplicate ───────────────────────────────────────────────

  const handleDeleteSelected = useCallback(() => {
    if (!selectedAnnotationId) return;
    onAnnotationDelete(selectedAnnotationId);
  }, [onAnnotationDelete, selectedAnnotationId]);

  const handleDuplicateSelected = useCallback(() => {
    if (!selectedAnnotation) return;
    endHistoryGroup();

    const dx = 12 / viewport.scale;
    const dy = 12 / viewport.scale;
    const now = new Date();

    const copied: Annotation = {
      ...selectedAnnotation,
      id: crypto.randomUUID(),
      created: now,
      modified: now,
      x: selectedAnnotation.x + dx,
      y: selectedAnnotation.y + dy,
      points: selectedAnnotation.points?.map((p) => ({ ...p })),
    };

    if (selectedAnnotation.type === AnnotationType.FREE_DRAW) {
      const points = getPointsFromAnnotation(selectedAnnotation);
      if (points) {
        const shifted = points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
        const bbox = bboxFromPoints(shifted);
        copied.points = shifted;
        copied.content = JSON.stringify(shifted);
        copied.x = bbox.x;
        copied.y = bbox.y;
        copied.width = bbox.width;
        copied.height = bbox.height;
      }
    }

    beginHistoryGroup();
    onAnnotationCreate(copied);
    selectAnnotation(copied.id);
    endHistoryGroup();
  }, [
    beginHistoryGroup,
    endHistoryGroup,
    onAnnotationCreate,
    selectedAnnotation,
    selectAnnotation,
    viewport.scale,
  ]);

  // ── Keyboard handler ─────────────────────────────────────────────────

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
        if (drawingState.isDrawing) setDrawingState(INITIAL_DRAWING_STATE);
        setDragState(null);
        setResizeState(null);
        selectAnnotation(null);
        endHistoryGroup();
        return;
      }

      if (isTyping) return;

      const key = event.key.toLowerCase();
      const isCommand = event.metaKey || event.ctrlKey;

      if (isCommand && key === "z") {
        event.preventDefault();
        endHistoryGroup();
        if (event.shiftKey) {
          onRedo?.();
        } else {
          onUndo?.();
        }
        return;
      }

      if (isCommand && key === "y") {
        event.preventDefault();
        endHistoryGroup();
        onRedo?.();
        return;
      }

      if (isCommand && key === "d" && selectedAnnotation) {
        event.preventDefault();
        handleDuplicateSelected();
        return;
      }

      const arrowKey =
        event.key === "Left"
          ? "ArrowLeft"
          : event.key === "Right"
            ? "ArrowRight"
            : event.key === "Up"
              ? "ArrowUp"
              : event.key === "Down"
                ? "ArrowDown"
                : event.key;

      // Alt+arrow: resize
      if (
        selectedAnnotation &&
        event.altKey &&
        (arrowKey === "ArrowUp" ||
          arrowKey === "ArrowDown" ||
          arrowKey === "ArrowLeft" ||
          arrowKey === "ArrowRight")
      ) {
        event.preventDefault();
        if (selectedAnnotation.type === AnnotationType.FREE_DRAW) return;

        if (!isNudgingRef.current) {
          beginHistoryGroup();
          isNudgingRef.current = true;
        }
        if (nudgeTimeoutRef.current) clearTimeout(nudgeTimeoutRef.current);

        const stepPx = event.shiftKey ? 10 : 1;
        const step = stepPx / viewport.scale;
        const minSize = MIN_ANNOTATION_SIZE;

        if (selectedAnnotation.type === AnnotationType.ARROW) {
          const widthSign = selectedAnnotation.width >= 0 ? 1 : -1;
          const heightSign = selectedAnnotation.height >= 0 ? 1 : -1;
          const widthDelta =
            arrowKey === "ArrowLeft"
              ? -step
              : arrowKey === "ArrowRight"
                ? step
                : 0;
          const heightDelta =
            arrowKey === "ArrowUp"
              ? -step
              : arrowKey === "ArrowDown"
                ? step
                : 0;
          let nextWidth = selectedAnnotation.width + widthDelta;
          let nextHeight = selectedAnnotation.height + heightDelta;
          if (Math.abs(nextWidth) < minSize) nextWidth = widthSign * minSize;
          if (Math.abs(nextHeight) < minSize) nextHeight = heightSign * minSize;
          onAnnotationUpdate(selectedAnnotation.id, {
            width: nextWidth,
            height: nextHeight,
            modified: new Date(),
          });
        } else {
          const widthDelta =
            arrowKey === "ArrowLeft"
              ? -step
              : arrowKey === "ArrowRight"
                ? step
                : 0;
          const heightDelta =
            arrowKey === "ArrowUp"
              ? -step
              : arrowKey === "ArrowDown"
                ? step
                : 0;
          const nextWidth = Math.max(
            minSize,
            selectedAnnotation.width + widthDelta
          );
          const nextHeight = Math.max(
            minSize,
            selectedAnnotation.height + heightDelta
          );
          onAnnotationUpdate(selectedAnnotation.id, {
            width: nextWidth,
            height: nextHeight,
            modified: new Date(),
          });
        }

        nudgeTimeoutRef.current = setTimeout(() => {
          isNudgingRef.current = false;
          endHistoryGroup();
        }, 350);
        return;
      }

      // Arrow: move
      if (
        selectedAnnotation &&
        !event.altKey &&
        (arrowKey === "ArrowUp" ||
          arrowKey === "ArrowDown" ||
          arrowKey === "ArrowLeft" ||
          arrowKey === "ArrowRight")
      ) {
        event.preventDefault();
        if (!isNudgingRef.current) {
          beginHistoryGroup();
          isNudgingRef.current = true;
        }
        if (nudgeTimeoutRef.current) clearTimeout(nudgeTimeoutRef.current);

        const stepPx = event.shiftKey ? 10 : 1;
        const step = stepPx / viewport.scale;
        const dx =
          arrowKey === "ArrowLeft"
            ? -step
            : arrowKey === "ArrowRight"
              ? step
              : 0;
        const dy =
          arrowKey === "ArrowUp" ? -step : arrowKey === "ArrowDown" ? step : 0;

        const next = moveAnnotationBy(selectedAnnotation, dx, dy);
        onAnnotationUpdate(selectedAnnotation.id, {
          ...next,
          modified: new Date(),
        });

        nudgeTimeoutRef.current = setTimeout(() => {
          isNudgingRef.current = false;
          endHistoryGroup();
        }, 350);
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        handleDeleteSelected();
      }
    },
    [
      beginHistoryGroup,
      drawingState.isDrawing,
      endHistoryGroup,
      handleDeleteSelected,
      handleDuplicateSelected,
      onAnnotationUpdate,
      onRedo,
      onUndo,
      selectedAnnotation,
      selectAnnotation,
      viewport.scale,
    ]
  );

  // ── Text editor handlers ─────────────────────────────────────────────

  const handleTextEdit = useCallback(
    (annotationId: string) => {
      const annotation = annotations.find((a) => a.id === annotationId);
      if (annotation && annotation.type === AnnotationType.TEXT) {
        setEditingTextAnnotation(annotation);
      }
    },
    [annotations]
  );

  const handleTextEditorSave = useCallback(
    (updates: Partial<Annotation>) => {
      if (editingTextAnnotation) {
        onAnnotationUpdate(editingTextAnnotation.id, updates);
        setEditingTextAnnotation(null);
      }
    },
    [editingTextAnnotation, onAnnotationUpdate]
  );

  const handleTextEditorCancel = useCallback(() => {
    if (editingTextAnnotation && !editingTextAnnotation.content) {
      onAnnotationDelete(editingTextAnnotation.id);
    }
    setEditingTextAnnotation(null);
  }, [editingTextAnnotation, onAnnotationDelete]);

  const handleTextEditorDelete = useCallback(() => {
    if (editingTextAnnotation) {
      onAnnotationDelete(editingTextAnnotation.id);
      setEditingTextAnnotation(null);
    }
  }, [editingTextAnnotation, onAnnotationDelete]);

  // ── Selection box + toolbar position ─────────────────────────────────

  const selectionBox = useMemo(() => {
    if (!selectedAnnotation) return null;
    return {
      x: selectedAnnotation.x * viewport.scale,
      y: selectedAnnotation.y * viewport.scale,
      width: selectedAnnotation.width * viewport.scale,
      height: selectedAnnotation.height * viewport.scale,
    };
  }, [selectedAnnotation, viewport.scale]);

  const toolbarPosition = useMemo(() => {
    if (!selectionBox) return null;

    const padding = 8;
    const minLeft = padding;
    const minTop = padding;
    const maxLeft = Math.max(
      padding,
      viewport.width - toolbarSize.width - padding
    );
    const maxTop = Math.max(
      padding,
      viewport.height - toolbarSize.height - padding
    );
    const handlePadding = 12;

    const selectionBounds = {
      left: selectionBox.x - handlePadding,
      top: selectionBox.y - handlePadding,
      right: selectionBox.x + selectionBox.width + handlePadding,
      bottom: selectionBox.y + selectionBox.height + handlePadding,
    };

    const overlapArea = (
      a: { left: number; top: number; right: number; bottom: number },
      b: { left: number; top: number; right: number; bottom: number }
    ) => {
      const horizontal = Math.max(
        0,
        Math.min(a.right, b.right) - Math.max(a.left, b.left)
      );
      const vertical = Math.max(
        0,
        Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
      );
      return horizontal * vertical;
    };

    const clamp = (value: number, min: number, max: number) =>
      Math.max(min, Math.min(value, max));

    const candidates = [
      {
        left: selectionBox.x + selectionBox.width + padding,
        top: selectionBox.y - toolbarSize.height - padding,
      },
      {
        left: selectionBox.x + selectionBox.width + padding,
        top: selectionBox.y + selectionBox.height + padding,
      },
      {
        left: selectionBox.x - toolbarSize.width - padding,
        top: selectionBox.y - toolbarSize.height - padding,
      },
      {
        left: selectionBox.x - toolbarSize.width - padding,
        top: selectionBox.y + selectionBox.height + padding,
      },
      {
        left: selectionBox.x + (selectionBox.width - toolbarSize.width) / 2,
        top: selectionBox.y - toolbarSize.height - padding,
      },
      {
        left: selectionBox.x + (selectionBox.width - toolbarSize.width) / 2,
        top: selectionBox.y + selectionBox.height + padding,
      },
    ];

    const scored = candidates
      .map((c) => {
        const left = clamp(c.left, minLeft, maxLeft);
        const top = clamp(c.top, minTop, maxTop);
        const toolbarBounds = {
          left,
          top,
          right: left + toolbarSize.width,
          bottom: top + toolbarSize.height,
        };
        const overlap = overlapArea(toolbarBounds, selectionBounds);
        const travel = Math.abs(left - c.left) + Math.abs(top - c.top);
        return { left, top, score: overlap * 1000 + travel };
      })
      .sort((a, b) => a.score - b.score);

    return scored[0] ?? { left: minLeft, top: minTop };
  }, [
    selectionBox,
    toolbarSize.height,
    toolbarSize.width,
    viewport.height,
    viewport.width,
  ]);

  const toolbarDisabled = Boolean(
    (dragState && dragState.hasMoved) ||
    (resizeState && resizeState.hasMoved) ||
    drawingState.isDrawing
  );

  return {
    // Refs
    svgRef,
    wrapperRef,
    toolbarRef,
    // State
    drawingState,
    selectedAnnotation,
    selectedAnnotationId,
    editingTextAnnotation,
    showStylePanel,
    setShowStylePanel,
    selectionBox,
    toolbarPosition,
    toolbarDisabled,
    canUndoAction,
    canRedoAction,
    // Handlers
    getCursorStyle,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleAnnotationMouseDown,
    handleResizeHandleMouseDown,
    handleKeyDown,
    handleDeleteSelected,
    handleDuplicateSelected,
    updateSelectedAnnotation,
    handleTextEdit,
    handleTextEditorSave,
    handleTextEditorCancel,
    handleTextEditorDelete,
    // Store actions (pass-through for toolbar)
    beginHistoryGroup,
    endHistoryGroup,
  };
}
