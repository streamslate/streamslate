import { invoke } from "@tauri-apps/api/core";
import { useState, useCallback, useEffect } from "react";
import { logger } from "../lib/logger";

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
  syphon_available: boolean;
  syphon_running: boolean;
  frames_captured: number;
  frames_sent: number;
  target_fps: number;
  current_fps: number;
}

/**
 * Display/monitor target information
 */
export interface DisplayTarget {
  id: number;
  width: number;
  height: number;
  origin_x: number;
  origin_y: number;
  is_primary: boolean;
}

export interface OutputCapabilities {
  platform: string;
  ndi_available: boolean;
  syphon_available: boolean;
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
  const [displayTargets, setDisplayTargets] = useState<DisplayTarget[]>([]);
  const [ndiAvailable, setNdiAvailable] = useState(false);
  const [syphonAvailable, setSyphonAvailable] = useState(false);
  const [status, setStatus] = useState<CaptureStatus | null>(null);

  // Check output availability on mount
  useEffect(() => {
    const check = async () => {
      try {
        const capabilities = await invoke<OutputCapabilities>(
          "get_output_capabilities"
        );
        setNdiAvailable(capabilities.ndi_available);
        setSyphonAvailable(capabilities.syphon_available);
      } catch (err) {
        logger.error("Failed to check output capabilities:", err);
        setNdiAvailable(false);
        setSyphonAvailable(false);
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
      logger.error("Failed to check NDI availability:", err);
      setNdiAvailable(false);
    }
  }, []);

  /**
   * Check if Syphon feature is compiled in
   */
  const checkSyphonAvailable = useCallback(async () => {
    try {
      const available = await invoke<boolean>("is_syphon_available");
      setSyphonAvailable(available);
    } catch (err) {
      logger.error("Failed to check Syphon availability:", err);
      setSyphonAvailable(false);
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
      logger.error("Failed to list capture targets:", err);
      return [];
    }
  }, []);

  /**
   * List all available displays/monitors for capture
   */
  const listDisplays = useCallback(async () => {
    try {
      const displays = await invoke<DisplayTarget[]>("list_capture_displays");
      setDisplayTargets(displays ?? []);
      return displays;
    } catch (err) {
      logger.error("Failed to list displays:", err);
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
      logger.error("Failed to get capture status:", err);
      return null;
    }
  }, []);

  /**
   * Start native screen capture (and NDI if available)
   * @param displayId Optional display ID to capture. If omitted, captures the StreamSlate window.
   */
  const startCapture = useCallback(
    async (displayId?: number) => {
      try {
        await invoke("start_ndi_sender", { displayId: displayId ?? null });
        setIsSending(true);
        await getCaptureStatus();
      } catch (err) {
        logger.error("Failed to start capture:", err);
      }
    },
    [getCaptureStatus]
  );

  /**
   * Stop native screen capture
   */
  const stopCapture = useCallback(async () => {
    try {
      await invoke("stop_ndi_sender");
      setIsSending(false);
      await getCaptureStatus();
    } catch (err) {
      logger.error("Failed to stop capture:", err);
    }
  }, [getCaptureStatus]);

  /**
   * Start Syphon output (scaffold)
   */
  const startSyphonOutput = useCallback(async () => {
    try {
      await invoke("start_syphon_output");
      await getCaptureStatus();
    } catch (err) {
      logger.error("Failed to start Syphon output:", err);
    }
  }, [getCaptureStatus]);

  /**
   * Stop Syphon output (scaffold)
   */
  const stopSyphonOutput = useCallback(async () => {
    try {
      await invoke("stop_syphon_output");
      await getCaptureStatus();
    } catch (err) {
      logger.error("Failed to stop Syphon output:", err);
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
    displayTargets,
    ndiAvailable,
    syphonAvailable,
    status,

    // Actions
    startCapture,
    stopCapture,
    startSyphonOutput,
    stopSyphonOutput,
    listCaptureTargets,
    listDisplays,
    getCaptureStatus,
    checkNdiAvailable,
    checkSyphonAvailable,

    // Legacy (backward compat)
    startTestPattern,
    stopTestPattern,
    sendCanvasFrame,
  };
};
