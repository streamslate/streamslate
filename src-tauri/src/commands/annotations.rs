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

//! Annotation persistence commands
//!
//! Annotations are stored in JSON sidecar files alongside the PDF.
//! For example, `document.pdf` would have annotations in `document.pdf.annotations.json`.

use crate::error::{Result, StreamSlateError};
use crate::state::AppState;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::State;
use tracing::{debug, info, instrument, warn};

/// Annotation data structure matching the frontend type
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Annotation {
    pub id: String,
    #[serde(rename = "type")]
    pub annotation_type: String,
    pub page_number: u32,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub content: String,
    pub color: String,
    pub opacity: f64,
    /// Optional stroke width for shapes
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stroke_width: Option<f64>,
    /// Optional font size for text annotations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub font_size: Option<f64>,
    /// Optional text background color (hex) for text annotations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub background_color: Option<String>,
    /// Optional text background opacity for text annotations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub background_opacity: Option<f64>,
    pub created: String,
    pub modified: String,
    pub visible: bool,
    /// Optional points for free-draw annotations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub points: Option<Vec<Point>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

/// Annotations file format
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnnotationsFile {
    pub version: u32,
    pub pdf_path: String,
    pub annotations: HashMap<u32, Vec<Annotation>>,
    pub created_at: String,
    pub updated_at: String,
}

impl AnnotationsFile {
    fn new(pdf_path: &str) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            version: 1,
            pdf_path: pdf_path.to_string(),
            annotations: HashMap::new(),
            created_at: now.clone(),
            updated_at: now,
        }
    }
}

/// Get the sidecar file path for annotations
fn get_annotations_path(pdf_path: &str) -> PathBuf {
    PathBuf::from(format!("{}.annotations.json", pdf_path))
}

/// Save annotations to a JSON sidecar file
#[tauri::command]
#[instrument(skip(state))]
pub async fn save_annotations(
    state: State<'_, AppState>,
    annotations: HashMap<u32, Vec<Annotation>>,
) -> Result<()> {
    let pdf_state = state.get_pdf_state()?;

    let pdf_path = pdf_state
        .current_file
        .ok_or_else(|| StreamSlateError::InvalidPdf("No PDF is currently open".to_string()))?;

    let annotations_path = get_annotations_path(&pdf_path);

    info!(
        path = %annotations_path.display(),
        count = annotations.values().map(|v| v.len()).sum::<usize>(),
        "Saving annotations"
    );

    let now = chrono::Utc::now().to_rfc3339();

    // Load existing file to preserve created_at, or create new
    let mut file = if annotations_path.exists() {
        let content = std::fs::read_to_string(&annotations_path)?;
        serde_json::from_str::<AnnotationsFile>(&content).unwrap_or_else(|_| {
            warn!("Failed to parse existing annotations file, creating new");
            AnnotationsFile::new(&pdf_path)
        })
    } else {
        AnnotationsFile::new(&pdf_path)
    };

    file.annotations = annotations;
    file.updated_at = now;

    // Write with pretty formatting for debugging
    let json = serde_json::to_string_pretty(&file)?;
    std::fs::write(&annotations_path, json)?;

    // Also store in app state for quick access
    {
        let mut state_annotations = state
            .annotations
            .lock()
            .map_err(|e| StreamSlateError::StateLock(format!("Annotations: {e}")))?;

        state_annotations.clear();
        for (page, page_annotations) in &file.annotations {
            let serialized: Vec<String> = page_annotations
                .iter()
                .filter_map(|a| serde_json::to_string(a).ok())
                .collect();
            state_annotations.insert(*page, serialized);
        }
    }

    debug!(path = %annotations_path.display(), "Annotations saved successfully");

    // Broadcast update to all connected clients (Live Collaboration)
    let mut broadcast_annotations = HashMap::new();
    for (page, page_annotations) in &file.annotations {
        let values: Vec<serde_json::Value> = page_annotations
            .iter()
            .filter_map(|a| serde_json::to_value(a).ok())
            .collect();
        broadcast_annotations.insert(*page, values);
    }

    if let Err(e) = state.broadcast(crate::websocket::WebSocketEvent::AnnotationsUpdated {
        annotations: broadcast_annotations,
    }) {
        warn!("Failed to broadcast annotations update: {}", e);
    }

    Ok(())
}

