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
 * TypeScript wrappers for OBS Tauri commands.
 */

import { invoke } from "@tauri-apps/api/core";
import type {
  OBSConnectionInfo,
  OBSRecordStatus,
  OBSRuntimeState,
  OBSScene,
  OBSStreamStatus,
} from "../../types/integration.types";

export interface OBSConnectOptions {
  host: string;
  port: number;
  password: string;
}

export interface OBSSetCurrentSceneOptions {
  sceneName: string;
}

export interface OBSSetSourceVisibilityOptions {
  sceneName: string;
  sourceName: string;
  visible: boolean;
}

export class OBSCommands {
  static async connect(
    options: OBSConnectOptions
  ): Promise<OBSConnectionInfo> {
    return await invoke<OBSConnectionInfo>("obs_connect", {
      host: options.host,
      port: options.port,
      password: options.password,
    });
  }

  static async disconnect(): Promise<void> {
    return await invoke<void>("obs_disconnect");
  }

  static async getState(): Promise<OBSRuntimeState> {
    return await invoke<OBSRuntimeState>("obs_get_state");
  }

  static async listScenes(): Promise<OBSScene[]> {
    return await invoke<OBSScene[]>("obs_list_scenes");
  }

  static async setCurrentScene(
    options: OBSSetCurrentSceneOptions
  ): Promise<void> {
    return await invoke<void>("obs_set_current_scene", {
      sceneName: options.sceneName,
    });
  }

  static async setSourceVisibility(
    options: OBSSetSourceVisibilityOptions
  ): Promise<void> {
    return await invoke<void>("obs_set_source_visibility", {
      sceneName: options.sceneName,
      sourceName: options.sourceName,
      visible: options.visible,
    });
  }

  static async getRecordStatus(): Promise<OBSRecordStatus> {
    return await invoke<OBSRecordStatus>("obs_get_record_status");
  }

  static async startRecord(): Promise<void> {
    return await invoke<void>("obs_start_record");
  }

  static async stopRecord(): Promise<void> {
    return await invoke<void>("obs_stop_record");
  }

  static async getStreamStatus(): Promise<OBSStreamStatus> {
    return await invoke<OBSStreamStatus>("obs_get_stream_status");
  }

  static async startStream(): Promise<void> {
    return await invoke<void>("obs_start_stream");
  }

  static async stopStream(): Promise<void> {
    return await invoke<void>("obs_stop_stream");
  }
}
