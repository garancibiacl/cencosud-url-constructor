import { getPresetVariants, type ImagePreset, type PresetDimension, type PresetVariantId } from "./image-presets";

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
  format: "webp" | "jpg" = "webp",
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
 * Export a canvas to a blob, reducing quality if needed to meet maxKb.
 * Supports both WebP and JPEG formats.
 */
async function exportOptimized(
  canvas: HTMLCanvasElement,
  maxKb: number,
  format: "webp" | "jpg" = "webp",
): Promise<Blob> {
  const mimeType = format === "jpg" ? "image/jpeg" : "image/webp";
  let quality = 0.82;
  const minQuality = 0.3;

  while (quality >= minQuality) {
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), mimeType, quality),
    );
    if (blob.size / 1024 <= maxKb || quality <= minQuality) {
      return blob;
    }
    quality -= 0.08;
  }

  return new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), mimeType, minQuality),
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
  const format = preset.outputFormat || "webp";
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

    const blob = await exportOptimized(canvas, preset.maxWeightKb, format);
    const progressDone = 15 + Math.round((((i + 1) * 70) / variants.length));
    onProgress?.(progressDone);

    results.push({
      blob,
      dataUrl: URL.createObjectURL(blob),
      fileName: generateFileName(preset.label, variant.id, format),
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
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
