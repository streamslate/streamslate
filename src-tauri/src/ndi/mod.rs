/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * NDI (Network Device Interface) sender implementation.
 * Captures screen content via ScreenCaptureKit and transmits via NDI.
 *
 * NOTE: This module requires the NDI SDK to be installed:
 * macOS: /Library/NDI SDK for Apple (install NDI Tools from ndi.video)
 *
 * Enable the `ndi` feature in Cargo.toml to build with NDI support.
 */

#[cfg(feature = "ndi")]
pub mod sender;

#[cfg(feature = "ndi")]
pub use sender::*;

/// Check if NDI feature is enabled at compile time
pub fn is_ndi_available() -> bool {
    cfg!(feature = "ndi")
}
