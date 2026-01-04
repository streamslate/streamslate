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
    // Initialize NDI (grafton-ndi or any bindings)
    // NOTE: grafton-ndi requires NDI runtime to be installed.
    // If it fails to load, we should catch it here.

    // For this prototype Step 2, we will focus on the loop logic and simple frame generation
    // We will verify if we can actually link/call NDI in a future step or if user has it.

    info!("NDI Sender Loop Started");

    loop {
        // Check interruption
        {
            let integration = state.integration.lock().unwrap(); // safe to unwrap here usually or handle
            if !integration.ndi_active {
                break;
            }
        }

        // Simulate Frame (Test Pattern)
        // In real code: sender.send(frame);

        std::thread::sleep(Duration::from_millis(33)); // ~30fps
    }

    info!("NDI Sender Loop Ended");
    Ok(())
}
