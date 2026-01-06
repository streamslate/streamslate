import { invoke } from "@tauri-apps/api/tauri";
import { useState, useCallback, useEffect } from "react";

/**
 * Capture target information
 */
export interface CaptureTarget {
  id: number;
  app_name: string;
  title: string;
}

/**
 * Capture and NDI status
 */
export interface CaptureStatus {
  is_capturing: boolean;
  ndi_available: boolean;
  ndi_running: boolean;
  frames_captured: number;
  frames_sent: number;
  target_fps: number;
  current_fps: number;
}

/**
 * Hook for managing native screen capture and NDI output
 *
 * This hook provides access to:
 * - Native screen capture via macOS ScreenCaptureKit
 * - NDI output (when built with the 'ndi' feature and SDK installed)
 * - Legacy JS-to-Rust frame transfer for benchmarking
 */
export const useNDI = () => {
  const [isSending, setIsSending] = useState(false);
  const [fps, setFps] = useState(0);
  const [captureTargets, setCaptureTargets] = useState<CaptureTarget[]>([]);
  const [ndiAvailable, setNdiAvailable] = useState(false);
  const [status, setStatus] = useState<CaptureStatus | null>(null);

  // Check NDI availability on mount
  useEffect(() => {
    const check = async () => {
      try {
        const available = await invoke<boolean>("is_ndi_available");
        setNdiAvailable(available);
      } catch (err) {
        console.error("Failed to check NDI availability:", err);
        setNdiAvailable(false);
      }
    };
    check();
  }, []);

  /**
   * Check if NDI feature is compiled in
   */
  const checkNdiAvailable = useCallback(async () => {
    try {
      const available = await invoke<boolean>("is_ndi_available");
      setNdiAvailable(available);
    } catch (err) {
      console.error("Failed to check NDI availability:", err);
      setNdiAvailable(false);
    }
  }, []);

  /**
   * List all available windows for capture
   */
  const listCaptureTargets = useCallback(async () => {
    try {
      const targets = await invoke<CaptureTarget[]>("list_capture_targets");
      setCaptureTargets(targets);
      return targets;
    } catch (err) {
      console.error("Failed to list capture targets:", err);
      return [];
    }
  }, []);

  /**
   * Get current capture status
   */
  const getCaptureStatus = useCallback(async () => {
    try {
      const captureStatus = await invoke<CaptureStatus>("get_capture_status");
      setStatus(captureStatus);
      return captureStatus;
    } catch (err) {
      console.error("Failed to get capture status:", err);
      return null;
    }
  }, []);

  /**
   * Start native screen capture (and NDI if available)
   */
  const startCapture = useCallback(async () => {
    try {
      await invoke("start_ndi_sender");
      setIsSending(true);
      await getCaptureStatus();
    } catch (err) {
      console.error("Failed to start capture:", err);
    }
  }, [getCaptureStatus]);

  /**
   * Stop native screen capture
   */
  const stopCapture = useCallback(async () => {
    try {
      await invoke("stop_ndi_sender");
      setIsSending(false);
      await getCaptureStatus();
    } catch (err) {
      console.error("Failed to stop capture:", err);
    }
  }, [getCaptureStatus]);

  // Legacy aliases for backward compatibility
  const startTestPattern = startCapture;
  const stopTestPattern = stopCapture;

  /**
   * Send a canvas frame via IPC (legacy Phase 1 approach for benchmarking)
   * This is slow but useful for testing the JS-to-Rust bridge throughput
   */
  const sendCanvasFrame = useCallback(async (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Performance measurement start
    const start = performance.now();

    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height);

    // This conversion to regular array is KILLER for performance
    // Tauri v1 expects number[] for Vec<u8> usually via JSON
    // Ideally we use a ArrayBuffer or Tauri's binary protocol
    const frameData = Array.from(imageData.data);

    await invoke("send_video_frame", {
      frameData,
      width,
      height,
    });

    const end = performance.now();
    const duration = end - start;
    if (duration > 0) {
      setFps(Math.round(1000 / duration));
    }
  }, []);

  return {
    // State
    isSending,
    fps,
    captureTargets,
    ndiAvailable,
    status,

    // Actions
    startCapture,
    stopCapture,
    listCaptureTargets,
    getCaptureStatus,
    checkNdiAvailable,

    // Legacy (backward compat)
    startTestPattern,
    stopTestPattern,
    sendCanvasFrame,
  };
};
