import { getPresetVariants, type ImagePreset, type PresetDimension, type PresetVariantId } from "./image-presets";

export const FORCED_OUTPUT_FORMAT = "jpg" as const;
const FORCED_MIME_TYPE = "image/jpeg";

export interface ProcessedImage {
  blob: Blob;
  dataUrl: string;
  fileName: string;
  sizeKb: number;
  width: number;
  height: number;
  device: PresetVariantId;
}

/**
 * Generate a SEO-friendly filename from the preset label.
 * Format: [bandera]-[tipo]-[dispositivo]-[fecha].[ext]
 */
export function generateFileName(
  presetLabel: string,
  device: PresetVariantId,
  format: "jpg" = FORCED_OUTPUT_FORMAT,
): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  const dateStr = `${dd}-${mm}-${yy}`;

  const slug = presetLabel
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${slug}-${device}-${dateStr}.${format}`;
}

/**
 * Crop an image using Canvas based on focal point and target dimensions.
 */
function cropWithFocalPoint(
  img: HTMLImageElement,
  target: PresetDimension,
  focalX: number,
  focalY: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;
  const ctx = canvas.getContext("2d")!;

  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  const targetAspect = target.width / target.height;
  const imgAspect = imgW / imgH;

  let srcW: number, srcH: number, srcX: number, srcY: number;

  if (imgAspect > targetAspect) {
    srcH = imgH;
    srcW = imgH * targetAspect;
    srcX = (focalX / 100) * imgW - srcW / 2;
    srcY = 0;
  } else {
    srcW = imgW;
    srcH = imgW / targetAspect;
    srcX = 0;
    srcY = (focalY / 100) * imgH - srcH / 2;
  }

  srcX = Math.max(0, Math.min(imgW - srcW, srcX));
  srcY = Math.max(0, Math.min(imgH - srcH, srcY));

  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, target.width, target.height);
  return canvas;
}

/**
 * Export a canvas to a JPEG blob, reducing quality if needed to meet maxKb.
 */
async function exportOptimized(
  canvas: HTMLCanvasElement,
  maxKb: number,
): Promise<Blob> {
  let quality = 0.9;
  const minQuality = 0.45;

  while (quality >= minQuality) {
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), FORCED_MIME_TYPE, quality),
    );
    if (blob.size / 1024 <= maxKb || quality <= minQuality) {
      return blob;
    }
    quality -= 0.05;
  }

  return new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), FORCED_MIME_TYPE, minQuality),
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Process an uploaded image into the output variants defined by the preset.
 */
export async function processImage(
  imageSrc: string,
  preset: ImagePreset,
  focalX: number,
  focalY: number,
  onProgress?: (pct: number) => void,
): Promise<ProcessedImage[]> {
  const variants = getPresetVariants(preset);

  onProgress?.(5);
  const img = await loadImage(imageSrc);
  onProgress?.(15);

  const results: ProcessedImage[] = [];

  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    const canvas = cropWithFocalPoint(img, variant.dimension, focalX, focalY);
    const progressBase = 15 + Math.round(((i * 70) / variants.length));
    onProgress?.(progressBase);

    const blob = await exportOptimized(canvas, preset.maxWeightKb);
    const progressDone = 15 + Math.round((((i + 1) * 70) / variants.length));
    onProgress?.(progressDone);

    results.push({
      blob,
      dataUrl: URL.createObjectURL(blob),
      fileName: generateFileName(preset.label, variant.id, FORCED_OUTPUT_FORMAT),
      sizeKb: Math.round(blob.size / 1024),
      width: variant.dimension.width,
      height: variant.dimension.height,
      device: variant.id,
    });
  }

  onProgress?.(100);
  return results;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const normalizedFileName = fileName.replace(/\.[a-z0-9]+$/i, `.${FORCED_OUTPUT_FORMAT}`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = normalizedFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
