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

//! Application error types with safe user-facing messages
//!
//! This module provides error types that:
//! - Present safe, generic messages to users
//! - Log detailed internal information for debugging
//! - Prevent information leakage

use serde::{Deserialize, Serialize};

/// Application error with safe user-facing message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppError {
    /// Error code for programmatic handling
    pub code: ErrorCode,
    /// Safe user-facing message
    pub message: String,
    /// Internal details (not serialized to frontend)
    #[serde(skip_serializing)]
    pub internal_details: Option<String>,
}

/// Error codes for categorizing errors
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ErrorCode {
    // PDF errors
    PdfNotFound,
    PdfAccessDenied,
    PdfInvalidFormat,
    PdfLoadFailed,
    PdfPageNotFound,

    // Presenter errors
    PresenterAlreadyOpen,
    PresenterNotOpen,
    PresenterConfigInvalid,

    // WebSocket errors
    WebSocketNotRunning,
    WebSocketConnectionFailed,

    // State errors
    StateLockFailed,

    // General errors
    InternalError,
    ValidationFailed,
    OperationNotPermitted,
}

impl AppError {
    /// Create a new error with internal details
    fn new(code: ErrorCode, message: &str, details: Option<String>) -> Self {
        // Log internal details in debug mode
        if let Some(ref internal) = details {
            #[cfg(debug_assertions)]
            eprintln!("[AppError] {}: {} - Details: {}", code, message, internal);
        }

        Self {
            code,
            message: message.to_string(),
            internal_details: details,
        }
    }

    // PDF Errors

    /// PDF file was not found
    pub fn pdf_not_found() -> Self {
        Self::new(
            ErrorCode::PdfNotFound,
            "The requested PDF file could not be found",
            None,
        )
    }

    /// PDF file access denied
    pub fn pdf_access_denied() -> Self {
        Self::new(
            ErrorCode::PdfAccessDenied,
            "Unable to access the PDF file",
            None,
        )
    }

    /// PDF file is invalid or corrupted
    pub fn pdf_invalid_format() -> Self {
        Self::new(
            ErrorCode::PdfInvalidFormat,
            "The file is not a valid PDF",
            None,
        )
    }

    /// Failed to load PDF
    pub fn pdf_load_failed(details: impl Into<String>) -> Self {
        Self::new(
            ErrorCode::PdfLoadFailed,
            "Unable to open the PDF file",
            Some(details.into()),
        )
    }

    /// PDF page not found
    pub fn pdf_page_not_found(page: u32) -> Self {
        Self::new(
            ErrorCode::PdfPageNotFound,
            "The requested page does not exist",
            Some(format!("Requested page: {}", page)),
        )
    }

    // Presenter Errors

    /// Presenter mode already open
    pub fn presenter_already_open() -> Self {
        Self::new(
            ErrorCode::PresenterAlreadyOpen,
            "Presenter mode is already active",
            None,
        )
    }

    /// Presenter mode not open
    pub fn presenter_not_open() -> Self {
        Self::new(
            ErrorCode::PresenterNotOpen,
            "Presenter mode is not active",
            None,
        )
    }

    /// Invalid presenter configuration
    pub fn presenter_config_invalid(details: impl Into<String>) -> Self {
        Self::new(
            ErrorCode::PresenterConfigInvalid,
            "Invalid presenter configuration",
            Some(details.into()),
        )
    }

    // WebSocket Errors

    /// WebSocket server not running
    pub fn websocket_not_running() -> Self {
        Self::new(
            ErrorCode::WebSocketNotRunning,
            "WebSocket server is not running",
            None,
        )
    }

    // State Errors

    /// Failed to lock state
    pub fn state_lock_failed(details: impl Into<String>) -> Self {
        Self::new(
            ErrorCode::StateLockFailed,
            "An internal error occurred",
            Some(details.into()),
        )
    }

    // General Errors

    /// Internal error (logs details but shows generic message)
    pub fn internal(details: impl Into<String>) -> Self {
        Self::new(
            ErrorCode::InternalError,
            "An unexpected error occurred",
            Some(details.into()),
        )
    }

    /// Validation failed
    pub fn validation_failed(message: &str) -> Self {
        Self::new(ErrorCode::ValidationFailed, message, None)
    }

    /// Operation not permitted
    pub fn operation_not_permitted() -> Self {
        Self::new(
            ErrorCode::OperationNotPermitted,
            "This operation is not permitted",
            None,
        )
    }
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::fmt::Display for ErrorCode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl std::error::Error for AppError {}

/// Convert AppError to String for Tauri command returns
impl From<AppError> for String {
    fn from(error: AppError) -> Self {
        error.message
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_messages_are_safe() {
        let error = AppError::pdf_load_failed("Failed to parse header at byte 0x45");
        assert_eq!(error.message, "Unable to open the PDF file");
        assert!(!error.message.contains("0x45"));
        assert!(!error.message.contains("header"));
    }

    #[test]
    fn test_internal_details_not_serialized() {
        let error = AppError::internal("Secret internal state: password=1234");
        let json = serde_json::to_string(&error).unwrap();
        assert!(!json.contains("password"));
        assert!(!json.contains("1234"));
        assert!(!json.contains("Secret"));
    }

    #[test]
    fn test_error_code_serialization() {
        let error = AppError::pdf_not_found();
        let json = serde_json::to_string(&error).unwrap();
        assert!(json.contains("pdf_not_found"));
    }
}
