/**
 * OpenAI Generative Fill (Outpainting) for Cencosud banners.
 *
 * Uses the DALL-E 2 images/edits endpoint to extend product photos
 * into wide banner formats, filling empty space with AI-generated
 * background that matches the original image's textures and lighting.
 */

const LS_KEY = "cencosud_openai_api_key";

// DALL-E 2 only accepts: 256x256, 512x512, or 1024x1024
const API_SIZE = 1024;

export function getOpenAIKey(): string {
  return localStorage.getItem(LS_KEY) ?? "";
}

export function saveOpenAIKey(key: string): void {
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem(LS_KEY, trimmed);
  } else {
    localStorage.removeItem(LS_KEY);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Error al convertir canvas a PNG."));
    }, "image/png");
  });
}

/**
 * Determines how much of the banner is uncovered by the source image.
 * Returns a ratio 0–1 where 0 = perfect fit, 1 = completely different aspect.
 */
export function getOutpaintingNeed(
  imgWidth: number,
  imgHeight: number,
  presetWidth: number,
  presetHeight: number,
): number {
  const imgAspect = imgWidth / imgHeight;
  const presetAspect = presetWidth / presetHeight;
  return Math.abs(imgAspect - presetAspect) / Math.max(imgAspect, presetAspect);
}

export interface OutpaintParams {
  /** dataURL of the original image */
  imageSrc: string;
  /** Target banner width (preset desktop or variant dimension) */
  presetWidth: number;
  /** Target banner height */
  presetHeight: number;
  /** Optional custom prompt */
  prompt?: string;
  apiKey: string;
  onProgress?: (msg: string) => void;
}

export interface OutpaintResult {
  /** JPEG dataURL of the outpainted image, cropped to preset dimensions */
  dataUrl: string;
  /** The actual pixel dimensions of the returned image */
  width: number;
  height: number;
}

/**
 * Main outpainting function:
 * 1. Creates a 1024×1024 image canvas with the product contained in the banner area
 * 2. Generates a matching mask (transparent = fill, opaque = keep)
 * 3. Calls OpenAI DALL-E 2 images/edits
 * 4. Crops result to banner aspect and returns a JPEG dataURL
 */
export async function generateOutpaint({
  imageSrc,
  presetWidth,
  presetHeight,
  prompt,
  apiKey,
  onProgress,
}: OutpaintParams): Promise<OutpaintResult> {
  if (!apiKey) throw new Error("API Key de OpenAI requerida.");

  onProgress?.("Cargando imagen original…");
  const originalImg = await loadImage(imageSrc);
  const imgW = originalImg.naturalWidth;
  const imgH = originalImg.naturalHeight;

  const imgAspect = imgW / imgH;
  const presetAspect = presetWidth / presetHeight;

  if (Math.abs(imgAspect - presetAspect) < 0.03) {
    throw new Error(
      "La imagen ya tiene el aspecto correcto para este formato. No se necesita Relleno Generativo.",
    );
  }

  onProgress?.("Preparando canvas y máscara…");

  // Scale the preset so it fits inside the API_SIZE square
  const scale = Math.min(API_SIZE / presetWidth, API_SIZE / presetHeight);
  const scaledW = Math.round(presetWidth * scale);
  const scaledH = Math.round(presetHeight * scale);
  const offsetX = Math.floor((API_SIZE - scaledW) / 2);
  const offsetY = Math.floor((API_SIZE - scaledH) / 2);

  // Where the product image lands (contain within the scaled preset rect)
  const containScale = Math.min(scaledW / imgW, scaledH / imgH);
  const drawW = Math.round(imgW * containScale);
  const drawH = Math.round(imgH * containScale);
  const drawX = offsetX + Math.floor((scaledW - drawW) / 2);
  const drawY = offsetY + Math.floor((scaledH - drawH) / 2);

  // ── Image canvas ──────────────────────────────────────────────
  // White background + product centered inside the preset area.
  // Areas outside the preset rect have white fill (they get cropped out later).
  const imgCanvas = document.createElement("canvas");
  imgCanvas.width = API_SIZE;
  imgCanvas.height = API_SIZE;
  const imgCtx = imgCanvas.getContext("2d")!;
  imgCtx.fillStyle = "#FFFFFF";
  imgCtx.fillRect(0, 0, API_SIZE, API_SIZE);
  imgCtx.drawImage(originalImg, drawX, drawY, drawW, drawH);

  // ── Mask canvas ───────────────────────────────────────────────
  // Transparent = DALL-E fills; Opaque = keep original pixel.
  // We mark the product rect as opaque and the rest as transparent.
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = API_SIZE;
  maskCanvas.height = API_SIZE;
  const maskCtx = maskCanvas.getContext("2d")!;
  // Start fully transparent (everything to be filled by default)
  maskCtx.clearRect(0, 0, API_SIZE, API_SIZE);
  // Mark product area as opaque (keep)
  maskCtx.fillStyle = "rgba(0,0,0,1)";
  maskCtx.fillRect(drawX, drawY, drawW, drawH);

  onProgress?.("Convirtiendo a PNG…");
  const imageBlob = await canvasToPngBlob(imgCanvas);
  const maskBlob = await canvasToPngBlob(maskCanvas);

  // Validate 4 MB limit
  const MAX_BYTES = 4 * 1024 * 1024;
  if (imageBlob.size > MAX_BYTES) {
    throw new Error(
      `La imagen es demasiado grande para la API (${Math.round(imageBlob.size / 1024)} KB). Máximo: 4096 KB.`,
    );
  }

  onProgress?.("Enviando a OpenAI DALL-E 2…");

  const finalPrompt =
    prompt ??
    "Extend the background textures, lighting, gradients, and patterns of this product photo to perfectly fill the empty spaces of a widescreen retail banner. Maintain a professional retail aesthetic, matching the existing colors and style seamlessly.";

  const formData = new FormData();
  formData.append("image", imageBlob, "image.png");
  formData.append("mask", maskBlob, "mask.png");
  formData.append("prompt", finalPrompt);
  formData.append("n", "1");
  formData.append("size", `${API_SIZE}x${API_SIZE}`);
  formData.append("response_format", "b64_json");
  formData.append("model", "dall-e-2");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    let errMsg = response.statusText;
    try {
      const errData = await response.json();
      errMsg = errData?.error?.message ?? errMsg;
    } catch {
      // ignore
    }
    throw new Error(`OpenAI API error ${response.status}: ${errMsg}`);
  }

  const data = await response.json();
  const b64 = data?.data?.[0]?.b64_json as string | undefined;
  if (!b64) throw new Error("La API de OpenAI no devolvió imagen.");

  onProgress?.("Recortando al formato del preset…");

  // Load the result and crop to the scaled preset area
  const resultImg = await loadImage(`data:image/png;base64,${b64}`);

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = scaledW;
  finalCanvas.height = scaledH;
  const finalCtx = finalCanvas.getContext("2d")!;
  finalCtx.drawImage(resultImg, offsetX, offsetY, scaledW, scaledH, 0, 0, scaledW, scaledH);

  const dataUrl = finalCanvas.toDataURL("image/jpeg", 0.92);
  return { dataUrl, width: scaledW, height: scaledH };
}
