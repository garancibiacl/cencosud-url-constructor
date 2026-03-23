/**
 * maskGenerator.ts
 *
 * Generates a binary alpha-mask PNG for the OpenAI images/edits endpoint.
 *
 * OpenAI mask convention:
 *   - Fully transparent pixel (alpha = 0)   → AI generates new content here
 *   - Fully opaque pixel    (alpha = 255)   → AI preserves original content
 *
 * Strategy: the mask starts fully transparent (everywhere editable),
 * then we paint the product rectangle opaque to protect it.
 */

import type { ExpansionAnalysis } from "../types";
import { API_CANVAS_SIZE } from "./imageSizeUtils";

/**
 * Builds a 1024×1024 RGBA mask canvas.
 *
 * @param analysis - Output of `analyzeExpansionNeeds`
 * @returns HTMLCanvasElement ready to be converted to a PNG Blob
 */
export function buildMaskCanvas(analysis: ExpansionAnalysis): HTMLCanvasElement {
  const { drawX, drawY, drawW, drawH } = analysis;

  const canvas = document.createElement("canvas");
  canvas.width  = API_CANVAS_SIZE;
  canvas.height = API_CANVAS_SIZE;
  const ctx = canvas.getContext("2d")!;

  // 1. Start fully transparent → DALL-E will fill everything by default
  ctx.clearRect(0, 0, API_CANVAS_SIZE, API_CANVAS_SIZE);

  // 2. Paint the product area opaque (black with full alpha) → DALL-E preserves it
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.fillRect(drawX, drawY, drawW, drawH);

  return canvas;
}

/**
 * Converts a canvas to a PNG Blob.
 */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Error al convertir canvas a PNG."));
    }, "image/png");
  });
}

/**
 * Full pipeline: given an analysis, return the mask as a PNG Blob.
 */
export async function generateMaskBlob(
  analysis: ExpansionAnalysis,
): Promise<Blob> {
  const canvas = buildMaskCanvas(analysis);
  return canvasToPngBlob(canvas);
}

/**
 * Returns a CSS-ready representation of the gap areas for the UI overlay.
 * Useful to visually highlight where the AI will fill before sending.
 *
 * Values are percentages relative to the preview container.
 */
export function getGapOverlayStyle(
  analysis: ExpansionAnalysis,
): { leftPct: number; rightPct: number; topPct: number; bottomPct: number } {
  const { scaledPresetW, scaledPresetH, leftGap, rightGap, topGap, bottomGap } = analysis;
  return {
    leftPct:   (leftGap   / scaledPresetW) * 100,
    rightPct:  (rightGap  / scaledPresetW) * 100,
    topPct:    (topGap    / scaledPresetH) * 100,
    bottomPct: (bottomGap / scaledPresetH) * 100,
  };
}
