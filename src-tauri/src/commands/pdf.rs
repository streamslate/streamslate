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

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

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

/// Open a PDF file and return basic information about it
#[tauri::command]
pub async fn open_pdf(path: String) -> Result<PdfInfo, String> {
    let pdf_path = PathBuf::from(&path);

    if !pdf_path.exists() {
        return Err("PDF file does not exist".to_string());
    }

    if !pdf_path.extension().map_or(false, |ext| ext == "pdf") {
        return Err("File is not a PDF".to_string());
    }

    // Get file metadata
    let metadata =
        std::fs::metadata(&pdf_path).map_err(|e| format!("Failed to read file metadata: {e}"))?;

    // For now, return basic info. In a full implementation, you'd use a PDF library
    // to extract actual PDF metadata like page count, title, etc.
    Ok(PdfInfo {
        path: path.clone(),
        title: pdf_path
            .file_stem()
            .and_then(|s| s.to_str())
            .map(String::from),
        author: None,
        page_count: 1, // Placeholder - would need PDF parsing
        file_size: metadata.len(),
        created: None,
        modified: metadata.modified().ok().and_then(|t| {
            t.duration_since(std::time::UNIX_EPOCH)
                .ok()
                .map(|d| d.as_secs().to_string())
        }),
    })
}

/// Close the currently open PDF
#[tauri::command]
pub async fn close_pdf() -> Result<(), String> {
    // This would clear any PDF state from memory
    Ok(())
}

/// Get information about a specific page in the PDF
#[tauri::command]
pub async fn get_pdf_page_info(page_number: u32) -> Result<PdfPage, String> {
    // Placeholder implementation - would need actual PDF parsing
    if page_number == 0 {
        return Err("Page numbers start from 1".to_string());
    }

    Ok(PdfPage {
        page_number,
        width: 612.0, // Standard letter size in points
        height: 792.0,
        rotation: 0,
    })
}

/// Get the total number of pages in the currently open PDF
#[tauri::command]
pub async fn get_pdf_page_count() -> Result<u32, String> {
    // Placeholder - would return actual page count from open PDF
    Ok(1)
}

/// Check if a PDF is currently open
#[tauri::command]
pub async fn is_pdf_open() -> Result<bool, String> {
    // Placeholder - would check application state
    Ok(false)
}
