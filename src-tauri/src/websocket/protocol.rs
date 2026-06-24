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

/// WebSocket control protocol version exposed by capability discovery.
pub const PROTOCOL_VERSION: &str = "2.0";

const SUPPORTED_COMMANDS: &[&str] = &[
    "NEXT_PAGE",
    "PREVIOUS_PAGE",
    "GO_TO_PAGE",
    "GET_STATE",
    "SET_ZOOM",
    "TOGGLE_PRESENTER",
    "PING",
    "ADD_ANNOTATION",
    "CLEAR_ANNOTATIONS",
    "GET_CAPABILITIES",
];

const SUPPORTED_EVENTS: &[&str] = &[
    "STATE",
    "PAGE_CHANGED",
    "PDF_OPENED",
    "PDF_CLOSED",
    "ZOOM_CHANGED",
    "PRESENTER_CHANGED",
    "ERROR",
    "PONG",
    "CONNECTED",
    "ANNOTATIONS_UPDATED",
    "ANNOTATIONS_CLEARED",
    "CAPABILITIES",
];

const SUPPORTED_FEATURES: &[&str] = &["presenter", "annotations", "pdf_state", "websocket_control"];

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

    /// Get supported protocol capabilities
    GetCapabilities,
}

/// Capability discovery payload for the WebSocket control protocol.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketCapabilities {
    /// Protocol version for the local-control contract.
    #[serde(rename = "protocolVersion")]
    pub protocol_version: String,

    /// Commands accepted by this server.
    pub supported_commands: Vec<String>,

    /// Events this server may emit.
    pub supported_events: Vec<String>,

    /// High-level feature areas exposed through the protocol.
    pub features: Vec<String>,
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

    /// Capability discovery response
    Capabilities(WebSocketCapabilities),
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

    /// Create a capabilities response event.
    pub fn capabilities() -> Self {
        Self::Capabilities(WebSocketCapabilities {
            protocol_version: PROTOCOL_VERSION.to_string(),
            supported_commands: SUPPORTED_COMMANDS
                .iter()
                .map(|command| (*command).to_string())
                .collect(),
            supported_events: SUPPORTED_EVENTS
                .iter()
                .map(|event| (*event).to_string())
                .collect(),
            features: SUPPORTED_FEATURES
                .iter()
                .map(|feature| (*feature).to_string())
                .collect(),
        })
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

    #[test]
    fn test_get_capabilities_command_deserialization() {
        let json = r#"{"type": "GET_CAPABILITIES"}"#;
        let cmd: WebSocketCommand = serde_json::from_str(json).unwrap();
        assert!(matches!(cmd, WebSocketCommand::GetCapabilities));
    }

    #[test]
    fn test_capabilities_serialization_shape() {
        let event = WebSocketEvent::capabilities();
        let json = serde_json::to_value(&event).unwrap();

        assert_eq!(json["type"], "CAPABILITIES");
        assert_eq!(json["protocolVersion"], PROTOCOL_VERSION);
        assert_eq!(
            json["supported_commands"],
            serde_json::json!([
                "NEXT_PAGE",
                "PREVIOUS_PAGE",
                "GO_TO_PAGE",
                "GET_STATE",
                "SET_ZOOM",
                "TOGGLE_PRESENTER",
                "PING",
                "ADD_ANNOTATION",
                "CLEAR_ANNOTATIONS",
                "GET_CAPABILITIES"
            ])
        );
        assert_eq!(
            json["supported_events"],
            serde_json::json!([
                "STATE",
                "PAGE_CHANGED",
                "PDF_OPENED",
                "PDF_CLOSED",
                "ZOOM_CHANGED",
                "PRESENTER_CHANGED",
                "ERROR",
                "PONG",
                "CONNECTED",
                "ANNOTATIONS_UPDATED",
                "ANNOTATIONS_CLEARED",
                "CAPABILITIES"
            ])
        );
        assert_eq!(
            json["features"],
            serde_json::json!(["presenter", "annotations", "pdf_state", "websocket_control"])
        );
    }
}
