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

//! WebSocket message protocol types
//!
//! Defines the JSON message format for client-server communication.

use serde::{Deserialize, Serialize};

/// Commands that clients can send to StreamSlate
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum WebSocketCommand {
    /// Navigate to the next page
    NextPage,

    /// Navigate to the previous page
    PreviousPage,

    /// Navigate to a specific page
    GoToPage { page: u32 },

    /// Get current state
    GetState,

    /// Set zoom level (1.0 = 100%)
    SetZoom { zoom: f64 },

    /// Toggle presenter mode
    TogglePresenter,

    /// Ping to keep connection alive
    Ping,

    /// Add an annotation
    AddAnnotation {
        page: u32,
        annotation: serde_json::Value,
    },

    /// Clear all annotations
    ClearAnnotations,
}

/// Events that StreamSlate sends to clients
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum WebSocketEvent {
    /// Current state update
    State {
        page: u32,
        total_pages: u32,
        zoom: f64,
        pdf_loaded: bool,
        pdf_path: Option<String>,
        pdf_title: Option<String>,
        presenter_active: bool,
    },

    /// Page changed notification
    PageChanged { page: u32, total_pages: u32 },

    /// PDF opened notification
    PdfOpened {
        path: String,
        title: Option<String>,
        page_count: u32,
    },

    /// PDF closed notification
    PdfClosed,

    /// Zoom changed notification
    ZoomChanged { zoom: f64 },

    /// Presenter mode changed
    PresenterChanged { active: bool },

    /// Error response
    Error { message: String },

    /// Pong response to ping
    Pong,

    /// Connection established confirmation
    Connected { version: String },

    /// Annotations updated notification
    AnnotationsUpdated {
        /// Map of page number to list of annotations
        annotations: std::collections::HashMap<u32, Vec<serde_json::Value>>,
    },

    /// All annotations cleared
    AnnotationsCleared,
}

impl WebSocketEvent {
    /// Create a connected event
    pub fn connected() -> Self {
        Self::Connected {
            version: env!("CARGO_PKG_VERSION").to_string(),
        }
    }

    /// Create an error event
    pub fn error(message: impl Into<String>) -> Self {
        Self::Error {
            message: message.into(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_command_serialization() {
        let cmd = WebSocketCommand::GoToPage { page: 5 };
        let json = serde_json::to_string(&cmd).unwrap();
        assert!(json.contains("GO_TO_PAGE"));
        assert!(json.contains("5"));
    }

    #[test]
    fn test_event_serialization() {
        let event = WebSocketEvent::PageChanged {
            page: 3,
            total_pages: 10,
        };
        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("PAGE_CHANGED"));
        assert!(json.contains("total_pages"));
    }

    #[test]
    fn test_command_deserialization() {
        let json = r#"{"type": "NEXT_PAGE"}"#;
        let cmd: WebSocketCommand = serde_json::from_str(json).unwrap();
        assert!(matches!(cmd, WebSocketCommand::NextPage));
    }
}
