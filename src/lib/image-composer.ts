import type { ImagePreset, PresetVariant } from "./image-presets";

export type SmartFillMode = "mirror-blur" | "solid";
export type FitMode = "cover" | "contain";
export type CompositionLayerId = "background" | "master" | "product" | "price" | "badge" | "warning";

export interface CompositionOptions {
  backgroundSrc?: string | null;
  productSrc?: string | null;
  smartFillMode: SmartFillMode;
  fitMode: FitMode;
  productScale: number;
  productOffsetX: number;
  productOffsetY: number;
  layerOrder: CompositionLayerId[];
  fontFamily: string;
  showUrgencyBadge: boolean;
  urgencyText: string;
  showAlcoholWarning: boolean;
  alcoholWarningText: string;
  showPriceBlock: boolean;
  priceText: string;
  offerText: string;
  showSiteChromePreview: boolean;
}

const DEFAULT_TOP_BOTTOM_SAFE = 24;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  width: number,
  height: number,
  focalX: number,
  focalY: number,
) {
  const source = img as HTMLImageElement;
  const imgW = source.width || source.naturalWidth;
  const imgH = source.height || source.naturalHeight;
  const targetAspect = width / height;
  const imgAspect = imgW / imgH;

  let srcW: number;
  let srcH: number;
  let srcX: number;
  let srcY: number;

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
  ctx.drawImage(source, srcX, srcY, srcW, srcH, 0, 0, width, height);
}

function drawContain(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  width: number,
  height: number,
  padding: number = 0,
) {
  const source = img as HTMLImageElement;
  const imgW = source.width || source.naturalWidth;
  const imgH = source.height || source.naturalHeight;
  const availableW = width - padding * 2;
  const availableH = height - padding * 2;
  const scale = Math.min(availableW / imgW, availableH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const drawX = (width - drawW) / 2;
  const drawY = (height - drawH) / 2;

  ctx.drawImage(source, drawX, drawY, drawW, drawH);
}

function sampleEdgeColor(img: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  const sampleSize = 24;
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "rgb(245,245,245)";

  ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
  const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);

  let r = 0;
  let g = 0;
  let b = 0;
  let total = 0;

  for (let y = 0; y < sampleSize; y++) {
    for (let x = 0; x < sampleSize; x++) {
      const isEdge = x === 0 || y === 0 || x === sampleSize - 1 || y === sampleSize - 1;
      if (!isEdge) continue;
      const idx = (y * sampleSize + x) * 4;
      r += data[idx];
      g += data[idx + 1];
      b += data[idx + 2];
      total += 1;
    }
  }

  if (total === 0) return "rgb(245,245,245)";
  return `rgb(${Math.round(r / total)}, ${Math.round(g / total)}, ${Math.round(b / total)})`;
}

function getSafeBox(preset: ImagePreset, variant: PresetVariant) {
  const lateralSafe = variant.id === "mobile"
    ? preset.safeZone?.mobile ?? 32
    : preset.safeZone?.desktop ?? 32;

  return {
    left: lateralSafe,
    right: lateralSafe,
    top: DEFAULT_TOP_BOTTOM_SAFE,
    bottom: DEFAULT_TOP_BOTTOM_SAFE,
  };
}

export function getProductPlacement(params: {
  canvasWidth: number;
  canvasHeight: number;
  productWidth: number;
  productHeight: number;
  productScale: number;
  productOffsetX: number;
  productOffsetY: number;
  preset: ImagePreset;
  variant: PresetVariant;
}) {
  const {
    canvasWidth, canvasHeight, productWidth, productHeight, productScale, productOffsetX, productOffsetY, preset, variant,
  } = params;
  const safeBox = getSafeBox(preset, variant);
  const maxProductWidth = canvasWidth * productScale;
  const maxProductHeight = canvasHeight * Math.min(0.78, productScale + 0.18);
  const scale = Math.min(maxProductWidth / productWidth, maxProductHeight / productHeight);
  const drawW = productWidth * scale;
  const drawH = productHeight * scale;
  const baseX = canvasWidth - safeBox.right - drawW;
  const baseY = canvasHeight - safeBox.bottom - drawH;

  return {
    x: baseX + (productOffsetX / 100) * canvasWidth,
    y: baseY + (productOffsetY / 100) * canvasHeight,
    width: drawW,
    height: drawH,
    safeBox,
  };
}

export function isPlacementOutsideSafeZone(placement: ReturnType<typeof getProductPlacement>, canvasWidth: number, canvasHeight: number) {
  return (
    placement.x < placement.safeBox.left ||
    placement.y < placement.safeBox.top ||
    placement.x + placement.width > canvasWidth - placement.safeBox.right ||
    placement.y + placement.height > canvasHeight - placement.safeBox.bottom
  );
}

function drawUrgencyBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  safeBox: ReturnType<typeof getSafeBox>,
  fontFamily: string,
) {
  const paddingX = 18;
  const paddingY = 10;
  ctx.save();
  ctx.font = `700 22px ${fontFamily}`;
  const textWidth = ctx.measureText(text).width;
  const badgeWidth = textWidth + paddingX * 2;
  const badgeHeight = 48;
  const x = safeBox.left;
  const y = safeBox.top;

  ctx.fillStyle = "#E11D48";
  ctx.beginPath();
  ctx.roundRect(x, y, Math.min(badgeWidth, width - safeBox.right - x), badgeHeight, 16);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + paddingX, y + badgeHeight / 2 + 1);
  ctx.restore();
}

