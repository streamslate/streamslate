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

//! Security utilities for input validation and path sanitization

use std::path::{Path, PathBuf};

/// Security error types
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SecurityError {
    /// Path traversal attempt detected
    PathTraversal,
    /// Path is outside allowed scope
    OutsideAllowedScope,
    /// Invalid file extension
    InvalidExtension,
    /// Invalid or malformed path
    InvalidPath,
    /// Symlink access not allowed
    SymlinkNotAllowed,
    /// Null byte in path
    NullByteInPath,
}

impl std::fmt::Display for SecurityError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        // User-facing messages that don't leak internal details
        match self {
            SecurityError::PathTraversal => write!(f, "Invalid file path"),
            SecurityError::OutsideAllowedScope => write!(f, "File access not permitted"),
            SecurityError::InvalidExtension => write!(f, "Invalid file type"),
            SecurityError::InvalidPath => write!(f, "Invalid path format"),
            SecurityError::SymlinkNotAllowed => write!(f, "File access not permitted"),
            SecurityError::NullByteInPath => write!(f, "Invalid path format"),
        }
    }
}

impl std::error::Error for SecurityError {}

/// Validate and sanitize a file path
///
/// Checks for:
/// - Null bytes
/// - Path traversal patterns
/// - Symlinks
/// - File existence
pub fn validate_path(path: &str) -> Result<PathBuf, SecurityError> {
    // Check for null bytes
    if path.contains('\0') {
        return Err(SecurityError::NullByteInPath);
    }

    // Check for path traversal patterns
    if path.contains("..") {
        return Err(SecurityError::PathTraversal);
    }

    // Additional traversal checks for various OS patterns
    let suspicious_patterns = [
        "..", // Parent directory
        "~",  // Home directory expansion (shell)
        "%",  // URL encoding
    ];

    for pattern in suspicious_patterns {
        if path.contains(pattern) {
            return Err(SecurityError::PathTraversal);
        }
    }

    let path_buf = PathBuf::from(path);

    // Verify the path exists and can be accessed
    if !path_buf.exists() {
        return Err(SecurityError::InvalidPath);
    }

    // Check if it's a symlink
    if path_buf.is_symlink() {
        return Err(SecurityError::SymlinkNotAllowed);
    }

    // Canonicalize to resolve to absolute path
    let canonical = path_buf
        .canonicalize()
        .map_err(|_| SecurityError::InvalidPath)?;

    Ok(canonical)
}

/// Validate a PDF file path
///
/// Additional checks for PDF files:
/// - Extension must be .pdf (case-insensitive)
/// - File must be readable
pub fn validate_pdf_path(path: &str) -> Result<PathBuf, SecurityError> {
    let canonical = validate_path(path)?;

    // Check file extension
    let extension = canonical
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase());

    if extension.as_deref() != Some("pdf") {
        return Err(SecurityError::InvalidExtension);
    }

    // Verify the file is readable
    if std::fs::metadata(&canonical).is_err() {
        return Err(SecurityError::InvalidPath);
    }

    Ok(canonical)
}

/// Validate presenter configuration values
///
/// Prevents:
/// - Off-screen window positioning
/// - Invalid window sizes
pub fn validate_window_config(
    x: i32,
    y: i32,
    width: u32,
    height: u32,
) -> Result<(), SecurityError> {
    // Reasonable bounds for window position (-10000 to 10000)
    const MAX_COORD: i32 = 10000;
    const MIN_COORD: i32 = -10000;

    if x < MIN_COORD || x > MAX_COORD || y < MIN_COORD || y > MAX_COORD {
        return Err(SecurityError::InvalidPath); // Generic error for config
    }

    // Reasonable bounds for window size (1 to 10000)
    const MAX_SIZE: u32 = 10000;
    const MIN_SIZE: u32 = 1;

    if width < MIN_SIZE || width > MAX_SIZE || height < MIN_SIZE || height > MAX_SIZE {
        return Err(SecurityError::InvalidPath);
    }

    Ok(())
}

/// Check if a path is within allowed directories
///
/// This is a basic check - Tauri's allowlist provides the primary protection
pub fn is_within_allowed_scope(path: &Path) -> bool {
    // Get standard directories
    let allowed_dirs: Vec<PathBuf> = vec![
        dirs::document_dir(),
        dirs::desktop_dir(),
        dirs::download_dir(),
    ]
    .into_iter()
    .flatten()
    .collect();

    // Check if the path starts with any allowed directory
    allowed_dirs
        .iter()
        .any(|allowed| path.starts_with(allowed))
}

/// Sanitize a string for logging (remove potentially sensitive data)
pub fn sanitize_for_log(input: &str) -> String {
    // Remove path components beyond the filename
    if let Some(filename) = Path::new(input).file_name() {
        filename.to_string_lossy().to_string()
    } else {
        "[invalid path]".to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_null_byte_detection() {
        let result = validate_path("/path/to\0/file.pdf");
        assert_eq!(result, Err(SecurityError::NullByteInPath));
    }

    #[test]
    fn test_path_traversal_detection() {
        let result = validate_path("/path/../../../etc/passwd");
        assert_eq!(result, Err(SecurityError::PathTraversal));
    }

    #[test]
    fn test_tilde_traversal_detection() {
        let result = validate_path("~/../../etc/passwd");
        assert_eq!(result, Err(SecurityError::PathTraversal));
    }

    #[test]
    fn test_nonexistent_path() {
        let result = validate_path("/definitely/not/a/real/path.pdf");
        assert_eq!(result, Err(SecurityError::InvalidPath));
    }

    #[test]
    fn test_invalid_extension() {
        // Create a temp file with wrong extension
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_security.txt");
        std::fs::write(&test_file, "test").unwrap();

        let result = validate_pdf_path(test_file.to_str().unwrap());
        assert_eq!(result, Err(SecurityError::InvalidExtension));

        std::fs::remove_file(&test_file).ok();
    }

    #[test]
    fn test_window_config_validation() {
        // Valid config
        assert!(validate_window_config(100, 100, 800, 600).is_ok());

        // Invalid x position
        assert!(validate_window_config(20000, 100, 800, 600).is_err());

        // Invalid width (0)
        assert!(validate_window_config(100, 100, 0, 600).is_err());

        // Invalid width (too large)
        assert!(validate_window_config(100, 100, 20000, 600).is_err());
    }

    #[test]
    fn test_sanitize_for_log() {
        let full_path = "/Users/secret/documents/sensitive.pdf";
        let sanitized = sanitize_for_log(full_path);
        assert_eq!(sanitized, "sensitive.pdf");
    }
}
