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

mod commands;
pub mod error;
pub mod state;
pub mod websocket;

// Native screen capture (macOS ScreenCaptureKit)
#[cfg(target_os = "macos")]
pub mod capture;

// NDI output support (optional, requires NDI SDK)
#[cfg(feature = "ndi")]
pub mod ndi;

use commands::*;
use state::AppState;
use std::sync::Arc;
use tauri::Manager;
use tracing::{info, warn};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! You've been greeted from Rust!")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            greet,
            // PDF commands
            open_pdf,
            close_pdf,
            get_pdf_page_info,
            get_pdf_page_count,
            is_pdf_open,
            // Presenter commands
            open_presenter_mode,
            close_presenter_mode,
            update_presenter_config,
            get_presenter_state,
            toggle_presenter_mode,
            set_presenter_page,
            // Annotation commands
            save_annotations,
            load_annotations,
            get_page_annotations,
            clear_annotations,
            has_annotations,
            // Capture & NDI commands
            start_ndi_sender,
            stop_ndi_sender,
            send_video_frame,
            list_capture_targets,
            is_ndi_available,
            get_capture_status
        ])
        .setup(|app| {
            // Initialize structured logging with tracing
            tracing_subscriber::fmt()
                .with_env_filter(
                    tracing_subscriber::EnvFilter::try_from_default_env()
                        .unwrap_or_else(|_| "streamslate=info".into()),
                )
                .init();

            info!("StreamSlate starting...");

            // Get the managed state and clone it for the WebSocket server
            // Clone is cheap - only clones Arc pointers, not underlying data
            let state: tauri::State<'_, AppState> = app.state::<AppState>();
            let state_arc: Arc<AppState> = Arc::new(state.inner().clone());

            // Get app handle for emitting events from WebSocket handlers
            let app_handle = app.handle();

            // Start WebSocket server on port 11451
            tokio::spawn(async move {
                // Clone state for the server, keep one for setting sender
                let server_state = state_arc.clone();
                match websocket::start_server(websocket::DEFAULT_PORT, server_state, app_handle)
                    .await
                {
                    Ok(tx) => {
                        info!("WebSocket server started, broadcast channel ready");
                        // Store the broadcast sender for future use
                        if let Err(e) = state_arc.set_broadcast_sender(tx) {
                            warn!("Failed to set broadcast sender: {}", e);
                        }
                    }
                    Err(e) => {
                        warn!(error = %e, "Failed to start WebSocket server");
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
