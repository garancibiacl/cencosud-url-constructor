import type { ProcessedImage } from "./image-processor";

const STORAGE_KEY = "aguapp-optimizer-history";
const MAX_ITEMS = 20;
const THUMB_SIZE = 120;

export interface HistoryEntry {
  id: string;
  timestamp: number;
  fileName: string;
  presetKey: string;
  presetLabel: string;
  brandName: string;
  focalPoint: { x: number; y: number };
  masterThumb: string; // base64 low-res
  desktopThumb: string;
  mobileThumb: string;
  desktopFileName: string;
  mobileFileName: string;
  desktopSizeKb: number;
  mobileSizeKb: number;
}

/** Downscale a data URL to a small base64 thumbnail */
function createThumbnail(src: string, maxDim: number = THUMB_SIZE): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/webp", 0.5));
    };
    img.onerror = () => resolve("");
    img.src = src;
  });
}

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ITEMS)));
}

export async function addHistoryEntry(
  masterImageSrc: string,
  results: ProcessedImage[],
  presetKey: string,
  presetLabel: string,
  focalPoint: { x: number; y: number },
  originalFileName: string,
): Promise<HistoryEntry> {
  const desktop = results.find((r) => r.device === "desktop") ?? results[0];
  const mobile = results.find((r) => r.device === "mobile");

  const [masterThumb, desktopThumb, mobileThumb] = await Promise.all([
    createThumbnail(masterImageSrc),
    desktop ? createThumbnail(desktop.dataUrl) : Promise.resolve(""),
    mobile ? createThumbnail(mobile.dataUrl) : Promise.resolve(""),
  ]);

  const brandName = presetLabel.split(" - ")[0] || presetLabel;

  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    fileName: originalFileName,
    presetKey,
    presetLabel,
    brandName,
    focalPoint,
    masterThumb,
    desktopThumb,
    mobileThumb,
    desktopFileName: desktop?.fileName || "",
    mobileFileName: mobile?.fileName || "",
    desktopSizeKb: desktop?.sizeKb || 0,
    mobileSizeKb: mobile?.sizeKb || 0,
  };

  const history = getHistory();
  history.unshift(entry);
  saveHistory(history);

  return entry;
}

export function removeHistoryEntry(id: string) {
  const history = getHistory().filter((e) => e.id !== id);
  saveHistory(history);
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
