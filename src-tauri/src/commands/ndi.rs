/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * Tauri commands for NDI/video output functionality.
 *
 * This module provides commands for:
 * - Starting/stopping native screen capture
 * - Listing available capture targets (windows/displays)
 * - Managing NDI output (when compiled with "ndi" feature)
 */

use crate::error::{Result, StreamSlateError};
use crate::state::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;
use tracing::{debug, info, warn};

#[cfg(target_os = "macos")]
use crate::capture::{
    create_display_filter, create_stream_config, create_window_filter, find_display_by_id,
    find_streamslate_window, list_capturable_displays, list_capturable_windows, CaptureConfig,
    FrameCallback, StreamHandler,
};
#[cfg(target_os = "macos")]
use screencapturekit::prelude::{SCStream, SCStreamOutputType};
#[cfg(target_os = "macos")]
use std::sync::Arc;

/// Information about a capturable window
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureTarget {
    pub id: u32,
    pub app_name: String,
    pub title: String,
}

/// Information about a capturable display/monitor
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisplayTarget {
    pub id: u32,
    pub width: u32,
    pub height: u32,
    pub origin_x: f64,
    pub origin_y: f64,
    pub is_primary: bool,
}

/// NDI/Capture feature status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureStatus {
    pub is_capturing: bool,
    pub ndi_available: bool,
    pub ndi_running: bool,
    pub syphon_available: bool,
    pub syphon_running: bool,
    pub frames_captured: u64,
    pub frames_sent: u64,
    pub target_fps: u8,
    pub current_fps: f64,
}

/// Runtime output capabilities exposed to the frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutputCapabilities {
    pub platform: String,
    pub ndi_available: bool,
    pub syphon_available: bool,
}

/// List available windows for capture
#[tauri::command]
#[cfg(target_os = "macos")]
pub async fn list_capture_targets() -> Result<Vec<CaptureTarget>> {
    let windows = list_capturable_windows();

    Ok(windows
        .into_iter()
        .map(|(id, app_name, title)| CaptureTarget {
            id,
            app_name,
            title,
        })
        .collect())
}

/// List available windows for capture (non-macOS stub)
#[tauri::command]
#[cfg(not(target_os = "macos"))]
pub async fn list_capture_targets() -> Result<Vec<CaptureTarget>> {
    // Screen capture not supported on this platform
    Ok(vec![])
}

/// List available displays/monitors for capture
#[tauri::command]
#[cfg(target_os = "macos")]
pub async fn list_capture_displays() -> Result<Vec<DisplayTarget>> {
    let displays = list_capturable_displays();
    let primary_id = displays.first().map(|d| d.0);

    Ok(displays
        .into_iter()
        .map(|(id, width, height, origin_x, origin_y)| DisplayTarget {
            id,
            width,
            height,
            origin_x,
            origin_y,
            is_primary: Some(id) == primary_id,
        })
        .collect())
}

/// List available displays for capture (non-macOS stub)
#[tauri::command]
#[cfg(not(target_os = "macos"))]
pub async fn list_capture_displays() -> Result<Vec<DisplayTarget>> {
    Ok(vec![])
}

/// Check if NDI feature is available
#[tauri::command]
pub async fn is_ndi_available() -> Result<bool> {
    Ok(cfg!(feature = "ndi"))
}

/// Check if Syphon feature is available
#[tauri::command]
pub async fn is_syphon_available() -> Result<bool> {
    Ok(cfg!(all(feature = "syphon", target_os = "macos")))
}

/// Get combined output capabilities
#[tauri::command]
pub async fn get_output_capabilities() -> Result<OutputCapabilities> {
    Ok(OutputCapabilities {
        platform: std::env::consts::OS.to_string(),
        ndi_available: cfg!(feature = "ndi"),
        syphon_available: cfg!(all(feature = "syphon", target_os = "macos")),
    })
}

/// Get current capture/NDI status
#[tauri::command]
pub async fn get_capture_status(state: State<'_, AppState>) -> Result<CaptureStatus> {
    let integration = state
        .integration
        .lock()
        .map_err(|e| StreamSlateError::StateLock(e.to_string()))?;

    Ok(CaptureStatus {
        is_capturing: integration.ndi_active,
        ndi_available: cfg!(feature = "ndi"),
        ndi_running: integration.ndi_active && cfg!(feature = "ndi"),
        syphon_available: cfg!(all(feature = "syphon", target_os = "macos")),
        syphon_running: integration.syphon_active
            && cfg!(all(feature = "syphon", target_os = "macos")),
        frames_captured: integration.frames_captured,
        frames_sent: integration.frames_sent,
        target_fps: 30,
        current_fps: 0.0,
    })
}

