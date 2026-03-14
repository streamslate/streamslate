import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UpdateBanner } from "./UpdateBanner";

const { checkMock, relaunchMock } = vi.hoisted(() => ({
  checkMock: vi.fn(),
  relaunchMock: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-updater", () => ({
  check: checkMock,
}));

vi.mock("@tauri-apps/plugin-process", () => ({
  relaunch: relaunchMock,
}));

vi.mock("../../lib/logger", () => ({
  logger: {
    debug: vi.fn(),
  },
}));

interface RenderHandle {
  container: HTMLDivElement;
  root: Root;
}

const mounted: RenderHandle[] = [];
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

async function render(element: React.ReactElement): Promise<RenderHandle> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(element);
  });

  const handle = { container, root };
  mounted.push(handle);
  return handle;
}

async function flushEffects(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

afterEach(async () => {
  while (mounted.length > 0) {
    const handle = mounted.pop();
    if (!handle) break;
    await act(async () => {
      handle.root.unmount();
    });
    handle.container.remove();
  }
});

beforeEach(() => {
  checkMock.mockReset();
  relaunchMock.mockReset();
});

describe("UpdateBanner", () => {
  it("renders nothing when no update is available", async () => {
    checkMock.mockResolvedValue(null);

    const { container } = await render(<UpdateBanner />);
    await flushEffects();

    expect(container.textContent).toBe("");
    expect(checkMock).toHaveBeenCalledTimes(1);
  });

  it("renders and dismisses an available update", async () => {
    checkMock.mockResolvedValue({
      version: "1.5.0",
      body: "Faster presenter sync",
    });

    const { container } = await render(<UpdateBanner />);
    await flushEffects();

    expect(container.textContent).toContain("StreamSlate 1.5.0 is available!");
    expect(container.textContent).toContain("Faster presenter sync");

    const laterButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Later"
    );

    expect(laterButton).toBeTruthy();

    await act(async () => {
      laterButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toBe("");
  });

  it("installs and relaunches when the user accepts the update", async () => {
    const downloadAndInstall = vi.fn().mockResolvedValue(undefined);
    checkMock
      .mockResolvedValueOnce({
        version: "1.5.0",
        body: "Faster presenter sync",
      })
      .mockResolvedValueOnce({
        version: "1.5.0",
        body: "Faster presenter sync",
        downloadAndInstall,
      });
    relaunchMock.mockResolvedValue(undefined);

    const { container } = await render(<UpdateBanner />);
    await flushEffects();

    const installButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Install Update"
    );

    expect(installButton).toBeTruthy();

    await act(async () => {
      installButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushEffects();

    expect(checkMock).toHaveBeenCalledTimes(2);
    expect(downloadAndInstall).toHaveBeenCalledTimes(1);
    expect(relaunchMock).toHaveBeenCalledTimes(1);
  });
});
