/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

use super::client::{
    OBSConnectionInfo, OBSRecordStatus, OBSRuntimeState, OBSScene, OBSStreamStatus, ObsClient,
    ObsError, Result,
};
use std::sync::OnceLock;
use tokio::sync::Mutex;

static OBS_CLIENT: OnceLock<Mutex<Option<ObsClient>>> = OnceLock::new();

fn client_slot() -> &'static Mutex<Option<ObsClient>> {
    OBS_CLIENT.get_or_init(|| Mutex::new(None))
}

pub async fn connect(
    host: String,
    port: u16,
    password: Option<String>,
) -> Result<OBSConnectionInfo> {
    let client = ObsClient::connect(host, port, password).await?;
    let info = client.connection_info();

    let mut guard = client_slot().lock().await;
    if let Some(mut previous) = guard.take() {
        let _ = previous.disconnect().await;
    }
    *guard = Some(client);

    Ok(info)
}

pub async fn disconnect() -> Result<()> {
    let mut guard = client_slot().lock().await;
    if let Some(mut client) = guard.take() {
        client.disconnect().await?;
    }
    Ok(())
}

pub async fn get_state() -> Result<OBSRuntimeState> {
    let mut guard = client_slot().lock().await;
    match guard.as_mut() {
        Some(client) => client.runtime_state().await,
        None => Ok(OBSRuntimeState::disconnected()),
    }
}

pub async fn list_scenes() -> Result<Vec<OBSScene>> {
    let mut guard = client_slot().lock().await;
    let client = guard.as_mut().ok_or(ObsError::Disconnected)?;
    client.list_scenes().await
}

pub async fn set_current_scene(scene_name: String) -> Result<()> {
    let mut guard = client_slot().lock().await;
    let client = guard.as_mut().ok_or(ObsError::Disconnected)?;
    client.set_current_scene(scene_name).await
}

pub async fn set_source_visibility(
    scene_name: String,
    source_name: String,
    visible: bool,
) -> Result<()> {
    let mut guard = client_slot().lock().await;
    let client = guard.as_mut().ok_or(ObsError::Disconnected)?;
    client
        .set_source_visibility(scene_name, source_name, visible)
        .await
}

pub async fn get_record_status() -> Result<OBSRecordStatus> {
    let mut guard = client_slot().lock().await;
    let client = guard.as_mut().ok_or(ObsError::Disconnected)?;
    client.record_status().await
}

pub async fn start_record() -> Result<()> {
    let mut guard = client_slot().lock().await;
    let client = guard.as_mut().ok_or(ObsError::Disconnected)?;
    client.start_record().await
}

pub async fn stop_record() -> Result<()> {
    let mut guard = client_slot().lock().await;
    let client = guard.as_mut().ok_or(ObsError::Disconnected)?;
    client.stop_record().await
}

pub async fn get_stream_status() -> Result<OBSStreamStatus> {
    let mut guard = client_slot().lock().await;
    let client = guard.as_mut().ok_or(ObsError::Disconnected)?;
    client.stream_status().await
}

pub async fn start_stream() -> Result<()> {
    let mut guard = client_slot().lock().await;
    let client = guard.as_mut().ok_or(ObsError::Disconnected)?;
    client.start_stream().await
}

pub async fn stop_stream() -> Result<()> {
    let mut guard = client_slot().lock().await;
    let client = guard.as_mut().ok_or(ObsError::Disconnected)?;
    client.stop_stream().await
}
