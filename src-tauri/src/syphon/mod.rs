/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * Syphon output support (macOS only, requires Syphon.framework).
 * Publishes captured frames as a Syphon source visible to any
 * Syphon client (OBS, VDMX, MadMapper, etc.).
 *
 * Enable the `syphon` feature in Cargo.toml to build with Syphon support.
 */

#[cfg(all(target_os = "macos", feature = "syphon"))]
mod ffi;

#[cfg(all(target_os = "macos", feature = "syphon"))]
mod server;

#[cfg(all(target_os = "macos", feature = "syphon"))]
pub use server::SyphonServer;

/// Check if Syphon feature is enabled at compile time
pub fn is_syphon_available() -> bool {
    cfg!(all(target_os = "macos", feature = "syphon"))
}
