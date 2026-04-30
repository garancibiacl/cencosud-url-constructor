/**
 * Edge Function: ai-generate-image (PLAI)
 * POST /functions/v1/ai-generate-image
 *
 * Body: {
 *   productData: ProductData,
 *   blockType: "hero" | "product" | "banner" | "text",
 *   style: "auto" | "lifestyle" | "promo",
 *   campaignId: string,
 *   quality: "fast" | "hd"
 * }
 *
 * Flujo:
 * 1. Valida JWT
 * 2. Verifica rate limit (10 generaciones / hora / user)
 * 3. Construye prompt con plantilla local (sin IA externa)
 * 4. Llama a plai POST /images/create con x-api-key
 * 5. Sube imágenes a Supabase Storage (bucket: ai-images)
 * 6. Guarda registros en ai_images y actualiza job
 * 7. Retorna { jobId, prompt, images: GeneratedImage[] }
 */

import { createClient } from "npm:@supabase/supabase-js@2";

// ── CORS ──────────────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// ── Tipos ────────────────────────────────────────────────────────────────────

type Brand     = "jumbo" | "sisa";
type BlockType = "hero" | "product" | "banner" | "text";
type Style     = "auto" | "lifestyle" | "promo";
type Quality   = "fast" | "hd";

interface ProductData {
  sku: string;
  brand: Brand;
  name: string;
  category: string | null;
  subcategory: string | null;
  price: number | null;
  originalPrice: number | null;
  discount: number | null;
  imageUrl: string | null;
  description: string | null;
  attributes: Record<string, string>;
}

interface GenerateImageRequest {
  productData: ProductData;
  blockType: BlockType;
  style: Style;
  campaignId: string;
  quality: Quality;
}

interface GeneratedImage {
  id: string;
  url: string;
  width: number;
  height: number;
  prompt: string;
  seed: number;
  variantIndex: number;
}

// ── Configuración PLAI ────────────────────────────────────────────────────────

// Modelos plai (mapeo fast / hd → modelos disponibles)
const PLAI_MODELS: Record<Quality, string> = {
  fast: "gemini-2.5-flash",
  hd:   "gemini-2.5-pro",
};

// Aspect ratio según blockType
const BLOCK_ASPECT: Record<BlockType, string> = {
  hero:    "16:9",
  product: "1:1",
  banner:  "16:9",
  text:    "16:9",
};

// Dimensiones aproximadas para el registro en BD (plai no necesariamente las respeta)
const BLOCK_DIMENSIONS: Record<BlockType, { width: number; height: number }> = {
  hero:    { width: 1024, height: 576 },
  product: { width: 1024, height: 1024 },
  banner:  { width: 1024, height: 576 },
  text:    { width: 1024, height: 576 },
};

const BRAND_INFO: Record<Brand, { primary: string; name: string }> = {
  jumbo: { primary: "#E8001C", name: "Jumbo" },
  sisa:  { primary: "#DA291C", name: "Santa Isabel" },
};

const NUM_IMAGES = 2;

// ── Seed determinista por campaña (para registro/coherencia) ─────────────────

function campaignSeed(campaignId: string): number {
  let hash = 0;
  for (let i = 0; i < campaignId.length; i++) {
    hash = ((hash << 5) - hash + campaignId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 2_147_483_647;
}

// ── Construcción del prompt (plantilla local, sin IA) ────────────────────────

function buildPromptLocal(
  product: ProductData,
  blockType: BlockType,
  style: Style,
): string {
  const brand = BRAND_INFO[product.brand];

  // Composición según bloque
  const composition: Record<BlockType, string> = {
    hero:
      "Wide editorial composition, lifestyle scene, natural lighting, generous empty space on the left for text overlay, magazine-quality photography",
    product:
      "Clean product shot on a soft white-to-light-gray gradient background, studio lighting, soft shadow, the product fills 70-80% of the frame, no distracting elements, photorealistic",
    banner:
      "Horizontal composition, product on the right, empty colored area on the left for promotional text, vibrant brand colors, clean and modern look",
    text:
      "Simple supporting image, neutral or brand-colored background, minimal composition, low visual weight",
  };

  // Modificador de estilo
  const styleMod: Record<Style, string> = {
    auto: "",
    lifestyle:
      "Real-life everyday scene, warm home environment, person or family naturally interacting with the product",
    promo:
      "Bold promotional aesthetic, saturated colors, sense of urgency and discount energy",
  };

  // Atributos relevantes
  const attrs = Object.entries(product.attributes ?? {})
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  const discount = product.discount ? ` Discount badge: ${product.discount}% off.` : "";

  // Prompt final
  const parts = [
    `Professional advertising photography of "${product.name}".`,
    product.category ? `Category: ${product.category}${product.subcategory ? ` / ${product.subcategory}` : ""}.` : "",
    attrs ? `Product attributes: ${attrs}.` : "",
    `Retail brand: ${brand.name} (Chilean supermarket).`,
    `Brand color accent: ${brand.primary}.${discount}`,
    composition[blockType] + ".",
    styleMod[style],
    "Photorealistic, sharp focus, high detail, commercial-grade lighting, suitable for an email marketing campaign.",
  ].filter(Boolean);

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

// ── Llamada a plai POST /images/create ───────────────────────────────────────

interface PlaiImage { url: string }
interface PlaiGenerated {
  id: string;
  prompt: string;
  aspectRatio: string;
  createdAt: string;
  images: PlaiImage[];
}
interface PlaiResponse {
  status: "success" | string;
  data: { generatedImages: PlaiGenerated[] };
}

async function generateWithPlai(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: string,
  numberOfImages: number,
  aspectRatio: string,
): Promise<PlaiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55_000);

  const url = `${baseUrl.replace(/\/+$/, "")}/images/create`;

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        model,
        numberOfImages,
        parameters: { aspectRatio },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`plai error ${res.status}: ${errText.slice(0, 300)}`);
    }

    return await res.json() as PlaiResponse;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Upload de imagen a Supabase Storage ──────────────────────────────────────

