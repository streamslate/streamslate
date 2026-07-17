import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnnotationType } from "../../types/pdf.types";
import { ToolSelector } from "./ToolSelector";

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

describe("ToolSelector", () => {
  it("groups annotation tools into stable picker sections", async () => {
    const { container } = await render(<ToolSelector onToolClick={vi.fn()} />);

    expect(
      container.querySelector("[role='group'][aria-label='Markup']")
    ).not.toBeNull();
    expect(
      container.querySelector("[role='group'][aria-label='Shapes']")
    ).not.toBeNull();
    expect(
      container.querySelector("[role='group'][aria-label='Notes']")
    ).not.toBeNull();
    expect(container.querySelectorAll("button[aria-label]")).toHaveLength(8);
  });

  it("marks the active text-line tool and dispatches tool clicks", async () => {
    const onToolClick = vi.fn();
    const { container } = await render(
      <ToolSelector
        activeTool={AnnotationType.UNDERLINE}
        onToolClick={onToolClick}
      />
    );

    const underline = container.querySelector('button[aria-label="Underline"]');
    const strike = container.querySelector(
      'button[aria-label="Strikethrough"]'
    );

    expect(underline?.getAttribute("aria-pressed")).toBe("true");
    expect(strike?.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      strike?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onToolClick).toHaveBeenCalledWith(AnnotationType.STRIKETHROUGH);
  });
});
