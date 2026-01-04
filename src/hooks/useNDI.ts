import { invoke } from "@tauri-apps/api/tauri";
import { useState, useCallback } from "react";

export const useNDI = () => {
  const [isSending, setIsSending] = useState(false);
  const [fps, setFps] = useState(0);

  const startTestPattern = useCallback(async () => {
    await invoke("start_ndi_sender");
    setIsSending(true);
  }, []);

  const stopTestPattern = useCallback(async () => {
    await invoke("stop_ndi_sender");
    setIsSending(false);
  }, []);

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
    isSending,
    fps,
    startTestPattern,
    stopTestPattern,
    sendCanvasFrame,
  };
};
