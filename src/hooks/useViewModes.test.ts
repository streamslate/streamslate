import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { useImperativeHandle, forwardRef } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useViewModes } from "./useViewModes";

// ── Mocks ───────────────────────────────────────────────────────────────

const openPresenterMode = vi.fn();
const closePresenterMode = vi.fn();

vi.mock("../lib/tauri/commands", () => ({
  PresenterCommands: {
    openPresenterMode: (...args: unknown[]) => openPresenterMode(...args),
    closePresenterMode: (...args: unknown[]) => closePresenterMode(...args),
  },
}));

vi.mock("../lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ── Hook test harness (no @testing-library/react needed) ────────────────

type ViewModesReturn = ReturnType<typeof useViewModes>;

interface HookHandle {
  current: ViewModesReturn;
}

const TestComponent = forwardRef(function TestComponent(_props, ref) {
  const hook = useViewModes();
  useImperativeHandle(ref, () => hook, [hook]);
  return null;
});

interface RenderHandle {
  container: HTMLDivElement;
  root: Root;
  result: HookHandle;
}

const mounted: RenderHandle[] = [];
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

async function renderHook(): Promise<RenderHandle> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const ref = { current: null as unknown as ViewModesReturn };

  await act(async () => {
    root.render(React.createElement(TestComponent, { ref: (r: ViewModesReturn) => { ref.current = r; } }));
  });

  const handle: RenderHandle = { container, root, result: ref };
  mounted.push(handle);
  return handle;
}

// ── Setup ───────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  openPresenterMode.mockResolvedValue(undefined);
  closePresenterMode.mockResolvedValue(undefined);
});

afterEach(async () => {
  while (mounted.length > 0) {
    const handle = mounted.pop();
    if (!handle) break;
    await act(async () => {
      handle.root.unmount();
    });
    handle.container.remove();
  }
  localStorage.clear();
});

// ── Tests ───────────────────────────────────────────────────────────────

describe("useViewModes", () => {
  describe("initial state", () => {
    it("starts with presenter mode off", async () => {
      const { result } = await renderHook();
      expect(result.current.presenterMode).toBe(false);
    });

    it("reads transparentBg from localStorage", async () => {
      localStorage.setItem("viewMode.transparentBg", "true");
      const { result } = await renderHook();
      expect(result.current.transparentBg).toBe(true);
    });

    it("reads borderlessMode from localStorage", async () => {
      localStorage.setItem("viewMode.borderlessMode", "true");
      const { result } = await renderHook();
      expect(result.current.borderlessMode).toBe(true);
    });
  });

  describe("togglePresenterMode", () => {
    it("calls openPresenterMode and sets state to true", async () => {
      const { result } = await renderHook();

      await act(async () => {
        await result.current.togglePresenterMode();
      });

      expect(openPresenterMode).toHaveBeenCalledTimes(1);
      expect(result.current.presenterMode).toBe(true);
    });

    it("calls closePresenterMode when toggling off", async () => {
      const { result } = await renderHook();

      await act(async () => {
        await result.current.togglePresenterMode();
      });
      expect(result.current.presenterMode).toBe(true);

      await act(async () => {
        await result.current.togglePresenterMode();
      });

      expect(closePresenterMode).toHaveBeenCalledTimes(1);
      expect(result.current.presenterMode).toBe(false);
    });

    it("falls back to local state when Tauri command fails", async () => {
      openPresenterMode.mockRejectedValue(new Error("not in Tauri"));
      const { result } = await renderHook();

      await act(async () => {
        await result.current.togglePresenterMode();
      });

      expect(result.current.presenterMode).toBe(true);
    });
  });

  describe("exitPresenterMode", () => {
    it("calls closePresenterMode and sets state to false", async () => {
      const { result } = await renderHook();

      await act(async () => {
        await result.current.togglePresenterMode();
      });
      expect(result.current.presenterMode).toBe(true);

      await act(async () => {
        await result.current.exitPresenterMode();
      });

      expect(closePresenterMode).toHaveBeenCalledTimes(1);
      expect(result.current.presenterMode).toBe(false);
    });

    it("sets state to false even when Tauri command fails", async () => {
      closePresenterMode.mockRejectedValue(new Error("not in Tauri"));
      const { result } = await renderHook();

      await act(async () => {
        result.current.setPresenterMode(true);
      });

      await act(async () => {
        await result.current.exitPresenterMode();
      });

      expect(result.current.presenterMode).toBe(false);
    });
  });

  describe("setPresenterMode (remote control)", () => {
    it("sets presenter state without invoking Tauri commands", async () => {
      const { result } = await renderHook();

      await act(async () => {
        result.current.setPresenterMode(true);
      });

      expect(result.current.presenterMode).toBe(true);
      expect(openPresenterMode).not.toHaveBeenCalled();
      expect(closePresenterMode).not.toHaveBeenCalled();
    });
  });

  describe("localStorage persistence", () => {
    it("persists transparentBg changes", async () => {
      const { result } = await renderHook();

      await act(async () => {
        result.current.setTransparentBg(true);
      });

      expect(localStorage.getItem("viewMode.transparentBg")).toBe("true");
    });

    it("persists borderlessMode changes", async () => {
      const { result } = await renderHook();

      await act(async () => {
        result.current.setBorderlessMode(true);
      });

      expect(localStorage.getItem("viewMode.borderlessMode")).toBe("true");
    });
  });
});
