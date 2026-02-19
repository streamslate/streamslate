/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * NDI Sender implementation using grafton-ndi.
 */

use crate::capture::CapturedFrame;
use std::sync::{
    atomic::{AtomicBool, AtomicU64, Ordering},
    Mutex,
};
use tracing::{debug, info, warn};

pub use grafton_ndi::{PixelFormat, SenderOptions, VideoFrame, NDI};

use grafton_ndi::frames::{calculate_line_stride, LineStrideOrSize};

/// Holds the NDI instance and sender together so the sender's borrow of NDI
/// is valid for the lifetime of the pair.
struct SenderPair {
    _ndi: NDI,
    sender: grafton_ndi::Sender<'static>,
}

/// NDI sender state
pub struct NdiSender {
    pair: Mutex<Option<SenderPair>>,
    is_running: AtomicBool,
    source_name: String,
    frames_sent: AtomicU64,
}

impl NdiSender {
    /// Create a new NDI sender with the given source name
    pub fn new(source_name: &str) -> Result<Self, grafton_ndi::Error> {
        Ok(Self {
            pair: Mutex::new(None),
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

        let ndi = NDI::new()?;
        let options = SenderOptions::builder(&self.source_name)
            .clock_video(true)
            .build();

        // SAFETY: We store the NDI instance alongside the Sender in SenderPair.
        // The Sender borrows &NDI, and both live together in the Mutex. The NDI
        // instance is never dropped before the Sender because they're in the same
        // struct and Rust drops fields in declaration order (_ndi after sender).
        // We transmute the lifetime to 'static since we manage it manually.
        let sender = unsafe {
            let ndi_ref: &NDI = &ndi;
            let ndi_static: &'static NDI = std::mem::transmute(ndi_ref);
            grafton_ndi::Sender::new(ndi_static, &options)?
        };

        {
            let mut guard = self
                .pair
                .lock()
                .expect("NdiSender internal lock poisoned in start()");
            *guard = Some(SenderPair { _ndi: ndi, sender });
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

        {
            let Ok(mut guard) = self.pair.lock() else {
                warn!("NdiSender lock poisoned during stop — skipping cleanup");
                return;
            };
            // Drop sender before NDI (struct field order guarantees this)
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

        let guard = self
            .pair
            .lock()
            .map_err(|_| "NdiSender lock poisoned during send_frame".to_string())?;
        let pair = guard
            .as_ref()
            .ok_or_else(|| "NDI sender not initialized".to_string())?;

        // Build a VideoFrame with the captured pixel data (BGRA from ScreenCaptureKit)
        let stride = calculate_line_stride(PixelFormat::BGRA, frame.width as i32);
        let video_frame = VideoFrame {
            width: frame.width as i32,
            height: frame.height as i32,
            pixel_format: PixelFormat::BGRA,
            frame_rate_n: 30,
            frame_rate_d: 1,
            picture_aspect_ratio: 16.0 / 9.0,
            scan_type: grafton_ndi::ScanType::Progressive,
            timecode: 0,
            data: frame.data.clone(),
            line_stride_or_size: LineStrideOrSize::LineStrideBytes(stride),
            metadata: None,
            timestamp: 0,
        };

        pair.sender.send_video(&video_frame);

        self.frames_sent.fetch_add(1, Ordering::SeqCst);
        let count = self.frames_sent.load(Ordering::SeqCst);
        if count % 60 == 0 {
            debug!(
                "Sent NDI frame {} ({}x{})",
                count, frame.width, frame.height
            );
        }

        Ok(())
    }

    /// Get the number of frames sent
    pub fn frames_sent(&self) -> u64 {
        self.frames_sent.load(Ordering::SeqCst)
    }
}

impl crate::state::FrameOutput for NdiSender {
    fn send_frame(&self, frame: &CapturedFrame) -> Result<(), String> {
        self.send_frame(frame)
    }

    fn stop(&self) {
        self.stop();
    }

    fn is_running(&self) -> bool {
        self.is_running()
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
