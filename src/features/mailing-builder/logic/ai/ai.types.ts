// ── Tipos compartidos para el sistema AI SKU → imagen ────────────────────────

export type Brand = "jumbo" | "sisa";
export type BlockType = "hero" | "product" | "banner" | "text";
export type AIStyle = "auto" | "lifestyle" | "promo";
export type AIQuality = "fast" | "hd";

// ── ProductData ──────────────────────────────────────────────────────────────
// Estructura normalizada que devuelve la Edge Function ai-fetch-product.
// Es el contrato entre el backend VTEX y el frontend.

export interface ProductData {
  sku: string;
  brand: Brand;
  name: string;
  category: string | null;
  subcategory: string | null;
  price: number | null;
  originalPrice: number | null;
  discount: number | null;             // porcentaje (0-100) o null
  imageUrl: string | null;             // imagen catálogo — fallback si IA falla
  description: string | null;
  attributes: Record<string, string>;  // peso, volumen, unidad, etc.
}

// ── GeneratedImage ────────────────────────────────────────────────────────────
// Una variante de imagen generada por fal.ai.

export interface GeneratedImage {
  id: string;
  url: string;
  width: number;
  height: number;
  prompt: string;
  seed: number;
  variantIndex: number;
}

// ── GenerateOptions ───────────────────────────────────────────────────────────
// Parámetros que el usuario configura antes de generar.

export interface GenerateOptions {
  blockType: BlockType;
  style: AIStyle;
  quality: AIQuality;
  campaignId: string;
}

// ── BlockProps AI extension ───────────────────────────────────────────────────
// Campos que se añaden a cualquier BlockProps cuando se usa el sistema AI.
// Se mergeará con el tipo de props específico del bloque.

export interface AIBlockFields {
  // Trazabilidad de la generación
  aiGenerated?: boolean;
  aiImageUrl?: string;
  aiPrompt?: string;
  aiGenerationId?: string;   // ID del registro en ai_images
  aiJobId?: string;          // ID del registro en ai_generation_jobs

  // Datos del producto (para render y personalización)
  sku?: string;
  productName?: string;
  productPrice?: number | null;
  productOriginalPrice?: number | null;
  productDiscount?: number | null;
  productImageUrl?: string | null;   // imagen catálogo como fallback
  productBrand?: Brand;
  productCategory?: string | null;
  productAttributes?: Record<string, string>;
}

// ── FetchProductResponse / GenerateImageResponse (desde Edge Functions) ───────

export interface FetchProductResponse {
  data: ProductData;
  source: "cache" | "api";
}

export interface GenerateImageResponse {
  jobId: string;
  prompt: string;
  images: GeneratedImage[];
  model: string;
  durationMs: number;
}
