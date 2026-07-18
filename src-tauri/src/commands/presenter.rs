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

use crate::error::Result;
use crate::state::AppState;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use tracing::{debug, info, instrument, warn};

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
    pub pdf_path: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
struct PresenterChangedPayload {
    active: bool,
}

/// Payload for PDF opened events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PdfOpenedPayload {
    pub path: String,
    pub page_count: u32,
}

/// Payload for page changed events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageChangedPayload {
    pub page: u32,
    pub total_pages: u32,
    pub pdf_path: Option<String>,
}

/// Open the presenter mode window
#[tauri::command]
#[instrument(skip(window, state))]
pub async fn open_presenter_mode(
    window: WebviewWindow,
    state: State<'_, AppState>,
    config: Option<PresenterConfig>,
) -> Result<()> {
    open_presenter_window(window.app_handle(), state.inner(), config)
}

/// Open the native presenter window from either a Tauri command or a remote
/// control handler. State is marked active only after the window is visible.
pub(crate) fn open_presenter_window(
    app_handle: &AppHandle,
    state: &AppState,
    config: Option<PresenterConfig>,
) -> Result<()> {
    // Check if presenter window already exists
    if let Some(presenter_window) = app_handle.get_webview_window("presenter") {
        info!("Presenter window already exists, showing and emitting current state");
        presenter_window.show().map_err(|e| {
            crate::error::StreamSlateError::Window(format!("Failed to show presenter window: {e}"))
        })?;
        ensure_presenter_visible(&presenter_window)?;

        if let Err(error) = state.update_presenter_state(|presenter| {
            presenter.is_active = true;
        }) {
            let _ = presenter_window.hide();
            return Err(error);
        }

        // Emit current state to sync presenter
        emit_current_state_to_presenter(&presenter_window, state)?;
        emit_presenter_changed(app_handle, true);
        return Ok(());
    }

    info!("Opening presenter mode — creating presenter window");

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

    let cfg = config.unwrap_or(default_config);

    // Create the presenter window (it may have been destroyed by a previous close)
    let presenter_window = WebviewWindowBuilder::new(
        app_handle,
        "presenter",
        WebviewUrl::App("/presenter".into()),
    )
    .title("StreamSlate - Presenter Mode")
    .inner_size(cfg.size.width as f64, cfg.size.height as f64)
    .min_inner_size(400.0, 300.0)
    .always_on_top(cfg.always_on_top)
    .decorations(!cfg.borderless)
    .skip_taskbar(true)
    .visible(true)
    .build()
    .map_err(|e| {
        crate::error::StreamSlateError::Window(format!("Failed to create presenter window: {e}"))
    })?;

    presenter_window.show().map_err(|e| {
        crate::error::StreamSlateError::Window(format!("Failed to show presenter window: {e}"))
    })?;
    ensure_presenter_visible(&presenter_window)?;

    // Update presenter state
    if let Err(error) = state.update_presenter_state(|presenter| {
        presenter.is_active = true;
    }) {
        let _ = presenter_window.close();
        return Err(error);
    }

    // Emit current PDF state so the presenter window syncs immediately
    emit_current_state_to_presenter(&presenter_window, state)?;
    emit_presenter_changed(app_handle, true);

    Ok(())
}

fn ensure_presenter_visible(presenter_window: &WebviewWindow) -> Result<()> {
    let is_visible = inspect_presenter_visibility(presenter_window)?;

    if !is_visible {
        return Err(crate::error::StreamSlateError::Window(
            "Presenter window was created but is not visible".to_string(),
        ));
    }

    Ok(())
}

fn inspect_presenter_visibility(presenter_window: &WebviewWindow) -> Result<bool> {
    presenter_window.is_visible().map_err(|e| {
        crate::error::StreamSlateError::Window(format!(
            "Failed to inspect presenter window visibility: {e}"
        ))
    })
}

fn presenter_is_visible(app_handle: &AppHandle) -> Result<bool> {
    app_handle
        .get_webview_window("presenter")
        .as_ref()
        .map(inspect_presenter_visibility)
        .unwrap_or(Ok(false))
}

fn emit_presenter_changed(app_handle: &AppHandle, active: bool) {
    if let Err(error) = app_handle.emit("presenter-changed", PresenterChangedPayload { active }) {
        warn!(%error, active, "Failed to emit presenter lifecycle change");
    }
}

/// Helper to emit current PDF state to presenter window
fn emit_current_state_to_presenter(
    presenter_window: &WebviewWindow,
    state: &AppState,
) -> Result<()> {
    let pdf_state = state.get_pdf_state()?;

    if pdf_state.is_loaded {
        if let Some(ref path) = pdf_state.current_file {
            debug!(
                page = pdf_state.current_page,
                total = pdf_state.total_pages,
                "Emitting PDF state to presenter"
            );

            // Emit pdf-opened event
            let _ = presenter_window.emit(
                "pdf-opened",
                PdfOpenedPayload {
                    path: path.clone(),
                    page_count: pdf_state.total_pages,
                },
            );

            // Emit current page
            let _ = presenter_window.emit(
                "page-changed",
                PageChangedPayload {
                    page: pdf_state.current_page,
                    total_pages: pdf_state.total_pages,
                    pdf_path: Some(path.clone()),
                },
            );
        }
    }

    Ok(())
}

