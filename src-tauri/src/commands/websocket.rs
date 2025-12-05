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

//! WebSocket-related Tauri commands

use crate::state::AppState;
use crate::websocket::{get_websocket_server, IntegrationMessage, IntegrationMessageType};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketStatus {
    pub is_running: bool,
    pub port: u16,
    pub client_count: usize,
}

/// Get the current WebSocket server status
#[tauri::command]
pub async fn get_websocket_status(state: State<'_, AppState>) -> Result<WebSocketStatus, String> {
    let ws_state = state.get_websocket_state()?;

    let client_count = if let Some(server) = get_websocket_server() {
        server.get_client_count().await
    } else {
        0
    };

    Ok(WebSocketStatus {
        is_running: ws_state.is_connected,
        port: ws_state.port,
        client_count,
    })
}

/// Broadcast a message to all connected WebSocket clients
#[tauri::command]
pub async fn broadcast_websocket_message(
    message_type: String,
    data: serde_json::Value,
) -> Result<(), String> {
    let server = get_websocket_server().ok_or("WebSocket server not running")?;

    let msg_type: IntegrationMessageType =
        serde_json::from_value(serde_json::Value::String(message_type.clone()))
            .map_err(|_| format!("Invalid message type: {}", message_type))?;

    let message = IntegrationMessage::new(msg_type, data);
    server.broadcast(&message).await;

    Ok(())
}

/// Broadcast a page change event to all connected clients
#[tauri::command]
pub async fn broadcast_page_change(page: u32, total_pages: u32) -> Result<(), String> {
    let server = get_websocket_server().ok_or("WebSocket server not running")?;

    let message = IntegrationMessage::new(
        IntegrationMessageType::PageChanged,
        serde_json::json!({
            "page": page,
            "totalPages": total_pages
        }),
    );

    server.broadcast(&message).await;
    Ok(())
}

/// Broadcast a PDF opened event to all connected clients
#[tauri::command]
pub async fn broadcast_pdf_opened(
    path: String,
    title: Option<String>,
    page_count: u32,
) -> Result<(), String> {
    let server = get_websocket_server().ok_or("WebSocket server not running")?;

    let message = IntegrationMessage::new(
        IntegrationMessageType::PdfOpened,
        serde_json::json!({
            "path": path,
            "title": title,
            "pageCount": page_count
        }),
    );

    server.broadcast(&message).await;
    Ok(())
}

/// Broadcast a PDF closed event to all connected clients
#[tauri::command]
pub async fn broadcast_pdf_closed() -> Result<(), String> {
    let server = get_websocket_server().ok_or("WebSocket server not running")?;

    let message = IntegrationMessage::new(IntegrationMessageType::PdfClosed, serde_json::json!({}));

    server.broadcast(&message).await;
    Ok(())
}

/// Broadcast a presenter mode toggle event to all connected clients
#[tauri::command]
pub async fn broadcast_presenter_mode(active: bool) -> Result<(), String> {
    let server = get_websocket_server().ok_or("WebSocket server not running")?;

    let message = IntegrationMessage::new(
        IntegrationMessageType::PresenterModeToggled,
        serde_json::json!({
            "active": active
        }),
    );

    server.broadcast(&message).await;
    Ok(())
}
