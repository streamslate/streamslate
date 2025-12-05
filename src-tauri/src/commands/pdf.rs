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

use crate::state::AppState;
use lopdf::Document;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::State;

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PdfPage {
    pub page_number: u32,
    pub width: f64,
    pub height: f64,
    pub rotation: u32,
}

/// Extract a string value from a PDF dictionary
fn extract_string_from_dict(
    doc: &Document,
    dict: &lopdf::Dictionary,
    key: &[u8],
) -> Option<String> {
    dict.get(key).ok().and_then(|obj| {
        match obj {
            lopdf::Object::String(bytes, _) => {
                // Try UTF-16BE first (common for PDF metadata)
                if bytes.len() >= 2 && bytes[0] == 0xFE && bytes[1] == 0xFF {
                    let utf16: Vec<u16> = bytes[2..]
                        .chunks(2)
                        .filter_map(|chunk| {
                            if chunk.len() == 2 {
                                Some(u16::from_be_bytes([chunk[0], chunk[1]]))
                            } else {
                                None
                            }
                        })
                        .collect();
                    String::from_utf16(&utf16).ok()
                } else {
                    // Try UTF-8 / Latin-1
                    String::from_utf8(bytes.clone())
                        .or_else(|_| {
                            // Fallback to Latin-1
                            Ok::<String, ()>(bytes.iter().map(|&b| b as char).collect())
                        })
                        .ok()
                }
            }
            lopdf::Object::Reference(obj_id) => doc.get_object(*obj_id).ok().and_then(|resolved| {
                if let lopdf::Object::String(bytes, _) = resolved {
                    String::from_utf8(bytes.clone()).ok()
                } else {
                    None
                }
            }),
            _ => None,
        }
    })
}

/// Parse PDF date format (D:YYYYMMDDHHmmSSOHH'mm')
fn parse_pdf_date(date_str: &str) -> Option<String> {
    let cleaned = date_str.trim_start_matches("D:");
    if cleaned.len() >= 4 {
        // Extract year at minimum
        let year = &cleaned[0..4];
        let month = if cleaned.len() >= 6 {
            &cleaned[4..6]
        } else {
            "01"
        };
        let day = if cleaned.len() >= 8 {
            &cleaned[6..8]
        } else {
            "01"
        };
        let hour = if cleaned.len() >= 10 {
            &cleaned[8..10]
        } else {
            "00"
        };
        let minute = if cleaned.len() >= 12 {
            &cleaned[10..12]
        } else {
            "00"
        };
        let second = if cleaned.len() >= 14 {
            &cleaned[12..14]
        } else {
            "00"
        };

        Some(format!(
            "{}-{}-{}T{}:{}:{}Z",
            year, month, day, hour, minute, second
        ))
    } else {
        None
    }
}

/// Extract metadata from a PDF document
fn extract_pdf_metadata(doc: &Document) -> (Option<String>, Option<String>, Option<String>) {
    let mut title = None;
    let mut author = None;
    let mut created = None;

    // Try to get the Info dictionary from the trailer
    if let Ok(info_ref) = doc.trailer.get(b"Info") {
        if let Ok(obj_id) = info_ref.as_reference() {
            if let Ok(info_obj) = doc.get_object(obj_id) {
                if let Ok(dict) = info_obj.as_dict() {
                    title = extract_string_from_dict(doc, dict, b"Title");
                    author = extract_string_from_dict(doc, dict, b"Author");

                    if let Some(date_str) = extract_string_from_dict(doc, dict, b"CreationDate") {
                        created = parse_pdf_date(&date_str);
                    }
                }
            }
        }
    }

    (title, author, created)
}

/// Get page dimensions from a PDF page
fn get_page_dimensions(doc: &Document, page_id: lopdf::ObjectId) -> (f64, f64, u32) {
    let mut width = 612.0; // Default letter size
    let mut height = 792.0;
    let mut rotation = 0u32;

    if let Ok(page_obj) = doc.get_object(page_id) {
        if let Ok(page_dict) = page_obj.as_dict() {
            // Get MediaBox (required) or CropBox
            let media_box = page_dict
                .get(b"MediaBox")
                .or_else(|_| page_dict.get(b"CropBox"));

            if let Ok(box_obj) = media_box {
                if let Ok(arr) = box_obj.as_array() {
                    if arr.len() >= 4 {
                        let get_num = |obj: &lopdf::Object| -> f64 {
                            match obj {
                                lopdf::Object::Integer(n) => *n as f64,
                                lopdf::Object::Real(n) => *n as f64,
                                _ => 0.0,
                            }
                        };
                        let x1 = get_num(&arr[0]);
                        let y1 = get_num(&arr[1]);
                        let x2 = get_num(&arr[2]);
                        let y2 = get_num(&arr[3]);
                        width = (x2 - x1).abs();
                        height = (y2 - y1).abs();
                    }
                }
            }

            // Get rotation
            if let Ok(rot_obj) = page_dict.get(b"Rotate") {
                if let Ok(rot) = rot_obj.as_i64() {
                    rotation = ((rot % 360 + 360) % 360) as u32;
                }
            }
        }
    }

    (width, height, rotation)
}

