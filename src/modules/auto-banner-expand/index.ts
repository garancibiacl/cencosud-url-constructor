/**
 * auto-banner-expand — public API
 *
 * Import from here, not from internal paths.
 *
 * Usage:
 *   import { AutoBannerExpand, useAutoExpandBanner, BANNER_PRESETS } from "@/modules/auto-banner-expand";
 */

// Component
export { AutoBannerExpand }   from "./components/AutoBannerExpand";
export { AISettingsModal }    from "./components/AISettingsModal";

// Hook
export { useAutoExpandBanner } from "./hooks/useAutoExpandBanner";

// Service helpers (for advanced use)
export {
  getStoredAPIKey,
  storeAPIKey,
  clearAPIKey,
  DEFAULT_PROMPT,
} from "./services/openaiImageEditService";

// Utilities (for advanced use)
export { analyzeExpansionNeeds, getImageDimensions, describeGaps } from "./utils/imageSizeUtils";
export { generateMaskBlob, getGapOverlayStyle }                     from "./utils/maskGenerator";
export { formatImageForAPI, cropResultToPreset }                     from "./utils/imageSquareFormatter";

// Types
export type {
  BannerPreset,
  ExpandStatus,
  ExpansionAnalysis,
  ExpandResult,
  UseAutoExpandBannerReturn,
} from "./types";

export { BANNER_PRESETS } from "./types";
