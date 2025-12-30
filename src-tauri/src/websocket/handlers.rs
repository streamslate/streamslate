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

//! WebSocket command handlers
//!
//! Processes incoming commands and generates appropriate responses/events.

use super::protocol::{WebSocketCommand, WebSocketEvent};
use crate::state::AppState;
use std::sync::Arc;
use tauri::AppHandle;
use tracing::{debug, warn};

/// Handle an incoming WebSocket command
pub fn handle_command(
    command: WebSocketCommand,
    state: &Arc<AppState>,
    app_handle: &AppHandle,
) -> WebSocketEvent {
    debug!(?command, "Handling WebSocket command");

    match command {
        WebSocketCommand::NextPage => handle_next_page(state, app_handle),
        WebSocketCommand::PreviousPage => handle_previous_page(state, app_handle),
        WebSocketCommand::GoToPage { page } => handle_go_to_page(state, app_handle, page),
        WebSocketCommand::GetState => handle_get_state(state),
        WebSocketCommand::SetZoom { zoom } => handle_set_zoom(state, app_handle, zoom),
        WebSocketCommand::TogglePresenter => handle_toggle_presenter(state, app_handle),
        WebSocketCommand::Ping => WebSocketEvent::Pong,
    }
}

fn handle_next_page(state: &Arc<AppState>, app_handle: &AppHandle) -> WebSocketEvent {
    let pdf_state = match state.get_pdf_state() {
        Ok(s) => s,
        Err(e) => return WebSocketEvent::error(e.to_string()),
    };

    if !pdf_state.is_loaded {
        return WebSocketEvent::error("No PDF is currently open");
    }

    let new_page = (pdf_state.current_page + 1).min(pdf_state.total_pages);
    if new_page == pdf_state.current_page {
        return WebSocketEvent::error("Already on last page");
    }

    // Update state
    if let Err(e) = state.update_pdf_state(|s| {
        s.current_page = new_page;
    }) {
        return WebSocketEvent::error(e.to_string());
    }

    // Emit event to frontend
    emit_page_changed(app_handle, new_page, pdf_state.total_pages);

    WebSocketEvent::PageChanged {
        page: new_page,
        total_pages: pdf_state.total_pages,
    }
}

fn handle_previous_page(state: &Arc<AppState>, app_handle: &AppHandle) -> WebSocketEvent {
    let pdf_state = match state.get_pdf_state() {
        Ok(s) => s,
        Err(e) => return WebSocketEvent::error(e.to_string()),
    };

    if !pdf_state.is_loaded {
        return WebSocketEvent::error("No PDF is currently open");
    }

    let new_page = pdf_state.current_page.saturating_sub(1).max(1);
    if new_page == pdf_state.current_page {
        return WebSocketEvent::error("Already on first page");
    }

    // Update state
    if let Err(e) = state.update_pdf_state(|s| {
        s.current_page = new_page;
    }) {
        return WebSocketEvent::error(e.to_string());
    }

    // Emit event to frontend
    emit_page_changed(app_handle, new_page, pdf_state.total_pages);

    WebSocketEvent::PageChanged {
        page: new_page,
        total_pages: pdf_state.total_pages,
    }
}

fn handle_go_to_page(state: &Arc<AppState>, app_handle: &AppHandle, page: u32) -> WebSocketEvent {
    let pdf_state = match state.get_pdf_state() {
        Ok(s) => s,
        Err(e) => return WebSocketEvent::error(e.to_string()),
    };

    if !pdf_state.is_loaded {
        return WebSocketEvent::error("No PDF is currently open");
    }

    if page < 1 || page > pdf_state.total_pages {
        return WebSocketEvent::error(format!(
            "Page {} is out of range (1-{})",
            page, pdf_state.total_pages
        ));
    }

    // Update state
    if let Err(e) = state.update_pdf_state(|s| {
        s.current_page = page;
    }) {
        return WebSocketEvent::error(e.to_string());
    }

    // Emit event to frontend
    emit_page_changed(app_handle, page, pdf_state.total_pages);

    WebSocketEvent::PageChanged {
        page,
        total_pages: pdf_state.total_pages,
    }
}

fn handle_get_state(state: &Arc<AppState>) -> WebSocketEvent {
    let pdf_state = match state.get_pdf_state() {
        Ok(s) => s,
        Err(e) => return WebSocketEvent::error(e.to_string()),
    };

    let presenter_state = match state.get_presenter_state() {
        Ok(s) => s,
        Err(e) => return WebSocketEvent::error(e.to_string()),
    };

    WebSocketEvent::State {
        page: pdf_state.current_page,
        total_pages: pdf_state.total_pages,
        zoom: pdf_state.zoom_level,
        pdf_loaded: pdf_state.is_loaded,
        pdf_path: pdf_state.current_file.clone(),
        pdf_title: None, // Title not stored in state currently
        presenter_active: presenter_state.is_active,
    }
}

fn handle_set_zoom(state: &Arc<AppState>, app_handle: &AppHandle, zoom: f64) -> WebSocketEvent {
    let zoom = zoom.clamp(0.1, 5.0); // Clamp zoom to valid range

    // Update state
    if let Err(e) = state.update_pdf_state(|s| {
        s.zoom_level = zoom;
    }) {
        return WebSocketEvent::error(e.to_string());
    }

    // Emit event to frontend
    emit_zoom_changed(app_handle, zoom);

    WebSocketEvent::ZoomChanged { zoom }
}

fn handle_toggle_presenter(state: &Arc<AppState>, app_handle: &AppHandle) -> WebSocketEvent {
    let presenter_state = match state.get_presenter_state() {
        Ok(s) => s,
        Err(e) => return WebSocketEvent::error(e.to_string()),
    };

    let new_active = !presenter_state.is_active;

    // Update state
    if let Err(e) = state.update_presenter_state(|s| {
        s.is_active = new_active;
    }) {
        return WebSocketEvent::error(e.to_string());
    }

    // Emit event to frontend
    emit_presenter_changed(app_handle, new_active);

    WebSocketEvent::PresenterChanged { active: new_active }
}

// Helper functions to emit events to the frontend

fn emit_page_changed(app_handle: &AppHandle, page: u32, total_pages: u32) {
    use tauri::Manager;

    #[derive(serde::Serialize, Clone)]
    struct PageChangedPayload {
        page: u32,
        total_pages: u32,
    }

    if let Err(e) = app_handle.emit_all("page-changed", PageChangedPayload { page, total_pages }) {
        warn!(error = %e, "Failed to emit page-changed event");
    }
}

fn emit_zoom_changed(app_handle: &AppHandle, zoom: f64) {
    use tauri::Manager;

    #[derive(serde::Serialize, Clone)]
    struct ZoomChangedPayload {
        zoom: f64,
    }

    if let Err(e) = app_handle.emit_all("zoom-changed", ZoomChangedPayload { zoom }) {
        warn!(error = %e, "Failed to emit zoom-changed event");
    }
}

fn emit_presenter_changed(app_handle: &AppHandle, active: bool) {
    use tauri::Manager;

    #[derive(serde::Serialize, Clone)]
    struct PresenterChangedPayload {
        active: bool,
    }

    if let Err(e) = app_handle.emit_all("presenter-changed", PresenterChangedPayload { active }) {
        warn!(error = %e, "Failed to emit presenter-changed event");
    }
}
