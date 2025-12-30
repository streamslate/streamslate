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

//! Error types for StreamSlate application
//!
//! This module provides a unified error type that can be returned from
//! Tauri commands and serialized to the frontend.

use thiserror::Error;

/// Main error type for StreamSlate operations
#[derive(Error, Debug)]
pub enum StreamSlateError {
    /// Error from PDF parsing library
    #[error("PDF error: {0}")]
    Pdf(#[from] lopdf::Error),

    /// File not found at specified path
    #[error("File not found: {0}")]
    FileNotFound(String),

    /// File exists but is not a valid PDF
    #[error("Invalid PDF: {0}")]
    InvalidPdf(String),

    /// Failed to acquire state lock
    #[error("State lock error: {0}")]
    StateLock(String),

    /// WebSocket server or connection error
    #[error("WebSocket error: {0}")]
    WebSocket(String),

    /// General I/O error
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    /// JSON serialization/deserialization error
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    /// Tauri window operation error
    #[error("Window error: {0}")]
    Window(String),

    /// Generic error for other cases
    #[error("{0}")]
    Other(String),
}

// Implement Serialize for Tauri command returns
// Tauri requires errors to be serializable to send to frontend
impl serde::Serialize for StreamSlateError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        // Serialize as a simple error message string
        // Frontend can parse this for display
        serializer.serialize_str(&self.to_string())
    }
}

/// Result type alias for StreamSlate operations
pub type Result<T> = std::result::Result<T, StreamSlateError>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let err = StreamSlateError::FileNotFound("/path/to/file.pdf".to_string());
        assert_eq!(err.to_string(), "File not found: /path/to/file.pdf");
    }

    #[test]
    fn test_error_serialization() {
        let err = StreamSlateError::InvalidPdf("Corrupted header".to_string());
        let json = serde_json::to_string(&err).unwrap();
        assert_eq!(json, "\"Invalid PDF: Corrupted header\"");
    }

    #[test]
    fn test_io_error_conversion() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "file missing");
        let err: StreamSlateError = io_err.into();
        assert!(matches!(err, StreamSlateError::Io(_)));
    }
}
