/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * Native screen capture using macOS ScreenCaptureKit.
 * This module provides high-performance window capture for streaming output.
 */

use screencapturekit::cv::CVPixelBufferLockFlags;
use screencapturekit::prelude::{
    CMSampleBuffer, PixelFormat, SCContentFilter, SCDisplay, SCShareableContent, SCStream,
    SCStreamConfiguration, SCStreamOutputTrait, SCStreamOutputType, SCWindow,
};
use std::sync::{Arc, Mutex};
use tracing::{debug, error, info, warn};

/// Frame data ready for transmission to NDI/Syphon
#[derive(Clone)]
pub struct CapturedFrame {
    pub data: Vec<u8>,
    pub width: u32,
    pub height: u32,
    pub bytes_per_row: u32,
    pub timestamp_ns: u64,
}

/// Capture configuration
#[derive(Clone, Debug)]
pub struct CaptureConfig {
    /// Target frames per second
    pub fps: u8,
    /// Output width (0 = native resolution)
    pub width: u32,
    /// Output height (0 = native resolution)
    pub height: u32,
    /// Whether to capture cursor
    pub show_cursor: bool,
}

impl Default for CaptureConfig {
    fn default() -> Self {
        Self {
            fps: 30,
            width: 1920,
            height: 1080,
            show_cursor: true,
        }
    }
}

/// Callback type for received frames
pub type FrameCallback = Arc<dyn Fn(CapturedFrame) + Send + Sync>;

/// Stream handler that receives captured frames
pub struct StreamHandler {
    callback: Option<FrameCallback>,
    frame_count: Arc<Mutex<u64>>,
}

impl StreamHandler {
    /// Create a new handler without callback (for basic frame counting)
    pub fn new() -> Self {
        Self {
            callback: None,
            frame_count: Arc::new(Mutex::new(0)),
        }
    }

    /// Create a handler with a frame callback
    pub fn with_callback(callback: FrameCallback) -> Self {
        Self {
            callback: Some(callback),
            frame_count: Arc::new(Mutex::new(0)),
        }
    }

    /// Get the current frame count
    pub fn frame_count(&self) -> u64 {
        self.frame_count.lock().map(|c| *c).unwrap_or(0)
    }
}

impl Default for StreamHandler {
    fn default() -> Self {
        Self::new()
    }
}

impl SCStreamOutputTrait for StreamHandler {
    fn did_output_sample_buffer(&self, sample: CMSampleBuffer, _output_type: SCStreamOutputType) {
        // Increment frame counter
        let count = {
            let Ok(mut count) = self.frame_count.lock() else {
                return;
            };
            *count += 1;
            *count
        };

        if count % 30 == 0 {
            debug!("Captured {} frames", count);
        }

        // If we have a callback, extract pixel data from the sample buffer
        if let Some(ref callback) = self.callback {
            // Get timestamp
            let timestamp = sample.presentation_timestamp();
            let timestamp_ns =
                (timestamp.value as u64 * 1_000_000_000) / timestamp.timescale.max(1) as u64;

            // Extract CVPixelBuffer from the sample
            let frame = if let Some(pixel_buffer) = sample.image_buffer() {
                // Lock the pixel buffer for read access
                match pixel_buffer.lock(CVPixelBufferLockFlags::READ_ONLY) {
                    Ok(guard) => {
                        // Get dimensions from the pixel buffer
                        let width = pixel_buffer.width() as u32;
                        let height = pixel_buffer.height() as u32;
                        let bytes_per_row = pixel_buffer.bytes_per_row() as u32;

                        // Get the base address and data size
                        let base_address = guard.base_address();
                        let data_size = pixel_buffer.data_size();

                        if !base_address.is_null() && data_size > 0 {
                            // Copy the pixel data
                            let data = unsafe {
                                std::slice::from_raw_parts(base_address, data_size).to_vec()
                            };

                            if count % 60 == 0 {
                                debug!(
                                    "Frame {}: {}x{}, {} bytes/row, {} bytes total",
                                    count, width, height, bytes_per_row, data_size
                                );
                            }

                            CapturedFrame {
                                data,
                                width,
                                height,
                                bytes_per_row,
                                timestamp_ns,
                            }
                        } else {
                            // No base address available or empty data
                            debug!("Frame {}: No base address or empty data", count);
                            CapturedFrame {
                                data: vec![],
                                width,
                                height,
                                bytes_per_row: 0,
                                timestamp_ns,
                            }
                        }
                        // Lock guard is automatically released here (RAII)
                    }
                    Err(e) => {
                        debug!("Failed to lock pixel buffer: {}", e);
                        CapturedFrame {
                            data: vec![],
                            width: 0,
                            height: 0,
                            bytes_per_row: 0,
                            timestamp_ns,
                        }
                    }
                }
            } else {
                // No image buffer in this sample (might be audio or empty frame)
                CapturedFrame {
                    data: vec![],
                    width: 0,
                    height: 0,
                    bytes_per_row: 0,
                    timestamp_ns,
                }
            };

            callback(frame);
        }
    }
}

/// Find the StreamSlate main window for capture
pub fn find_streamslate_window() -> Option<SCWindow> {
    let content = SCShareableContent::get().ok()?;
    let windows = content.windows();

    for window in windows {
        // Look for our main window by app name
        if let Some(app) = window.owning_application() {
            let app_name = app.application_name();
            if app_name.contains("StreamSlate") || app_name.contains("streamslate") {
                let title = window.title().unwrap_or_default();
                // Skip the presenter window - we want the main window
                if !title.to_lowercase().contains("presenter") {
                    info!(
                        "Found StreamSlate window: '{}' (ID: {})",
                        title,
                        window.window_id()
                    );
                    return Some(window);
                }
            }
        }
    }

    warn!("StreamSlate window not found for capture");
    None
}

