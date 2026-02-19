import { describe, it, expect } from "vitest";
import {
  annotationToDTO,
  dtoToAnnotation,
  parseAnnotationDTO,
} from "./converters";
import { AnnotationType } from "../../types/pdf.types";
import type { Annotation } from "../../types/pdf.types";
import type { AnnotationDTO } from "../tauri/commands";

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: "ann-1",
    type: AnnotationType.HIGHLIGHT,
    pageNumber: 1,
    x: 10,
    y: 20,
    width: 100,
    height: 30,
    content: "test",
    color: "#ffff00",
    opacity: 0.8,
    created: new Date("2025-06-15T12:00:00Z"),
    modified: new Date("2025-06-15T13:00:00Z"),
    visible: true,
    ...overrides,
  };
}

function makeDTO(overrides: Partial<AnnotationDTO> = {}): AnnotationDTO {
  return {
    id: "ann-1",
    type: "highlight",
    pageNumber: 1,
    x: 10,
    y: 20,
    width: 100,
    height: 30,
    content: "test",
    color: "#ffff00",
    opacity: 0.8,
    created: "2025-06-15T12:00:00.000Z",
    modified: "2025-06-15T13:00:00.000Z",
    visible: true,
    ...overrides,
  };
}

describe("converters", () => {
  describe("annotationToDTO", () => {
    it("converts all basic fields", () => {
      const ann = makeAnnotation();
      const dto = annotationToDTO(ann);
      expect(dto.id).toBe("ann-1");
      expect(dto.type).toBe("highlight");
      expect(dto.pageNumber).toBe(1);
      expect(dto.x).toBe(10);
      expect(dto.y).toBe(20);
      expect(dto.width).toBe(100);
      expect(dto.height).toBe(30);
      expect(dto.content).toBe("test");
      expect(dto.color).toBe("#ffff00");
      expect(dto.opacity).toBe(0.8);
      expect(dto.visible).toBe(true);
    });

    it("converts Date to ISO string", () => {
      const ann = makeAnnotation({
        created: new Date("2025-01-01T00:00:00Z"),
      });
      const dto = annotationToDTO(ann);
      expect(dto.created).toBe("2025-01-01T00:00:00.000Z");
    });

    it("preserves optional fields", () => {
      const ann = makeAnnotation({
        strokeWidth: 3,
        fontSize: 14,
        backgroundColor: "#000000",
        backgroundOpacity: 0.5,
      });
      const dto = annotationToDTO(ann);
      expect(dto.strokeWidth).toBe(3);
      expect(dto.fontSize).toBe(14);
      expect(dto.backgroundColor).toBe("#000000");
      expect(dto.backgroundOpacity).toBe(0.5);
    });

    it("includes points from annotation", () => {
      const ann = makeAnnotation({
        points: [
          { x: 1, y: 2 },
          { x: 3, y: 4 },
        ],
      });
      const dto = annotationToDTO(ann);
      expect(dto.points).toEqual([
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ]);
    });

    it("parses points from content for free_draw without points field", () => {
      const ann = makeAnnotation({
        type: AnnotationType.FREE_DRAW,
        content: JSON.stringify([
          { x: 10, y: 20 },
          { x: 30, y: 40 },
        ]),
        points: undefined,
      });
      const dto = annotationToDTO(ann);
      expect(dto.points).toEqual([
        { x: 10, y: 20 },
        { x: 30, y: 40 },
      ]);
    });
  });

  describe("dtoToAnnotation", () => {
    it("converts all basic fields", () => {
      const dto = makeDTO();
      const ann = dtoToAnnotation(dto);
      expect(ann.id).toBe("ann-1");
      expect(ann.type).toBe("highlight");
      expect(ann.pageNumber).toBe(1);
      expect(ann.visible).toBe(true);
    });

    it("converts ISO string to Date", () => {
      const dto = makeDTO({ created: "2025-01-01T00:00:00.000Z" });
      const ann = dtoToAnnotation(dto);
      expect(ann.created).toBeInstanceOf(Date);
      expect(ann.created.toISOString()).toBe("2025-01-01T00:00:00.000Z");
    });

    it("preserves optional fields", () => {
      const dto = makeDTO({
        strokeWidth: 3,
        fontSize: 14,
        backgroundColor: "#000",
        backgroundOpacity: 0.5,
      });
      const ann = dtoToAnnotation(dto);
      expect(ann.strokeWidth).toBe(3);
      expect(ann.fontSize).toBe(14);
      expect(ann.backgroundColor).toBe("#000");
      expect(ann.backgroundOpacity).toBe(0.5);
    });
  });

  describe("round-trip", () => {
    it("annotation -> DTO -> annotation preserves data", () => {
      const original = makeAnnotation({
        strokeWidth: 2,
        points: [
          { x: 1, y: 2 },
          { x: 3, y: 4 },
        ],
      });
      const dto = annotationToDTO(original);
      const restored = dtoToAnnotation(dto);

      expect(restored.id).toBe(original.id);
      expect(restored.type).toBe(original.type);
      expect(restored.pageNumber).toBe(original.pageNumber);
      expect(restored.x).toBe(original.x);
      expect(restored.y).toBe(original.y);
      expect(restored.width).toBe(original.width);
      expect(restored.height).toBe(original.height);
      expect(restored.color).toBe(original.color);
      expect(restored.opacity).toBe(original.opacity);
      expect(restored.strokeWidth).toBe(original.strokeWidth);
      expect(restored.points).toEqual(original.points);
      expect(restored.created.toISOString()).toBe(
        original.created.toISOString()
      );
      expect(restored.modified.toISOString()).toBe(
        original.modified.toISOString()
      );
    });
  });

  describe("parseAnnotationDTO", () => {
    it("parses a valid DTO object", () => {
      const input = {
        id: "a1",
        type: "highlight",
        pageNumber: 2,
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        content: "hello",
        color: "#ff0000",
        opacity: 0.5,
        created: "2025-01-01T00:00:00Z",
        modified: "2025-01-01T00:00:00Z",
        visible: true,
      };
      const result = parseAnnotationDTO(input);
      expect(result).not.toBeNull();
      expect(result!.id).toBe("a1");
      expect(result!.pageNumber).toBe(2);
      expect(result!.color).toBe("#ff0000");
    });

    it("accepts snake_case keys (page_number)", () => {
      const input = {
        id: "a1",
        type: "highlight",
        page_number: 3,
        x: 0,
        y: 0,
        width: 50,
        height: 50,
      };
      const result = parseAnnotationDTO(input);
      expect(result).not.toBeNull();
      expect(result!.pageNumber).toBe(3);
    });

    it("returns null for missing required fields", () => {
      expect(parseAnnotationDTO({ id: "a1" })).toBeNull();
      expect(parseAnnotationDTO({})).toBeNull();
      expect(parseAnnotationDTO(null)).toBeNull();
      expect(parseAnnotationDTO("string")).toBeNull();
      expect(parseAnnotationDTO(42)).toBeNull();
    });

    it("applies defaults for optional fields", () => {
      const input = {
        id: "a1",
        type: "rectangle",
        pageNumber: 1,
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      };
      const result = parseAnnotationDTO(input);
      expect(result).not.toBeNull();
      expect(result!.content).toBe("");
      expect(result!.color).toBe("#ffff00");
      expect(result!.opacity).toBe(1);
      expect(result!.visible).toBe(true);
    });

    it("parses points for free_draw from content", () => {
      const input = {
        id: "a1",
        type: "free_draw",
        pageNumber: 1,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        content: JSON.stringify([
          { x: 1, y: 2 },
          { x: 3, y: 4 },
        ]),
      };
      const result = parseAnnotationDTO(input);
      expect(result).not.toBeNull();
      expect(result!.points).toEqual([
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ]);
    });

    it("floors pageNumber to integer", () => {
      const input = {
        id: "a1",
        type: "highlight",
        pageNumber: 2.7,
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      };
      const result = parseAnnotationDTO(input);
      expect(result!.pageNumber).toBe(2);
    });

    it("rejects NaN/Infinity in numeric fields", () => {
      const input = {
        id: "a1",
        type: "highlight",
        pageNumber: 1,
        x: NaN,
        y: 0,
        width: 10,
        height: 10,
      };
      expect(parseAnnotationDTO(input)).toBeNull();
    });
  });
});
