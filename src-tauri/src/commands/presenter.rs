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

//! Presenter mode related Tauri commands

use serde::{Deserialize, Serialize};
use tauri::{Manager, Window};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresenterConfig {
    pub always_on_top: bool,
    pub transparent_background: bool,
    pub borderless: bool,
    pub position: WindowPosition,
    pub size: WindowSize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowPosition {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowSize {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresenterState {
    pub is_active: bool,
    pub current_page: u32,
    pub total_pages: u32,
    pub zoom_level: f64,
}

/// Open the presenter mode window
#[tauri::command]
pub async fn open_presenter_mode(
    window: Window,
    config: Option<PresenterConfig>,
) -> Result<(), String> {
    let app_handle = window.app_handle();

    // Check if presenter window already exists
    if let Some(_presenter_window) = app_handle.get_window("presenter") {
        return Err("Presenter mode is already open".to_string());
    }

    let default_config = PresenterConfig {
        always_on_top: true,
        transparent_background: true,
        borderless: true,
        position: WindowPosition { x: 100, y: 100 },
        size: WindowSize {
            width: 800,
            height: 600,
        },
    };

    let _config = config.unwrap_or(default_config);

    // Create presenter window (this would need to be implemented with actual window creation)
    // For now, just return success as the window configuration is in tauri.conf.json

    Ok(())
}

/// Close the presenter mode window
#[tauri::command]
pub async fn close_presenter_mode(window: Window) -> Result<(), String> {
    let app_handle = window.app_handle();

    if let Some(presenter_window) = app_handle.get_window("presenter") {
        presenter_window
            .close()
            .map_err(|e| format!("Failed to close presenter window: {}", e))?;
    }

    Ok(())
}

/// Update presenter mode configuration
#[tauri::command]
pub async fn update_presenter_config(
    window: Window,
    config: PresenterConfig,
) -> Result<(), String> {
    let app_handle = window.app_handle();

    if let Some(presenter_window) = app_handle.get_window("presenter") {
        // Apply configuration changes
        presenter_window
            .set_always_on_top(config.always_on_top)
            .map_err(|e| format!("Failed to set always on top: {}", e))?;

        presenter_window
            .set_decorations(!config.borderless)
            .map_err(|e| format!("Failed to set decorations: {}", e))?;

        presenter_window
            .set_size(tauri::Size::Physical(tauri::PhysicalSize {
                width: config.size.width,
                height: config.size.height,
            }))
            .map_err(|e| format!("Failed to set size: {}", e))?;

        presenter_window
            .set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                x: config.position.x,
                y: config.position.y,
            }))
            .map_err(|e| format!("Failed to set position: {}", e))?;
    }

    Ok(())
}

/// Get current presenter mode state
#[tauri::command]
pub async fn get_presenter_state(window: Window) -> Result<PresenterState, String> {
    let app_handle = window.app_handle();
    let is_active = app_handle.get_window("presenter").is_some();

    // Placeholder state - would be retrieved from application state in real implementation
    Ok(PresenterState {
        is_active,
        current_page: 1,
        total_pages: 1,
        zoom_level: 1.0,
    })
}

/// Toggle presenter mode on/off
#[tauri::command]
pub async fn toggle_presenter_mode(window: Window) -> Result<bool, String> {
    let app_handle = window.app_handle();

    if app_handle.get_window("presenter").is_some() {
        close_presenter_mode(window).await?;
        Ok(false)
    } else {
        open_presenter_mode(window, None).await?;
        Ok(true)
    }
}

/// Update the current page in presenter mode
#[tauri::command]
pub async fn set_presenter_page(window: Window, page: u32) -> Result<(), String> {
    let app_handle = window.app_handle();

    if let Some(presenter_window) = app_handle.get_window("presenter") {
        // Emit event to update page in presenter window
        presenter_window
            .emit("page-changed", page)
            .map_err(|e| format!("Failed to emit page change event: {}", e))?;
    }

    Ok(())
}
