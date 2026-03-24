/**
 * imageSizeUtils.ts
 *
 * Utilities for detecting image dimensions and comparing them
 * against a target banner preset to determine if expansion is needed.
 */

import type { BannerPreset, ExpansionAnalysis, ImageDimensions } from "../types";

// DALL-E 2 only accepts: 256×256, 512×512, or 1024×1024
export const API_CANVAS_SIZE = 1024;

/**
 * Reads the natural width/height of an image from its dataURL.
 */
export function getImageDimensions(dataUrl: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
      });
    img.onerror = () => reject(new Error("No se pudo leer las dimensiones de la imagen."));
    img.src = dataUrl;
  });
}

/**
 * Determines whether the image needs outpainting to fill the preset.
 * Returns the full ExpansionAnalysis with gap values in 1024-canvas space.
 *
 * Decision logic:
 * - If gapRatio < 0.03 → almost perfect fit → needsExpansion = false
 * - Otherwise → expansion is worthwhile
 *
 * @param focusX - Horizontal position of subject: 0 = full left, 50 = center, 100 = full right
 */
export function analyzeExpansionNeeds(
  img: ImageDimensions,
  preset: BannerPreset,
  focusX = 50,
): ExpansionAnalysis {
  const imgAspect = img.width / img.height;
  const presetAspect = preset.width / preset.height;

  const gapRatio =
    Math.abs(imgAspect - presetAspect) / Math.max(imgAspect, presetAspect);

  const needsExpansion = gapRatio >= 0.03;

  // ── Working space: fit the preset inside 1024×1024 ──────────────────────
  const scale = Math.min(
    API_CANVAS_SIZE / preset.width,
    API_CANVAS_SIZE / preset.height,
  );
  const scaledPresetW = Math.round(preset.width * scale);
  const scaledPresetH = Math.round(preset.height * scale);
  const offsetX = Math.floor((API_CANVAS_SIZE - scaledPresetW) / 2);
  const offsetY = Math.floor((API_CANVAS_SIZE - scaledPresetH) / 2);

  // ── Contain the product image inside the scaled preset area ─────────────
  const containScale = Math.min(scaledPresetW / img.width, scaledPresetH / img.height);
  const drawW = Math.round(img.width * containScale);
  const drawH = Math.round(img.height * containScale);

  // Horizontal placement driven by focusX (0–100)
  const availableX = scaledPresetW - drawW;
  const drawX = offsetX + Math.round((availableX * Math.max(0, Math.min(100, focusX))) / 100);
  // Vertical: always centered
  const drawY = offsetY + Math.floor((scaledPresetH - drawH) / 2);

  // ── Gaps inside the preset area ─────────────────────────────────────────
  const leftGap  = drawX - offsetX;
  const rightGap = (offsetX + scaledPresetW) - (drawX + drawW);
  const topGap   = drawY - offsetY;
  const bottomGap = (offsetY + scaledPresetH) - (drawY + drawH);

  return {
    needsExpansion,
    leftGap,
    rightGap,
    topGap,
    bottomGap,
    scaledPresetW,
    scaledPresetH,
    offsetX,
    offsetY,
    drawX,
    drawY,
    drawW,
    drawH,
    gapRatio,
  };
}

/**
 * Returns a human-readable description of the gap distribution,
 * useful for the UI hint text.
 */
export function describeGaps(analysis: ExpansionAnalysis): string {
  const { leftGap, rightGap, topGap, bottomGap } = analysis;
  const isLateral = leftGap > 10 || rightGap > 10;
  const isVertical = topGap > 10 || bottomGap > 10;

  if (isLateral && isVertical) return "espacios en los costados y verticales";
  if (isLateral) return "espacios en los costados laterales";
  if (isVertical) return "espacios en la parte superior e inferior";
  return "pequeños espacios vacíos";
}
