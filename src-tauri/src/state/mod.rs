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
//!
//! Some state accessors are prepared for future integration features.

#![allow(dead_code)]

use lopdf::Document;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex, MutexGuard};

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
}

/// Main application state
pub struct AppState {
    pub pdf: Arc<Mutex<PdfState>>,
    pub presenter: Arc<Mutex<PresenterState>>,
    pub websocket: Arc<Mutex<WebSocketState>>,
    pub integration: Arc<Mutex<IntegrationState>>,
    pub annotations: Arc<Mutex<HashMap<u32, Vec<String>>>>,
    /// Cached PDF document for page operations
    pdf_document: Arc<Mutex<Option<Document>>>,
}

// Implement Debug manually since lopdf::Document doesn't implement Debug
impl std::fmt::Debug for AppState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("AppState")
            .field("pdf", &self.pdf)
            .field("presenter", &self.presenter)
            .field("websocket", &self.websocket)
            .field("integration", &self.integration)
            .field("annotations", &self.annotations)
            .field("pdf_document", &"<Document>")
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
            pdf: Arc::new(Mutex::new(PdfState::default())),
            presenter: Arc::new(Mutex::new(PresenterState::default())),
            websocket: Arc::new(Mutex::new(WebSocketState::default())),
            integration: Arc::new(Mutex::new(IntegrationState::default())),
            annotations: Arc::new(Mutex::new(HashMap::new())),
            pdf_document: Arc::new(Mutex::new(None)),
        }
    }

    /// Get current PDF state
    pub fn get_pdf_state(&self) -> Result<PdfState, String> {
        self.pdf
            .lock()
            .map(|state| state.clone())
            .map_err(|e| format!("Failed to lock PDF state: {e}"))
    }

    /// Update PDF state
    pub fn update_pdf_state<F>(&self, update_fn: F) -> Result<(), String>
    where
        F: FnOnce(&mut PdfState),
    {
        self.pdf
            .lock()
            .map(|mut state| update_fn(&mut state))
            .map_err(|e| format!("Failed to lock PDF state: {e}"))
    }

    /// Get current presenter state
    pub fn get_presenter_state(&self) -> Result<PresenterState, String> {
        self.presenter
            .lock()
            .map(|state| state.clone())
            .map_err(|e| format!("Failed to lock presenter state: {e}"))
    }

    /// Update presenter state
    pub fn update_presenter_state<F>(&self, update_fn: F) -> Result<(), String>
    where
        F: FnOnce(&mut PresenterState),
    {
        self.presenter
            .lock()
            .map(|mut state| update_fn(&mut state))
            .map_err(|e| format!("Failed to lock presenter state: {e}"))
    }

    /// Get WebSocket state
    pub fn get_websocket_state(&self) -> Result<WebSocketState, String> {
        self.websocket
            .lock()
            .map(|state| state.clone())
            .map_err(|e| format!("Failed to lock WebSocket state: {e}"))
    }

    /// Update WebSocket state
    pub fn update_websocket_state<F>(&self, update_fn: F) -> Result<(), String>
    where
        F: FnOnce(&mut WebSocketState),
    {
        self.websocket
            .lock()
            .map(|mut state| update_fn(&mut state))
            .map_err(|e| format!("Failed to lock WebSocket state: {e}"))
    }

    /// Get integration state
    pub fn get_integration_state(&self) -> Result<IntegrationState, String> {
        self.integration
            .lock()
            .map(|state| state.clone())
            .map_err(|e| format!("Failed to lock integration state: {e}"))
    }

    /// Store the PDF document for later operations
    pub fn set_pdf_document(&self, doc: Document) -> Result<(), String> {
        self.pdf_document
            .lock()
            .map(|mut guard| {
                *guard = Some(doc);
            })
            .map_err(|e| format!("Failed to lock PDF document: {e}"))
    }

    /// Get a reference to the PDF document
    pub fn get_pdf_document(&self) -> Result<MutexGuard<'_, Option<Document>>, String> {
        self.pdf_document
            .lock()
            .map_err(|e| format!("Failed to lock PDF document: {e}"))
    }

    /// Clear the PDF document from memory
    pub fn clear_pdf_document(&self) -> Result<(), String> {
        self.pdf_document
            .lock()
            .map(|mut guard| {
                *guard = None;
            })
            .map_err(|e| format!("Failed to lock PDF document: {e}"))
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
