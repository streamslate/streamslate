/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 */

use crate::error::{Result, StreamSlateError};
use crate::state::AppState;
use std::time::Duration;
use tauri::State;
use tracing::{info, warn}; // Remove Arc, Mutex if not used explicitly other than inside AppState inheritance logic which isn't visible here.

#[tauri::command]
pub async fn start_ndi_sender(state: State<'_, AppState>) -> Result<()> {
    // 1. Check/Set State
    {
        let mut integration = state
            .integration
            .lock()
            .map_err(|e| StreamSlateError::StateLock(e.to_string()))?;
        if integration.ndi_active {
            warn!("NDI sender already running");
            return Ok(());
        }
        integration.ndi_active = true;
    }

    info!("Starting NDI sender thread...");

    // 2. Spawn Thread
    let state_arc = state.inner().clone();
    std::thread::spawn(move || {
        if let Err(e) = run_ndi_sender_loop(state_arc) {
            warn!("NDI Sender loop exited with error: {:?}", e);
        }
    });

    Ok(())
}

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
    info!("Signal sent to stop NDI sender...");
    Ok(())
}

#[tauri::command]
pub async fn send_video_frame(frame_data: Vec<u8>, width: u32, height: u32) -> Result<()> {
    // Just measure size/receiving for now to benchmark IPC
    // tracing::debug!("Received frame: {} bytes, {}x{}", frame_data.len(), width, height);
    if frame_data.len() != (width * height * 4) as usize {
        // warn!("Frame size mismatch");
    }
    Ok(())
}

fn run_ndi_sender_loop(state: AppState) -> std::result::Result<(), Box<dyn std::error::Error>> {
    info!("NDI/SCK Sender Loop Started");

    // Create a new runtime for the capture task since we are in a dedicated thread
    let rt = tokio::runtime::Runtime::new()?;

    rt.block_on(async {
        use screencapturekit::prelude::SCShareableContent;

        info!("Requesting shareable content...");
        // This requires screen recording permissions on macOS.
        // If not granted, it might return empty or error.
        let content = SCShareableContent::get().unwrap(); // using unwrap for prototype simplicity or ? if error allows
                                                          // Since we are in async block but get is sync, it's fine.

        // Error says 'displays' is a method.
        let displays = content.displays();
        if displays.is_empty() {
            warn!("No displays found for capture");
            return Ok(());
        }

        let main_display = displays.first().unwrap();

        info!(
            "Capturing display: {} ({}x{})",
            main_display.display_id(),
            main_display.width(),
            main_display.height()
        );

        // Commenting out filter/stream creation until exact API signature for v1.5.0 is confirmed locally
        // let filter = SCContentFilter::new(InitParams::DisplayExcludingWindows(main_display.clone(), vec![]));

        // let mut config = SCStreamConfiguration::new();
        // config.set_width(1920);
        // config.set_height(1080);
        // config.set_shows_cursor(true);

        loop {
            // Check interruption
            {
                let integration = state.integration.lock().unwrap();
                if !integration.ndi_active {
                    break;
                }
            }
            // Keep the async task alive
            tokio::time::sleep(Duration::from_millis(100)).await;
        }

        info!("Capture loop stopping...");
        // stream.stop_capture().await?;
        Ok(())
    })
}
