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
 * Type definitions for streaming integrations (OBS, Stream Deck, NDI, etc.)
 */

export interface WebSocketState {
  connected: boolean;
  port: number;
  lastError: string | null;
  connectionTime: Date | null;
}

export interface IntegrationMessage {
  id: string;
  type: IntegrationMessageType;
  source: IntegrationSource;
  timestamp: Date;
  data: unknown;
}

export enum IntegrationMessageType {
  // PDF Events
  PDF_OPENED = "pdf_opened",
  PDF_CLOSED = "pdf_closed",
  PAGE_CHANGED = "page_changed",
  ZOOM_CHANGED = "zoom_changed",
  ANNOTATION_ADDED = "annotation_added",
  ANNOTATION_REMOVED = "annotation_removed",
  ANNOTATIONS_UPDATED = "annotations_updated",
  ANNOTATIONS_CLEARED = "annotations_cleared",

  // Presenter Events
  PRESENTER_MODE_TOGGLED = "presenter_mode_toggled",
  PRESENTER_CONFIG_CHANGED = "presenter_config_changed",

  // OBS Integration
  OBS_SCENE_CHANGED = "obs_scene_changed",
  OBS_SOURCE_VISIBILITY_CHANGED = "obs_source_visibility_changed",
  OBS_RECORDING_STARTED = "obs_recording_started",
  OBS_RECORDING_STOPPED = "obs_recording_stopped",
  OBS_STREAMING_STARTED = "obs_streaming_started",
  OBS_STREAMING_STOPPED = "obs_streaming_stopped",

  // Stream Deck
  STREAM_DECK_BUTTON_PRESSED = "stream_deck_button_pressed",
  STREAM_DECK_DIAL_ROTATED = "stream_deck_dial_rotated",

  // NDI
  NDI_SOURCE_FOUND = "ndi_source_found",
  NDI_SOURCE_LOST = "ndi_source_lost",
  SYPHON_OUTPUT_STARTED = "syphon_output_started",
  SYPHON_OUTPUT_STOPPED = "syphon_output_stopped",

  // Commands
  COMMAND_NEXT_PAGE = "command_next_page",
  COMMAND_PREVIOUS_PAGE = "command_previous_page",
  COMMAND_GO_TO_PAGE = "command_go_to_page",
  COMMAND_TOGGLE_PRESENTER = "command_toggle_presenter",
  COMMAND_ADD_ANNOTATION = "command_add_annotation",

  // System
  PING = "ping",
  PONG = "pong",
  ERROR = "error",
  CONNECTION_STATUS = "connection_status",
}

export enum IntegrationSource {
  STREAMSLATE = "streamslate",
  OBS = "obs",
  STREAM_DECK = "stream_deck",
  NDI = "ndi",
  SYPHON = "syphon",
  EXTERNAL_API = "external_api",
}

export interface OBSIntegration {
  connected: boolean;
  version: string | null;
  scenes: OBSScene[];
  currentScene: string | null;
  isRecording: boolean;
  isStreaming: boolean;
  stats: OBSStats | null;
}

export interface OBSScene {
  name: string;
  sources: OBSSource[];
}

export interface OBSSource {
  name: string;
  type: string;
  visible: boolean;
  settings: Record<string, unknown>;
}

export interface OBSStats {
  fps: number;
  renderTotalFrames: number;
  renderSkippedFrames: number;
  outputTotalFrames: number;
  outputSkippedFrames: number;
  averageFrameTime: number;
  cpuUsage: number;
  memoryUsage: number;
  freeDiskSpace: number;
}

export interface StreamDeckIntegration {
  connected: boolean;
  deviceInfo: StreamDeckDevice | null;
  buttons: StreamDeckButton[];
}

export interface StreamDeckDevice {
  path: string;
  productName: string;
  manufacturer: string;
  serialNumber: string;
  firmwareVersion: string;
  keyRows: number;
  keyColumns: number;
}

export interface StreamDeckButton {
  row: number;
  column: number;
  action: StreamDeckAction;
  icon: string | null;
  text: string | null;
  backgroundColor: string;
}

export enum StreamDeckAction {
  NEXT_PAGE = "next_page",
  PREVIOUS_PAGE = "previous_page",
  TOGGLE_PRESENTER = "toggle_presenter",
  ADD_HIGHLIGHT = "add_highlight",
  ADD_NOTE = "add_note",
  TOGGLE_RECORDING = "toggle_recording",
  TOGGLE_STREAMING = "toggle_streaming",
  SWITCH_SCENE = "switch_scene",
  CUSTOM_COMMAND = "custom_command",
}

export interface NDIIntegration {
  enabled: boolean;
  sources: NDISource[];
  outputEnabled: boolean;
  outputName: string;
}

export interface SyphonIntegration {
  enabled: boolean;
  outputEnabled: boolean;
  outputName: string;
}

export interface NDISource {
  name: string;
  url: string;
  connected: boolean;
  bandwidth: number;
}

export interface IntegrationConfig {
  obs: {
    enabled: boolean;
    host: string;
    port: number;
    password: string;
    autoConnect: boolean;
  };
  streamDeck: {
    enabled: boolean;
    autoConnect: boolean;
    buttonLayout: StreamDeckButton[];
  };
  ndi: {
    enabled: boolean;
    outputName: string;
    quality: NDIQuality;
    framerate: number;
  };
  syphon: {
    enabled: boolean;
    outputName: string;
  };
  websocket: {
    enabled: boolean;
    port: number;
    allowExternalConnections: boolean;
    apiKey: string;
  };
}

export enum NDIQuality {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  ULTRA = "ultra",
}

export interface APIEndpoint {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  description: string;
  parameters: APIParameter[];
  response: APIResponse;
}

export interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example: unknown;
}

export interface APIResponse {
  status: number;
  data: unknown;
  error?: string;
}

export interface IntegrationEvent {
  id: string;
  type: IntegrationMessageType;
  source: IntegrationSource;
  timestamp: Date;
  data: unknown;
  handled: boolean;
}

export interface IntegrationError {
  code: string;
  message: string;
  source: IntegrationSource;
  timestamp: Date;
  details?: unknown;
}
