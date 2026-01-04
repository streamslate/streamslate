/**
 * Geometry utilities for drawing and paths
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Convert an array of points to a smooth SVG path using Catmull-Rom splines.
 * This creates smooth curves through all points rather than jagged polylines.
 */
export function pointsToSmoothPath(points: Point[], scale: number = 1): string {
  if (points.length < 2) return "";
  if (points.length === 2) {
    // Just draw a line for 2 points
    return `M ${points[0].x * scale},${points[0].y * scale} L ${points[1].x * scale},${points[1].y * scale}`;
  }

  // Simplify points if there are too many (performance optimization)
  const simplified = simplifyPoints(points, 1.5);
  if (simplified.length < 2) return "";

  const scaledPoints = simplified.map((p) => ({
    x: p.x * scale,
    y: p.y * scale,
  }));

  // Start the path
  let path = `M ${scaledPoints[0].x},${scaledPoints[0].y}`;

  // Use Catmull-Rom spline interpolation
  for (let i = 0; i < scaledPoints.length - 1; i++) {
    const p0 = scaledPoints[Math.max(0, i - 1)];
    const p1 = scaledPoints[i];
    const p2 = scaledPoints[Math.min(scaledPoints.length - 1, i + 1)];
    const p3 = scaledPoints[Math.min(scaledPoints.length - 1, i + 2)];

    // Calculate control points for cubic bezier
    const tension = 0.5;
    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 3;
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 3;
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 3;
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 3;

    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return path;
}

/**
 * Douglas-Peucker algorithm for point simplification.
 * Reduces the number of points while preserving the shape.
 */
export function simplifyPoints(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points;

  // Find the point with maximum distance from the line between start and end
  let maxDist = 0;
  let maxIndex = 0;

  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDist > tolerance) {
    const left = simplifyPoints(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPoints(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  // Otherwise, just return start and end
  return [start, end];
}

/**
 * Calculate perpendicular distance from a point to a line.
 */
function perpendicularDistance(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lineLengthSq = dx * dx + dy * dy;

  if (lineLengthSq === 0) {
    // Start and end are the same point
    return Math.sqrt(
      (point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2
    );
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
        lineLengthSq
    )
  );

  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;

  return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
}
