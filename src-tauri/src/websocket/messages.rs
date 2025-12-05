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

//! WebSocket message types for StreamSlate integrations
//!
//! These types match the frontend TypeScript definitions in integration.types.ts

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Message exchanged over WebSocket
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntegrationMessage {
    pub id: String,
    #[serde(rename = "type")]
    pub message_type: IntegrationMessageType,
    pub source: IntegrationSource,
    pub timestamp: DateTime<Utc>,
    pub data: serde_json::Value,
}

impl IntegrationMessage {
    /// Create a new message from StreamSlate
    pub fn new(message_type: IntegrationMessageType, data: serde_json::Value) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            message_type,
            source: IntegrationSource::Streamslate,
            timestamp: Utc::now(),
            data,
        }
    }

    /// Create a pong response
    pub fn pong() -> Self {
        Self::new(IntegrationMessageType::Pong, serde_json::json!({}))
    }

    /// Create an error message
    pub fn error(message: &str) -> Self {
        Self::new(
            IntegrationMessageType::Error,
            serde_json::json!({ "message": message }),
        )
    }

    /// Create a connection status message
    pub fn connection_status(connected: bool, client_count: usize) -> Self {
        Self::new(
            IntegrationMessageType::ConnectionStatus,
            serde_json::json!({
                "connected": connected,
                "clientCount": client_count
            }),
        )
    }
}

/// Types of messages that can be exchanged
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum IntegrationMessageType {
    // PDF Events
    PdfOpened,
    PdfClosed,
    PageChanged,
    AnnotationAdded,
    AnnotationRemoved,

    // Presenter Events
    PresenterModeToggled,
    PresenterConfigChanged,

    // OBS Integration
    ObsSceneChanged,
    ObsSourceVisibilityChanged,
    ObsRecordingStarted,
    ObsRecordingStopped,
    ObsStreamingStarted,
    ObsStreamingStopped,

    // Stream Deck
    StreamDeckButtonPressed,
    StreamDeckDialRotated,

    // NDI
    NdiSourceFound,
    NdiSourceLost,

    // Commands (inbound from clients)
    CommandNextPage,
    CommandPreviousPage,
    CommandGoToPage,
    CommandTogglePresenter,
    CommandAddAnnotation,

    // System
    Ping,
    Pong,
    Error,
    ConnectionStatus,
}

/// Source of the message
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum IntegrationSource {
    Streamslate,
    Obs,
    StreamDeck,
    Ndi,
    ExternalApi,
}

/// Data for page change events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageChangedData {
    pub page: u32,
    pub total_pages: u32,
}

/// Data for PDF opened events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PdfOpenedData {
    pub path: String,
    pub title: Option<String>,
    pub page_count: u32,
}

/// Data for go to page command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoToPageData {
    pub page: u32,
}

/// Data for presenter mode events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresenterModeData {
    pub active: bool,
}
