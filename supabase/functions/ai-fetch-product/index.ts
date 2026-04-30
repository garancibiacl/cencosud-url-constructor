/**
 * Edge Function: ai-fetch-product
 * POST /functions/v1/ai-fetch-product
 *
 * Body: { sku: string, brand: "jumbo" | "sisa" }
 *
 * 1. Valida JWT y extrae user_id
 * 2. Sanitiza SKU (solo alfanumérico)
 * 3. Busca en product_catalog (cache < 24h)
 * 4. Si cache miss: llama a la API Cencosud (sm-web-api) buscando por productReference
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

// ── Endpoints Cencosud (sm-web-api) ──────────────────────────────────────────
// Tenants conocidos de la plataforma de catálogo de Cencosud.
// El path es el mismo, cambia el query param `tenant` (algunos endpoints lo
// usan, en otros se infiere por la apiKey). Por ahora la apiKey es global.

const CATALOG_BASE_DEFAULT = "https://sm-web-api.ecomm.cencosud.com/catalog/api/v1/products";

// ── Normalización de respuesta sm-web-api ────────────────────────────────────

interface CencoCommertialOffer {
  Price?: number;
  ListPrice?: number;
  PriceWithoutDiscount?: number;
  AvailableQuantity?: number;
}
interface CencoSeller {
  commertialOffer?: CencoCommertialOffer;
}
interface CencoImage {
  imageUrl?: string;
}
interface CencoItem {
  itemId?: string | number;
  name?: string;
  ean?: string;
  images?: CencoImage[];
  sellers?: CencoSeller[];
  referenceId?: { Key: string; Value: string }[];
}
interface CencoSpec {
  name?: string;
  values?: string[];
}
interface CencoSpecGroup {
  name?: string;
  specifications?: CencoSpec[];
}
interface CencoProduct {
  productId?: string | number;
  productName?: string;
  productReference?: string;
  brand?: string;
  description?: string | null;
  linkText?: string;
  categories?: string[];
  items?: CencoItem[];
  specificationGroups?: CencoSpecGroup[];
  [key: string]: unknown;
}
interface CencoSearchResponse {
  redirect?: unknown;
  products?: CencoProduct[];
  recordsFiltered?: number;
}

function num(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const n = parseFloat(raw.replace(/[^\d.]/g, ""));
    return isNaN(n) ? null : n;
  }
  return null;
}

/**
 * Devuelve true si el producto coincide con el SKU pedido. Se considera match
 * si productReference coincide, o si algún item tiene itemId / referenceId.Value
 * igual al SKU buscado.
 */
function productMatchesSku(p: CencoProduct, sku: string): boolean {
  const target = String(sku).trim();
  if (!target) return false;

  if (String(p.productReference ?? "").trim() === target) return true;

  for (const it of p.items ?? []) {
    if (String(it.itemId ?? "").trim() === target) return true;
    for (const ref of it.referenceId ?? []) {
      if (String(ref?.Value ?? "").trim() === target) return true;
    }
    if (String(it.ean ?? "").trim() === target) return true;
  }
  return false;
}

