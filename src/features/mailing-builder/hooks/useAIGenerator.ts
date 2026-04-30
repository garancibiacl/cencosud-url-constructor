/**
 * useAIGenerator
 *
 * Hook que orquesta el flujo completo:
 *   SKU input → fetch product → generate image → apply to block
 *
 * Características:
 * - Cancelación de requests en vuelo con AbortController
 * - Retry automático x2 en fallos de red (no en errores 4xx)
 * - Fallback a imageUrl del catálogo si falla la IA
 * - Estado de error granular (product vs image)
 */

import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  Brand,
  FetchProductResponse,
  GenerateImageResponse,
  GenerateOptions,
  GeneratedImage,
  ProductData,
} from "../logic/ai/ai.types";

// ── Tipos de error granular ───────────────────────────────────────────────────

export type AIErrorKind =
  | "product_not_found"
  | "product_fetch_failed"
  | "image_generation_failed"
  | "rate_limit"
  | "auth"
  | "network"
  | "unknown";

export interface AIError {
  kind: AIErrorKind;
  message: string;
}

export interface UseAIGeneratorReturn {
  // Estado
  isLoadingProduct: boolean;
  isGeneratingImage: boolean;
  productData: ProductData | null;
  generatedImages: GeneratedImage[];
  selectedImageUrl: string | null;
  error: AIError | null;

  // Acciones
  fetchProduct: (sku: string, brand: Brand) => Promise<void>;
  generateImage: (options: GenerateOptions) => Promise<void>;
  selectVariant: (imageUrl: string) => void;
  reset: () => void;
}

// ── Configuración de retry ────────────────────────────────────────────────────

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

// Devuelve true si el error es retriable (no es un error de lógica del servidor)
function isRetriable(status: number): boolean {
  return status === 0 || status >= 500; // network error o 5xx
}

// ── Llamada a Edge Function con retry y AbortController ──────────────────────