/// Start native capture (and optionally NDI output) - macOS implementation
///
/// If `display_id` is provided, captures that specific display.
/// Otherwise, captures the StreamSlate main window.
#[tauri::command]
#[cfg(target_os = "macos")]
pub async fn start_ndi_sender(state: State<'_, AppState>, display_id: Option<u32>) -> Result<()> {
    // 1. Check/Set State
    {
        let mut integration = state
            .integration
            .lock()
            .map_err(|e| StreamSlateError::StateLock(e.to_string()))?;
        if integration.ndi_active {
            warn!("Capture/NDI sender already running");
            return Ok(());
        }
        integration.ndi_active = true;
    }

    // 2. Create and start NDI sender if feature enabled
    #[cfg(feature = "ndi")]
    {
        use crate::ndi::NdiSender;

        match NdiSender::new("StreamSlate") {
            Ok(sender) => {
                if let Err(e) = sender.start() {
                    warn!("Failed to start NDI sender: {:?}", e);
                } else {
                    let mut outputs = state
                        .outputs
                        .lock()
                        .map_err(|e| StreamSlateError::StateLock(e.to_string()))?;
                    outputs.ndi_sender = Some(Arc::new(sender));
                    info!("NDI sender started and stored in outputs");
                }
            }
            Err(e) => {
                warn!("Failed to create NDI sender: {:?}", e);
            }
        }
    }

    info!("Starting native capture...");

    // 3. Spawn capture thread
    let state_arc = state.inner().clone();
    std::thread::spawn(move || {
        if let Err(e) = run_capture_loop(state_arc, display_id) {
            warn!("Capture loop exited with error: {:?}", e);
        }
    });

    Ok(())
}

/// Start native capture - non-macOS stub
#[tauri::command]
#[cfg(not(target_os = "macos"))]
pub async fn start_ndi_sender(state: State<'_, AppState>, display_id: Option<u32>) -> Result<()> {
    warn!("Native capture not supported on this platform");
    let mut integration = state
        .integration
        .lock()
        .map_err(|e| StreamSlateError::StateLock(e.to_string()))?;
    integration.ndi_active = false;
    Ok(())
}

/// Stop native capture and NDI output
#[tauri::command]
pub async fn stop_ndi_sender(state: State<'_, AppState>) -> Result<()> {
    {
        let mut integration = state
            .integration
            .lock()
            .map_err(|e| StreamSlateError::StateLock(e.to_string()))?;
        if !integration.ndi_active {
            return Ok(());
        }
        integration.ndi_active = false;
        integration.frames_captured = 0;
        integration.frames_sent = 0;
    }

    // Stop and clear the NDI sender output
    #[cfg(target_os = "macos")]
    {
        let mut outputs = state
            .outputs
            .lock()
            .map_err(|e| StreamSlateError::StateLock(e.to_string()))?;
        if let Some(ref sender) = outputs.ndi_sender {
            sender.stop();
        }
        outputs.ndi_sender = None;
    }

    info!("Signal sent to stop capture/NDI sender...");
    Ok(())
}

/// Start Syphon output - macOS + syphon feature
#[tauri::command]
#[cfg(all(target_os = "macos", feature = "syphon"))]
pub async fn start_syphon_output(state: State<'_, AppState>) -> Result<()> {
    {
        let integration = state
            .integration
            .lock()
            .map_err(|e| StreamSlateError::StateLock(e.to_string()))?;
        if integration.syphon_active {
            return Ok(());
        }
    }

    use crate::syphon::SyphonServer;

    let server = SyphonServer::new("StreamSlate")
        .map_err(|e| StreamSlateError::Other(format!("Syphon init: {e}")))?;

    {
        let mut outputs = state
            .outputs
            .lock()
            .map_err(|e| StreamSlateError::StateLock(e.to_string()))?;
        outputs.syphon_server = Some(Arc::new(server));
    }

    {
        let mut integration = state
            .integration
            .lock()
            .map_err(|e| StreamSlateError::StateLock(e.to_string()))?;
        integration.syphon_enabled = true;
        integration.syphon_active = true;
    }

    info!("Syphon output started");
    Ok(())
}

/// Start Syphon output stub when unavailable
#[tauri::command]
#[cfg(not(all(target_os = "macos", feature = "syphon")))]
pub async fn start_syphon_output(state: State<'_, AppState>) -> Result<()> {
    let mut integration = state
        .integration
        .lock()
        .map_err(|e| StreamSlateError::StateLock(e.to_string()))?;
    integration.syphon_enabled = false;
    integration.syphon_active = false;
    warn!("Syphon output is not available in this build");
    Ok(())
}

/// Stop Syphon output
#[tauri::command]
pub async fn stop_syphon_output(state: State<'_, AppState>) -> Result<()> {
    {
        let mut integration = state
            .integration
            .lock()
            .map_err(|e| StreamSlateError::StateLock(e.to_string()))?;
        integration.syphon_active = false;
    }

    #[cfg(target_os = "macos")]
    {
        let mut outputs = state
            .outputs
            .lock()
            .map_err(|e| StreamSlateError::StateLock(e.to_string()))?;
        if let Some(ref server) = outputs.syphon_server {
            server.stop();
        }
        outputs.syphon_server = None;
    }

    info!("Syphon output stopped");
    Ok(())
}