function normalizeCencoResponse(
  data: CencoSearchResponse,
  sku: string,
  brand: Brand,
): ProductData | null {
  const products = data.products ?? [];
  console.log(`[ai-fetch-product] Cenco returned ${products.length} products for SKU ${sku} (recordsFiltered=${data.recordsFiltered ?? "?"})`);
  if (products.length === 0) return null;

  const product = products.find((p) => productMatchesSku(p, sku));
  if (!product) {
    const refs = products.map((p) => `productRef=${p.productReference} itemIds=[${(p.items ?? []).map(i => i.itemId).join(",")}]`).join(" | ");
    console.error(`[ai-fetch-product] No match for SKU ${sku}. Candidates: ${refs}`);
    return null;
  }


  const items = product.items ?? [];
  // Item correspondiente al SKU; si no, el primero
  const item =
    items.find((it) => {
      if (String(it.itemId ?? "") === sku) return true;
      return (it.referenceId ?? []).some((r) => String(r?.Value ?? "") === sku);
    }) ?? items[0];

  // Precios
  let price: number | null = null;
  let originalPrice: number | null = null;
  if (item) {
    const seller = (item.sellers ?? [])[0];
    const offer = seller?.commertialOffer;
    if (offer) {
      price = num(offer.Price);
      originalPrice = num(offer.ListPrice ?? offer.PriceWithoutDiscount);
    }
  }
  const discount =
    price != null && originalPrice != null && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  // Imagen
  const imageUrl = (item?.images ?? [])[0]?.imageUrl ?? null;

  // Categorías: vienen como string tipo "/Bebidas/Bebidas Gaseosas/Light/"
  const catRaw = (product.categories ?? [])[0] ?? "";
  const catParts = catRaw.split("/").filter(Boolean);
  const category = catParts[0] ?? null;
  const subcategory = catParts[1] ?? null;

  // Atributos (desde specificationGroups + brand + cantidad)
  const attributes: Record<string, string> = {};
  if (product.brand) attributes["Marca"] = product.brand;
  for (const group of product.specificationGroups ?? []) {
    for (const spec of group.specifications ?? []) {
      if (!spec.name) continue;
      const v = (spec.values ?? []).join(", ");
      if (v) attributes[spec.name] = v;
    }
  }

  return {
    sku,
    brand,
    name: product.productName ?? item?.name ?? "Producto sin nombre",
    category,
    subcategory,
    price,
    originalPrice,
    discount,
    imageUrl,
    description: product.description ?? null,
    attributes,
  };
}

// ── Fetch desde Cencosud sm-web-api ──────────────────────────────────────────

async function fetchFromCenco(sku: string, brand: Brand): Promise<ProductData | null> {
  const apiKey = Deno.env.get("CENCOSUD_CATALOG_API_KEY");
  if (!apiKey) {
    console.error("[ai-fetch-product] CENCOSUD_CATALOG_API_KEY not configured");
    return null;
  }

  // El endpoint actual no segmenta por marca en la URL; la apiKey ya está
  // ligada al tenant. Si en el futuro hay endpoints por marca, se mapean acá.
  void brand;

  const baseUrl = (Deno.env.get("CENCOSUD_CATALOG_API_URL") ?? "").trim() || CATALOG_BASE_DEFAULT;
  // Aceptamos URL completa al endpoint o solo al host (sin path)
  const endpoint = baseUrl.includes("/products")
    ? baseUrl.replace(/\/+$/, "")
    : `${baseUrl.replace(/\/+$/, "")}/catalog/api/v1/products`;
  const url = `${endpoint}?ft=${encodeURIComponent(sku)}&_from=0&_to=9`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25_000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "apiKey": apiKey,
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; AguaApp/1.0)",
      },
    });

    if (!res.ok) {
      console.error(`[ai-fetch-product] Cenco API returned ${res.status} for SKU ${sku}`);
      // Consumir body para evitar leaks
      try { await res.text(); } catch { /* noop */ }
      return null;
    }

    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) {
      const txt = await res.text();
      console.error(
        `[ai-fetch-product] Cenco API returned non-JSON (${ct}) for SKU ${sku}. First 200 chars:`,
        txt.slice(0, 200),
      );
      return null;
    }

    const data = await res.json() as CencoSearchResponse;
    return normalizeCencoResponse(data, sku, brand);
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      console.error(`[ai-fetch-product] Timeout fetching SKU ${sku}`);
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

  // ── 4. Fetch desde Cencosud sm-web-api ───────────────────
  const productData = await fetchFromCenco(sku, brand);

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
      raw_payload: {},
      fetched_at: new Date().toISOString(),
    },
    { onConflict: "sku,brand" },
  );

  if (upsertError) {
    console.error("[ai-fetch-product] Cache upsert error:", upsertError);
  }

  return json({ data: productData, source: "api" });
});
