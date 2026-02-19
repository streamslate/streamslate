import { describe, it, expect } from "vitest";
import { AnnotationType } from "../../types/pdf.types";
import type { Annotation } from "../../types/pdf.types";
import {
  normalizeHexColor,
  clampOpacity,
  hexToRgba,
  getPointsFromAnnotation,
  bboxFromPoints,
  moveAnnotationBy,
  MIN_ANNOTATION_SIZE,
} from "./drawing";

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: "test-1",
    type: AnnotationType.RECTANGLE,
    pageNumber: 1,
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    content: "",
    color: "#ff0000",
    opacity: 0.8,
    created: new Date(),
    modified: new Date(),
    visible: true,
    ...overrides,
  };
}

describe("normalizeHexColor", () => {
  it("returns valid 6-digit hex unchanged", () => {
    expect(normalizeHexColor("#ff0000")).toBe("#ff0000");
    expect(normalizeHexColor("#AABBCC")).toBe("#AABBCC");
  });

  it("expands 3-digit hex to 6-digit", () => {
    expect(normalizeHexColor("#f00")).toBe("#ff0000");
    expect(normalizeHexColor("#abc")).toBe("#aabbcc");
  });

  it("returns null for invalid values", () => {
    expect(normalizeHexColor(undefined)).toBe(null);
    expect(normalizeHexColor("")).toBe(null);
    expect(normalizeHexColor("red")).toBe(null);
    expect(normalizeHexColor("#gg0000")).toBe(null);
  });
});

describe("clampOpacity", () => {
  it("clamps value to [0, 1]", () => {
    expect(clampOpacity(0.5, 1)).toBe(0.5);
    expect(clampOpacity(-0.5, 1)).toBe(0);
    expect(clampOpacity(1.5, 1)).toBe(1);
  });

  it("returns fallback for undefined or NaN", () => {
    expect(clampOpacity(undefined, 0.7)).toBe(0.7);
    expect(clampOpacity(NaN, 0.3)).toBe(0.3);
    expect(clampOpacity(Infinity, 0.4)).toBe(0.4);
  });
});

describe("hexToRgba", () => {
  it("converts hex + opacity to rgba string", () => {
    expect(hexToRgba("#ff0000", 0.5, "#000000")).toBe("rgba(255, 0, 0, 0.5)");
    expect(hexToRgba("#00ff00", 1.0, "#000000")).toBe("rgba(0, 255, 0, 1)");
  });

  it("uses fallback when hex is invalid", () => {
    expect(hexToRgba(undefined, 0.8, "#0000ff")).toBe("rgba(0, 0, 255, 0.8)");
    expect(hexToRgba("bad", 0.5, "#ffffff")).toBe("rgba(255, 255, 255, 0.5)");
  });
});

describe("getPointsFromAnnotation", () => {
  it("returns annotation.points if present", () => {
    const a = makeAnnotation({
      type: AnnotationType.FREE_DRAW,
      points: [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ],
    });
    expect(getPointsFromAnnotation(a)).toEqual([
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ]);
  });

  it("parses points from JSON content as fallback", () => {
    const a = makeAnnotation({
      type: AnnotationType.FREE_DRAW,
      content: JSON.stringify([
        { x: 5, y: 6 },
        { x: 7, y: 8 },
      ]),
    });
    expect(getPointsFromAnnotation(a)).toEqual([
      { x: 5, y: 6 },
      { x: 7, y: 8 },
    ]);
  });

  it("returns null for invalid content", () => {
    const a = makeAnnotation({
      type: AnnotationType.FREE_DRAW,
      content: "not json",
    });
    expect(getPointsFromAnnotation(a)).toBe(null);
  });

  it("returns null for empty array", () => {
    const a = makeAnnotation({
      type: AnnotationType.FREE_DRAW,
      content: "[]",
    });
    expect(getPointsFromAnnotation(a)).toBe(null);
  });

  it("skips entries with non-numeric coordinates", () => {
    const a = makeAnnotation({
      type: AnnotationType.FREE_DRAW,
      content: JSON.stringify([
        { x: 1, y: 2 },
        { x: "bad", y: 3 },
        { x: 4, y: NaN },
      ]),
    });
    const result = getPointsFromAnnotation(a);
    expect(result).toEqual([{ x: 1, y: 2 }]);
  });
});

describe("bboxFromPoints", () => {
  it("calculates bounding box from points", () => {
    const points = [
      { x: 5, y: 10 },
      { x: 15, y: 30 },
      { x: 10, y: 20 },
    ];
    expect(bboxFromPoints(points)).toEqual({
      x: 5,
      y: 10,
      width: 10,
      height: 20,
    });
  });

  it("handles single point (zero-size bbox)", () => {
    expect(bboxFromPoints([{ x: 7, y: 3 }])).toEqual({
      x: 7,
      y: 3,
      width: 0,
      height: 0,
    });
  });
});

describe("moveAnnotationBy", () => {
  it("offsets x and y for rectangle", () => {
    const a = makeAnnotation({ x: 10, y: 20 });
    const result = moveAnnotationBy(a, 5, -3);
    expect(result.x).toBe(15);
    expect(result.y).toBe(17);
  });

  it("moves free-draw points and recalculates bbox", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ];
    const a = makeAnnotation({
      type: AnnotationType.FREE_DRAW,
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      points,
      content: JSON.stringify(points),
    });
    const result = moveAnnotationBy(a, 5, 5);
    expect(result.x).toBe(5);
    expect(result.y).toBe(5);
    expect(result.points).toEqual([
      { x: 5, y: 5 },
      { x: 15, y: 15 },
    ]);
  });
});

describe("MIN_ANNOTATION_SIZE", () => {
  it("is a positive number", () => {
    expect(MIN_ANNOTATION_SIZE).toBeGreaterThan(0);
  });
});
