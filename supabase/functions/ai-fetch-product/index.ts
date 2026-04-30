/**
 * Edge Function: ai-fetch-product
 * POST /functions/v1/ai-fetch-product
 *
 * Body: { sku: string, brand: "jumbo" | "sisa" }
 *
 * 1. Valida JWT y extrae user_id
 * 2. Sanitiza SKU (solo alfanumérico)
 * 3. Busca en product_catalog (cache < 24h)
 * 4. Si cache miss: llama a la API pública de Jumbo/SISA
 * 5. Normaliza al formato ProductData
 * 6. Upsert en product_catalog
 * 7. Retorna ProductData
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

type Brand = "jumbo" | "sisa";

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

interface FetchProductRequest {
  sku: string;
  brand: Brand;
}

// ── URL de APIs por marca ─────────────────────────────────────────────────────

const CATALOG_ENDPOINTS: Record<Brand, string> = {
  jumbo: "https://www.jumbo.cl/api/catalog_system/pub/products/search",
  sisa:  "https://www.santaisabel.cl/api/catalog_system/pub/products/search",
};

// ── Normalización de respuesta de VTEX ───────────────────────────────────────

function parsePrice(raw: unknown): number | null {
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const n = parseFloat(raw.replace(/[^\d.]/g, ""));
    return isNaN(n) ? null : n;
  }
  return null;
}

// La API VTEX devuelve un array de productos.
// Cada producto tiene `items` con SKUs; filtramos por el SKU solicitado.
function normalizeVtexResponse(data: unknown[], sku: string, brand: Brand): ProductData | null {
  if (!Array.isArray(data) || data.length === 0) return null;

  // Un producto puede tener múltiples SKUs; buscamos el que coincide
  const product = data[0] as Record<string, unknown>;

  const items = Array.isArray(product.items) ? product.items as Record<string, unknown>[] : [];
  const item = items.find((i) => String(i.itemId) === String(sku)) ?? items[0];

  // Precio: VTEX tiene una estructura sellers → commertialOffer
  let price: number | null = null;
  let originalPrice: number | null = null;

  if (item) {
    const sellers = Array.isArray(item.sellers) ? item.sellers as Record<string, unknown>[] : [];
    const mainSeller = sellers[0];
    if (mainSeller) {
      const offer = mainSeller.commertialOffer as Record<string, unknown> | undefined;
      if (offer) {
        price = parsePrice(offer.Price);
        originalPrice = parsePrice(offer.ListPrice);
      }
    }
  }

  const discount =
    price != null && originalPrice != null && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  // Imagen: primer item → primer imageUrl
  const images = Array.isArray(item?.images) ? item.images as Record<string, unknown>[] : [];
  const imageUrl = (images[0]?.imageUrl as string | undefined) ?? null;

  // Categorías: categoryTree es un array de objetos con name
  const categoryTree = Array.isArray(product.categoryTree)
    ? (product.categoryTree as Record<string, unknown>[])
    : [];
  const category    = (categoryTree[0]?.name as string | undefined) ?? null;
  const subcategory = (categoryTree[1]?.name as string | undefined) ?? null;

  // Atributos especificaciones (peso, volumen, etc.)
  const attributes: Record<string, string> = {};
  const specs = product.Specifications as Record<string, string[]> | undefined;
  if (specs && typeof specs === "object") {
    for (const [key, val] of Object.entries(specs)) {
      attributes[key] = Array.isArray(val) ? val.join(", ") : String(val);
    }
  }

  return {
    sku,
    brand,
    name: (product.productName as string | undefined) ?? (product.productTitle as string | undefined) ?? "Producto sin nombre",
    category,
    subcategory,
    price,
    originalPrice,
    discount,
    imageUrl,
    description: (product.description as string | undefined) ?? null,
    attributes,
  };
}

// ── Fetch de la API VTEX con timeout ─────────────────────────────────────────

async function fetchFromVtex(sku: string, brand: Brand): Promise<ProductData | null> {
  const url = `${CATALOG_ENDPOINTS[brand]}?fq=skuId:${encodeURIComponent(sku)}&_from=0&_to=0`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 28_000); // 28s (Edge Function timeout es 30s)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; AguaApp/1.0)",
      },
    });

    if (!res.ok) {
      console.error(`[ai-fetch-product] VTEX ${brand} returned ${res.status} for SKU ${sku}`);
      return null;
    }

    const data = await res.json() as unknown[];
    return normalizeVtexResponse(data, sku, brand);
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      console.error(`[ai-fetch-product] Timeout fetching SKU ${sku} from ${brand}`);
    } else {
      console.error(`[ai-fetch-product] Fetch error for SKU ${sku}:`, err);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Handler principal ─────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Método no permitido" }, 405);
  }

  // ── 1. Autenticación JWT ──────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "No autenticado" }, 401);
  }

  const supabaseUrl  = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseSvc  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return json({ error: "Token inválido o expirado" }, 401);
  }

  // ── 2. Parse y validación del body ────────────────────────
  let body: FetchProductRequest;
  try {
    body = await req.json() as FetchProductRequest;
  } catch {
    return json({ error: "Body JSON inválido" }, 400);
  }

  // Sanitizar SKU: solo alfanumérico (evita inyección en URLs)
  const rawSku = String(body.sku ?? "").trim();
  const sku = rawSku.replace(/[^a-zA-Z0-9]/g, "");
  if (sku.length === 0 || sku.length > 40) {
    return json({ error: "SKU inválido" }, 400);
  }

  const brand = body.brand;
  if (brand !== "jumbo" && brand !== "sisa") {
    return json({ error: "brand debe ser 'jumbo' o 'sisa'" }, 400);
  }

  // ── 3. Buscar en cache (product_catalog) ─────────────────
  const svcClient = createClient(supabaseUrl, supabaseSvc);

  const TTL_HOURS = 24;
  const ttlCutoff = new Date(Date.now() - TTL_HOURS * 60 * 60 * 1000).toISOString();

  const { data: cached, error: cacheError } = await svcClient
    .from("product_catalog")
    .select("*")
    .eq("sku", sku)
    .eq("brand", brand)
    .gt("fetched_at", ttlCutoff)
    .maybeSingle();

  if (cacheError) {
    console.error("[ai-fetch-product] Cache query error:", cacheError);
    // No abortamos — intentamos hacer fetch igualmente
  }

  if (cached) {
    const product: ProductData = {
      sku: cached.sku,
      brand: cached.brand as Brand,
      name: cached.name,
      category: cached.category,
      subcategory: cached.subcategory,
      price: cached.price ? Number(cached.price) : null,
      originalPrice: cached.original_price ? Number(cached.original_price) : null,
      discount: cached.discount ? Number(cached.discount) : null,
      imageUrl: cached.image_url,
      description: cached.description,
      attributes: (cached.attributes as Record<string, string>) ?? {},
    };
    return json({ data: product, source: "cache" });
  }

  // ── 4. Fetch desde VTEX ───────────────────────────────────
  const productData = await fetchFromVtex(sku, brand);

  if (!productData) {
    return json(
      { error: `Producto con SKU ${sku} no encontrado en ${brand === "jumbo" ? "Jumbo" : "Santa Isabel"}` },
      404,
    );
  }

  // ── 5. Upsert en cache ────────────────────────────────────
  const { error: upsertError } = await svcClient.from("product_catalog").upsert(
    {
      sku: productData.sku,
      brand: productData.brand,
      name: productData.name,
      category: productData.category,
      subcategory: productData.subcategory,
      price: productData.price,
      original_price: productData.originalPrice,
      discount: productData.discount,
      image_url: productData.imageUrl,
      description: productData.description,
      attributes: productData.attributes,
      raw_payload: {},         // no guardamos el payload completo por tamaño
      fetched_at: new Date().toISOString(),
    },
    { onConflict: "sku,brand" },
  );

  if (upsertError) {
    // Error no fatal: devolvemos el dato igualmente
    console.error("[ai-fetch-product] Cache upsert error:", upsertError);
  }

  return json({ data: productData, source: "api" });
});