/// Close the presenter mode window
#[tauri::command]
#[instrument(skip(window, state))]
pub async fn close_presenter_mode(window: WebviewWindow, state: State<'_, AppState>) -> Result<()> {
    close_presenter_window(window.app_handle(), state.inner())
}

/// Close the native presenter window and publish the resulting lifecycle state.
pub(crate) fn close_presenter_window(app_handle: &AppHandle, state: &AppState) -> Result<()> {
    info!("Closing presenter mode");

    // Persist the intended state before the irreversible close. If closing the
    // native window fails, restore the active flag while the window is visible.
    state.update_presenter_state(|presenter| {
        presenter.is_active = false;
    })?;

    if let Some(presenter_window) = app_handle.get_webview_window("presenter") {
        if let Err(error) = presenter_window.close() {
            state.update_presenter_state(|presenter| {
                presenter.is_active = true;
            })?;
            return Err(crate::error::StreamSlateError::Window(format!(
                "Failed to close presenter window: {error}"
            )));
        }
    }

    emit_presenter_changed(app_handle, false);

    Ok(())
}

/// Update presenter mode configuration
#[tauri::command]
#[instrument(skip(window))]
pub async fn update_presenter_config(window: WebviewWindow, config: PresenterConfig) -> Result<()> {
    use crate::error::StreamSlateError;
    let app_handle = window.app_handle();

    debug!(?config, "Updating presenter config");

    if let Some(presenter_window) = app_handle.get_webview_window("presenter") {
        // Apply configuration changes
        presenter_window
            .set_always_on_top(config.always_on_top)
            .map_err(|e| StreamSlateError::Window(format!("Failed to set always on top: {e}")))?;

        presenter_window
            .set_decorations(!config.borderless)
            .map_err(|e| StreamSlateError::Window(format!("Failed to set decorations: {e}")))?;

        presenter_window
            .set_size(tauri::Size::Physical(tauri::PhysicalSize {
                width: config.size.width,
                height: config.size.height,
            }))
            .map_err(|e| StreamSlateError::Window(format!("Failed to set size: {e}")))?;

        presenter_window
            .set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                x: config.position.x,
                y: config.position.y,
            }))
            .map_err(|e| StreamSlateError::Window(format!("Failed to set position: {e}")))?;
    }

    Ok(())
}

/// Get current presenter mode state
#[tauri::command]
#[instrument(skip(window, state))]
pub async fn get_presenter_state(
    window: WebviewWindow,
    state: State<'_, AppState>,
) -> Result<PresenterState> {
    let app_handle = window.app_handle();
    let is_active = presenter_is_visible(app_handle)?;

    // Get PDF state for page info
    let pdf_state = state.get_pdf_state()?;

    Ok(PresenterState {
        is_active,
        current_page: pdf_state.current_page,
        total_pages: pdf_state.total_pages,
        zoom_level: pdf_state.zoom_level,
        pdf_path: pdf_state.current_file,
    })
}

/// Toggle presenter mode on/off
#[tauri::command]
#[instrument(skip(window, state))]
pub async fn toggle_presenter_mode(
    window: WebviewWindow,
    state: State<'_, AppState>,
) -> Result<bool> {
    toggle_presenter_window(window.app_handle(), state.inner())
}

/// Toggle the actual native window and return its resulting visibility.
pub(crate) fn toggle_presenter_window(app_handle: &AppHandle, state: &AppState) -> Result<bool> {
    if presenter_is_visible(app_handle)? {
        close_presenter_window(app_handle, state)?;
        Ok(false)
    } else {
        open_presenter_window(app_handle, state, None)?;
        Ok(true)
    }
}

/// Update the current page in presenter mode
#[tauri::command]
#[instrument(skip(window, state))]
pub async fn set_presenter_page(
    window: WebviewWindow,
    state: State<'_, AppState>,
    page: u32,
) -> Result<()> {
    use crate::error::StreamSlateError;
    let app_handle = window.app_handle();

    // Update PDF state
    state.update_pdf_state(|pdf| {
        pdf.current_page = page;
    })?;

    // Get total pages for the event payload
    let pdf_state = state.get_pdf_state()?;

    if let Some(presenter_window) = app_handle.get_webview_window("presenter") {
        // Emit event to update page in presenter window
        presenter_window
            .emit(
                "page-changed",
                PageChangedPayload {
                    page,
                    total_pages: pdf_state.total_pages,
                    pdf_path: pdf_state.current_file,
                },
            )
            .map_err(|e| {
                StreamSlateError::Window(format!("Failed to emit page change event: {e}"))
            })?;
    }

    Ok(())
}
