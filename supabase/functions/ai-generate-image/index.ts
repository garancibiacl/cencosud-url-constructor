/**
 * Edge Function: ai-generate-image
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
 * 3. Crea job en ai_generation_jobs (status: pending)
 * 4. Llama Claude Haiku para construir el prompt óptimo
 * 5. Genera 2 variantes con fal.ai (FLUX.1-schnell o FLUX.1-dev)
 * 6. Sube imágenes a Supabase Storage (bucket: ai-images)
 * 7. Guarda registros en ai_images
 * 8. Actualiza job a status: done
 * 9. Retorna { jobId, images: GeneratedImage[] }
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@0.27.3";

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

type Brand = "jumbo" | "sisa";
type BlockType = "hero" | "product" | "banner" | "text";
type Style = "auto" | "lifestyle" | "promo";
type Quality = "fast" | "hd";

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

// ── Configuración fal.ai ──────────────────────────────────────────────────────

const FAL_MODELS: Record<Quality, string> = {
  fast: "fal-ai/flux/schnell",
  hd:   "fal-ai/flux/dev",
};

// Dimensiones según blockType (ratio aproximado para email)
const BLOCK_DIMENSIONS: Record<BlockType, { width: number; height: number }> = {
  hero:    { width: 600, height: 300 },
  product: { width: 400, height: 400 },
  banner:  { width: 600, height: 200 },
  text:    { width: 600, height: 200 },
};

// ── Colores de marca para el prompt ──────────────────────────────────────────

const BRAND_COLORS: Record<Brand, { primary: string; secondary: string; name: string }> = {
  jumbo: { primary: "#E8001C", secondary: "#FFFFFF", name: "Jumbo" },
  sisa:  { primary: "#DA291C", secondary: "#FFFFFF", name: "Santa Isabel" },
};

// ── Seed determinista por campaña ─────────────────────────────────────────────
// Un mismo campaignId siempre produce el mismo seed base → coherencia visual

function campaignSeed(campaignId: string): number {
  let hash = 0;
  for (let i = 0; i < campaignId.length; i++) {
    const char = campaignId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  // fal.ai acepta seeds positivos de 32 bits
  return Math.abs(hash) % 2_147_483_647;
}

// ── Construcción del prompt con Claude Haiku ─────────────────────────────────

async function buildPromptWithClaude(
  anthropic: Anthropic,
  productData: ProductData,
  blockType: BlockType,
  style: Style,
): Promise<string> {
  const brandInfo = BRAND_COLORS[productData.brand];

  const systemPrompt = `Eres un experto en fotografía publicitaria y diseño de mailings de retail chileno.
Tu tarea es generar un prompt en inglés para un modelo de imagen por IA (FLUX).
El prompt debe ser preciso, descriptivo y orientado a resultados fotorrealistas de alta calidad.
Responde ÚNICAMENTE con el prompt en inglés, sin explicaciones ni texto adicional.
Máximo 120 palabras.`;

  const blockGuidelines: Record<BlockType, string> = {
    hero: `Imagen lifestyle y ambiental. El producto debe estar integrado en un escenario de vida real.
Composición amplia, luz natural, espacio para texto superpuesto a la izquierda.
Estilo editorial de revista de cocina o supermercado premium.`,
    product: `Product shot limpio sobre fondo blanco o degradado muy suave.
El producto ocupa 70-80% del encuadre. Luz de estudio, sombra suave.
Sin elementos distractores. Fotorrealista.`,
    banner: `Composición horizontal. Producto a la derecha, espacio vacío a la izquierda para texto.
Colores de marca ${brandInfo.name}: ${brandInfo.primary}. Estilo promo/oferta.
Fondo sólido o degradado de marca. Clean y moderno.`,
    text: `Imagen de apoyo simple y limpia. Fondo neutro o de marca.
Composición sencilla, no ocupa atención principal.`,
  };

  const styleModifiers: Record<Style, string> = {
    auto:      "",
    lifestyle: "Escena de vida cotidiana, ambiente hogareño, familia o individuo usando el producto.",
    promo:     "Estilo promocional vibrante. Énfasis en el descuento y urgencia. Colores saturados.",
  };

  const attrs = Object.entries(productData.attributes)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  const userMessage = `Producto: ${productData.name}
Marca retail: ${brandInfo.name}
Categoría: ${productData.category ?? "General"}${productData.subcategory ? ` > ${productData.subcategory}` : ""}
${attrs ? `Atributos: ${attrs}` : ""}
${productData.discount ? `Descuento: ${productData.discount}%` : ""}
Tipo de bloque: ${blockType}
Directrices de composición: ${blockGuidelines[blockType]}
${styleModifiers[style] ? `Estilo adicional: ${styleModifiers[style]}` : ""}

Genera un prompt profesional para FLUX.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 200,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Claude no devolvió texto");

  return content.text.trim();
}

// ── Llamada a fal.ai ──────────────────────────────────────────────────────────

interface FalImageResult {
  url: string;
  width: number;
  height: number;
  content_type: string;
}

interface FalResponse {
  images: FalImageResult[];
  seed: number;
}

async function generateWithFal(
  falApiKey: string,
  model: string,
  prompt: string,
  dimensions: { width: number; height: number },
  seed: number,
  numImages: number,
): Promise<FalResponse> {
  const controller = new AbortController();
  // 55s de timeout — la Edge Function tiene 60s en total para generate-image
  const timeoutId = setTimeout(() => controller.abort(), 55_000);

  try {
    const body = {
      prompt,
      image_size: { width: dimensions.width, height: dimensions.height },
      num_images: numImages,
      seed,
      enable_safety_checker: true,
      ...(model.includes("dev") ? { guidance_scale: 7.5, num_inference_steps: 28 } : {}),
    };

    const res = await fetch(`https://fal.run/${model}`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Key ${falApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`fal.ai error ${res.status}: ${errText.slice(0, 200)}`);
    }

    return await res.json() as FalResponse;
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
  if (!imgRes.ok) throw new Error(`No se pudo descargar imagen de fal.ai: ${imgRes.status}`);

  const buffer = await imgRes.arrayBuffer();
  const fileSize = buffer.byteLength;
  const ext = "jpg"; // fal.ai devuelve JPEG por defecto
  const storagePath = `${userId}/${jobId}/variant_${variantIndex}.${ext}`;

  const { error: uploadError } = await svcClient.storage
    .from("ai-images")
    .upload(storagePath, buffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadError) throw new Error(`Storage upload error: ${uploadError.message}`);

  const { data: { publicUrl } } = svcClient.storage.from("ai-images").getPublicUrl(storagePath);

  return { storagePath, publicUrl, fileSize };
}

// ── Handler principal ─────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Método no permitido" }, 405);
  }

  const startTime = Date.now();

  // ── Env vars ──────────────────────────────────────────────
  const supabaseUrl   = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnon  = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseSvc   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey  = Deno.env.get("ANTHROPIC_API_KEY");
  const falApiKey     = Deno.env.get("FAL_API_KEY");

  if (!anthropicKey) return json({ error: "ANTHROPIC_API_KEY no configurada" }, 500);
  if (!falApiKey)    return json({ error: "FAL_API_KEY no configurada" }, 500);

  // ── 1. Autenticación JWT ──────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "No autenticado" }, 401);
  }

  const userClient = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return json({ error: "Token inválido o expirado" }, 401);
  }

  const svcClient = createClient(supabaseUrl, supabaseSvc);

  // ── 2. Rate limiting ──────────────────────────────────────
  const { data: rateLimitOk, error: rateLimitError } = await svcClient
    .rpc("ai_rate_limit_ok", { p_user_id: user.id, p_limit: 10 });

  if (rateLimitError) {
    console.error("[ai-generate-image] Rate limit check error:", rateLimitError);
  }

  if (rateLimitOk === false) {
    return json(
      { error: "Límite de generaciones alcanzado (10 por hora). Intenta más tarde." },
      429,
    );
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

  // ── Función para marcar el job como fallido ───────────────
  async function failJob(message: string) {
    await svcClient
      .from("ai_generation_jobs")
      .update({ status: "failed", error_message: message.slice(0, 500) })
      .eq("id", jobId);
  }

  try {
    // ── 5. Construir prompt con Claude Haiku ─────────────────
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    let prompt: string;

    try {
      prompt = await buildPromptWithClaude(anthropic, productData, blockType, style);
    } catch (claudeErr) {
      console.error("[ai-generate-image] Claude error:", claudeErr);
      // Fallback a prompt básico si Claude falla
      prompt = `Professional product photography of ${productData.name}, clean studio lighting, high quality, photorealistic`;
    }

    // ── 6. Generar imágenes con fal.ai ────────────────────────
    const model      = FAL_MODELS[quality];
    const dimensions = BLOCK_DIMENSIONS[blockType];
    const seed       = campaignId ? campaignSeed(campaignId) : Math.floor(Math.random() * 2_147_483_647);
    const numImages  = 2; // 2 variantes por generación

    let falResponse: FalResponse;
    try {
      falResponse = await generateWithFal(falApiKey, model, prompt, dimensions, seed, numImages);
    } catch (falErr) {
      await failJob((falErr as Error).message);
      return json({ error: "Error en la generación de imagen. Puedes usar la imagen del catálogo como fallback." }, 502);
    }

    // ── 7. Subir imágenes a Storage y guardar en BD ───────────
    const generatedImages: GeneratedImage[] = [];

    for (let i = 0; i < falResponse.images.length; i++) {
      const falImg = falResponse.images[i];

      let storagePath: string;
      let publicUrl: string;
      let fileSize: number;

      try {
        ({ storagePath, publicUrl, fileSize } = await uploadImageToStorage(
          svcClient, falImg.url, user.id, jobId, i,
        ));
      } catch (uploadErr) {
        console.error(`[ai-generate-image] Upload error for variant ${i}:`, uploadErr);
        // Si falla el upload, usar la URL directa de fal.ai como fallback temporal
        publicUrl  = falImg.url;
        storagePath = "";
        fileSize    = 0;
      }

      const { data: imgRecord, error: imgError } = await svcClient
        .from("ai_images")
        .insert({
          job_id:           jobId,
          user_id:          user.id,
          storage_path:     storagePath,
          public_url:       publicUrl,
          width:            falImg.width,
          height:           falImg.height,
          file_size_bytes:  fileSize,
          prompt,
          seed:             falResponse.seed,
          model:            model.split("/").pop() ?? model,
          variant_index:    i,
          is_selected:      false,
        })
        .select("id")
        .single();

      if (imgError) {
        console.error(`[ai-generate-image] ai_images insert error for variant ${i}:`, imgError);
      }

      generatedImages.push({
        id:           (imgRecord?.id as string | undefined) ?? crypto.randomUUID(),
        url:          publicUrl,
        width:        falImg.width,
        height:       falImg.height,
        prompt,
        seed:         falResponse.seed,
        variantIndex: i,
      });
    }

    // ── 8. Actualizar job a done ──────────────────────────────
    const durationMs = Date.now() - startTime;
    await svcClient
      .from("ai_generation_jobs")
      .update({
        status:        "done",
        prompt,
        fal_request_id: String(falResponse.seed),
        duration_ms:   durationMs,
        completed_at:  new Date().toISOString(),
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
  } catch (unexpectedErr) {
    console.error("[ai-generate-image] Unexpected error:", unexpectedErr);
    await failJob((unexpectedErr as Error).message ?? "Error inesperado");
    return json({ error: "Error interno inesperado" }, 500);
  }
});
