/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * NDI Sender implementation using grafton-ndi.
 */

use crate::capture::CapturedFrame;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex,
};
use std::time::Duration;
use tracing::{debug, error, info, warn};

// Re-export grafton-ndi types
pub use grafton_ndi::{Sender, SenderOptions, VideoFrame, VideoFrameFourCC, NDI};

/// NDI sender state
pub struct NdiSender {
    ndi: Arc<NDI>,
    sender: Mutex<Option<Sender>>,
    is_running: AtomicBool,
    source_name: String,
    frames_sent: AtomicU64,
}

use std::sync::atomic::AtomicU64;

impl NdiSender {
    /// Create a new NDI sender with the given source name
    pub fn new(source_name: &str) -> Result<Self, grafton_ndi::Error> {
        let ndi = NDI::new()?;

        Ok(Self {
            ndi: Arc::new(ndi),
            sender: Mutex::new(None),
            is_running: AtomicBool::new(false),
            source_name: source_name.to_string(),
            frames_sent: AtomicU64::new(0),
        })
    }

    /// Start the NDI sender
    pub fn start(&self) -> Result<(), grafton_ndi::Error> {
        if self.is_running.load(Ordering::SeqCst) {
            warn!("NDI sender already running");
            return Ok(());
        }

        let options = SenderOptions::builder(&self.source_name)
            .clock_video(true)
            .build();

        let sender = Sender::new(&self.ndi, &options)?;

        {
            let mut guard = self.sender.lock().unwrap();
            *guard = Some(sender);
        }

        self.is_running.store(true, Ordering::SeqCst);
        info!("NDI sender started: {}", self.source_name);

        Ok(())
    }

    /// Stop the NDI sender
    pub fn stop(&self) {
        if !self.is_running.load(Ordering::SeqCst) {
            return;
        }

        self.is_running.store(false, Ordering::SeqCst);

        // Drop the sender to close the NDI connection
        {
            let mut guard = self.sender.lock().unwrap();
            *guard = None;
        }

        info!(
            "NDI sender stopped. Total frames sent: {}",
            self.frames_sent.load(Ordering::SeqCst)
        );
    }

    /// Check if the sender is running
    pub fn is_running(&self) -> bool {
        self.is_running.load(Ordering::SeqCst)
    }

    /// Send a captured frame via NDI
    pub fn send_frame(&self, frame: &CapturedFrame) -> Result<(), String> {
        if !self.is_running.load(Ordering::SeqCst) {
            return Err("NDI sender is not running".to_string());
        }

        let guard = self.sender.lock().unwrap();
        let sender = guard
            .as_ref()
            .ok_or_else(|| "NDI sender not initialized".to_string())?;

        // Create video frame
        // The frame data from ScreenCaptureKit is typically BGRA
        let video_frame = VideoFrame::builder()
            .resolution(frame.width as i32, frame.height as i32)
            .four_cc(VideoFrameFourCC::BGRA)
            .frame_rate(30, 1) // 30 fps
            .line_stride(frame.bytes_per_row as i32)
            .data(frame.data.clone())
            .build();

        // Send the frame
        sender.send_video(&video_frame);

        self.frames_sent.fetch_add(1, Ordering::SeqCst);
        debug!(
            "Sent NDI frame {} ({}x{})",
            self.frames_sent.load(Ordering::SeqCst),
            frame.width,
            frame.height
        );

        Ok(())
    }

    /// Get the number of frames sent
    pub fn frames_sent(&self) -> u64 {
        self.frames_sent.load(Ordering::SeqCst)
    }
}

impl Drop for NdiSender {
    fn drop(&mut self) {
        self.stop();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore = "Requires NDI SDK installed"]
    fn test_ndi_sender_creation() {
        let sender = NdiSender::new("StreamSlate Test");
        assert!(sender.is_ok(), "Should create NDI sender");
    }
}