/// Load annotations from the JSON sidecar file
#[tauri::command]
#[instrument(skip(state))]
pub async fn load_annotations(state: State<'_, AppState>) -> Result<HashMap<u32, Vec<Annotation>>> {
    let pdf_state = state.get_pdf_state()?;

    let pdf_path = pdf_state
        .current_file
        .ok_or_else(|| StreamSlateError::InvalidPdf("No PDF is currently open".to_string()))?;

    let annotations_path = get_annotations_path(&pdf_path);

    if !annotations_path.exists() {
        debug!(path = %annotations_path.display(), "No annotations file found");
        return Ok(HashMap::new());
    }

    info!(path = %annotations_path.display(), "Loading annotations");

    let content = std::fs::read_to_string(&annotations_path)?;
    let file: AnnotationsFile = serde_json::from_str(&content).map_err(StreamSlateError::Json)?;

    // Verify the annotations match the current PDF
    if file.pdf_path != pdf_path {
        warn!(
            expected = %pdf_path,
            found = %file.pdf_path,
            "Annotations file PDF path mismatch"
        );
    }

    // Store in app state for quick access
    {
        let mut state_annotations = state
            .annotations
            .lock()
            .map_err(|e| StreamSlateError::StateLock(format!("Annotations: {e}")))?;

        state_annotations.clear();
        for (page, page_annotations) in &file.annotations {
            let serialized: Vec<String> = page_annotations
                .iter()
                .filter_map(|a| serde_json::to_string(a).ok())
                .collect();
            state_annotations.insert(*page, serialized);
        }
    }

    debug!(
        count = file.annotations.values().map(|v| v.len()).sum::<usize>(),
        "Annotations loaded successfully"
    );

    Ok(file.annotations)
}

/// Get annotations for a specific page
#[tauri::command]
#[instrument(skip(state))]
pub async fn get_page_annotations(
    state: State<'_, AppState>,
    page_number: u32,
) -> Result<Vec<Annotation>> {
    let state_annotations = state
        .annotations
        .lock()
        .map_err(|e| StreamSlateError::StateLock(format!("Annotations: {e}")))?;

    let annotations: Vec<Annotation> = state_annotations
        .get(&page_number)
        .map(|serialized| {
            serialized
                .iter()
                .filter_map(|s| serde_json::from_str::<Annotation>(s).ok())
                .collect()
        })
        .unwrap_or_default();

    debug!(
        page = page_number,
        count = annotations.len(),
        "Got page annotations"
    );

    Ok(annotations)
}

/// Delete all annotations for the current PDF
#[tauri::command]
#[instrument(skip(state))]
pub async fn clear_annotations(state: State<'_, AppState>) -> Result<()> {
    let pdf_state = state.get_pdf_state()?;

    let pdf_path = pdf_state
        .current_file
        .ok_or_else(|| StreamSlateError::InvalidPdf("No PDF is currently open".to_string()))?;

    let annotations_path = get_annotations_path(&pdf_path);

    if annotations_path.exists() {
        info!(path = %annotations_path.display(), "Deleting annotations file");
        std::fs::remove_file(&annotations_path)?;
    }

    // Clear from state
    {
        let mut state_annotations = state
            .annotations
            .lock()
            .map_err(|e| StreamSlateError::StateLock(format!("Annotations: {e}")))?;
        state_annotations.clear();
    }

    Ok(())
}

/// Check if annotations exist for a PDF
#[tauri::command]
#[instrument]
pub async fn has_annotations(pdf_path: String) -> Result<bool> {
    let annotations_path = get_annotations_path(&pdf_path);
    Ok(annotations_path.exists())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_annotation_serialization() {
        let annotation = Annotation {
            id: "test-123".to_string(),
            annotation_type: "highlight".to_string(),
            page_number: 1,
            x: 100.0,
            y: 200.0,
            width: 300.0,
            height: 50.0,
            content: "".to_string(),
            color: "#ffff00".to_string(),
            opacity: 0.5,
            stroke_width: None,
            font_size: None,
            background_color: None,
            background_opacity: None,
            created: "2025-01-01T00:00:00Z".to_string(),
            modified: "2025-01-01T00:00:00Z".to_string(),
            visible: true,
            points: None,
        };

        let json = serde_json::to_string(&annotation).unwrap();
        assert!(json.contains("highlight"));
        assert!(json.contains("pageNumber"));
    }

    #[test]
    fn test_annotations_file_new() {
        let file = AnnotationsFile::new("/path/to/test.pdf");
        assert_eq!(file.version, 1);
        assert_eq!(file.pdf_path, "/path/to/test.pdf");
        assert!(file.annotations.is_empty());
    }
}
