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
mod errors;
mod security;
mod state;
mod websocket;

use commands::*;
use state::AppState;
use tauri::Manager;
use websocket::init_websocket_server;

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
            // WebSocket commands
            get_websocket_status,
            broadcast_websocket_message,
            broadcast_page_change,
            broadcast_pdf_opened,
            broadcast_pdf_closed,
            broadcast_presenter_mode
        ])
        .setup(|app| {
            let app_handle = app.handle();

            // Initialize and start WebSocket server on port 11451
            let handle_clone = app_handle.clone();
            tokio::spawn(async move {
                let server = init_websocket_server(11451).await;
                server.set_app_handle(handle_clone).await;

                // Update state to reflect server is running
                if let Some(state) = app_handle.try_state::<AppState>() {
                    let _ = state.update_websocket_state(|ws_state| {
                        ws_state.is_connected = true;
                        ws_state.port = 11451;
                    });
                }

                // Start the server (this runs indefinitely)
                if let Err(e) = server.start().await {
                    eprintln!("WebSocket server error: {}", e);
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
