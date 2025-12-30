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

//! PDF-related Tauri commands
//!
//! This module provides commands for opening, closing, and querying PDF documents.
//! PDF parsing is handled by the lopdf crate.

use crate::error::{Result, StreamSlateError};
use crate::state::AppState;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::State;
use tracing::{debug, info, instrument, warn};

/// Information about an opened PDF file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PdfInfo {
    pub path: String,
    pub title: Option<String>,
    pub author: Option<String>,
    pub page_count: u32,
    pub file_size: u64,
    pub created: Option<String>,
    pub modified: Option<String>,
}

/// Information about a specific page in the PDF
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PdfPage {
    pub page_number: u32,
    pub width: f64,
    pub height: f64,
    pub rotation: u32,
}

/// Open a PDF file and return basic information about it
///
/// This command loads the PDF using lopdf, extracts metadata,
/// and stores the document in application state for subsequent operations.
#[tauri::command]
#[instrument(skip(state))]
pub async fn open_pdf(path: String, state: State<'_, AppState>) -> Result<PdfInfo> {
    let pdf_path = PathBuf::from(&path);

    // Validate file exists
    if !pdf_path.exists() {
        warn!(path = %path, "PDF file not found");
        return Err(StreamSlateError::FileNotFound(path));
    }

    // Validate file extension
    if !pdf_path
        .extension()
        .is_some_and(|ext| ext.eq_ignore_ascii_case("pdf"))
    {
        warn!(path = %path, "File is not a PDF");
        return Err(StreamSlateError::InvalidPdf(
            "File does not have .pdf extension".to_string(),
        ));
    }

    // Get file metadata
    let metadata = std::fs::metadata(&pdf_path)?;

    info!(path = %path, size = metadata.len(), "Loading PDF document");

    // Load the PDF document with lopdf
    let document = lopdf::Document::load(&pdf_path).map_err(|e| {
        warn!(path = %path, error = %e, "Failed to parse PDF");
        StreamSlateError::InvalidPdf(format!("Failed to parse PDF: {e}"))
    })?;

    // Get page count
    let page_count = document.get_pages().len() as u32;
    debug!(path = %path, pages = page_count, "PDF page count determined");

    // Extract metadata from PDF info dictionary
    let (title, author) = extract_pdf_metadata(&document);

    // Store the document in application state
    state.set_pdf_document(Some(document))?;

    // Update PDF state
    state.update_pdf_state(|pdf_state| {
        pdf_state.current_file = Some(path.clone());
        pdf_state.total_pages = page_count;
        pdf_state.current_page = 1;
        pdf_state.is_loaded = true;
    })?;

    info!(
        path = %path,
        pages = page_count,
        title = ?title,
        "PDF opened successfully"
    );

    Ok(PdfInfo {
        path,
        title: title.or_else(|| {
            pdf_path
                .file_stem()
                .and_then(|s| s.to_str())
                .map(String::from)
        }),
        author,
        page_count,
        file_size: metadata.len(),
        created: None,
        modified: metadata.modified().ok().and_then(|t| {
            t.duration_since(std::time::UNIX_EPOCH)
                .ok()
                .map(|d| d.as_secs().to_string())
        }),
    })
}

/// Extract title and author from PDF metadata
fn extract_pdf_metadata(document: &lopdf::Document) -> (Option<String>, Option<String>) {
    // Try to get the Info dictionary from the trailer
    let info_ref = match document.trailer.get(b"Info") {
        Ok(lopdf::Object::Reference(reference)) => Some(*reference),
        _ => None,
    };

    let info = info_ref.and_then(|reference| document.get_object(reference).ok());

    let (title, author) = if let Some(lopdf::Object::Dictionary(info_dict)) = info {
        let title = info_dict
            .get(b"Title")
            .ok()
            .and_then(extract_string_from_object);

        let author = info_dict
            .get(b"Author")
            .ok()
            .and_then(extract_string_from_object);

        (title, author)
    } else {
        (None, None)
    };

    (title, author)
}

/// Extract a string from a PDF object (handles both String and HexString)
fn extract_string_from_object(obj: &lopdf::Object) -> Option<String> {
    match obj {
        lopdf::Object::String(bytes, _) => String::from_utf8(bytes.clone()).ok(),
        _ => None,
    }
}

/// Close the currently open PDF
///
/// Clears the document from state and resets PDF metadata.
#[tauri::command]
#[instrument(skip(state))]
pub async fn close_pdf(state: State<'_, AppState>) -> Result<()> {
    info!("Closing PDF document");

    // Clear the document from state
    state.set_pdf_document(None)?;

    // Reset PDF state
    state.update_pdf_state(|pdf_state| {
        pdf_state.current_file = None;
        pdf_state.total_pages = 0;
        pdf_state.current_page = 1;
        pdf_state.is_loaded = false;
    })?;

    Ok(())
}

