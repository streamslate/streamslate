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

//! WebSocket server implementation for StreamSlate
//!
//! This module is prepared for integration and will be started when the
//! application initializes. Some methods are not yet called from the main app.

#![allow(dead_code)]

use super::messages::{IntegrationMessage, IntegrationMessageType};
use futures_util::{SinkExt, StreamExt};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use tauri::{AppHandle, Manager};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::{mpsc, Mutex, RwLock};
use tokio_tungstenite::{accept_async, tungstenite::Message};

/// Unique identifier for connected clients
pub type ClientId = String;

/// Channel sender for sending messages to a client
pub type ClientSender = mpsc::UnboundedSender<Message>;

/// Map of connected clients
pub type ClientMap = Arc<RwLock<HashMap<ClientId, ClientSender>>>;

/// WebSocket server for streaming integrations
pub struct WebSocketServer {
    port: u16,
    clients: ClientMap,
    app_handle: Arc<Mutex<Option<AppHandle>>>,
}

impl WebSocketServer {
    /// Create a new WebSocket server
    pub fn new(port: u16) -> Self {
        Self {
            port,
            clients: Arc::new(RwLock::new(HashMap::new())),
            app_handle: Arc::new(Mutex::new(None)),
        }
    }

    /// Set the Tauri app handle for emitting events
    pub async fn set_app_handle(&self, handle: AppHandle) {
        let mut app_handle = self.app_handle.lock().await;
        *app_handle = Some(handle);
    }

    /// Start the WebSocket server
    pub async fn start(self: Arc<Self>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let addr = format!("127.0.0.1:{}", self.port);
        let listener = TcpListener::bind(&addr).await?;

        println!("WebSocket server listening on ws://{}", addr);

        loop {
            match listener.accept().await {
                Ok((stream, addr)) => {
                    let server = Arc::clone(&self);
                    tokio::spawn(async move {
                        if let Err(e) = server.handle_connection(stream, addr).await {
                            eprintln!("WebSocket connection error: {}", e);
                        }
                    });
                }
                Err(e) => {
                    eprintln!("Failed to accept connection: {}", e);
                }
            }
        }
    }

    /// Handle a new WebSocket connection
    async fn handle_connection(
        &self,
        stream: TcpStream,
        addr: SocketAddr,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let ws_stream = accept_async(stream).await?;
        let client_id = uuid::Uuid::new_v4().to_string();

        println!("New WebSocket connection: {} ({})", client_id, addr);

        let (mut ws_sender, mut ws_receiver) = ws_stream.split();
        let (tx, mut rx) = mpsc::unbounded_channel::<Message>();

        // Register client
        {
            let mut clients = self.clients.write().await;
            clients.insert(client_id.clone(), tx);
        }

        // Emit connection event to Tauri
        self.emit_event("ws-client-connected", &client_id).await;

        // Send initial connection status
        let client_count = self.get_client_count().await;
        let status_msg = IntegrationMessage::connection_status(true, client_count);
        if let Ok(json) = serde_json::to_string(&status_msg) {
            let _ = ws_sender.send(Message::Text(json)).await;
        }

        // Task to forward messages from channel to WebSocket
        let send_task = tokio::spawn(async move {
            while let Some(msg) = rx.recv().await {
                if ws_sender.send(msg).await.is_err() {
                    break;
                }
            }
        });

        // Handle incoming messages
        let clients = Arc::clone(&self.clients);
        let app_handle = Arc::clone(&self.app_handle);
        let client_id_clone = client_id.clone();

        while let Some(result) = ws_receiver.next().await {
            match result {
                Ok(Message::Text(text)) => {
                    if let Err(e) =
                        Self::handle_text_message(&text, &client_id_clone, &clients, &app_handle)
                            .await
                    {
                        eprintln!("Error handling message: {}", e);
                    }
                }
                Ok(Message::Ping(data)) => {
                    if let Some(client) = clients.read().await.get(&client_id_clone) {
                        let _ = client.send(Message::Pong(data));
                    }
                }
                Ok(Message::Close(_)) => {
                    println!("Client {} requested close", client_id_clone);
                    break;
                }
                Err(e) => {
                    eprintln!("WebSocket error for {}: {}", client_id_clone, e);
                    break;
                }
                _ => {}
            }
        }

        // Cleanup
        {
            let mut clients = self.clients.write().await;
            clients.remove(&client_id);
        }

        send_task.abort();

        self.emit_event("ws-client-disconnected", &client_id).await;
        println!("Client {} disconnected", client_id);

        Ok(())
    }

