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

// Import capture module only on macOS
#[cfg(target_os = "macos")]
use crate::capture::{find_streamslate_window, list_capturable_windows, CaptureConfig};
#[cfg(target_os = "macos")]
use std::time::Duration;

/// Information about a capturable window
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureTarget {
    pub id: u32,
    pub app_name: String,
    pub title: String,
}

/// NDI/Capture feature status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureStatus {
    pub is_capturing: bool,
    pub ndi_available: bool,
    pub ndi_running: bool,
    pub frames_captured: u64,
    pub frames_sent: u64,
    pub target_fps: u8,
    pub current_fps: f64,
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

/// Check if NDI feature is available
#[tauri::command]
pub async fn is_ndi_available() -> Result<bool> {
    Ok(cfg!(feature = "ndi"))
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
        frames_captured: 0, // TODO: Track in state
        frames_sent: 0,     // TODO: Track in state
        target_fps: 30,
        current_fps: 0.0,
    })
}

/// Start native capture (and optionally NDI output) - macOS implementation
#[tauri::command]
#[cfg(target_os = "macos")]
pub async fn start_ndi_sender(state: State<'_, AppState>) -> Result<()> {
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

    info!("Starting native capture...");

    // 2. Spawn capture thread
    let state_arc = state.inner().clone();
    std::thread::spawn(move || {
        if let Err(e) = run_capture_loop(state_arc) {
            warn!("Capture loop exited with error: {:?}", e);
        }
    });

    Ok(())
}

/// Start native capture - non-macOS stub
#[tauri::command]
#[cfg(not(target_os = "macos"))]
pub async fn start_ndi_sender(state: State<'_, AppState>) -> Result<()> {
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
    let mut integration = state
        .integration
        .lock()
        .map_err(|e| StreamSlateError::StateLock(e.to_string()))?;
    if !integration.ndi_active {
        return Ok(());
    }
    integration.ndi_active = false;
    info!("Signal sent to stop capture/NDI sender...");
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
#[cfg(target_os = "macos")]
fn run_capture_loop(state: AppState) -> std::result::Result<(), Box<dyn std::error::Error>> {
    info!("Native capture loop started");

    // Create a tokio runtime for async SCK operations
    let rt = tokio::runtime::Runtime::new()?;

    rt.block_on(async {
        use screencapturekit::prelude::SCShareableContent;

        info!("Requesting shareable content (requires Screen Recording permission)...");

        // Get available content
        let content = match SCShareableContent::get() {
            Ok(c) => c,
            Err(e) => {
                warn!("Failed to get shareable content: {:?}", e);
                warn!("Hint: Grant Screen Recording permission in System Settings > Privacy & Security");
                return Ok(());
            }
        };

        let displays = content.displays();
        if displays.is_empty() {
            warn!("No displays found for capture");
            return Ok(());
        }

        let main_display = displays.first().unwrap();

        info!(
            "Primary display: ID {} ({}x{})",
            main_display.display_id(),
            main_display.width(),
            main_display.height()
        );

        // List available windows for debugging
        let windows = list_capturable_windows();
        info!("Found {} capturable windows:", windows.len());
        for (id, app, title) in windows.iter().take(5) {
            debug!("  - [{}] {} : {}", id, app, title);
        }

        // Try to find our own window
        if let Some(window) = find_streamslate_window() {
            info!(
                "Found StreamSlate window for capture: {} (ID: {})",
                window.title().unwrap_or_default(),
                window.window_id()
            );
        }

        // Capture configuration
        let config = CaptureConfig::default();
        info!("Capture config: {:?}", config);

        // Main loop: poll for stop signal
        // Full stream capture implementation will be added in next iteration
        loop {
            // Check for stop signal
            {
                let integration = state.integration.lock().unwrap();
                if !integration.ndi_active {
                    break;
                }
            }

            // Placeholder for actual frame capture
            // In the full implementation, we'd be receiving frames
            // from an SCStream handler and forwarding to NDI

            tokio::time::sleep(Duration::from_millis(33)).await; // ~30fps interval
        }

        info!("Capture loop stopped");
        Ok(())
    })
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