/// Get information about a specific page in the PDF
///
/// Returns page dimensions and rotation. Page numbers are 1-indexed.
#[tauri::command]
#[instrument(skip(state))]
pub async fn get_pdf_page_info(page_number: u32, state: State<'_, AppState>) -> Result<PdfPage> {
    if page_number == 0 {
        return Err(StreamSlateError::InvalidPdf(
            "Page numbers start from 1".to_string(),
        ));
    }

    // Get the document from state
    let document = state.get_pdf_document()?;
    let document = document.ok_or_else(|| {
        StreamSlateError::InvalidPdf("No PDF document is currently open".to_string())
    })?;

    // Get the page
    let pages = document.get_pages();
    let page_id = pages.get(&page_number).ok_or_else(|| {
        StreamSlateError::InvalidPdf(format!(
            "Page {} not found (document has {} pages)",
            page_number,
            pages.len()
        ))
    })?;

    // Get page dictionary
    let page_dict = document
        .get_dictionary(*page_id)
        .map_err(|e| StreamSlateError::InvalidPdf(format!("Failed to get page dictionary: {e}")))?;

    // Extract MediaBox for dimensions (default to US Letter if not found)
    let (width, height) = extract_page_dimensions(page_dict).unwrap_or((612.0, 792.0));

    // Extract rotation (default to 0)
    let rotation = page_dict
        .get(b"Rotate")
        .ok()
        .and_then(|obj| obj.as_i64().ok())
        .map(|r| (r % 360) as u32)
        .unwrap_or(0);

    debug!(
        page = page_number,
        width = width,
        height = height,
        rotation = rotation,
        "Page info retrieved"
    );

    Ok(PdfPage {
        page_number,
        width,
        height,
        rotation,
    })
}

/// Extract page dimensions from MediaBox or CropBox
fn extract_page_dimensions(page_dict: &lopdf::Dictionary) -> Option<(f64, f64)> {
    // Try MediaBox first, then CropBox
    let media_box = page_dict
        .get(b"MediaBox")
        .or_else(|_| page_dict.get(b"CropBox"))
        .ok()?;

    if let lopdf::Object::Array(arr) = media_box {
        if arr.len() >= 4 {
            let x1 = object_to_f64(&arr[0])?;
            let y1 = object_to_f64(&arr[1])?;
            let x2 = object_to_f64(&arr[2])?;
            let y2 = object_to_f64(&arr[3])?;
            return Some(((x2 - x1).abs(), (y2 - y1).abs()));
        }
    }

    None
}

/// Convert a PDF object to f64 (handles both Integer and Real types)
fn object_to_f64(obj: &lopdf::Object) -> Option<f64> {
    match obj {
        lopdf::Object::Integer(i) => Some(*i as f64),
        lopdf::Object::Real(r) => Some(*r as f64),
        _ => None,
    }
}

/// Get the total number of pages in the currently open PDF
#[tauri::command]
#[instrument(skip(state))]
pub async fn get_pdf_page_count(state: State<'_, AppState>) -> Result<u32> {
    let pdf_state = state.get_pdf_state()?;

    if !pdf_state.is_loaded {
        return Err(StreamSlateError::InvalidPdf(
            "No PDF document is currently open".to_string(),
        ));
    }

    Ok(pdf_state.total_pages)
}

/// Check if a PDF is currently open
#[tauri::command]
#[instrument(skip(state))]
pub async fn is_pdf_open(state: State<'_, AppState>) -> Result<bool> {
    let pdf_state = state.get_pdf_state()?;
    Ok(pdf_state.is_loaded)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pdf_info_serialization() {
        let info = PdfInfo {
            path: "/test/file.pdf".to_string(),
            title: Some("Test PDF".to_string()),
            author: Some("Test Author".to_string()),
            page_count: 10,
            file_size: 1024,
            created: None,
            modified: Some("1234567890".to_string()),
        };

        let json = serde_json::to_string(&info).unwrap();
        assert!(json.contains("Test PDF"));
        assert!(json.contains("page_count"));
    }

    #[test]
    fn test_pdf_page_serialization() {
        let page = PdfPage {
            page_number: 1,
            width: 612.0,
            height: 792.0,
            rotation: 0,
        };

        let json = serde_json::to_string(&page).unwrap();
        assert!(json.contains("612"));
        assert!(json.contains("792"));
    }
}
