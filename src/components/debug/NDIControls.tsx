import React, { useEffect, useRef, useState } from "react";
import { useNDI } from "../../hooks/useNDI";

/**
 * NDI/Capture Controls Component
 *
 * Provides debugging UI for:
 * - Native screen capture status
 * - NDI feature availability
 * - Available capture targets (windows/displays)
 * - Legacy JS-to-Rust frame transfer benchmarking
 */
export const NDIControls: React.FC = () => {
  const {
    isSending,
    fps,
    ndiAvailable,
    status,
    captureTargets,
    startCapture,
    stopCapture,
    listCaptureTargets,
    getCaptureStatus,
    sendCanvasFrame,
  } = useNDI();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showTargets, setShowTargets] = useState(false);
  const [legacyMode, setLegacyMode] = useState(false);

  // Refresh status periodically while capturing
  useEffect(() => {
    if (!isSending) return;

    const interval = setInterval(() => {
      getCaptureStatus();
    }, 1000);

    return () => clearInterval(interval);
  }, [isSending, getCaptureStatus]);

  // Legacy test pattern rendering (for JS-to-Rust benchmarking)
  useEffect(() => {
    if (!legacyMode || !isSending) return;

    let frameId: number;
    let p = 0;

    const render = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Draw a moving box (Test Pattern)
          const w = canvas.width;
          const h = canvas.height;

          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, w, h);

          ctx.fillStyle = "#FF0000";
          ctx.fillRect(p % w, 50, 100, 100);

          ctx.fillStyle = "#00FF00";
          ctx.font = "30px Arial";
          ctx.fillText("JS -> Rust IPC Benchmark", 50, 200);

          p += 5;

          // If "sending" in legacy mode, push frame to Rust
          sendCanvasFrame(canvas);
        }
      }
      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [legacyMode, isSending, sendCanvasFrame]);

  const handleListTargets = async () => {
    await listCaptureTargets();
    setShowTargets(true);
  };

  return (
    <div className="p-4 bg-surface-tertiary rounded-lg border border-border-primary space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Capture & NDI Controls</h4>
        <div className="flex items-center gap-2">
          {ndiAvailable ? (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              NDI Available
            </span>
          ) : (
            <span className="text-xs text-yellow-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              NDI Not Available
            </span>
          )}
        </div>
      </div>

      {/* Capture Status */}
      {status && (
        <div className="text-xs space-y-1 p-2 bg-surface-secondary rounded">
          <div className="flex justify-between">
            <span className="text-text-tertiary">Capturing:</span>
            <span>{status.is_capturing ? "Yes" : "No"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-tertiary">Frames Captured:</span>
            <span>{status.frames_captured}</span>
          </div>
          {status.ndi_running && (
            <div className="flex justify-between">
              <span className="text-text-tertiary">Frames Sent (NDI):</span>
              <span>{status.frames_sent}</span>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        {!isSending ? (
          <button
            onClick={startCapture}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
          >
            Start Native Capture
          </button>
        ) : (
          <button
            onClick={stopCapture}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
          >
            Stop Capture
          </button>
        )}

        <button
          onClick={handleListTargets}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
        >
          List Windows
        </button>

        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={legacyMode}
            onChange={(e) => setLegacyMode(e.target.checked)}
            className="w-3 h-3"
          />
          Legacy IPC Mode
        </label>
      </div>

      {/* Capture Targets List */}
      {showTargets && captureTargets.length > 0 && (
        <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
          <p className="text-text-tertiary">
            Available Windows ({captureTargets.length}):
          </p>
          {captureTargets.slice(0, 10).map((target) => (
            <div
              key={target.id}
              className="p-1 bg-surface-secondary rounded flex justify-between"
            >
              <span className="truncate flex-1">{target.title}</span>
              <span className="text-text-tertiary ml-2">{target.app_name}</span>
            </div>
          ))}
          {captureTargets.length > 10 && (
            <p className="text-text-tertiary">
              ... and {captureTargets.length - 10} more
            </p>
          )}
        </div>
      )}

      {/* Legacy Preview Canvas */}
      {legacyMode && (
        <div>
          <p className="text-xs text-text-tertiary mb-1">
            Legacy IPC Preview (JS → Rust):
          </p>
          <canvas
            ref={canvasRef}
            width={320}
            height={180}
            className="w-full h-auto bg-black border border-gray-600 rounded"
          />
          <p className="text-xs text-text-tertiary mt-1">
            IPC FPS: {fps} | This measures JS-to-Rust frame transfer speed
          </p>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-text-tertiary">
        Native capture uses macOS ScreenCaptureKit for high-performance window
        capture. NDI output requires the NDI SDK to be installed.
      </p>
    </div>
  );
};