/// Find the primary display
#[allow(dead_code)]
pub fn find_primary_display() -> Option<SCDisplay> {
    let content = SCShareableContent::get().ok()?;
    let displays = content.displays();

    // Return the first display (primary)
    displays.into_iter().next()
}

/// Get a list of all connected displays
pub fn list_capturable_displays() -> Vec<(u32, u32, u32, f64, f64)> {
    let content = match SCShareableContent::get() {
        Ok(c) => c,
        Err(e) => {
            error!("Failed to get shareable content: {:?}", e);
            return vec![];
        }
    };

    content
        .displays()
        .into_iter()
        .map(|d| {
            let frame = d.frame();
            (
                d.display_id(),
                d.width(),
                d.height(),
                frame.origin().x,
                frame.origin().y,
            )
        })
        .collect()
}

/// Find a display by its ID
pub fn find_display_by_id(display_id: u32) -> Option<SCDisplay> {
    let content = SCShareableContent::get().ok()?;
    content
        .displays()
        .into_iter()
        .find(|d| d.display_id() == display_id)
}

/// Get a list of all available windows for capture
pub fn list_capturable_windows() -> Vec<(u32, String, String)> {
    let content = match SCShareableContent::get() {
        Ok(c) => c,
        Err(e) => {
            error!("Failed to get shareable content: {:?}", e);
            return vec![];
        }
    };

    content
        .windows()
        .into_iter()
        .filter_map(|w| {
            let app_name = w
                .owning_application()
                .map(|a| a.application_name())
                .unwrap_or_else(|| "Unknown".to_string());
            let title = w.title().unwrap_or_else(|| "Untitled".to_string());

            // Filter out system windows and empty titles
            if title.is_empty() || app_name == "Window Server" {
                None
            } else {
                Some((w.window_id(), app_name, title))
            }
        })
        .collect()
}

/// Create a stream configuration for capture
pub fn create_stream_config(config: &CaptureConfig) -> SCStreamConfiguration {
    SCStreamConfiguration::new()
        .with_width(config.width)
        .with_height(config.height)
        .with_shows_cursor(config.show_cursor)
        .with_pixel_format(PixelFormat::BGRA)
}

/// Create a content filter for a specific display
pub fn create_display_filter(display: &SCDisplay) -> SCContentFilter {
    SCContentFilter::create()
        .with_display(display)
        .with_excluding_windows(&[])
        .build()
}

/// Create a content filter for a specific window
pub fn create_window_filter(window: &SCWindow) -> SCContentFilter {
    SCContentFilter::create().with_window(window).build()
}

/// Capture manager that handles the SCStream lifecycle
pub struct CaptureManager {
    stream: Option<SCStream>,
    handler: Arc<StreamHandler>,
    is_running: bool,
}

impl CaptureManager {
    /// Create a new capture manager
    pub fn new() -> Self {
        Self {
            stream: None,
            handler: Arc::new(StreamHandler::new()),
            is_running: false,
        }
    }
}

impl Default for CaptureManager {
    fn default() -> Self {
        Self::new()
    }
}

impl CaptureManager {
    /// Start capturing a display
    pub fn start_display_capture(
        &mut self,
        display: &SCDisplay,
        config: &CaptureConfig,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if self.is_running {
            return Err("Capture already running".into());
        }

        let filter = create_display_filter(display);
        let stream_config = create_stream_config(config);

        let mut stream = SCStream::new(&filter, &stream_config);
        stream.add_output_handler(StreamHandler::new(), SCStreamOutputType::Screen);
        stream.start_capture()?;

        self.stream = Some(stream);
        self.is_running = true;

        info!("Display capture started");
        Ok(())
    }

    /// Start capturing a window
    pub fn start_window_capture(
        &mut self,
        window: &SCWindow,
        config: &CaptureConfig,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if self.is_running {
            return Err("Capture already running".into());
        }

        let filter = create_window_filter(window);
        let stream_config = create_stream_config(config);

        let mut stream = SCStream::new(&filter, &stream_config);
        stream.add_output_handler(StreamHandler::new(), SCStreamOutputType::Screen);
        stream.start_capture()?;

        self.stream = Some(stream);
        self.is_running = true;

        info!("Window capture started");
        Ok(())
    }

    /// Stop the active capture
    pub fn stop_capture(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        if !self.is_running {
            return Ok(());
        }

        if let Some(ref stream) = self.stream {
            stream.stop_capture()?;
        }

        self.stream = None;
        self.is_running = false;

        info!(
            "Capture stopped. Total frames captured: {}",
            self.handler.frame_count()
        );
        Ok(())
    }

    /// Check if capture is running
    pub fn is_running(&self) -> bool {
        self.is_running
    }

    /// Get the number of frames captured
    pub fn frame_count(&self) -> u64 {
        self.handler.frame_count()
    }
}

impl Drop for CaptureManager {
    fn drop(&mut self) {
        let _ = self.stop_capture();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Note: These tests require Screen Recording permissions and a valid display session.
    // They will fail in CI or headless environments.

    #[test]
    #[ignore = "Requires Screen Recording permissions"]
    fn test_list_windows() {
        let windows = list_capturable_windows();
        assert!(!windows.is_empty(), "Should find at least one window");
    }

    #[test]
    #[ignore = "Requires Screen Recording permissions"]
    fn test_find_primary_display() {
        let display = find_primary_display();
        assert!(display.is_some(), "Should find primary display");
    }
}
