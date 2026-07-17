import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnnotationType } from "../../types/pdf.types";
import { AnnotationTools } from "./AnnotationTools";

interface RenderHandle {
  container: HTMLDivElement;
  root: Root;
}

const mounted: RenderHandle[] = [];
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

async function renderTools(): Promise<RenderHandle> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <AnnotationTools
        toolConfig={{ color: "#ffff00", opacity: 0.5, strokeWidth: 2 }}
        onToolSelect={vi.fn()}
        onToolConfigChange={vi.fn()}
        documentPath="/tmp/layout-regression.pdf"
      />
    );
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

describe("AnnotationTools", () => {
  it("opens templates in a bounded overlay that cannot resize the PDF viewport", async () => {
    const { container } = await renderTools();

    expect(
      container
        .querySelector("[data-testid='annotation-tools']")
        ?.classList.contains("flex-nowrap")
    ).toBe(true);
    expect(
      container.querySelector("[data-testid='annotation-tools-popover']")
    ).toBeNull();

    const templatesButton = container.querySelector<HTMLButtonElement>(
      "button[aria-controls='annotation-templates-panel']"
    );
    expect(templatesButton).not.toBeNull();

    await act(async () => {
      templatesButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true })
      );
    });

    const popover = container.querySelector(
      "[data-testid='annotation-tools-popover']"
    );
    expect(popover).not.toBeNull();
    expect(popover?.classList.contains("absolute")).toBe(true);
    expect(popover?.classList.contains("overflow-y-auto")).toBe(true);
    expect(popover?.className).toContain("max-h-");
    expect(popover?.textContent).toContain("Lecture Focus");

    const lectureFocus = Array.from(
      popover?.querySelectorAll("button") ?? []
    ).find((button) => button.textContent?.includes("Lecture Focus"));
    await act(async () => {
      lectureFocus?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(
      container.querySelector("[data-testid='annotation-tools-popover']")
    ).toBeNull();
  });

  it("keeps tool settings in the same overlay layer", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    mounted.push({ container, root });

    await act(async () => {
      root.render(
        <AnnotationTools
          activeTool={AnnotationType.HIGHLIGHT}
          toolConfig={{ color: "#ffff00", opacity: 0.5, strokeWidth: 2 }}
          onToolSelect={vi.fn()}
          onToolConfigChange={vi.fn()}
        />
      );
    });

    const settingsButton = container.querySelector<HTMLButtonElement>(
      "button[aria-controls='annotation-settings-panel']"
    );
    expect(settingsButton).not.toBeNull();

    await act(async () => {
      settingsButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const popover = container.querySelector(
      "[data-testid='annotation-tools-popover']"
    );
    expect(popover?.classList.contains("absolute")).toBe(true);
    expect(popover?.textContent).toContain("Tool Settings");
  });
});