async function uploadImageToStorage(
  svcClient: ReturnType<typeof createClient>,
  imageUrl: string,
  userId: string,
  jobId: string,
  variantIndex: number,
): Promise<{ storagePath: string; publicUrl: string; fileSize: number }> {
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`No se pudo descargar imagen de plai: ${imgRes.status}`);

  const buffer = await imgRes.arrayBuffer();
  const fileSize = buffer.byteLength;

  // Detectar extensión por content-type (plai puede devolver jpg o png)
  const ct = imgRes.headers.get("content-type") ?? "image/jpeg";
  const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
  const storagePath = `${userId}/${jobId}/variant_${variantIndex}.${ext}`;

  const { error: uploadError } = await svcClient.storage
    .from("ai-images")
    .upload(storagePath, buffer, { contentType: ct, upsert: true });

  if (uploadError) throw new Error(`Storage upload error: ${uploadError.message}`);

  const { data: { publicUrl } } = svcClient.storage.from("ai-images").getPublicUrl(storagePath);

  return { storagePath, publicUrl, fileSize };
}

// ── Handler principal ─────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST")    return json({ error: "Método no permitido" }, 405);

  const startTime = Date.now();

  // ── Env vars ──────────────────────────────────────────────
  const supabaseUrl  = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseSvc  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const plaiApiKey   = Deno.env.get("PLAI_API_KEY");
  const plaiBaseUrl  = Deno.env.get("PLAI_API_BASE_URL") ?? "https://plai-api-core.cencosud.ai";

  if (!plaiApiKey) return json({ error: "PLAI_API_KEY no configurada" }, 500);

  // ── 1. Autenticación JWT ──────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "No autenticado" }, 401);
  }

  const userClient = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: "Token inválido o expirado" }, 401);

  const svcClient = createClient(supabaseUrl, supabaseSvc);

  // ── 2. Rate limiting ──────────────────────────────────────
  const { data: rateLimitOk, error: rateLimitError } = await svcClient
    .rpc("ai_rate_limit_ok", { p_user_id: user.id, p_limit: 10 });

  if (rateLimitError) {
    console.error("[ai-generate-image] Rate limit check error:", rateLimitError);
  }
  if (rateLimitOk === false) {
    return json({ error: "Límite de generaciones alcanzado (10 por hora). Intenta más tarde." }, 429);
  }

  // ── 3. Parse y validación del body ────────────────────────
  let body: GenerateImageRequest;
  try {
    body = await req.json() as GenerateImageRequest;
  } catch {
    return json({ error: "Body JSON inválido" }, 400);
  }

  const { productData, blockType, style, campaignId, quality } = body;

  if (!productData?.name) return json({ error: "productData inválido" }, 400);
  if (!["hero", "product", "banner", "text"].includes(blockType)) {
    return json({ error: "blockType inválido" }, 400);
  }
  if (!["auto", "lifestyle", "promo"].includes(style)) {
    return json({ error: "style inválido" }, 400);
  }
  if (!["fast", "hd"].includes(quality)) {
    return json({ error: "quality inválido" }, 400);
  }

  // ── 4. Crear job en BD ────────────────────────────────────
  const { data: jobData, error: jobError } = await svcClient
    .from("ai_generation_jobs")
    .insert({
      user_id:    user.id,
      campaign_id: campaignId ?? null,
      sku:        productData.sku ?? null,
      brand:      productData.brand ?? null,
      block_type: blockType,
      style,
      quality,
      status:     "generating",
    })
    .select("id")
    .single();

  if (jobError || !jobData) {
    console.error("[ai-generate-image] Job insert error:", jobError);
    return json({ error: "Error interno al crear el job" }, 500);
  }

  const jobId = jobData.id as string;

  async function failJob(message: string) {
    await svcClient
      .from("ai_generation_jobs")
      .update({ status: "failed", error_message: message.slice(0, 500) })
      .eq("id", jobId);
  }

  try {
    // ── 5. Construir prompt (plantilla local, sin IA externa) ─
    const prompt = buildPromptLocal(productData, blockType, style);

    // ── 6. Generar imágenes con plai ──────────────────────────
    const model       = PLAI_MODELS[quality];
    const aspectRatio = BLOCK_ASPECT[blockType];
    const dimensions  = BLOCK_DIMENSIONS[blockType];
    const seed        = campaignId ? campaignSeed(campaignId) : Math.floor(Math.random() * 2_147_483_647);

    let plaiResponse: PlaiResponse;
    try {
      plaiResponse = await generateWithPlai(plaiBaseUrl, plaiApiKey, model, prompt, NUM_IMAGES, aspectRatio);
    } catch (plaiErr) {
      const msg = (plaiErr as Error).message;
      console.error("[ai-generate-image] plai error:", msg);
      await failJob(msg);
      return json({ error: "Error en la generación de imagen. Puedes usar la imagen del catálogo como fallback." }, 502);
    }

    const plaiImages = plaiResponse?.data?.generatedImages?.[0]?.images ?? [];
    if (plaiImages.length === 0) {
      await failJob("plai devolvió 0 imágenes");
      return json({ error: "El proveedor no devolvió imágenes" }, 502);
    }

    const plaiGenerationId = plaiResponse?.data?.generatedImages?.[0]?.id ?? "";

    // ── 7. Subir imágenes a Storage y guardar en BD ───────────
    const generatedImages: GeneratedImage[] = [];

    for (let i = 0; i < plaiImages.length; i++) {
      const plaiImg = plaiImages[i];

      let storagePath = "";
      let publicUrl   = plaiImg.url;
      let fileSize    = 0;

      try {
        ({ storagePath, publicUrl, fileSize } = await uploadImageToStorage(
          svcClient, plaiImg.url, user.id, jobId, i,
        ));
      } catch (uploadErr) {
        console.error(`[ai-generate-image] Upload error variant ${i}:`, uploadErr);
        // Fallback: usar URL directa de plai (puede expirar)
      }

      const { data: imgRecord, error: imgError } = await svcClient
        .from("ai_images")
        .insert({
          job_id:           jobId,
          user_id:          user.id,
          storage_path:     storagePath,
          public_url:       publicUrl,
          width:            dimensions.width,
          height:           dimensions.height,
          file_size_bytes:  fileSize,
          prompt,
          seed,
          model,
          variant_index:    i,
          is_selected:      false,
          metadata:         { provider: "plai", plaiGenerationId, aspectRatio },
        })
        .select("id")
        .single();

      if (imgError) {
        console.error(`[ai-generate-image] ai_images insert error variant ${i}:`, imgError);
      }

      generatedImages.push({
        id:           (imgRecord?.id as string | undefined) ?? crypto.randomUUID(),
        url:          publicUrl,
        width:        dimensions.width,
        height:       dimensions.height,
        prompt,
        seed,
        variantIndex: i,
      });
    }

    // ── 8. Actualizar job a done ──────────────────────────────
    const durationMs = Date.now() - startTime;
    await svcClient
      .from("ai_generation_jobs")
      .update({
        status:         "done",
        prompt,
        fal_request_id: plaiGenerationId, // reutilizamos la columna para el ID de plai
        duration_ms:    durationMs,
        completed_at:   new Date().toISOString(),
      })
      .eq("id", jobId);

    // ── 9. Respuesta ──────────────────────────────────────────
    return json({
      jobId,
      prompt,
      images: generatedImages,
      model,
      durationMs,
    });
  } catch (err) {
    const msg = (err as Error).message ?? "Error desconocido";
    console.error("[ai-generate-image] Unexpected error:", err);
    await failJob(msg);
    return json({ error: msg }, 500);
  }
});
