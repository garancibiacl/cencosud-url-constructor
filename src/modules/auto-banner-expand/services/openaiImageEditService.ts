/**
 * openaiImageEditService.ts
 *
 * Decoupled service for calling the OpenAI images/edits endpoint (DALL-E 2).
 *
 * API Notes:
 * - Endpoint: POST https://api.openai.com/v1/images/edits
 * - model: "dall-e-2" (only model that supports edits as of 2025)
 * - image: square PNG, RGBA, max 4 MB
 * - mask:  same size as image, transparent = fill, opaque = keep
 * - size:  must match image dimensions (256, 512, or 1024)
 * - response_format: "b64_json" (avoids URL expiry issues)
 *
 * This service is intentionally stateless — all inputs are explicit.
 * The hook (useAutoExpandBanner) owns state and calls this service.
 */

import type { FocusPosition, OpenAIEditPayload, OpenAIEditResult } from "../types";

const OPENAI_EDITS_URL = "https://api.openai.com/v1/images/edits";
const API_SIZE_PX = 1024;

/**
 * Builds a dynamic outpainting prompt based on the user's composition choices
 * and an optional scene description (materials, textures, lighting keywords).
 *
 * @param focusPosition    - Where the main subject sits in the final banner
 * @param hasElements      - Whether the image contains labels, seals, or text to preserve
 * @param sceneDescription - Optional free-text describing background materials/scene
 *                           (e.g. "madera cálida, luz natural lateral, tonos tierra")
 */
export function buildDynamicPrompt(
  focusPosition: FocusPosition,
  hasElements: boolean,
  sceneDescription = "",
): string {
  const positionDesc: Record<FocusPosition, string> = {
    left:   "positioned in the left third of the composition",
    center: "centered as the main focal point",
    right:  "positioned in the right third of the composition",
  };

  // Resolved materials string: use user input or a safe generic fallback
  const materials = sceneDescription.trim()
    ? sceneDescription.trim()
    : "background materials, textures, and colors";

  const prompt =
    `Continue the existing scene exactly as it would naturally extend beyond the frame. ` +
    `Match the same ${materials}, perspective, lighting, shadows, and depth of field already visible. ` +
    `The main subject is ${positionDesc[focusPosition]} — do not recenter the composition. ` +
    `Preserve all original products and graphic elements without duplication or distortion. ` +
    `Do not add new objects. ` +
    `The generated area must look like a seamless extension of the same professional product photograph.` +
    (hasElements
      ? ` Preserve all labels, seals, price tags, and text elements at their original positions without distortion.`
      : "");

  return prompt;
}

/** Fallback prompt for when focusPosition/hasElements are not provided */
export const DEFAULT_PROMPT = buildDynamicPrompt("center", false);

// ── API Key management ────────────────────────────────────────────────────

const LS_KEY = "cencosud_openai_api_key";

export function getStoredAPIKey(): string {
  return localStorage.getItem(LS_KEY) ?? "";
}

export function storeAPIKey(key: string): void {
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem(LS_KEY, trimmed);
  } else {
    localStorage.removeItem(LS_KEY);
  }
}

export function clearAPIKey(): void {
  localStorage.removeItem(LS_KEY);
}

// ── Mock / Fallback ───────────────────────────────────────────────────────

/**
 * Mock that returns the original image blob as base64.
 * Used when no API key is configured or in test environments.
 * The UI should always warn the user that this is a mock result.
 */
async function mockEditResult(imageBlob: Blob): Promise<OpenAIEditResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Strip the data: prefix and return raw b64
      const result = (reader.result as string).split(",")[1] ?? "";
      resolve({ b64: result });
    };
    reader.readAsDataURL(imageBlob);
  });
}

// ── Real service ──────────────────────────────────────────────────────────

/**
 * Calls OpenAI images/edits.
 * Falls back to mockEditResult if apiKey is empty or if the call fails
 * with a non-auth error and `allowFallback` is true.
 *
 * @throws Error with a human-readable message on hard failures.
 */
export async function callOpenAIImageEdit(
  payload: OpenAIEditPayload,
  allowFallback = false,
): Promise<OpenAIEditResult> {
  const { imageBlob, maskBlob, prompt, apiKey } = payload;

  // If no key, skip the real call and return mock
  if (!apiKey) {
    if (allowFallback) return mockEditResult(imageBlob);
    throw new Error(
      "No hay API Key de OpenAI configurada. " +
      "Abre Configuración IA para ingresar tu clave.",
    );
  }

  const form = new FormData();
  form.append("image",           imageBlob,   "image.png");
  form.append("mask",            maskBlob,    "mask.png");
  form.append("prompt",          prompt);
  form.append("model",           "dall-e-2");
  form.append("n",               "1");
  form.append("size",            `${API_SIZE_PX}x${API_SIZE_PX}`);
  form.append("response_format", "b64_json");

  let response: Response;
  try {
    response = await fetch(OPENAI_EDITS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
  } catch (networkErr) {
    throw new Error(
      "No se pudo conectar a OpenAI. Verifica tu conexión a internet.",
    );
  }

  if (!response.ok) {
    // Parse error message from OpenAI if available
    let errMsg = response.statusText;
    try {
      const errData = await response.json();
      errMsg = errData?.error?.message ?? errMsg;
    } catch {
      // ignore JSON parse failure
    }

    // Auth errors are never fallback-able
    if (response.status === 401) {
      throw new Error(`API Key incorrecta o sin permisos: ${errMsg}`);
    }
    if (response.status === 429) {
      throw new Error(`Límite de solicitudes alcanzado (rate limit). Espera un momento y vuelve a intentarlo.`);
    }
    if (response.status === 400) {
      throw new Error(`Solicitud inválida: ${errMsg}`);
    }

    if (allowFallback) return mockEditResult(imageBlob);
    throw new Error(`OpenAI API error ${response.status}: ${errMsg}`);
  }

  const data = await response.json();
  const b64 = data?.data?.[0]?.b64_json as string | undefined;

  if (!b64) {
    throw new Error("La API de OpenAI no devolvió imagen. Respuesta inesperada.");
  }

  return { b64 };
}