async function callEdgeFunction<T>(
  fnName: string,
  body: unknown,
  signal: AbortSignal,
  retries = MAX_RETRIES,
): Promise<T> {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;
  if (!token) {
    throw Object.assign(new Error("No autenticado"), { kind: "auth" as AIErrorKind, status: 401 });
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const url = `${supabaseUrl}/functions/v1/${fnName}`;

  let lastError: Error & { kind?: AIErrorKind; status?: number } = new Error("Unknown");

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal.aborted) {
      throw Object.assign(new Error("Cancelado"), { kind: "unknown" as AIErrorKind });
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let errMsg = `Error ${res.status}`;
        try {
          const errBody = await res.json() as { error?: string };
          errMsg = errBody.error ?? errMsg;
        } catch {
          // ignore parse error
        }

        const kind: AIErrorKind =
          res.status === 401 ? "auth" :
          res.status === 429 ? "rate_limit" :
          res.status === 404 ? "product_not_found" :
          res.status >= 500  ? "unknown" :
          "unknown";

        const err = Object.assign(new Error(errMsg), { kind, status: res.status });

        if (!isRetriable(res.status)) throw err;
        lastError = err;
      } else {
        return await res.json() as T;
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        throw Object.assign(new Error("Cancelado"), { kind: "unknown" as AIErrorKind });
      }
      const typedErr = err as Error & { kind?: AIErrorKind; status?: number };
      if (typedErr.kind && !isRetriable(typedErr.status ?? 0)) throw err;
      lastError = typedErr;
    }

    if (attempt < retries) {
      await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw lastError;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAIGenerator(): UseAIGeneratorReturn {
  const [isLoadingProduct, setIsLoadingProduct]   = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [productData, setProductData]             = useState<ProductData | null>(null);
  const [generatedImages, setGeneratedImages]     = useState<GeneratedImage[]>([]);
  const [selectedImageUrl, setSelectedImageUrl]   = useState<string | null>(null);
  const [error, setError]                         = useState<AIError | null>(null);

  // Un AbortController por tipo de operación para cancelarlas independientemente
  const productAbortRef = useRef<AbortController | null>(null);
  const imageAbortRef   = useRef<AbortController | null>(null);

  // ── fetchProduct ───────────────────────────────────────────────────────────

  const fetchProduct = useCallback(async (sku: string, brand: Brand) => {
    // Sanitizar SKU en el cliente también (defensa en profundidad)
    const cleanSku = sku.trim().replace(/[^a-zA-Z0-9]/g, "");
    if (!cleanSku) {
      setError({ kind: "product_fetch_failed", message: "SKU inválido" });
      return;
    }

    // Cancelar fetch anterior si existe
    productAbortRef.current?.abort();
    const controller = new AbortController();
    productAbortRef.current = controller;

    setIsLoadingProduct(true);
    setError(null);
    setProductData(null);
    setGeneratedImages([]);
    setSelectedImageUrl(null);

    try {
      const res = await callEdgeFunction<FetchProductResponse>(
        "ai-fetch-product",
        { sku: cleanSku, brand },
        controller.signal,
      );
      setProductData(res.data);
    } catch (err) {
      const typedErr = err as Error & { kind?: AIErrorKind };
      if (typedErr.name === "AbortError" || typedErr.message === "Cancelado") return;

      const kind: AIErrorKind = typedErr.kind ?? "product_fetch_failed";
      const message =
        kind === "product_not_found"
          ? `No se encontró el SKU ${cleanSku} en ${brand === "jumbo" ? "Jumbo" : "Santa Isabel"}.`
          : kind === "rate_limit"
          ? "Límite de consultas alcanzado. Intenta en unos minutos."
          : kind === "auth"
          ? "Sesión expirada. Recarga la página."
          : typedErr.message || "Error al buscar el producto. Verifica el SKU.";

      setError({ kind, message });
    } finally {
      setIsLoadingProduct(false);
    }
  }, []);

  // ── generateImage ──────────────────────────────────────────────────────────

  const generateImage = useCallback(async (options: GenerateOptions) => {
    if (!productData) {
      setError({ kind: "unknown", message: "Primero busca un producto." });
      return;
    }

    // Cancelar generación anterior si existe
    imageAbortRef.current?.abort();
    const controller = new AbortController();
    imageAbortRef.current = controller;

    setIsGeneratingImage(true);
    setError(null);

    try {
      const res = await callEdgeFunction<GenerateImageResponse>(
        "ai-generate-image",
        {
          productData,
          blockType:  options.blockType,
          style:      options.style,
          campaignId: options.campaignId,
          quality:    options.quality,
        },
        controller.signal,
        1, // 1 retry para generate-image (la operación es costosa)
      );

      setGeneratedImages(res.images);

      // Auto-seleccionar la primera variante
      if (res.images.length > 0) {
        setSelectedImageUrl(res.images[0].url);
      }
    } catch (err) {
      const typedErr = err as Error & { kind?: AIErrorKind };
      if (typedErr.name === "AbortError" || typedErr.message === "Cancelado") return;

      const kind: AIErrorKind = typedErr.kind ?? "image_generation_failed";
      const message =
        kind === "rate_limit"
          ? "Límite de generaciones alcanzado (10 por hora)."
          : kind === "auth"
          ? "Sesión expirada. Recarga la página."
          : "Error al generar la imagen. Puedes usar la imagen del catálogo.";

      setError({ kind, message });

      // Fallback automático: si hay imagen de catálogo, usarla como selección
      if (productData.imageUrl && kind !== "rate_limit" && kind !== "auth") {
        setSelectedImageUrl(productData.imageUrl);
      }
    } finally {
      setIsGeneratingImage(false);
    }
  }, [productData]);

  // ── selectVariant ──────────────────────────────────────────────────────────

  const selectVariant = useCallback((imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
  }, []);

  // ── reset ──────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    productAbortRef.current?.abort();
    imageAbortRef.current?.abort();
    setIsLoadingProduct(false);
    setIsGeneratingImage(false);
    setProductData(null);
    setGeneratedImages([]);
    setSelectedImageUrl(null);
    setError(null);
  }, []);

  return {
    isLoadingProduct,
    isGeneratingImage,
    productData,
    generatedImages,
    selectedImageUrl,
    error,
    fetchProduct,
    generateImage,
    selectVariant,
    reset,
  };
}
