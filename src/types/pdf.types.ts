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
 * Core PDF and annotation type definitions
 */

export interface PDFDocument {
  id: string;
  path: string;
  title?: string;
  author?: string;
  pageCount: number;
  fileSize: number;
  created?: Date;
  modified?: Date;
  isLoaded: boolean;
}

export interface PDFPage {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  annotations: Annotation[];
}

export interface Annotation {
  id: string;
  type: AnnotationType;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  color: string;
  opacity: number;
  strokeWidth?: number;
  fontSize?: number;
  points?: { x: number; y: number }[];
  created: Date;
  modified: Date;
  visible: boolean;
}

export enum AnnotationType {
  TEXT = "text",
  HIGHLIGHT = "highlight",
  UNDERLINE = "underline",
  STRIKETHROUGH = "strikethrough",
  ARROW = "arrow",
  RECTANGLE = "rectangle",
  CIRCLE = "circle",
  FREE_DRAW = "free_draw",
  STAMP = "stamp",
  NOTE = "note",
}

export interface ViewerState {
  currentPage: number;
  zoom: number;
  rotation: number;
  fitMode: FitMode;
  viewMode: ViewMode;
  sidebarVisible: boolean;
  toolbarVisible: boolean;
}

export enum FitMode {
  FIT_WIDTH = "fit_width",
  FIT_HEIGHT = "fit_height",
  FIT_PAGE = "fit_page",
  ACTUAL_SIZE = "actual_size",
  CUSTOM = "custom",
}

export enum ViewMode {
  SINGLE_PAGE = "single_page",
  CONTINUOUS = "continuous",
  FACING = "facing",
  FACING_CONTINUOUS = "facing_continuous",
}

export interface Tool {
  id: string;
  name: string;
  type: AnnotationType;
  icon: string;
  active: boolean;
  config: ToolConfig;
}

export interface ToolConfig {
  color: string;
  opacity: number;
  strokeWidth: number;
  fontSize?: number;
  fontFamily?: string;
}

export interface PDFError {
  code: string;
  message: string;
  details?: unknown;
}

export interface LoadingState {
  isLoading: boolean;
  progress: number;
  stage: LoadingStage;
  message?: string;
}

export enum LoadingStage {
  OPENING = "opening",
  PARSING = "parsing",
  RENDERING = "rendering",
  COMPLETE = "complete",
  ERROR = "error",
}

export interface PDFSettings {
  defaultZoom: number;
  defaultFitMode: FitMode;
  defaultViewMode: ViewMode;
  enableAnnotations: boolean;
  autoSave: boolean;
  saveInterval: number; // milliseconds
  maxUndoHistory: number;
  renderQuality: number; // 1-3, higher = better quality
}

export interface ExportOptions {
  includeAnnotations: boolean;
  format: ExportFormat;
  quality: number;
  pageRange?: PageRange;
}

export enum ExportFormat {
  PDF = "pdf",
  PNG = "png",
  JPEG = "jpeg",
  SVG = "svg",
}

export interface PageRange {
  start: number;
  end: number;
}

export interface SearchResult {
  pageNumber: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  context: string;
}

export interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
  highlightAll: boolean;
}
