import React, { useEffect, useRef } from "react";
import { useNDI } from "../../hooks/useNDI";

export const NDIControls: React.FC = () => {
  const { isSending, fps, startTestPattern, stopTestPattern, sendCanvasFrame } =
    useNDI();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Function to capture frame from the active PDF canvas
  // Note: In real app, we need to access the main PDF canvas.
  // For this prototype, we'll cheat and create a dummy animation on a local canvas to send.
  useEffect(() => {
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
          ctx.fillText("JS -> Rust NDI Prototype", 50, 200);

          p += 5;

          // If "sending", push frame to Rust
          if (isSending) {
            sendCanvasFrame(canvas);
          }
        }
      }
      if (isSending) {
        frameId = requestAnimationFrame(render);
      }
    };

    if (isSending) {
      frameId = requestAnimationFrame(render);
    }

    return () => cancelAnimationFrame(frameId);
  }, [isSending, sendCanvasFrame]);

  return (
    <div className="p-4 bg-surface-tertiary rounded-lg border border-border-primary">
      <h4 className="text-sm font-semibold mb-2">NDI Prototype Controls</h4>
      <div className="flex gap-2 mb-2">
        {!isSending ? (
          <button
            onClick={startTestPattern}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
          >
            Start Test Pattern
          </button>
        ) : (
          <button
            onClick={stopTestPattern}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
          >
            Stop Test Pattern
          </button>
        )}
      </div>
      <div>
        <p className="text-xs text-text-tertiary mb-1">
          Local Preview (Source):
        </p>
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="w-full h-auto bg-black border border-gray-600"
        />
      </div>
      <p className="text-xs text-text-tertiary mt-2">
        FPS: {fps} | Check console for frame transfer times.
      </p>
    </div>
  );
};
