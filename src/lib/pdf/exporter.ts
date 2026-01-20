/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 */

import { PDFDocument, rgb, StandardFonts, type RGB } from "pdf-lib";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { AnnotationType } from "../../types/pdf.types";
import type { Annotation } from "../../types/pdf.types";
import { pointsToSmoothPath } from "../utils/geometry";
import type { Point } from "../utils/geometry";

/**
 * Convert hex color string to pdf-lib RGB color
 */
function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? rgb(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
      )
    : rgb(0, 0, 0);
}

/**
 * Export PDF with annotations burned in
 */
export async function exportPDF(
  inputPath: string,
  annotations: Map<number, Annotation[]>
): Promise<Uint8Array> {
  console.log("Starting PDF export...");

  // 1. Load the original PDF
  const assetUrl = convertFileSrc(inputPath);
  const response = await fetch(assetUrl);
  const buffer = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(buffer);

  // Embed font for text annotations
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // 2. Iterate through pages and draw annotations
  const pages = pdfDoc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const pageNum = i + 1; // 1-based page number
    const pageAnnotations = annotations.get(pageNum);

    if (!pageAnnotations || pageAnnotations.length === 0) continue;

    const page = pages[i];
    const { height: pageHeight } = page.getSize();

    // Sort annotations by creation time to preserve layer order
    const sortedAnnotations = [...pageAnnotations].sort(
      (a, b) => a.created.getTime() - b.created.getTime()
    );

    for (const annotation of sortedAnnotations) {
      if (!annotation.visible) continue;

      const color = hexToRgb(annotation.color);
      // PDF-ib uses bottom-left origin, StreamSlate uses top-left
      // y = pageHeight - y - height (for shapes)

      switch (annotation.type) {
        case AnnotationType.HIGHLIGHT:
          // Highlights are drawn as rectangles with opacity and multiply blend mode (if supported)
          // pdf-lib doesn't support blend modes easily, so just semi-transparent rect
          page.drawRectangle({
            x: annotation.x,
            y: pageHeight - annotation.y - annotation.height,
            width: annotation.width,
            height: annotation.height,
            color: color,
            opacity: annotation.opacity,
          });
          break;

        case AnnotationType.RECTANGLE:
          page.drawRectangle({
            x: annotation.x,
            y: pageHeight - annotation.y - annotation.height,
            width: annotation.width,
            height: annotation.height,
            borderColor: color,
            borderWidth: 2, // Hardcoded stroke width for now, should come from annotation config
            opacity: 0, // Fill opacity
            borderOpacity: annotation.opacity,
          });
          break;

        case AnnotationType.CIRCLE:
          page.drawEllipse({
            x: annotation.x + annotation.width / 2,
            y: pageHeight - (annotation.y + annotation.height / 2),
            xScale: annotation.width / 2,
            yScale: annotation.height / 2,
            borderColor: color,
            borderWidth: 2,
            opacity: 0,
            borderOpacity: annotation.opacity,
          });
          break;

        case AnnotationType.ARROW: {
          // Calculate start and end points with coordinate flip
          const arrowStart = {
            x: annotation.x,
            y: pageHeight - annotation.y,
          };
          const arrowEnd = {
            x: annotation.x + annotation.width,
            y: pageHeight - (annotation.y + annotation.height),
          };

          // Draw the main arrow line
          page.drawLine({
            start: arrowStart,
            end: arrowEnd,
            color: color,
            thickness: 2,
            opacity: annotation.opacity,
          });

          // Calculate arrowhead using vector math
          const dx = arrowEnd.x - arrowStart.x;
          const dy = arrowEnd.y - arrowStart.y;
          const length = Math.sqrt(dx * dx + dy * dy);

          if (length > 0) {
            // Normalize direction vector
            const nx = dx / length;
            const ny = dy / length;

            // Arrowhead size (proportional to line length, max 15px)
            const headLength = Math.min(15, length * 0.3);

            // Calculate arrowhead points using rotation
            // Rotate the direction vector ±30 degrees for the head lines
            const angle = Math.PI / 6; // 30 degrees

            // Left wing of arrowhead
            const leftWingX =
              arrowEnd.x -
              headLength * (nx * Math.cos(angle) - ny * Math.sin(angle));
            const leftWingY =
              arrowEnd.y -
              headLength * (nx * Math.sin(angle) + ny * Math.cos(angle));

            // Right wing of arrowhead
            const rightWingX =
              arrowEnd.x -
              headLength * (nx * Math.cos(-angle) - ny * Math.sin(-angle));
            const rightWingY =
              arrowEnd.y -
              headLength * (nx * Math.sin(-angle) + ny * Math.cos(-angle));

            // Draw left wing
            page.drawLine({
              start: arrowEnd,
              end: { x: leftWingX, y: leftWingY },
              color: color,
              thickness: 2,
              opacity: annotation.opacity,
            });

            // Draw right wing
            page.drawLine({
              start: arrowEnd,
              end: { x: rightWingX, y: rightWingY },
              color: color,
              thickness: 2,
              opacity: annotation.opacity,
            });
          }
          break;
        }

        case AnnotationType.FREE_DRAW:
          try {
            const points: Point[] = JSON.parse(annotation.content || "[]");
            if (points.length < 2) continue;

            // Draw SVG path
            // Note: pdf-lib drawSvgPath uses top-left origin if origin is not specified?
            // Actually it draws based on the current coordinate system.
            // SVG paths usually assume TL origin.
            // We need to transform the path to flip Y?
            // Or easier: use page.moveTo/lineTo with flipped coordinates?

            // Let's manually draw the segments instead of SVG path to handle coordinate flip easily
            // Simplify points first
            // ... re-implement logic here or use points directly

            // Actually, pdf-lib's drawSvgPath places the path relative to the page origin (BL).
            // A path "M 10,10 ..." means x=10, y=10 from BL.
            // But our points are from TL.
            // So y=10 means "near bottom" in pdf-lib, but "near top" in our data.
            // We need to flip Y for every point in the path.

            const flippedPoints = points.map((p) => ({
              x: p.x,
              y: pageHeight - p.y,
            }));

            const flippedPath = pointsToSmoothPath(flippedPoints);

            page.drawSvgPath(flippedPath, {
              x: 0,
              y: 0,
              borderColor: color,
              borderWidth: 2,
              borderOpacity: annotation.opacity,
            });
          } catch (e) {
            console.warn("Failed to export free draw annotation", e);
          }
          break;

        case AnnotationType.TEXT:
          page.drawText(annotation.content, {
            x: annotation.x,
            y: pageHeight - annotation.y - 14, // Adjust for font size/baseline (~14px)
            size: 14,
            font: font,
            color: color,
            opacity: 1, // Text always opaque for readability?
          });
          break;
      }
    }
  }

  // 3. Save
  return await pdfDoc.save();
}
