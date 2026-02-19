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

//! Application state management for StreamSlate

use crate::error::{Result, StreamSlateError};
use crate::websocket::WebSocketEvent;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex, OnceLock, RwLock};
use tokio::sync::broadcast;

#[cfg(target_os = "macos")]
use crate::capture::CapturedFrame;

/// Trait for frame output destinations (NDI, Syphon, etc.)
#[cfg(target_os = "macos")]
pub trait FrameOutput: Send + Sync {
    fn send_frame(&self, frame: &CapturedFrame) -> std::result::Result<(), String>;
    fn stop(&self);
    fn is_running(&self) -> bool;
}

/// Holds active output handles for fan-out from the capture loop
#[cfg(target_os = "macos")]
#[derive(Default)]
pub struct OutputState {
    pub ndi_sender: Option<Arc<dyn FrameOutput>>,
    pub syphon_server: Option<Arc<dyn FrameOutput>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PdfState {
    pub current_file: Option<String>,
    pub current_page: u32,
    pub total_pages: u32,
    pub zoom_level: f64,
    pub is_loaded: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PresenterState {
    pub is_active: bool,
    pub window_id: Option<String>,
    pub config: PresenterConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresenterConfig {
    pub always_on_top: bool,
    pub transparent_background: bool,
    pub borderless: bool,
    pub position: WindowPosition,
    pub size: WindowSize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowPosition {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowSize {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketState {
    pub is_connected: bool,
    pub port: u16,
    pub active_connections: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct IntegrationState {
    pub obs_connected: bool,
    pub stream_deck_connected: bool,
    pub ndi_enabled: bool,
    pub ndi_active: bool,
    pub syphon_enabled: bool,
    pub syphon_active: bool,
    /// Number of frames captured from screen
    pub frames_captured: u64,
    /// Number of frames sent to NDI/Syphon output
    pub frames_sent: u64,
}

/// Main application state
///
/// This struct holds all application state that needs to be shared across
/// Tauri commands. Read-heavy fields use Arc<RwLock<T>> for concurrent reads;
/// write-heavy fields (integration counters, outputs) use Arc<Mutex<T>>.
///
/// Clone is cheap because it only clones the Arc pointers, not the underlying data.
#[derive(Clone)]
pub struct AppState {
    /// PDF metadata state (serializable, sent to frontend)
    pub pdf: Arc<RwLock<PdfState>>,

    /// The actual loaded PDF document (not serializable)
    /// This is stored separately because lopdf::Document doesn't impl Serialize
    pub pdf_document: Arc<RwLock<Option<lopdf::Document>>>,

    /// Presenter window state
    pub presenter: Arc<RwLock<PresenterState>>,

    /// WebSocket server state
    pub websocket: Arc<RwLock<WebSocketState>>,

    /// External integrations state (kept as Mutex — write-heavy at 30fps)
    pub integration: Arc<Mutex<IntegrationState>>,

    /// Annotations per page (page_number -> list of annotation JSON strings)
    pub annotations: Arc<RwLock<HashMap<u32, Vec<String>>>>,

    /// WebSocket broadcast sender (for sending events from commands).
    /// Set once during app setup; lock-free reads via OnceLock.
    pub broadcast_sender: Arc<OnceLock<broadcast::Sender<WebSocketEvent>>>,

    /// Active output handles (NDI, Syphon) for the capture fan-out
    #[cfg(target_os = "macos")]
    pub outputs: Arc<Mutex<OutputState>>,
}

// Manual Debug impl since lopdf::Document doesn't implement Debug
impl std::fmt::Debug for AppState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("AppState")
            .field("pdf", &self.pdf)
            .field("pdf_document", &"<lopdf::Document>")
            .field("presenter", &self.presenter)
            .field("websocket", &self.websocket)
            .field("integration", &self.integration)
            .field("annotations", &self.annotations)
            .field("broadcast_sender", &"<broadcast::Sender>")
            .field("outputs", &"<OutputState>")
            .finish()
    }
}

impl Default for PdfState {
    fn default() -> Self {
        Self {
            current_file: None,
            current_page: 1,
            total_pages: 0,
            zoom_level: 1.0,
            is_loaded: false,
        }
    }
}

impl Default for PresenterConfig {
    fn default() -> Self {
        Self {
            always_on_top: true,
            transparent_background: true,
            borderless: true,
            position: WindowPosition { x: 100, y: 100 },
            size: WindowSize {
                width: 800,
                height: 600,
            },
        }
    }
}

impl Default for WebSocketState {
    fn default() -> Self {
        Self {
            is_connected: false,
            port: 11451,
            active_connections: 0,
        }
    }
}

impl AppState {
    pub fn new() -> Self {
        Self {
            pdf: Arc::new(RwLock::new(PdfState::default())),
            pdf_document: Arc::new(RwLock::new(None)),
            presenter: Arc::new(RwLock::new(PresenterState::default())),
            websocket: Arc::new(RwLock::new(WebSocketState::default())),
            integration: Arc::new(Mutex::new(IntegrationState::default())),
            annotations: Arc::new(RwLock::new(HashMap::new())),
            broadcast_sender: Arc::new(OnceLock::new()),
            #[cfg(target_os = "macos")]
            outputs: Arc::new(Mutex::new(OutputState::default())),
        }
    }

    /// Get current PDF state
    pub fn get_pdf_state(&self) -> Result<PdfState> {
        self.pdf
            .read()
            .map(|state| state.clone())
            .map_err(|e| StreamSlateError::StateLock(format!("PDF state: {e}")))
    }

    /// Update PDF state with a closure
    pub fn update_pdf_state<F>(&self, update_fn: F) -> Result<()>
    where
        F: FnOnce(&mut PdfState),
    {
        self.pdf
            .write()
            .map(|mut state| update_fn(&mut state))
            .map_err(|e| StreamSlateError::StateLock(format!("PDF state: {e}")))
    }

    /// Get the loaded PDF document
    pub fn get_pdf_document(&self) -> Result<Option<lopdf::Document>> {
        self.pdf_document
            .read()
            .map(|doc| doc.clone())
            .map_err(|e| StreamSlateError::StateLock(format!("PDF document: {e}")))
    }

    /// Set the loaded PDF document
    pub fn set_pdf_document(&self, doc: Option<lopdf::Document>) -> Result<()> {
        let mut guard = self
            .pdf_document
            .write()
            .map_err(|e| StreamSlateError::StateLock(format!("PDF document: {e}")))?;
        *guard = doc;
        Ok(())
    }

    /// Get current presenter state
    pub fn get_presenter_state(&self) -> Result<PresenterState> {
        self.presenter
            .read()
            .map(|state| state.clone())
            .map_err(|e| StreamSlateError::StateLock(format!("Presenter state: {e}")))
    }

    /// Update presenter state with a closure
    pub fn update_presenter_state<F>(&self, update_fn: F) -> Result<()>
    where
        F: FnOnce(&mut PresenterState),
    {
        self.presenter
            .write()
            .map(|mut state| update_fn(&mut state))
            .map_err(|e| StreamSlateError::StateLock(format!("Presenter state: {e}")))
    }

    /// Get WebSocket state
    #[allow(dead_code)]
    pub fn get_websocket_state(&self) -> Result<WebSocketState> {
        self.websocket
            .read()
            .map(|state| state.clone())
            .map_err(|e| StreamSlateError::StateLock(format!("WebSocket state: {e}")))
    }

    /// Get integration state
    #[allow(dead_code)]
    pub fn get_integration_state(&self) -> Result<IntegrationState> {
        self.integration
            .lock()
            .map(|state| state.clone())
            .map_err(|e| StreamSlateError::StateLock(format!("Integration state: {e}")))
    }

    /// Set the broadcast sender for WebSocket events (called once during setup)
    pub fn set_broadcast_sender(&self, sender: broadcast::Sender<WebSocketEvent>) -> Result<()> {
        self.broadcast_sender.set(sender).map_err(|_| {
            StreamSlateError::Other("Broadcast sender already initialized".to_string())
        })
    }

    /// Broadcast an event to all connected WebSocket clients
    pub fn broadcast(&self, event: WebSocketEvent) -> Result<()> {
        if let Some(sender) = self.broadcast_sender.get() {
            // Ignore error if no receivers (it's fine)
            let _ = sender.send(event);
        }
        Ok(())
    }

    /// Increment the frames captured counter
    pub fn increment_frames_captured(&self) -> Result<()> {
        let mut integration = self
            .integration
            .lock()
            .map_err(|e| StreamSlateError::StateLock(format!("Integration state: {e}")))?;
        integration.frames_captured += 1;
        Ok(())
    }

    /// Increment the frames sent counter
    pub fn increment_frames_sent(&self) -> Result<()> {
        let mut integration = self
            .integration
            .lock()
            .map_err(|e| StreamSlateError::StateLock(format!("Integration state: {e}")))?;
        integration.frames_sent += 1;
        Ok(())
    }

    /// Reset frame counters (called when stopping capture)
    pub fn reset_frame_counters(&self) -> Result<()> {
        let mut integration = self
            .integration
            .lock()
            .map_err(|e| StreamSlateError::StateLock(format!("Integration state: {e}")))?;
        integration.frames_captured = 0;
        integration.frames_sent = 0;
        Ok(())
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
