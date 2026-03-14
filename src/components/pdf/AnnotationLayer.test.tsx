import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnnotationLayer } from "./AnnotationLayer";
import { AnnotationType } from "../../types/pdf.types";
import type { Annotation } from "../../types/pdf.types";

// ── Helpers ─────────────────────────────────────────────────────────────

interface RenderHandle {
  container: HTMLDivElement;
  root: Root;
}

const mounted: RenderHandle[] = [];
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

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

const viewport = { width: 800, height: 600, scale: 1 };

function makeAnnotation(
  type: AnnotationType,
  overrides: Partial<Annotation> = {}
): Annotation {
  return {
    id: `test-${type}`,
    type,
    pageNumber: 1,
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    content: type === AnnotationType.TEXT ? "Hello World" : "",
    color: "#ff0000",
    opacity: 0.8,
    created: new Date(),
    modified: new Date(),
    visible: true,
    ...overrides,
  };
}

const defaultProps = {
  pageNumber: 1,
  viewport,
  onAnnotationCreate: vi.fn(),
  onAnnotationUpdate: vi.fn(),
  onAnnotationDelete: vi.fn(),
};

// ── Tests ───────────────────────────────────────────────────────────────

describe("AnnotationLayer rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders RECTANGLE as an SVG rect element", async () => {
    const annotation = makeAnnotation(AnnotationType.RECTANGLE);
    const { container } = await render(
      <AnnotationLayer {...defaultProps} annotations={[annotation]} />
    );

    const svg = container.querySelector("[data-testid='annotation-layer']");
    expect(svg).not.toBeNull();

    const rect = svg!.querySelector(
      `[data-annotation-type="${AnnotationType.RECTANGLE}"]`
    );
    expect(rect).not.toBeNull();
    expect(rect!.tagName.toLowerCase()).toBe("rect");
  });

  it("renders HIGHLIGHT as an SVG rect element with fill", async () => {
    const annotation = makeAnnotation(AnnotationType.HIGHLIGHT);
    const { container } = await render(
      <AnnotationLayer {...defaultProps} annotations={[annotation]} />
    );

    const svg = container.querySelector("[data-testid='annotation-layer']");
    const rect = svg!.querySelector(
      `[data-annotation-type="${AnnotationType.HIGHLIGHT}"]`
    );
    expect(rect).not.toBeNull();
    expect(rect!.tagName.toLowerCase()).toBe("rect");
    // Highlights have a filled color (not "none")
    expect(rect!.getAttribute("fill")).toBe("#ff0000");
  });

  it("renders CIRCLE as an SVG ellipse element", async () => {
    const annotation = makeAnnotation(AnnotationType.CIRCLE);
    const { container } = await render(
      <AnnotationLayer {...defaultProps} annotations={[annotation]} />
    );

    const svg = container.querySelector("[data-testid='annotation-layer']");
    const ellipse = svg!.querySelector(
      `[data-annotation-type="${AnnotationType.CIRCLE}"]`
    );
    expect(ellipse).not.toBeNull();
    expect(ellipse!.tagName.toLowerCase()).toBe("ellipse");
  });

  it("renders ARROW as SVG line elements", async () => {
    const annotation = makeAnnotation(AnnotationType.ARROW);
    const { container } = await render(
      <AnnotationLayer {...defaultProps} annotations={[annotation]} />
    );

    const svg = container.querySelector("[data-testid='annotation-layer']");
    const line = svg!.querySelector(
      `[data-annotation-type="${AnnotationType.ARROW}"]`
    );
    expect(line).not.toBeNull();
    expect(line!.tagName.toLowerCase()).toBe("line");
  });

  it("renders TEXT as SVG text with content", async () => {
    const annotation = makeAnnotation(AnnotationType.TEXT, {
      content: "Test Label",
    });
    const { container } = await render(
      <AnnotationLayer {...defaultProps} annotations={[annotation]} />
    );

    const svg = container.querySelector("[data-testid='annotation-layer']");
    const textEl = svg!.querySelector(
      `[data-annotation-type="${AnnotationType.TEXT}"]`
    );
    // TEXT renders inside a <g> group
    expect(textEl).not.toBeNull();
    // Find the actual text element inside
    const group = textEl!.closest("g") ?? textEl!.parentElement;
    const text = group!.querySelector("text");
    expect(text).not.toBeNull();
    expect(text!.textContent).toBe("Test Label");
  });

  it("renders FREE_DRAW as SVG path elements", async () => {
    const points = [
      { x: 10, y: 10 },
      { x: 50, y: 50 },
      { x: 100, y: 20 },
    ];
    const annotation = makeAnnotation(AnnotationType.FREE_DRAW, {
      points,
      content: JSON.stringify(points),
    });
    const { container } = await render(
      <AnnotationLayer {...defaultProps} annotations={[annotation]} />
    );

    const svg = container.querySelector("[data-testid='annotation-layer']");
    const path = svg!.querySelector(
      `[data-annotation-type="${AnnotationType.FREE_DRAW}"]`
    );
    expect(path).not.toBeNull();
    expect(path!.tagName.toLowerCase()).toBe("path");
  });

  it("does not render invisible annotations", async () => {
    const annotation = makeAnnotation(AnnotationType.RECTANGLE, {
      visible: false,
    });
    const { container } = await render(
      <AnnotationLayer {...defaultProps} annotations={[annotation]} />
    );

    const svg = container.querySelector("[data-testid='annotation-layer']");
    const rect = svg!.querySelector(
      `[data-annotation-type="${AnnotationType.RECTANGLE}"]`
    );
    expect(rect).toBeNull();
  });

  it("does not render annotations from other pages", async () => {
    const annotation = makeAnnotation(AnnotationType.RECTANGLE, {
      pageNumber: 2,
    });
    const { container } = await render(
      <AnnotationLayer {...defaultProps} annotations={[annotation]} />
    );

    const svg = container.querySelector("[data-testid='annotation-layer']");
    const rect = svg!.querySelector(
      `[data-annotation-type="${AnnotationType.RECTANGLE}"]`
    );
    expect(rect).toBeNull();
  });

  it("renders all 6 annotation types simultaneously", async () => {
    const points = [
      { x: 10, y: 10 },
      { x: 50, y: 50 },
    ];
    const annotations = [
      makeAnnotation(AnnotationType.TEXT, { id: "a1", content: "Hi" }),
      makeAnnotation(AnnotationType.HIGHLIGHT, { id: "a2" }),
      makeAnnotation(AnnotationType.ARROW, { id: "a3" }),
      makeAnnotation(AnnotationType.RECTANGLE, { id: "a4" }),
      makeAnnotation(AnnotationType.CIRCLE, { id: "a5" }),
      makeAnnotation(AnnotationType.FREE_DRAW, {
        id: "a6",
        points,
        content: JSON.stringify(points),
      }),
    ];

    const { container } = await render(
      <AnnotationLayer {...defaultProps} annotations={annotations} />
    );

    const svg = container.querySelector("[data-testid='annotation-layer']");
    expect(svg).not.toBeNull();

    // Each type should produce at least one element
    for (const type of Object.values(AnnotationType)) {
      const el = svg!.querySelector(`[data-annotation-type="${type}"]`);
      expect(el, `Expected element for annotation type: ${type}`).not.toBeNull();
    }
  });
});
