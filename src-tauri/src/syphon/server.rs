/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * Safe Rust wrapper around the Syphon Objective-C bridge.
 */

use super::ffi;
use crate::capture::CapturedFrame;
use crate::state::FrameOutput;
use std::ffi::CString;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use tracing::{debug, info};

/// Syphon server that publishes frames to Syphon clients.
pub struct SyphonServer {
    handle: *mut std::os::raw::c_void,
    is_running: AtomicBool,
    frames_sent: AtomicU64,
    name: String,
}

// The ObjC handle is thread-safe (SyphonMetalServer is internally synchronized)
unsafe impl Send for SyphonServer {}
unsafe impl Sync for SyphonServer {}

impl SyphonServer {
    /// Create a new Syphon server with the given name.
    pub fn new(name: &str) -> Result<Self, String> {
        let c_name = CString::new(name).map_err(|e| format!("Invalid name: {e}"))?;
        let handle = unsafe { ffi::syphon_server_create(c_name.as_ptr()) };
        if handle.is_null() {
            return Err("Failed to create Syphon server (is Syphon.framework installed?)".into());
        }

        info!("Syphon server created: {}", name);

        Ok(Self {
            handle,
            is_running: AtomicBool::new(true),
            frames_sent: AtomicU64::new(0),
            name: name.to_string(),
        })
    }

    /// Publish a captured frame to Syphon clients.
    pub fn publish_frame(&self, frame: &CapturedFrame) -> Result<(), String> {
        if !self.is_running.load(Ordering::SeqCst) {
            return Err("Syphon server is not running".into());
        }
        if frame.data.is_empty() {
            return Ok(());
        }

        let result = unsafe {
            ffi::syphon_server_publish_frame(
                self.handle,
                frame.data.as_ptr(),
                frame.width,
                frame.height,
                frame.bytes_per_row,
            )
        };

        if result != 0 {
            return Err("Syphon publish_frame failed".into());
        }

        self.frames_sent.fetch_add(1, Ordering::SeqCst);
        let count = self.frames_sent.load(Ordering::SeqCst);
        if count % 60 == 0 {
            debug!("Syphon: sent {} frames", count);
        }

        Ok(())
    }

    /// Check if any Syphon clients are connected.
    pub fn has_clients(&self) -> bool {
        if self.handle.is_null() {
            return false;
        }
        unsafe { ffi::syphon_server_has_clients(self.handle) != 0 }
    }

    pub fn frames_sent(&self) -> u64 {
        self.frames_sent.load(Ordering::SeqCst)
    }
}

impl FrameOutput for SyphonServer {
    fn send_frame(&self, frame: &CapturedFrame) -> Result<(), String> {
        self.publish_frame(frame)
    }

    fn stop(&self) {
        self.is_running.store(false, Ordering::SeqCst);
        info!(
            "Syphon server '{}' stopped. Frames sent: {}",
            self.name,
            self.frames_sent.load(Ordering::SeqCst)
        );
    }

    fn is_running(&self) -> bool {
        self.is_running.load(Ordering::SeqCst)
    }
}

impl Drop for SyphonServer {
    fn drop(&mut self) {
        if !self.handle.is_null() {
            unsafe { ffi::syphon_server_destroy(self.handle) };
            self.handle = std::ptr::null_mut();
            info!("Syphon server '{}' destroyed", self.name);
        }
    }
}
