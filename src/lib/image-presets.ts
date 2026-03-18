export interface PresetDimension {
  width: number;
  height: number;
  ratio: string;
}

export interface SafeZone {
  desktop: number; // px margin
  mobile: number;
}

export interface TextLimits {
  titleMax: number;
  paragraphMax: number;
}

export interface ImagePreset {
  label: string;
  desktop: PresetDimension;
  mobile: PresetDimension;
  maxWeightKb: number;
  /** Output format override. Defaults to "webp" if not set. */
  outputFormat?: "webp" | "jpg";
  /** Safe zone margins in px for preview overlays */
  safeZone?: SafeZone;
  /** Character limits for text elements */
  textLimits?: TextLimits;
}

export const CENCOSUD_PRESETS: Record<string, ImagePreset> = {
  PARIS_HOME: {
    label: "Paris - Home Principal",
    desktop: { width: 1920, height: 450, ratio: "64/15" },
    mobile: { width: 640, height: 800, ratio: "4/5" },
    maxWeightKb: 250,
  },
  JUMBO_OFERTA: {
    label: "Jumbo - Banner Oferta",
    desktop: { width: 1280, height: 300, ratio: "64/15" },
    mobile: { width: 600, height: 600, ratio: "1/1" },
    maxWeightKb: 150,
  },
  SANTA_ISABEL_GRILLA: {
    label: "Santa Isabel - Grilla",
    desktop: { width: 1200, height: 400, ratio: "3/1" },
    mobile: { width: 500, height: 500, ratio: "1/1" },
    maxWeightKb: 100,
  },
  CARRUSEL_OFERTAS: {
    label: "Carrusel Ofertas (Jumbo/SISA)",
    desktop: { width: 652, height: 352, ratio: "163/88" },
    mobile: { width: 440, height: 280, ratio: "11/7" },
    maxWeightKb: 200,
    outputFormat: "jpg",
    safeZone: { desktop: 56, mobile: 48 },
    textLimits: { titleMax: 22, paragraphMax: 18 },
  },
};
