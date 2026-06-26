/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

//! Tauri commands for OBS WebSocket v5 control.

use crate::obs::{
    self, OBSConnectionInfo, OBSRecordStatus, OBSRuntimeState, OBSScene, OBSStreamStatus, ObsError,
};

type Result<T> = std::result::Result<T, ObsError>;

#[tauri::command]
pub async fn obs_connect(
    host: String,
    port: u16,
    password: Option<String>,
) -> Result<OBSConnectionInfo> {
    obs::connect(host, port, password).await
}

#[tauri::command]
pub async fn obs_disconnect() -> Result<()> {
    obs::disconnect().await
}

#[tauri::command]
pub async fn obs_get_state() -> Result<OBSRuntimeState> {
    obs::get_state().await
}

#[tauri::command]
pub async fn obs_list_scenes() -> Result<Vec<OBSScene>> {
    obs::list_scenes().await
}

#[tauri::command]
pub async fn obs_set_current_scene(scene_name: String) -> Result<()> {
    obs::set_current_scene(scene_name).await
}

#[tauri::command]
pub async fn obs_set_source_visibility(
    scene_name: String,
    source_name: String,
    visible: bool,
) -> Result<()> {
    obs::set_source_visibility(scene_name, source_name, visible).await
}

#[tauri::command]
pub async fn obs_get_record_status() -> Result<OBSRecordStatus> {
    obs::get_record_status().await
}

#[tauri::command]
pub async fn obs_start_record() -> Result<()> {
    obs::start_record().await
}

#[tauri::command]
pub async fn obs_stop_record() -> Result<()> {
    obs::stop_record().await
}

#[tauri::command]
pub async fn obs_get_stream_status() -> Result<OBSStreamStatus> {
    obs::get_stream_status().await
}

#[tauri::command]
pub async fn obs_start_stream() -> Result<()> {
    obs::start_stream().await
}

#[tauri::command]
pub async fn obs_stop_stream() -> Result<()> {
    obs::stop_stream().await
}
