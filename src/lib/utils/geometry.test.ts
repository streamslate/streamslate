import { describe, it, expect } from "vitest";
import { simplifyPoints, pointsToSmoothPath } from "./geometry";
import type { Point } from "./geometry";

describe("geometry", () => {
  describe("simplifyPoints", () => {
    it("returns same array for 2 or fewer points", () => {
      const one: Point[] = [{ x: 0, y: 0 }];
      expect(simplifyPoints(one, 1)).toEqual(one);

      const two: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ];
      expect(simplifyPoints(two, 1)).toEqual(two);
    });

    it("reduces collinear points to endpoints", () => {
      // Points on a straight line should simplify to just start and end
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
        { x: 10, y: 10 },
        { x: 15, y: 15 },
        { x: 20, y: 20 },
      ];
      const result = simplifyPoints(points, 1);
      expect(result).toEqual([
        { x: 0, y: 0 },
        { x: 20, y: 20 },
      ]);
    });

    it("preserves sharp corners above tolerance", () => {
      // An L-shape: the corner point deviates significantly from the line
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ];
      const result = simplifyPoints(points, 1);
      expect(result).toHaveLength(3);
    });

    it("with high tolerance reduces more aggressively", () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 5, y: 3 },
        { x: 10, y: 0 },
        { x: 15, y: 2 },
        { x: 20, y: 0 },
      ];
      const low = simplifyPoints(points, 1);
      const high = simplifyPoints(points, 10);
      expect(high.length).toBeLessThanOrEqual(low.length);
    });

    it("handles identical start and end points", () => {
      const points: Point[] = [
        { x: 5, y: 5 },
        { x: 10, y: 5 },
        { x: 5, y: 5 },
      ];
      const result = simplifyPoints(points, 1);
      // Should preserve the middle point since it deviates from start=end
      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("pointsToSmoothPath", () => {
    it("returns empty string for fewer than 2 points", () => {
      expect(pointsToSmoothPath([])).toBe("");
      expect(pointsToSmoothPath([{ x: 1, y: 1 }])).toBe("");
    });

    it("returns a line for exactly 2 points", () => {
      const path = pointsToSmoothPath([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ]);
      expect(path).toContain("M ");
      expect(path).toContain("L ");
    });

    it("returns a cubic bezier path for 3+ points", () => {
      const path = pointsToSmoothPath([
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 0 },
      ]);
      expect(path).toContain("M ");
      expect(path).toContain("C ");
    });

    it("applies scale factor", () => {
      const path = pointsToSmoothPath(
        [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
        2
      );
      // Scaled: M 0,0 L 20,20
      expect(path).toContain("20");
    });

    it("handles large point arrays without error", () => {
      const points: Point[] = Array.from({ length: 1000 }, (_, i) => ({
        x: i,
        y: Math.sin(i * 0.1) * 50,
      }));
      const path = pointsToSmoothPath(points);
      expect(path.length).toBeGreaterThan(0);
      expect(path).toContain("M ");
    });
  });
});
