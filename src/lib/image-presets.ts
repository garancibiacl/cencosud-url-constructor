export interface PresetDimension {
  width: number;
  height: number;
  ratio: string;
}

export interface SafeZone {
  desktop: number; // px margin
  mobile: number;
}

export interface ReserveMargin {
  desktop: number;
  mobile: number;
}

export interface TextLimits {
  titleMax: number;
  paragraphMax: number;
}

export interface FocalPointTuning {
  xStep?: number;
  yStep?: number;
  helperText?: string;
}

export type PresetVariantId = "desktop" | "mobile" | "app";

export interface PresetVariant {
  id: PresetVariantId;
  label: string;
  dimension: PresetDimension;
}

export interface ImagePreset {
  label: string;
  desktop: PresetDimension;
  mobile: PresetDimension;
  maxWeightKb: number;
  /** Optional category used in the selector */
  category?: string;
  /** Informative density tag for selector and panel */
  densityLabel?: string;
  /** Output format override. Defaults to "jpg" if not set. */
  outputFormat?: "jpg";
  /** Explicit output variants. Falls back to desktop/mobile when omitted */
  variants?: PresetVariant[];
  /** Safe zone margins in px for preview overlays */
  safeZone?: SafeZone;
  /** Reserve margin inside the safe zone */
  reserveMargin?: ReserveMargin;
  /** Overlay style for preview guides */
  safeZoneMode?: "frame" | "lateral";
  /** Whether safe zones should be shown by default when the preset is selected */
  safeZoneDefaultVisible?: boolean;
  /** Character limits for text elements */
  textLimits?: TextLimits;
  /** Output DPI reference for technical specs */
  outputDpi?: number;
  /** Preset-specific focal point tuning */
  focalPointTuning?: FocalPointTuning;
  /** Technical note displayed in the panel */
  technicalNote?: string;
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
  HUINCHA_JUMBO_SISA: {
    label: "Huincha (Jumbo/SISA)",
    desktop: { width: 2088, height: 198, ratio: "348/33" },
    mobile: { width: 1179, height: 474, ratio: "393/158" },
    maxWeightKb: 200,
    outputFormat: "jpg",
    outputDpi: 72,
    safeZone: { desktop: 48, mobile: 48 },
    focalPointTuning: {
      xStep: 1,
      yStep: 0.5,
      helperText: "El formato Desktop es muy bajo. Ajusta el eje vertical con movimientos finos para no cortar textos.",
    },
  },
  BANNER_PRINCIPAL_JUMBO_SISA: {
    label: "Banner Principal (Jumbo/SISA)",
    desktop: { width: 1920, height: 364, ratio: "480/91" },
    mobile: { width: 700, height: 330, ratio: "70/33" },
    maxWeightKb: 200,
    outputFormat: "jpg",
    safeZone: { desktop: 64, mobile: 32 },
    reserveMargin: { desktop: 16, mobile: 16 },
    safeZoneMode: "lateral",
    safeZoneDefaultVisible: true,
    technicalNote: "Margen lateral recomendado para correcta rasterización y reserva de seguridad de 16 px",
    focalPointTuning: {
      xStep: 0.5,
      yStep: 1,
      helperText: "Centra el hero dentro de la zona segura, respetando la reserva interna de 16 px para evitar cortes visuales.",
    },
  },
  JUMBO_APP_BANNER_PRINCIPAL: {
    label: "Banner Principal App",
    category: "Jumbo App",
    densityLabel: "Medida 3X",
    desktop: { width: 1032, height: 399, ratio: "344/133" },
    mobile: { width: 1032, height: 399, ratio: "344/133" },
    variants: [
      {
        id: "app",
        label: "App",
        dimension: { width: 1032, height: 399, ratio: "344/133" },
      },
    ],
    maxWeightKb: 200,
    outputFormat: "jpg",
    technicalNote: "Exportación App en medida 3X para pantallas de alta densidad, priorizando nitidez de textos y límite estricto de 200 KB.",
  },
  JUMBO_APP_BANNER_DOBLE: {
    label: "Banner Doble App",
    category: "Jumbo App",
    densityLabel: "Medida 2X",
    desktop: { width: 332, height: 332, ratio: "1/1" },
    mobile: { width: 332, height: 332, ratio: "1/1" },
    variants: [
      {
        id: "app",
        label: "App",
        dimension: { width: 332, height: 332, ratio: "1/1" },
      },
    ],
    maxWeightKb: 200,
    outputFormat: "jpg",
    technicalNote: "Exportación App en medida 2X para mantener nitidez superior en superficies cuadradas de alta densidad.",
  },
  JUMBO_APP_BANNER_HUINCHA: {
    label: "Banner Huincha App",
    category: "Jumbo App",
    densityLabel: "Medida 2X",
    desktop: { width: 686, height: 120, ratio: "343/60" },
    mobile: { width: 686, height: 120, ratio: "343/60" },
    variants: [
      {
        id: "app",
        label: "App",
        dimension: { width: 686, height: 120, ratio: "343/60" },
      },
    ],
    maxWeightKb: 200,
    outputFormat: "jpg",
    focalPointTuning: {
      xStep: 0.5,
      yStep: 0.5,
      helperText: "La huincha App es muy delgada. Ajusta el punto focal con pasos finos para mantener el hero y los textos nítidos dentro del recorte.",
    },
    technicalNote: "Exportación App en medida 2X para huinchas de alta densidad con foco sincronizado y nitidez reforzada.",
  },
  SISA_APP_BANNER_PRINCIPAL: {
    label: "Banner Principal App",
    category: "SISA App",
    densityLabel: "Medida 3X",
    desktop: { width: 1032, height: 399, ratio: "344/133" },
    mobile: { width: 1032, height: 399, ratio: "344/133" },
    variants: [
      {
        id: "app",
        label: "App",
        dimension: { width: 1032, height: 399, ratio: "344/133" },
      },
    ],
    maxWeightKb: 200,
    outputFormat: "jpg",
    technicalNote: "Exportación SISA App en medida 3X con remuestreo optimizado para textos nítidos, salida JPG y tope estricto de 200 KB.",
  },
  SISA_APP_SHORTCUTS: {
    label: "Shortcuts App",
    category: "SISA App",
    densityLabel: "Medida 2X",
    desktop: { width: 100, height: 100, ratio: "1/1" },
    mobile: { width: 100, height: 100, ratio: "1/1" },
    variants: [
      {
        id: "app",
        label: "App",
        dimension: { width: 100, height: 100, ratio: "1/1" },
      },
    ],
    maxWeightKb: 200,
    outputFormat: "jpg",
    focalPointTuning: {
      xStep: 0.5,
      yStep: 0.5,
      helperText: "Shortcuts requiere un encuadre perfectamente centrado. Ajusta el foco con pasos finos para iconos o productos en formato cuadrado.",
    },
    technicalNote: "Formato Shortcuts en medida 2X con foco sincronizado al centro para categorías visuales precisas y sin bordes dentados.",
  },
  SISA_APP_BANNER_SECUNDARIO: {
    label: "Banner Secundario App",
    category: "SISA App",
    densityLabel: "Medida 3X",
    desktop: { width: 1032, height: 399, ratio: "344/133" },
    mobile: { width: 1032, height: 399, ratio: "344/133" },
    variants: [
      {
        id: "app",
        label: "App",
        dimension: { width: 1032, height: 399, ratio: "344/133" },
      },
    ],
    maxWeightKb: 200,
    outputFormat: "jpg",
    technicalNote: "Exportación SISA App en medida 3X para banners secundarios con remuestreo cuidado y peso máximo de 200 KB.",
  },
  SISA_APP_BANNER_HUINCHA: {
    label: "Banner Huincha App",
    category: "SISA App",
    densityLabel: "Medida 2X",
    desktop: { width: 686, height: 120, ratio: "343/60" },
    mobile: { width: 686, height: 120, ratio: "343/60" },
    variants: [
      {
        id: "app",
        label: "App",
        dimension: { width: 686, height: 120, ratio: "343/60" },
      },
    ],
    maxWeightKb: 200,
    outputFormat: "jpg",
    focalPointTuning: {
      xStep: 0.5,
      yStep: 0.5,
      helperText: "La huincha SISA App es muy delgada. Usa microajustes de foco para preservar hero y textos en pantallas de alta densidad.",
    },
    technicalNote: "Huincha SISA App en medida 2X con sincronización fina del punto focal y salida JPG de hasta 200 KB.",
  },
  SISA_APP_BANNER_DOBLE: {
    label: "Banner Doble App",
    category: "SISA App",
    densityLabel: "Medida 2X",
    desktop: { width: 332, height: 332, ratio: "1/1" },
    mobile: { width: 332, height: 332, ratio: "1/1" },
    variants: [
      {
        id: "app",
        label: "App",
        dimension: { width: 332, height: 332, ratio: "1/1" },
      },
    ],
    maxWeightKb: 200,
    outputFormat: "jpg",
    technicalNote: "Banner doble SISA App en medida 2X para superficies cuadradas con máxima nitidez y compresión controlada.",
  },
};

export function getPresetVariants(preset: ImagePreset): PresetVariant[] {
  if (preset.variants?.length) {
    return preset.variants;
  }

  return [
    { id: "desktop", label: "Desktop", dimension: preset.desktop },
    { id: "mobile", label: "Mobile", dimension: preset.mobile },
  ];
}