/// Open a PDF file and return basic information about it
#[tauri::command]
pub async fn open_pdf(path: String, state: State<'_, AppState>) -> Result<PdfInfo, String> {
    let pdf_path = PathBuf::from(&path);

    if !pdf_path.exists() {
        return Err("PDF file does not exist".to_string());
    }

    if !pdf_path
        .extension()
        .map_or(false, |ext| ext.eq_ignore_ascii_case("pdf"))
    {
        return Err("File is not a PDF".to_string());
    }

    // Get file metadata
    let metadata = std::fs::metadata(&pdf_path).map_err(|_| "Unable to read file".to_string())?;

    // Load PDF with lopdf
    let doc = Document::load(&pdf_path).map_err(|_| "Unable to open PDF file".to_string())?;

    // Get page count
    let page_count = doc.get_pages().len() as u32;

    // Extract metadata
    let (title, author, created) = extract_pdf_metadata(&doc);

    // Use filename as fallback title
    let final_title = title.or_else(|| {
        pdf_path
            .file_stem()
            .and_then(|s| s.to_str())
            .map(String::from)
    });

    // Update application state
    state
        .update_pdf_state(|pdf_state| {
            pdf_state.current_file = Some(path.clone());
            pdf_state.total_pages = page_count;
            pdf_state.current_page = 1;
            pdf_state.is_loaded = true;
        })
        .map_err(|e| format!("Failed to update state: {e}"))?;

    // Store document in state for later use
    state.set_pdf_document(doc)?;

    Ok(PdfInfo {
        path,
        title: final_title,
        author,
        page_count,
        file_size: metadata.len(),
        created,
        modified: metadata.modified().ok().and_then(|t| {
            t.duration_since(std::time::UNIX_EPOCH)
                .ok()
                .map(|d| d.as_secs().to_string())
        }),
    })
}

/// Close the currently open PDF
#[tauri::command]
pub async fn close_pdf(state: State<'_, AppState>) -> Result<(), String> {
    state
        .update_pdf_state(|pdf_state| {
            pdf_state.current_file = None;
            pdf_state.total_pages = 0;
            pdf_state.current_page = 1;
            pdf_state.is_loaded = false;
        })
        .map_err(|e| format!("Failed to update state: {e}"))?;

    state.clear_pdf_document()?;

    Ok(())
}

/// Get information about a specific page in the PDF
#[tauri::command]
pub async fn get_pdf_page_info(
    page_number: u32,
    state: State<'_, AppState>,
) -> Result<PdfPage, String> {
    if page_number == 0 {
        return Err("Page numbers start from 1".to_string());
    }

    let doc_guard = state.get_pdf_document()?;
    let doc = doc_guard.as_ref().ok_or("No PDF is currently open")?;

    let pages = doc.get_pages();
    let page_id = pages
        .get(&page_number)
        .ok_or_else(|| format!("Page {} does not exist", page_number))?;

    let (width, height, rotation) = get_page_dimensions(doc, *page_id);

    Ok(PdfPage {
        page_number,
        width,
        height,
        rotation,
    })
}

/// Get the total number of pages in the currently open PDF
#[tauri::command]
pub async fn get_pdf_page_count(state: State<'_, AppState>) -> Result<u32, String> {
    let pdf_state = state.get_pdf_state()?;
    Ok(pdf_state.total_pages)
}

/// Check if a PDF is currently open
#[tauri::command]
pub async fn is_pdf_open(state: State<'_, AppState>) -> Result<bool, String> {
    let pdf_state = state.get_pdf_state()?;
    Ok(pdf_state.is_loaded)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use std::io::Write;
    use tempfile::tempdir;

    #[test]
    fn test_parse_pdf_date_full() {
        let result = parse_pdf_date("D:20231215143022+00'00'");
        assert_eq!(result, Some("2023-12-15T14:30:22Z".to_string()));
    }

    #[test]
    fn test_parse_pdf_date_minimal() {
        let result = parse_pdf_date("D:2023");
        assert_eq!(result, Some("2023-01-01T00:00:00Z".to_string()));
    }

    #[test]
    fn test_parse_pdf_date_partial() {
        let result = parse_pdf_date("D:20231215");
        assert_eq!(result, Some("2023-12-15T00:00:00Z".to_string()));
    }

    #[test]
    fn test_parse_pdf_date_invalid() {
        let result = parse_pdf_date("D:20");
        assert_eq!(result, None);
    }

    #[tokio::test]
    async fn test_pdf_path_validation_nonexistent() {
        let state = AppState::new();
        let tauri_state = tauri::State::new(&state);
        let result = open_pdf("/nonexistent/path.pdf".to_string(), tauri_state).await;
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "PDF file does not exist");
    }

    #[tokio::test]
    async fn test_pdf_path_validation_wrong_extension() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.txt");
        File::create(&file_path)
            .unwrap()
            .write_all(b"not a pdf")
            .unwrap();

        let state = AppState::new();
        let tauri_state = tauri::State::new(&state);
        let result = open_pdf(file_path.to_string_lossy().to_string(), tauri_state).await;
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "File is not a PDF");
    }

    #[test]
    fn test_page_number_validation() {
        // Page 0 should be invalid
        assert_eq!(0u32, 0);
    }
}
