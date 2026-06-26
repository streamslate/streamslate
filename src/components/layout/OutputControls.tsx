import React, { useEffect, useState } from "react";
import { useNDI } from "../../hooks/useNDI";
import { useIntegrationStore } from "../../stores/integration.store";

/**
 * Output controls for screen capture, native video output, and OBS control.
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
  const {
    obs,
    config,
    connectOBS,
    disconnectOBS,
    setOBSCurrentScene,
    setOBSSourceVisibility,
    startOBSRecording,
    stopOBSRecording,
    startOBSStreaming,
    stopOBSStreaming,
  } = useIntegrationStore((state) => ({
    obs: state.obs,
    config: state.config,
    connectOBS: state.connectOBS,
    disconnectOBS: state.disconnectOBS,
    setOBSCurrentScene: state.setOBSCurrentScene,
    setOBSSourceVisibility: state.setOBSSourceVisibility,
    startOBSRecording: state.startOBSRecording,
    stopOBSRecording: state.stopOBSRecording,
    startOBSStreaming: state.startOBSStreaming,
    stopOBSStreaming: state.stopOBSStreaming,
  }));

  const [selectedDisplayId, setSelectedDisplayId] = useState<
    number | undefined
  >(undefined);
  const [obsBusy, setOBSBusy] = useState<string | null>(null);

  const currentOBSScene = obs.scenes.find(
    (scene) => scene.name === obs.currentScene
  );

  const handleOBSAction = async (key: string, action: () => Promise<void>) => {
    setOBSBusy(key);
    try {
      await action();
    } finally {
      setOBSBusy(null);
    }
  };

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
        Capture a display or the StreamSlate window for NDI/Syphon video output.
        NDI requires the NDI SDK; Syphon is macOS-only.
      </p>

      <div className="pt-4 border-t border-border-secondary space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`text-xs flex items-center gap-1 ${
              obs.connected ? "text-green-400" : "text-text-tertiary"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                obs.connected ? "bg-green-400" : "bg-text-tertiary"
              }`}
            />
            OBS {obs.connected ? (obs.version ?? "connected") : "disconnected"}
          </span>
          <button
            onClick={() =>
              void handleOBSAction(
                obs.connected ? "disconnect" : "connect",
                obs.connected ? disconnectOBS : connectOBS
              )
            }
            disabled={obsBusy !== null}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
              obs.connected
                ? "bg-surface-tertiary text-text-primary hover:bg-bg-tertiary border border-border-primary"
                : "bg-primary text-white hover:bg-primary-dark"
            }`}
          >
            {obs.connected ? "Disconnect" : "Connect"}
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-text-tertiary">OBS scene</label>
          <select
            value={obs.currentScene ?? ""}
            onChange={(e) =>
              e.target.value
                ? void handleOBSAction("scene", () =>
                    setOBSCurrentScene(e.target.value)
                  )
                : undefined
            }
            disabled={
              !obs.connected || obs.scenes.length === 0 || obsBusy !== null
            }
            className="w-full text-sm bg-surface-secondary border border-border-primary rounded-lg px-3 py-2 disabled:opacity-50 text-text-primary"
          >
            <option value="" disabled>
              No scene selected
            </option>
            {obs.scenes.map((scene) => (
              <option key={scene.name} value={scene.name}>
                {scene.name}
              </option>
            ))}
          </select>
        </div>

        {currentOBSScene && currentOBSScene.sources.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-text-tertiary">Sources</div>
            <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
              {currentOBSScene.sources.map((source) => (
                <label
                  key={source.name}
                  className="flex items-center gap-2 text-sm text-text-primary bg-surface-secondary border border-border-primary rounded-lg px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={source.visible}
                    disabled={!obs.connected || obsBusy !== null}
                    onChange={(e) =>
                      void handleOBSAction("source", () =>
                        setOBSSourceVisibility(
                          currentOBSScene.name,
                          source.name,
                          e.target.checked
                        )
                      )
                    }
                    className="w-4 h-4 text-primary bg-surface-primary border-border-secondary rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="truncate">{source.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() =>
              void handleOBSAction(
                "record",
                obs.isRecording ? stopOBSRecording : startOBSRecording
              )
            }
            disabled={!obs.connected || obsBusy !== null}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              obs.isRecording
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-surface-tertiary text-text-primary hover:bg-bg-tertiary border border-border-primary"
            }`}
          >
            {obs.isRecording ? "Stop Rec" : "Record"}
          </button>
          <button
            onClick={() =>
              void handleOBSAction(
                "stream",
                obs.isStreaming ? stopOBSStreaming : startOBSStreaming
              )
            }
            disabled={!obs.connected || obsBusy !== null}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              obs.isStreaming
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-surface-tertiary text-text-primary hover:bg-bg-tertiary border border-border-primary"
            }`}
          >
            {obs.isStreaming ? "Stop Live" : "Stream"}
          </button>
        </div>

        <div className="text-xs text-text-tertiary">
          {config.obs.host}:{config.obs.port}
        </div>
      </div>
    </div>
  );
};
