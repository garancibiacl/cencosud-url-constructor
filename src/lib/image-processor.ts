import type { PresetDimension } from "./image-presets";

export interface ProcessedImage {
  blob: Blob;
  dataUrl: string;
  fileName: string;
  sizeKb: number;
  width: number;
  height: number;
  device: "desktop" | "mobile";
}

/**
 * Generate a SEO-friendly filename from the preset label.
 * Format: [bandera]-[tipo]-[dispositivo]-[fecha].webp
 * Example: paris-home-principal-mobile-18-03-26.webp
 */
export function generateFileName(presetLabel: string, device: "desktop" | "mobile"): string {
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

  return `${slug}-${device}-${dateStr}.webp`;
}

/**
 * Crop an image using Canvas based on focal point and target dimensions.
 * Applies the same logic as CSS object-fit: cover + object-position.
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
    // Image is wider — crop horizontally
    srcH = imgH;
    srcW = imgH * targetAspect;
    srcX = (focalX / 100) * imgW - srcW / 2;
    srcY = 0;
  } else {
    // Image is taller — crop vertically
    srcW = imgW;
    srcH = imgW / targetAspect;
    srcX = 0;
    srcY = (focalY / 100) * imgH - srcH / 2;
  }

  // Clamp to image bounds
  srcX = Math.max(0, Math.min(imgW - srcW, srcX));
  srcY = Math.max(0, Math.min(imgH - srcH, srcY));

  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, target.width, target.height);
  return canvas;
}

/**
 * Export a canvas to a WebP blob, reducing quality if needed to meet maxKb.
 */
async function exportOptimized(canvas: HTMLCanvasElement, maxKb: number): Promise<Blob> {
  let quality = 0.82;
  const minQuality = 0.3;

  while (quality >= minQuality) {
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/webp", quality),
    );
    if (blob.size / 1024 <= maxKb || quality <= minQuality) {
      return blob;
    }
    quality -= 0.08;
  }

  // Final attempt at minimum quality
  return new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/webp", minQuality),
  );
}

/**
 * Load an image from a data URL.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Process an uploaded image into Desktop and Mobile variants.
 * Returns processed images with blobs, data URLs, filenames, and sizes.
 */
export async function processImage(
  imageSrc: string,
  preset: { label: string; desktop: PresetDimension; mobile: PresetDimension; maxWeightKb: number },
  focalX: number,
  focalY: number,
  onProgress?: (pct: number) => void,
): Promise<ProcessedImage[]> {
  onProgress?.(5);

  const img = await loadImage(imageSrc);
  onProgress?.(15);

  // Desktop
  const desktopCanvas = cropWithFocalPoint(img, preset.desktop, focalX, focalY);
  onProgress?.(35);

  const desktopBlob = await exportOptimized(desktopCanvas, preset.maxWeightKb);
  onProgress?.(55);

  // Mobile
  const mobileCanvas = cropWithFocalPoint(img, preset.mobile, focalX, focalY);
  onProgress?.(70);

  const mobileBlob = await exportOptimized(mobileCanvas, preset.maxWeightKb);
  onProgress?.(90);

  const results: ProcessedImage[] = [
    {
      blob: desktopBlob,
      dataUrl: URL.createObjectURL(desktopBlob),
      fileName: generateFileName(preset.label, "desktop"),
      sizeKb: Math.round(desktopBlob.size / 1024),
      width: preset.desktop.width,
      height: preset.desktop.height,
      device: "desktop",
    },
    {
      blob: mobileBlob,
      dataUrl: URL.createObjectURL(mobileBlob),
      fileName: generateFileName(preset.label, "mobile"),
      sizeKb: Math.round(mobileBlob.size / 1024),
      width: preset.mobile.width,
      height: preset.mobile.height,
      device: "mobile",
    },
  ];

  onProgress?.(100);
  return results;
}

/**
 * Download a single blob as a file.
 */
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
