import React, { useEffect, useState } from "react";
import { useNDI } from "../../hooks/useNDI";

/**
 * Output controls for screen capture and video output (NDI / Syphon).
 *
 * Surfaces the user-facing capture workflow: pick a display, start/stop
 * capture, and toggle Syphon output.  Debug-only features (legacy IPC
 * benchmarking, window enumeration) remain in debug/NDIControls.
 */
export const OutputControls: React.FC = () => {
  const {
    isSending,
    ndiAvailable,
    syphonAvailable,
    status,
    displayTargets,
    startCapture,
    stopCapture,
    startSyphonOutput,
    stopSyphonOutput,
    listDisplays,
    getCaptureStatus,
  } = useNDI();

  const [selectedDisplayId, setSelectedDisplayId] = useState<
    number | undefined
  >(undefined);

  useEffect(() => {
    listDisplays();
  }, [listDisplays]);

  useEffect(() => {
    if (!isSending) return;
    const interval = setInterval(() => {
      getCaptureStatus();
    }, 1000);
    return () => clearInterval(interval);
  }, [isSending, getCaptureStatus]);

  return (
    <div className="space-y-4">
      {/* Availability indicators */}
      <div className="flex items-center gap-3">
        <span
          className={`text-xs flex items-center gap-1 ${ndiAvailable ? "text-green-400" : "text-text-tertiary"}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${ndiAvailable ? "bg-green-400" : "bg-text-tertiary"}`}
          />
          NDI {ndiAvailable ? "" : "(unavailable)"}
        </span>
        <span
          className={`text-xs flex items-center gap-1 ${syphonAvailable ? "text-green-400" : "text-text-tertiary"}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${syphonAvailable ? "bg-green-400" : "bg-text-tertiary"}`}
          />
          Syphon {syphonAvailable ? "" : "(unavailable)"}
        </span>
      </div>

      {/* Display selector */}
      {displayTargets?.length > 0 && (
        <div className="space-y-1">
          <label className="text-xs text-text-tertiary">Capture source</label>
          <select
            value={selectedDisplayId ?? ""}
            onChange={(e) =>
              setSelectedDisplayId(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            disabled={isSending}
            className="w-full text-sm bg-surface-secondary border border-border-primary rounded-lg px-3 py-2 disabled:opacity-50 text-text-primary"
          >
            <option value="">StreamSlate Window</option>
            {displayTargets.map((d) => (
              <option key={d.id} value={d.id}>
                Display {d.id} ({d.width}x{d.height})
                {d.is_primary ? " — Primary" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Capture toggle */}
      <div className="flex gap-2">
        {!isSending ? (
          <button
            onClick={() => startCapture(selectedDisplayId)}
            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
          >
            Start Capture
          </button>
        ) : (
          <button
            onClick={stopCapture}
            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
          >
            Stop Capture
          </button>
        )}

        {syphonAvailable &&
          (status?.syphon_running ? (
            <button
              onClick={stopSyphonOutput}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
            >
              Stop Syphon
            </button>
          ) : (
            <button
              onClick={startSyphonOutput}
              className="px-3 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 text-sm font-medium transition-colors"
            >
              Start Syphon
            </button>
          ))}
      </div>

      {/* Capture status (compact) */}
      {isSending && status && (
        <div className="text-xs p-2 bg-surface-secondary rounded-lg space-y-1">
          <div className="flex justify-between">
            <span className="text-text-tertiary">Frames captured</span>
            <span className="text-text-primary">{status.frames_captured}</span>
          </div>
          {status.ndi_running && (
            <div className="flex justify-between">
              <span className="text-text-tertiary">NDI frames sent</span>
              <span className="text-text-primary">{status.frames_sent}</span>
            </div>
          )}
          {status.syphon_running && (
            <div className="flex justify-between">
              <span className="text-text-tertiary">Syphon</span>
              <span className="text-green-400">Active</span>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-text-tertiary">
        Capture a display or the StreamSlate window for NDI/Syphon video
        output. NDI requires the NDI SDK; Syphon is macOS-only.
      </p>
    </div>
  );
};
