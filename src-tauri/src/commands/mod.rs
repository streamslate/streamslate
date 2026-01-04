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

//! Tauri commands for StreamSlate application
//!
//! This module contains all the Tauri commands that can be invoked from the frontend.
//! Commands are organized by functionality into separate modules.

pub mod annotations;
pub mod ndi;
pub mod pdf;
pub mod presenter;

// Re-export all commands for easy access
pub use annotations::*;
pub use ndi::*;
pub use pdf::*;
pub use presenter::*;