function drawAlcoholWarning(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
  safeBox: ReturnType<typeof getSafeBox>,
  fontFamily: string,
) {
  ctx.save();
  ctx.font = `700 16px ${fontFamily}`;
  const warningWidth = Math.min(width - safeBox.left - safeBox.right, ctx.measureText(text).width + 28);
  const warningHeight = 36;
  const x = safeBox.left;
  const y = height - safeBox.bottom - warningHeight;

  ctx.fillStyle = "rgba(17,24,39,0.86)";
  ctx.beginPath();
  ctx.roundRect(x, y, warningWidth, warningHeight, 12);
  ctx.fill();

  ctx.fillStyle = "#F9FAFB";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 14, y + warningHeight / 2 + 1);
  ctx.restore();
}

function drawPriceBlock(
  ctx: CanvasRenderingContext2D,
  variant: PresetVariant,
  priceText: string,
  offerText: string,
  width: number,
  height: number,
  safeBox: ReturnType<typeof getSafeBox>,
  fontFamily: string,
) {
  const isCentered = variant.id === "mobile" || variant.id === "app" || width < 900;

  ctx.save();
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "rgba(17,24,39,0.22)";
  ctx.lineWidth = 6;

  const offerFontSize = isCentered ? 26 : 24;
  const priceFontSize = isCentered ? 58 : 64;
  ctx.font = `700 ${offerFontSize}px ${fontFamily}`;
  const offerWidth = ctx.measureText(offerText).width;
  ctx.font = `800 ${priceFontSize}px ${fontFamily}`;
  const priceWidth = ctx.measureText(priceText).width;

  const blockWidth = Math.max(offerWidth, priceWidth);
  const x = isCentered
    ? (width - blockWidth) / 2
    : width - safeBox.right - blockWidth;
  const offerY = isCentered ? height * 0.56 : height * 0.42;
  const priceY = offerY + priceFontSize;

  ctx.font = `700 ${offerFontSize}px ${fontFamily}`;
  ctx.strokeText(offerText, x, offerY);
  ctx.fillText(offerText, x, offerY);

  ctx.font = `800 ${priceFontSize}px ${fontFamily}`;
  ctx.strokeText(priceText, x, priceY);
  ctx.fillText(priceText, x, priceY);
  ctx.restore();
}

export async function composeVariantCanvas(params: {
  masterSrc: string;
  preset: ImagePreset;
  variant: PresetVariant;
  focalX: number;
  focalY: number;
  composition: CompositionOptions;
}) {
  const { masterSrc, preset, variant, focalX, focalY, composition } = params;
  const masterImage = await loadImage(masterSrc);
  const backgroundImage = composition.backgroundSrc ? await loadImage(composition.backgroundSrc) : null;
  const productImage = composition.productSrc ? await loadImage(composition.productSrc) : null;

  const canvas = document.createElement("canvas");
  canvas.width = variant.dimension.width;
  canvas.height = variant.dimension.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo crear el contexto de composición.");
  }

  const safeBox = getSafeBox(preset, variant);
  const backgroundSource = backgroundImage ?? masterImage;
  const fallbackColor = sampleEdgeColor(backgroundSource);
  const drawLayer = (layerId: CompositionLayerId) => {
    switch (layerId) {
      case "background":
        ctx.fillStyle = fallbackColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (composition.smartFillMode === "mirror-blur") {
          ctx.save();
          ctx.filter = "blur(28px) saturate(1.08)";
          drawCover(ctx, backgroundSource, canvas.width, canvas.height, focalX, focalY);
          ctx.restore();

          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (backgroundImage) {
          drawCover(ctx, backgroundImage, canvas.width, canvas.height, 50, 50);
        }
        break;
      case "master":
        if (!backgroundImage || composition.fitMode === "contain") {
          const padding = Math.max(safeBox.left, safeBox.right) * 0.35;
          drawContain(ctx, masterImage, canvas.width, canvas.height, padding);
        } else {
          drawCover(ctx, masterImage, canvas.width, canvas.height, focalX, focalY);
        }
        break;
      case "product":
        if (!productImage) break;
        {
          const placement = getProductPlacement({
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            productWidth: productImage.naturalWidth,
            productHeight: productImage.naturalHeight,
            productScale: composition.productScale,
            productOffsetX: composition.productOffsetX,
            productOffsetY: composition.productOffsetY,
            preset,
            variant,
          });
          ctx.drawImage(productImage, placement.x, placement.y, placement.width, placement.height);
        }
        break;
      case "badge":
        if (composition.showUrgencyBadge && composition.urgencyText.trim()) {
          drawUrgencyBadge(ctx, composition.urgencyText.trim(), canvas.width, safeBox, composition.fontFamily);
        }
        break;
      case "warning":
        if (composition.showAlcoholWarning && composition.alcoholWarningText.trim()) {
          drawAlcoholWarning(
            ctx,
            composition.alcoholWarningText.trim(),
            canvas.width,
            canvas.height,
            safeBox,
            composition.fontFamily,
          );
        }
        break;
      case "price":
        if (composition.showPriceBlock && (composition.priceText.trim() || composition.offerText.trim())) {
          drawPriceBlock(
            ctx,
            variant,
            composition.priceText.trim() || "$0",
            composition.offerText.trim() || "Oferta destacada",
            canvas.width,
            canvas.height,
            safeBox,
            composition.fontFamily,
          );
        }
        break;
    }
  };

  composition.layerOrder.forEach(drawLayer);

  return canvas;
}
