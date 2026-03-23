/**
 * imageSquareFormatter.ts
 *
 * Prepares the source image for the OpenAI images/edits endpoint.
 *
 * DALL-E 2 requirement: the input image MUST be a square PNG
 * with dimensions of exactly 256×256, 512×512, or 1024×1024.
 *
 * This utility:
 *  1. Creates a 1024×1024 canvas
 *  2. Fills a white background (outside the preset area — gets cropped post-AI)
 *  3. Draws the product image "contained" within the scaled preset area
 *  4. Returns the canvas as a PNG Blob
 */

import type { ExpansionAnalysis } from "../types";
import { API_CANVAS_SIZE } from "./imageSizeUtils";
import { canvasToPngBlob } from "./maskGenerator";

const MAX_BLOB_BYTES = 4 * 1024 * 1024; // OpenAI limit: 4 MB

/**
 * Builds the 1024×1024 image canvas for the API.
 *
 * @param imgEl   - The loaded HTMLImageElement
 * @param analysis - Output of `analyzeExpansionNeeds`
 */
export function buildSquareImageCanvas(
  imgEl: HTMLImageElement,
  analysis: ExpansionAnalysis,
): HTMLCanvasElement {
  const { drawX, drawY, drawW, drawH } = analysis;

  const canvas = document.createElement("canvas");
  canvas.width  = API_CANVAS_SIZE;
  canvas.height = API_CANVAS_SIZE;
  const ctx = canvas.getContext("2d")!;

  // White background — the area outside the preset rect doesn't matter
  // because we'll crop the result after the API call anyway.
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, API_CANVAS_SIZE, API_CANVAS_SIZE);

  // Draw the product image contained within the preset area
  ctx.drawImage(imgEl, drawX, drawY, drawW, drawH);

  return canvas;
}

/**
 * Full pipeline: HTMLImageElement → 1024×1024 PNG Blob.
 * Also validates the 4 MB size limit required by DALL-E 2.
 */
export async function formatImageForAPI(
  imgEl: HTMLImageElement,
  analysis: ExpansionAnalysis,
): Promise<Blob> {
  const canvas = buildSquareImageCanvas(imgEl, analysis);
  const blob   = await canvasToPngBlob(canvas);

  if (blob.size > MAX_BLOB_BYTES) {
    throw new Error(
      `La imagen excede el límite de 4 MB requerido por OpenAI ` +
      `(actual: ${Math.round(blob.size / 1024)} KB). ` +
      `Reduce la resolución de la imagen y vuelve a intentarlo.`,
    );
  }

  return blob;
}

/**
 * Loads a dataURL into an HTMLImageElement.
 */
export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    img.src = src;
  });
}

/**
 * After the API returns the 1024×1024 result, crop it back to the
 * scaled preset area and return a JPEG dataURL.
 */
export async function cropResultToPreset(
  b64: string,
  analysis: ExpansionAnalysis,
): Promise<string> {
  const { offsetX, offsetY, scaledPresetW, scaledPresetH } = analysis;

  const resultImg = await loadImageElement(`data:image/png;base64,${b64}`);

  const canvas = document.createElement("canvas");
  canvas.width  = scaledPresetW;
  canvas.height = scaledPresetH;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    resultImg,
    offsetX, offsetY, scaledPresetW, scaledPresetH,
    0, 0, scaledPresetW, scaledPresetH,
  );

  return canvas.toDataURL("image/jpeg", 0.92);
}
