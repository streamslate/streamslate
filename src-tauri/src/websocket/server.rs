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

//! WebSocket server implementation using tokio-tungstenite

use super::handlers::handle_command;
use super::protocol::{WebSocketCommand, WebSocketEvent};
use crate::state::AppState;
use futures_util::{SinkExt, StreamExt};
use std::sync::Arc;
use tauri::AppHandle;
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::broadcast;
use tokio_tungstenite::{accept_async, tungstenite::Message};
use tracing::{debug, error, info, warn};

/// Default port for the WebSocket server
pub const DEFAULT_PORT: u16 = 11451;

/// Start the WebSocket server
///
/// This spawns a background task that listens for connections on the specified port.
/// Returns a broadcast sender that can be used to send events to all connected clients.
pub async fn start_server(
    port: u16,
    state: Arc<AppState>,
    app_handle: AppHandle,
) -> Result<broadcast::Sender<WebSocketEvent>, std::io::Error> {
    let addr = format!("127.0.0.1:{}", port);
    let listener = TcpListener::bind(&addr).await?;

    info!(port = port, "WebSocket server started on {}", addr);

    // Create broadcast channel for sending events to all clients
    let (tx, _rx) = broadcast::channel::<WebSocketEvent>(100);
    let tx_clone = tx.clone();

    // Spawn the server task
    tokio::spawn(async move {
        loop {
            match listener.accept().await {
                Ok((stream, peer_addr)) => {
                    info!(peer = %peer_addr, "New WebSocket connection");

                    let state = Arc::clone(&state);
                    let app_handle = app_handle.clone();
                    let tx = tx_clone.clone();
                    let rx = tx_clone.subscribe();

                    tokio::spawn(async move {
                        if let Err(e) = handle_connection(stream, state, app_handle, tx, rx).await {
                            warn!(peer = %peer_addr, error = %e, "Connection error");
                        }
                        info!(peer = %peer_addr, "WebSocket connection closed");
                    });
                }
                Err(e) => {
                    error!(error = %e, "Failed to accept connection");
                }
            }
        }
    });

    Ok(tx)
}

/// Handle a single WebSocket connection
async fn handle_connection(
    stream: TcpStream,
    state: Arc<AppState>,
    app_handle: AppHandle,
    tx: broadcast::Sender<WebSocketEvent>,
    mut rx: broadcast::Receiver<WebSocketEvent>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let ws_stream = accept_async(stream).await?;
    let (mut ws_sender, mut ws_receiver) = ws_stream.split();

    // Send connected event
    let connected_event = WebSocketEvent::connected();
    let connected_msg = serde_json::to_string(&connected_event)?;
    ws_sender.send(Message::Text(connected_msg)).await?;

    // Send current state
    let state_event = get_current_state(&state);
    let state_msg = serde_json::to_string(&state_event)?;
    ws_sender.send(Message::Text(state_msg)).await?;

    loop {
        tokio::select! {
            // Handle incoming messages from client
            msg = ws_receiver.next() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        debug!(msg = %text, "Received WebSocket message");

                        match serde_json::from_str::<WebSocketCommand>(&text) {
                            Ok(command) => {
                                let response = handle_command(command, &state, &app_handle);

                                // Send response back to this client
                                let response_msg = serde_json::to_string(&response)?;
                                ws_sender.send(Message::Text(response_msg)).await?;

                                // Broadcast state-changing events to all clients
                                if should_broadcast(&response) {
                                    let _ = tx.send(response);
                                }
                            }
                            Err(e) => {
                                warn!(error = %e, "Failed to parse WebSocket command");
                                let error_event = WebSocketEvent::error(format!("Invalid command: {}", e));
                                let error_msg = serde_json::to_string(&error_event)?;
                                ws_sender.send(Message::Text(error_msg)).await?;
                            }
                        }
                    }
                    Some(Ok(Message::Ping(data))) => {
                        ws_sender.send(Message::Pong(data)).await?;
                    }
                    Some(Ok(Message::Close(_))) => {
                        break;
                    }
                    Some(Err(e)) => {
                        warn!(error = %e, "WebSocket receive error");
                        break;
                    }
                    None => {
                        break;
                    }
                    _ => {}
                }
            }

            // Handle broadcast events from other connections
            event = rx.recv() => {
                match event {
                    Ok(event) => {
                        let msg = serde_json::to_string(&event)?;
                        if ws_sender.send(Message::Text(msg)).await.is_err() {
                            break;
                        }
                    }
                    Err(broadcast::error::RecvError::Lagged(_)) => {
                        // Client is too slow, skip missed messages
                        debug!("Client lagged behind on broadcast messages");
                    }
                    Err(broadcast::error::RecvError::Closed) => {
                        break;
                    }
                }
            }
        }
    }

    Ok(())
}

/// Get current state as a WebSocketEvent
fn get_current_state(state: &Arc<AppState>) -> WebSocketEvent {
    let pdf_state = state.get_pdf_state().unwrap_or_default();
    let presenter_state = state.get_presenter_state().unwrap_or_default();

    WebSocketEvent::State {
        page: pdf_state.current_page,
        total_pages: pdf_state.total_pages,
        zoom: pdf_state.zoom_level,
        pdf_loaded: pdf_state.is_loaded,
        pdf_path: pdf_state.current_file.clone(),
        pdf_title: None,
        presenter_active: presenter_state.is_active,
    }
}

/// Determine if an event should be broadcast to other clients
fn should_broadcast(event: &WebSocketEvent) -> bool {
    matches!(
        event,
        WebSocketEvent::PageChanged { .. }
            | WebSocketEvent::ZoomChanged { .. }
            | WebSocketEvent::PresenterChanged { .. }
            | WebSocketEvent::PdfOpened { .. }
            | WebSocketEvent::PdfClosed
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_should_broadcast() {
        assert!(should_broadcast(&WebSocketEvent::PageChanged {
            page: 1,
            total_pages: 10
        }));
        assert!(should_broadcast(&WebSocketEvent::ZoomChanged { zoom: 1.5 }));
        assert!(should_broadcast(&WebSocketEvent::PdfClosed));
        assert!(!should_broadcast(&WebSocketEvent::Pong));
        assert!(!should_broadcast(&WebSocketEvent::error("test")));
    }
}
