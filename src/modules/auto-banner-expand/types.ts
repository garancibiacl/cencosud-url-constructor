/**
 * Shared types for the Auto Banner Expand module.
 */

import { CENCOSUD_PRESETS } from "@/lib/image-presets";

export type ExpandStatus = "idle" | "loading" | "success" | "error";

/** Horizontal position of the main subject within the banner */
export type FocusPosition = "left" | "center" | "right";

// ── Presets ────────────────────────────────────────────────────────────────

export interface BannerPreset {
  id: string;
  label: string;
  width: number;
  height: number;
  maxWeightKb?: number;
  /** Category group for the selector (e.g. "Web y Retail", "Jumbo App") */
  category: string;
}

// ── Derive BANNER_PRESETS from CENCOSUD_PRESETS (single source of truth) ─────

const EXCLUDED_PRESET_KEYS = new Set(["PARIS_HOME", "JUMBO_OFERTA", "SANTA_ISABEL_GRILLA"]);

function buildBannerPresets(): BannerPreset[] {
  const result: BannerPreset[] = [];

  for (const [key, preset] of Object.entries(CENCOSUD_PRESETS)) {
    if (EXCLUDED_PRESET_KEYS.has(key)) continue;
    const category = preset.category ?? "Web y Retail";
    const densityTag = preset.densityLabel ? ` (${preset.densityLabel})` : "";

    if (preset.variants?.length) {
      // App-only preset — single output dimension
      const variant = preset.variants[0];
      result.push({
        id: `${key}_app`,
        label: `${preset.label}${densityTag}`,
        width: variant.dimension.width,
        height: variant.dimension.height,
        maxWeightKb: preset.maxWeightKb,
        category,
      });
    } else {
      // Desktop variant
      result.push({
        id: `${key}_desktop`,
        label: `${preset.label} — Desktop`,
        width: preset.desktop.width,
        height: preset.desktop.height,
        maxWeightKb: preset.maxWeightKb,
        category,
      });
      // Mobile variant (only if different from desktop)
      if (
        preset.mobile.width !== preset.desktop.width ||
        preset.mobile.height !== preset.desktop.height
      ) {
        result.push({
          id: `${key}_mobile`,
          label: `${preset.label} — Mobile`,
          width: preset.mobile.width,
          height: preset.mobile.height,
          maxWeightKb: preset.maxWeightKb,
          category,
        });
      }
    }
  }

  return result;
}

export const BANNER_PRESETS: BannerPreset[] = buildBannerPresets();

// ── Analysis ───────────────────────────────────────────────────────────────

/** Pixel dimensions of any image */
export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * Result of comparing an image against a preset.
 * All px values are in 1024×1024 working space.
 */
export interface ExpansionAnalysis {
  /** True if the image does not cover the full preset aspect */
  needsExpansion: boolean;
  /** Pixel gap on each side within the 1024-canvas */
  leftGap: number;
  rightGap: number;
  topGap: number;
  bottomGap: number;
  /** Scaled preset rect inside the 1024 canvas */
  scaledPresetW: number;
  scaledPresetH: number;
  /** Offset to center the preset in the 1024 canvas */
  offsetX: number;
  offsetY: number;
  /** Where the contained product image lands inside the 1024 canvas */
  drawX: number;
  drawY: number;
  drawW: number;
  drawH: number;
  /** Ratio of uncovered area (0 = perfect, 1 = totally different) */
  gapRatio: number;
}

// ── Service ────────────────────────────────────────────────────────────────

export interface OpenAIEditPayload {
  imageBlob: Blob;
  maskBlob: Blob;
  prompt: string;
  apiKey: string;
}

export interface OpenAIEditResult {
  b64: string;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export interface ExpandResult {
  /** JPEG dataURL of the AI-expanded image, cropped to preset */
  dataUrl: string;
  width: number;
  height: number;
}

export interface UseAutoExpandBannerReturn {
  /** Current process status */
  status: ExpandStatus;
  /** Human-readable progress message */
  statusMessage: string;
  /** Error message if status === "error" */
  errorMessage: string | null;
  /** Original uploaded image dataURL */
  originalDataUrl: string | null;
  /** AI-expanded result dataURL (available on success) */
  resultDataUrl: string | null;
  /** Analysis of how much expansion is needed */
  analysis: ExpansionAnalysis | null;
  /** Currently active preset */
  preset: BannerPreset;
  /** Set the active preset */
  setPreset: (preset: BannerPreset) => void;
  /** Horizontal focus position 0–100 (0 = full left, 50 = center, 100 = full right) */
  focusX: number;
  /** Set the horizontal focus position */
  setFocusX: (x: number) => void;
  /** Whether the image contains labels/seals/text elements to preserve */
  hasElements: boolean;
  /** Toggle preserve-elements mode */
  setHasElements: (v: boolean) => void;
  /** Free-text description of background materials/scene for the dynamic prompt */
  sceneDescription: string;
  setSceneDescription: (v: string) => void;
  /** Load an image from a File object */
  loadImage: (file: File) => void;
  /** Trigger the AI outpainting process */
  runExpansion: () => Promise<void>;
  /** Export the result as a JPEG file download */
  exportResult: () => void;
  /** Reset all state back to idle */
  reset: () => void;
}
