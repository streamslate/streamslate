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

use serde::{Deserialize, Deserializer, Serialize};

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

/// Return whether a command name is part of the current protocol.
pub fn is_supported_command_type(command_type: &str) -> bool {
    SUPPORTED_COMMANDS.contains(&command_type)
}

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

impl WebSocketCommand {
    /// Return the wire-level command name.
    pub fn type_name(&self) -> &'static str {
        match self {
            Self::NextPage => "NEXT_PAGE",
            Self::PreviousPage => "PREVIOUS_PAGE",
            Self::GoToPage { .. } => "GO_TO_PAGE",
            Self::GetState => "GET_STATE",
            Self::SetZoom { .. } => "SET_ZOOM",
            Self::TogglePresenter => "TOGGLE_PRESENTER",
            Self::Ping => "PING",
            Self::AddAnnotation { .. } => "ADD_ANNOTATION",
            Self::ClearAnnotations => "CLEAR_ANNOTATIONS",
            Self::GetCapabilities => "GET_CAPABILITIES",
        }
    }
}

/// Optional V2 metadata accepted on incoming commands and echoed on direct responses.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct WebSocketMessageMetadata {
    /// Optional client-advertised protocol version.
    #[serde(
        rename = "protocolVersion",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub protocol_version: Option<String>,

    /// Optional client request identifier.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub request_id: Option<String>,
}

impl WebSocketMessageMetadata {
    fn is_v2(&self) -> bool {
        self.protocol_version.as_deref() == Some(PROTOCOL_VERSION) || self.request_id.is_some()
    }

    fn for_response(&self, event: &WebSocketEvent) -> Self {
        let protocol_version = if self.is_v2() && !matches!(event, WebSocketEvent::Capabilities(_))
        {
            Some(PROTOCOL_VERSION.to_string())
        } else {
            None
        };

        Self {
            protocol_version,
            request_id: self.request_id.clone(),
        }
    }
}

/// Incoming WebSocket command with optional V2 metadata preserved.
#[derive(Debug, Clone, Deserialize)]
pub struct WebSocketRequest {
    /// Optional V2 command metadata.
    #[serde(flatten)]
    pub metadata: WebSocketMessageMetadata,

    /// Backwards-compatible V1 command payload.
    #[serde(flatten)]
    pub command: WebSocketCommand,
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

/// Stable V2 error codes for machine-readable runtime failures.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum WebSocketErrorCode {
    InvalidCommand,
    InvalidPayload,
    PdfNotLoaded,
    PageOutOfRange,
    UnsupportedCommand,
    InternalError,
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
    Error {
        message: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        code: Option<WebSocketErrorCode>,
        #[serde(skip_serializing_if = "Option::is_none")]
        recoverable: Option<bool>,
        #[serde(skip_serializing_if = "Option::is_none")]
        details: Option<serde_json::Value>,
    },

    /// Pong response to ping
    Pong,

    /// Connection established confirmation
    Connected { version: String },

    /// Annotations updated notification
    AnnotationsUpdated {
        /// Map of page number to list of annotations
        #[serde(deserialize_with = "deserialize_annotation_map")]
        annotations: std::collections::HashMap<u32, Vec<serde_json::Value>>,
    },

    /// All annotations cleared
    AnnotationsCleared,

    /// Capability discovery response
    Capabilities(WebSocketCapabilities),
}

/// Direct response serializer that echoes request metadata without changing broadcasts.
#[derive(Debug, Serialize)]
pub struct WebSocketDirectResponse<'a> {
    #[serde(flatten)]
    event: &'a WebSocketEvent,

    #[serde(flatten)]
    metadata: WebSocketMessageMetadata,
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
            code: None,
            recoverable: None,
            details: None,
        }
    }

    /// Create a classified V2 error event.
    pub fn classified_error(
        code: WebSocketErrorCode,
        message: impl Into<String>,
        recoverable: bool,
        details: Option<serde_json::Value>,
    ) -> Self {
        Self::Error {
            message: message.into(),
            code: Some(code),
            recoverable: Some(recoverable),
            details,
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

    /// Wrap this event as a direct response to a command request.
    pub fn direct_response<'a>(
        &'a self,
        metadata: &WebSocketMessageMetadata,
    ) -> WebSocketDirectResponse<'a> {
        WebSocketDirectResponse {
            event: self,
            metadata: metadata.for_response(self),
        }
    }
}

