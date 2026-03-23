/**
 * useAutoExpandBanner.ts
 *
 * Core hook that orchestrates the full Auto Banner Expand pipeline:
 *
 *  loadImage → analyzeExpansionNeeds → runExpansion →
 *    formatImageForAPI + generateMaskBlob →
 *    callOpenAIImageEdit → cropResultToPreset → resultDataUrl
 *
 * State machine:
 *   idle → loading → success | error → idle (via reset)
 */

import { useState, useCallback } from "react";

import type {
  BannerPreset,
  ExpandStatus,
  ExpansionAnalysis,
  UseAutoExpandBannerReturn,
} from "../types";
import { BANNER_PRESETS } from "../types";

import { getImageDimensions, analyzeExpansionNeeds } from "../utils/imageSizeUtils";
import { generateMaskBlob } from "../utils/maskGenerator";
import {
  formatImageForAPI,
  loadImageElement,
  cropResultToPreset,
} from "../utils/imageSquareFormatter";
import {
  callOpenAIImageEdit,
  getStoredAPIKey,
  DEFAULT_PROMPT,
} from "../services/openaiImageEditService";
import { downloadBlob } from "@/lib/image-processor";

// ── Helper ────────────────────────────────────────────────────────────────

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("Error al leer el archivo."));
    reader.readAsDataURL(file);
  });
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useAutoExpandBanner(
  initialPreset: BannerPreset = BANNER_PRESETS[0],
): UseAutoExpandBannerReturn {
  const [preset,          setPreset]          = useState<BannerPreset>(initialPreset);
  const [status,          setStatus]          = useState<ExpandStatus>("idle");
  const [statusMessage,   setStatusMessage]   = useState<string>("");
  const [errorMessage,    setErrorMessage]    = useState<string | null>(null);
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);
  const [resultDataUrl,   setResultDataUrl]   = useState<string | null>(null);
  const [analysis,        setAnalysis]        = useState<ExpansionAnalysis | null>(null);

  // ── Load image ──────────────────────────────────────────────────────────

  const loadImage = useCallback(async (file: File) => {
    // Reset previous result when a new image is loaded
    setResultDataUrl(null);
    setErrorMessage(null);
    setStatus("idle");
    setStatusMessage("");

    try {
      const dataUrl = await readFileAsDataURL(file);
      setOriginalDataUrl(dataUrl);

      const dims     = await getImageDimensions(dataUrl);
      const newAnalysis = analyzeExpansionNeeds(dims, preset);
      setAnalysis(newAnalysis);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error al cargar imagen.");
      setStatus("error");
    }
  }, [preset]);

  // Re-run analysis when preset changes but image is already loaded
  const handleSetPreset = useCallback(async (newPreset: BannerPreset) => {
    setPreset(newPreset);
    setResultDataUrl(null);

    if (!originalDataUrl) return;
    try {
      const dims        = await getImageDimensions(originalDataUrl);
      const newAnalysis = analyzeExpansionNeeds(dims, newPreset);
      setAnalysis(newAnalysis);
    } catch {
      // ignore — image may not be loaded yet
    }
  }, [originalDataUrl]);

  // ── Run AI expansion ────────────────────────────────────────────────────

  const runExpansion = useCallback(async () => {
    if (!originalDataUrl || !analysis) return;

    const apiKey = getStoredAPIKey();

    setStatus("loading");
    setErrorMessage(null);

    try {
      setStatusMessage("Cargando imagen…");
      const imgEl = await loadImageElement(originalDataUrl);

      setStatusMessage("Generando máscara automática…");
      const [imageBlob, maskBlob] = await Promise.all([
        formatImageForAPI(imgEl, analysis),
        generateMaskBlob(analysis),
      ]);

      setStatusMessage("Enviando a OpenAI DALL-E 2…");
      const { b64 } = await callOpenAIImageEdit(
        {
          imageBlob,
          maskBlob,
          prompt: DEFAULT_PROMPT,
          apiKey,
        },
        false, // do not silently fall back — surface errors to user
      );

      setStatusMessage("Recortando al formato del preset…");
      const cropped = await cropResultToPreset(b64, analysis);

      setResultDataUrl(cropped);
      setStatus("success");
      setStatusMessage("¡Expansión completada!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido.";
      setErrorMessage(msg);
      setStatus("error");
      setStatusMessage("");
    }
  }, [originalDataUrl, analysis]);

  // ── Export ──────────────────────────────────────────────────────────────

  const exportResult = useCallback(() => {
    if (!resultDataUrl) return;

    // Convert dataURL → Blob → download
    fetch(resultDataUrl)
      .then((r) => r.blob())
      .then((blob) => {
        const slug = preset.label
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        downloadBlob(blob, `${slug}-ai-expanded.jpg`);
      })
      .catch(() => {
        // Fallback: anchor link from dataURL
        const a = document.createElement("a");
        a.href     = resultDataUrl;
        a.download = "banner-ai-expanded.jpg";
        a.click();
      });
  }, [resultDataUrl, preset]);

  // ── Reset ───────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setStatus("idle");
    setStatusMessage("");
    setErrorMessage(null);
    setOriginalDataUrl(null);
    setResultDataUrl(null);
    setAnalysis(null);
  }, []);

  return {
    status,
    statusMessage,
    errorMessage,
    originalDataUrl,
    resultDataUrl,
    analysis,
    preset,
    setPreset: handleSetPreset,
    loadImage,
    runExpansion,
    exportResult,
    reset,
  };
}