    /// Handle a text message from a client
    async fn handle_text_message(
        text: &str,
        client_id: &str,
        clients: &ClientMap,
        app_handle: &Arc<Mutex<Option<AppHandle>>>,
    ) -> Result<(), String> {
        let message: IntegrationMessage =
            serde_json::from_str(text).map_err(|e| format!("Invalid JSON: {}", e))?;

        match message.message_type {
            IntegrationMessageType::Ping => {
                // Respond with pong
                let pong = IntegrationMessage::pong();
                if let Ok(json) = serde_json::to_string(&pong) {
                    if let Some(client) = clients.read().await.get(client_id) {
                        let _ = client.send(Message::Text(json));
                    }
                }
            }
            IntegrationMessageType::CommandNextPage
            | IntegrationMessageType::CommandPreviousPage
            | IntegrationMessageType::CommandGoToPage
            | IntegrationMessageType::CommandTogglePresenter
            | IntegrationMessageType::CommandAddAnnotation => {
                // Forward command to Tauri frontend
                if let Some(handle) = app_handle.lock().await.as_ref() {
                    let _ = handle.emit_all("integration-command", &message);
                }
            }
            _ => {
                // Log unhandled message types
                println!("Received message type: {:?}", message.message_type);
            }
        }

        Ok(())
    }

    /// Emit an event to the Tauri frontend
    async fn emit_event<S: serde::Serialize + Clone>(&self, event: &str, payload: &S) {
        if let Some(handle) = self.app_handle.lock().await.as_ref() {
            let _ = handle.emit_all(event, payload);
        }
    }

    /// Broadcast a message to all connected clients
    pub async fn broadcast(&self, message: &IntegrationMessage) {
        let json = match serde_json::to_string(message) {
            Ok(j) => j,
            Err(e) => {
                eprintln!("Failed to serialize broadcast message: {}", e);
                return;
            }
        };

        let clients = self.clients.read().await;
        for (client_id, sender) in clients.iter() {
            if sender.send(Message::Text(json.clone())).is_err() {
                eprintln!("Failed to send message to client {}", client_id);
            }
        }
    }

    /// Send a message to a specific client
    pub async fn send_to_client(&self, client_id: &str, message: &IntegrationMessage) {
        let json = match serde_json::to_string(message) {
            Ok(j) => j,
            Err(e) => {
                eprintln!("Failed to serialize message: {}", e);
                return;
            }
        };

        let clients = self.clients.read().await;
        if let Some(sender) = clients.get(client_id) {
            if sender.send(Message::Text(json)).is_err() {
                eprintln!("Failed to send message to client {}", client_id);
            }
        }
    }

    /// Get the number of connected clients
    pub async fn get_client_count(&self) -> usize {
        self.clients.read().await.len()
    }

    /// Check if the server has any connected clients
    pub async fn has_clients(&self) -> bool {
        !self.clients.read().await.is_empty()
    }
}

/// Global WebSocket server instance
static WEBSOCKET_SERVER: tokio::sync::OnceCell<Arc<WebSocketServer>> =
    tokio::sync::OnceCell::const_new();

/// Initialize the global WebSocket server
pub async fn init_websocket_server(port: u16) -> Arc<WebSocketServer> {
    WEBSOCKET_SERVER
        .get_or_init(|| async { Arc::new(WebSocketServer::new(port)) })
        .await
        .clone()
}

/// Get the global WebSocket server instance
pub fn get_websocket_server() -> Option<Arc<WebSocketServer>> {
    WEBSOCKET_SERVER.get().cloned()
}