fn deserialize_annotation_map<'de, D>(
    deserializer: D,
) -> Result<std::collections::HashMap<u32, Vec<serde_json::Value>>, D::Error>
where
    D: Deserializer<'de>,
{
    let annotations =
        std::collections::HashMap::<String, Vec<serde_json::Value>>::deserialize(deserializer)?;

    annotations
        .into_iter()
        .map(|(page, annotations)| {
            page.parse::<u32>()
                .map(|page| (page, annotations))
                .map_err(serde::de::Error::custom)
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixture(name: &str) -> serde_json::Value {
        let path = format!(
            "{}/../docs/api-v2-fixtures/{}",
            env!("CARGO_MANIFEST_DIR"),
            name
        );
        let json = std::fs::read_to_string(&path)
            .unwrap_or_else(|error| panic!("failed to read fixture {path}: {error}"));

        serde_json::from_str(&json)
            .unwrap_or_else(|error| panic!("failed to parse fixture {path}: {error}"))
    }

    fn optional_fixture(name: &str) -> Option<serde_json::Value> {
        let path = format!(
            "{}/../docs/api-v2-fixtures/{}",
            env!("CARGO_MANIFEST_DIR"),
            name
        );
        let json = match std::fs::read_to_string(&path) {
            Ok(json) => json,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => return None,
            Err(error) => panic!("failed to read fixture {path}: {error}"),
        };

        Some(
            serde_json::from_str(&json)
                .unwrap_or_else(|error| panic!("failed to parse fixture {path}: {error}")),
        )
    }

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
    fn test_v1_request_deserialization() {
        let json = r#"{"type": "NEXT_PAGE"}"#;
        let request: WebSocketRequest = serde_json::from_str(json).unwrap();

        assert!(matches!(request.command, WebSocketCommand::NextPage));
        assert!(request.metadata.protocol_version.is_none());
        assert!(request.metadata.request_id.is_none());
    }

    #[test]
    fn test_v2_request_deserialization_preserves_metadata() {
        let json = r#"{"type": "GO_TO_PAGE", "page": 5, "protocolVersion": "2.0", "request_id": "obs-42"}"#;
        let request: WebSocketRequest = serde_json::from_str(json).unwrap();

        assert!(matches!(
            request.command,
            WebSocketCommand::GoToPage { page: 5 }
        ));
        assert_eq!(request.metadata.protocol_version.as_deref(), Some("2.0"));
        assert_eq!(request.metadata.request_id.as_deref(), Some("obs-42"));
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

    #[test]
    fn test_direct_response_echoes_request_id() {
        let metadata = WebSocketMessageMetadata {
            protocol_version: Some(PROTOCOL_VERSION.to_string()),
            request_id: Some("obs-42".to_string()),
        };
        let event = WebSocketEvent::PageChanged {
            page: 3,
            total_pages: 10,
        };

        let json = serde_json::to_value(event.direct_response(&metadata)).unwrap();

        assert_eq!(json["type"], "PAGE_CHANGED");
        assert_eq!(json["protocolVersion"], PROTOCOL_VERSION);
        assert_eq!(json["request_id"], "obs-42");
        assert_eq!(json["page"], 3);
        assert_eq!(json["total_pages"], 10);
    }

    #[test]
    fn test_direct_capabilities_response_echoes_request_id_without_duplicate_version() {
        let metadata = WebSocketMessageMetadata {
            protocol_version: Some(PROTOCOL_VERSION.to_string()),
            request_id: Some("deck-hello".to_string()),
        };
        let event = WebSocketEvent::capabilities();

        let json = serde_json::to_string(&event.direct_response(&metadata)).unwrap();

        assert_eq!(json.matches("protocolVersion").count(), 1);
        let value: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(value["type"], "CAPABILITIES");
        assert_eq!(value["protocolVersion"], PROTOCOL_VERSION);
        assert_eq!(value["request_id"], "deck-hello");
    }

    #[test]
    fn test_rich_v2_error_serialization_shape() {
        let metadata = WebSocketMessageMetadata {
            protocol_version: Some(PROTOCOL_VERSION.to_string()),
            request_id: Some("cmd-go-to-page-invalid".to_string()),
        };
        let event = WebSocketEvent::classified_error(
            WebSocketErrorCode::PageOutOfRange,
            "Page 99 is out of range (1-12)",
            true,
            Some(serde_json::json!({
                "command": "GO_TO_PAGE",
                "requested_page": 99,
                "total_pages": 12
            })),
        );

        let json = serde_json::to_value(event.direct_response(&metadata)).unwrap();

        assert_eq!(json["type"], "ERROR");
        assert_eq!(json["protocolVersion"], PROTOCOL_VERSION);
        assert_eq!(json["request_id"], "cmd-go-to-page-invalid");
        assert_eq!(json["code"], "PAGE_OUT_OF_RANGE");
        assert_eq!(json["message"], "Page 99 is out of range (1-12)");
        assert_eq!(json["recoverable"], true);
        assert_eq!(json["details"]["command"], "GO_TO_PAGE");
        assert_eq!(json["details"]["requested_page"], 99);
        assert_eq!(json["details"]["total_pages"], 12);
    }

    #[test]
    fn test_message_only_error_remains_valid() {
        let event: WebSocketEvent =
            serde_json::from_str(r#"{"type": "ERROR", "message": "No PDF is currently open"}"#)
                .unwrap();

        match event {
            WebSocketEvent::Error {
                message,
                code,
                recoverable,
                details,
            } => {
                assert_eq!(message, "No PDF is currently open");
                assert!(code.is_none());
                assert!(recoverable.is_none());
                assert!(details.is_none());
            }
            _ => panic!("expected error event"),
        }

        let json = serde_json::to_value(WebSocketEvent::error("plain error")).unwrap();
        assert_eq!(
            json,
            serde_json::json!({"type": "ERROR", "message": "plain error"})
        );
    }

    #[test]
    fn test_capabilities_v2_fixture_matches_protocol_capabilities() {
        let mut fixture = fixture("capabilities.v2.json");
        assert_eq!(fixture["request_id"], "cmd-get-capabilities");
        fixture
            .as_object_mut()
            .expect("capabilities fixture should be an object")
            .remove("request_id");

        let capabilities = WebSocketEvent::capabilities();
        let json = serde_json::to_value(&capabilities).unwrap();

        assert_eq!(json, fixture);
    }

    #[test]
    fn test_error_fixtures_deserialize() {
        let v1: WebSocketEvent = serde_json::from_value(fixture("error.v1.json")).unwrap();
        match v1 {
            WebSocketEvent::Error {
                message,
                code,
                recoverable,
                details,
            } => {
                assert_eq!(message, "Page 99 is outside the loaded document range.");
                assert!(code.is_none());
                assert!(recoverable.is_none());
                assert!(details.is_none());
            }
            _ => panic!("expected v1 error fixture to deserialize as ERROR"),
        }

        let v2: WebSocketEvent = serde_json::from_value(fixture("error.v2.json")).unwrap();
        match v2 {
            WebSocketEvent::Error {
                message,
                code,
                recoverable,
                details,
            } => {
                assert_eq!(message, "Page 99 is outside the loaded document range.");
                assert_eq!(code, Some(WebSocketErrorCode::PageOutOfRange));
                assert_eq!(recoverable, Some(true));
                let details = details.expect("v2 error fixture should include details");
                assert_eq!(details["command"], "GO_TO_PAGE");
                assert_eq!(details["requested_page"], 99);
                assert_eq!(details["total_pages"], 12);
            }
            _ => panic!("expected v2 error fixture to deserialize as ERROR"),
        }
    }

    #[test]
    fn test_get_capabilities_v2_fixture_preserves_request_metadata() {
        let request: WebSocketRequest =
            serde_json::from_value(fixture("command.get-capabilities.v2.json")).unwrap();

        assert!(matches!(request.command, WebSocketCommand::GetCapabilities));
        assert_eq!(
            request.metadata.protocol_version.as_deref(),
            Some(PROTOCOL_VERSION)
        );
        assert_eq!(
            request.metadata.request_id.as_deref(),
            Some("cmd-get-capabilities")
        );
    }

    #[test]
    fn test_annotation_v2_fixtures_deserialize_when_present() {
        let updated: WebSocketEvent =
            serde_json::from_value(fixture("annotations-updated.v2.json")).unwrap();
        match updated {
            WebSocketEvent::AnnotationsUpdated { annotations } => {
                let page_annotations = annotations
                    .get(&3)
                    .expect("annotations-updated fixture should include page 3");
                assert_eq!(page_annotations.len(), 1);
                assert_eq!(page_annotations[0]["id"], "ann-highlight-1");
            }
            _ => {
                panic!("expected annotations-updated fixture to deserialize as ANNOTATIONS_UPDATED")
            }
        }

        if let Some(cleared) = optional_fixture("annotations-cleared.v2.json") {
            let cleared: WebSocketEvent = serde_json::from_value(cleared).unwrap();
            assert!(matches!(cleared, WebSocketEvent::AnnotationsCleared));
        }
    }
}