/// Send a video frame from the frontend (legacy IPC path, for benchmarking)
#[tauri::command]
pub async fn send_video_frame(frame_data: Vec<u8>, width: u32, height: u32) -> Result<()> {
    // This is the legacy JS-to-Rust path (Phase 1 in design doc)
    // It's slow but useful for benchmarking and testing
    debug!(
        "Received frame via IPC: {} bytes, {}x{}",
        frame_data.len(),
        width,
        height
    );

    // Validate expected size (RGBA)
    let expected_size = (width * height * 4) as usize;
    if frame_data.len() != expected_size {
        debug!(
            "Frame size mismatch: got {}, expected {}",
            frame_data.len(),
            expected_size
        );
    }

    Ok(())
}

/// Main capture loop using ScreenCaptureKit (macOS only)
///
/// If `display_id` is Some, captures the specified display.
/// Otherwise, captures the StreamSlate main window.
/// Each captured frame is fanned out to whichever outputs are active
/// (NDI, Syphon) via the `FrameOutput` handles stored in `state.outputs`.
#[cfg(target_os = "macos")]
fn run_capture_loop(
    state: AppState,
    display_id: Option<u32>,
) -> std::result::Result<(), Box<dyn std::error::Error>> {
    info!("Native capture loop started");

    // Build stream configuration
    let config = CaptureConfig::default();
    let stream_config = create_stream_config(&config);

    // Create content filter based on capture target
    let filter = if let Some(id) = display_id {
        // Display capture mode
        match find_display_by_id(id) {
            Some(sc_display) => {
                info!(
                    "Capturing display {} ({}x{})",
                    id,
                    sc_display.width(),
                    sc_display.height()
                );
                create_display_filter(&sc_display)
            }
            None => {
                warn!("Display {} not found — cannot start capture", id);
                let mut integration = state.integration.lock().unwrap();
                integration.ndi_active = false;
                return Ok(());
            }
        }
    } else {
        // Window capture mode (legacy default)
        match find_streamslate_window() {
            Some(w) => {
                info!(
                    "Capturing StreamSlate window: {} (ID: {})",
                    w.title().unwrap_or_default(),
                    w.window_id()
                );
                create_window_filter(&w)
            }
            None => {
                let windows = list_capturable_windows();
                info!("Available windows ({}):", windows.len());
                for (wid, app, title) in windows.iter().take(5) {
                    debug!("  - [{}] {} : {}", wid, app, title);
                }
                warn!("StreamSlate window not found — cannot start capture");
                let mut integration = state.integration.lock().unwrap();
                integration.ndi_active = false;
                return Ok(());
            }
        }
    };

    info!("Capture config: {:?}", config);

    // Build the fan-out callback: each captured frame goes to all active outputs
    let state_for_callback = state.clone();
    let callback: FrameCallback = Arc::new(move |frame| {
        // Skip empty frames (no pixel data)
        if frame.data.is_empty() {
            return;
        }

        let _ = state_for_callback.increment_frames_captured();

        // Fan out to all active outputs
        let outputs = match state_for_callback.outputs.lock() {
            Ok(o) => o,
            Err(_) => return,
        };

        if let Some(ref ndi) = outputs.ndi_sender {
            if ndi.is_running() {
                if let Err(e) = ndi.send_frame(&frame) {
                    debug!("NDI send_frame error: {}", e);
                } else {
                    let _ = state_for_callback.increment_frames_sent();
                }
            }
        }

        if let Some(ref syphon) = outputs.syphon_server {
            if syphon.is_running() {
                if let Err(e) = syphon.send_frame(&frame) {
                    debug!("Syphon send_frame error: {}", e);
                } else {
                    let _ = state_for_callback.increment_frames_sent();
                }
            }
        }
    });

    // Create stream with handler and start capture
    let handler = StreamHandler::with_callback(callback);
    let mut stream = SCStream::new(&filter, &stream_config);
    stream.add_output_handler(handler, SCStreamOutputType::Screen);
    stream.start_capture()?;

    info!("SCStream capture started");

    // Poll for stop signal (frames arrive on SCK's dispatch queue)
    loop {
        let active = {
            let integration = state.integration.lock().unwrap();
            integration.ndi_active
        };
        if !active {
            break;
        }
        std::thread::sleep(std::time::Duration::from_millis(100));
    }

    // Stop stream
    if let Err(e) = stream.stop_capture() {
        warn!("Error stopping SCStream: {:?}", e);
    }

    // Stop all outputs
    {
        let mut outputs = state.outputs.lock().unwrap();
        if let Some(ref sender) = outputs.ndi_sender {
            sender.stop();
        }
        outputs.ndi_sender = None;
        if let Some(ref server) = outputs.syphon_server {
            server.stop();
        }
        outputs.syphon_server = None;
    }

    let _ = state.reset_frame_counters();
    info!("Capture loop stopped");
    Ok(())
}

#[cfg(test)]
mod tests {
    #[allow(unused_imports)]
    use super::*;

    #[test]
    fn test_ndi_feature_flag() {
        // Test that the feature flag check works
        let available = cfg!(feature = "ndi");
        // This will be true or false depending on how tests are run
        println!("NDI feature enabled: {}", available);
    }
}
