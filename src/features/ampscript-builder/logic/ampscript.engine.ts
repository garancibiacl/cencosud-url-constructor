import type { BrandConfig, ParsedUrlData, AMPscriptResult } from "./ampscript.types";

// ── Stopwords para slug ────────────────────────────────────────────────────────
const SLUG_STOPWORDS = new Set([
  "de", "del", "la", "el", "los", "las", "y", "o", "a", "en", "con",
  "por", "para", "un", "una", "unos", "unas", "al", "lo", "se",
  "oferta", "ofertas", "promo", "promocion", "especial",
  "descuento", "descuentos", "precio", "precios", "desde",
  "hasta", "este", "esta", "estos", "estas",
]);

/**
 * Genera un slug limpio desde una descripción libre.
 * Elimina acentos, stopwords, caracteres especiales.
 * Máximo 5 palabras significativas.
 */
export function generateSlug(description: string): string {
  if (!description.trim()) return "";

  return description
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")      // solo alfanumérico
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .filter((word) => !SLUG_STOPWORDS.has(word))
    .slice(0, 5)
    .join("-");
}

/**
 * Extrae el categoryId numérico desde URLs de e-commerce Cencosud.
 * Soporta: fq=H:1234 | fq=H%3A1234 | fq=H%253A1234
 */
export function extractCategoryId(url: string): string | null {
  if (!url.trim()) return null;

  // Decodifica parcialmente para normalizar variantes de encoding
  const normalized = url.replace(/%253A/gi, ":").replace(/%3A/gi, ":");

  const match = normalized.match(/[?&]fq=H:(\d+)/i);
  return match ? match[1] : null;
}

/**
 * Parsea una URL y retorna los datos extraídos con estado de validación.
 */
export function parseUrl(url: string): ParsedUrlData {
  const categoryId = extractCategoryId(url);
  const isValid = !!url.trim() && categoryId !== null;

  return { categoryId, rawUrl: url, isValid };
}

/**
 * Construye el bloque AMPscript completo para SFMC.
 *
 * Jumbo (deepLink=false) — URL web directa, separador &:
 * %%=RedirectTo(Concat('https://www.jumbo.cl/busca?fq=H%3A{id}&',@utm_source,'&',@utm_medium,'&',
 *   'utm_campaign={campaign}','_',@fechaenvio,'&','utm_content={slug}'))=%%
 *
 * Santa Isabel / Spid (deepLink=true) — app deep link, separador %26:
 * %%=RedirectTo(Concat('https://{appLink}/?link=https://www.{domain}/busca%3Ffq=H%3A{id}%26',
 *   @utm_source,'%26',@utm_medium,'%26','utm_campaign={campaign}','_',@fechaenvio,
 *   '%26','utm_content={slug}','%26','apn={apn}','%26','ibi={ibi}','%26','efr=0','%26','isi={isi}'))=%%
 */
export function buildAMPscript(
  brand: BrandConfig,
  categoryId: string,
  slug: string,
  campaign: string,
): string {
  if (!brand.deepLink) {
    // Formato web directo (Jumbo)
    const base = `https://www.${brand.domain}${brand.searchPath}?fq=H%3A${categoryId}&`;
    const args = [
      `'${base}'`,
      `@utm_source`,
      `'&'`,
      `@utm_medium`,
      `'&'`,
      `'utm_campaign=${campaign}'`,
      `'_'`,
      `@fechaenvio`,
      `'&'`,
      `'utm_content=${slug}'`,
    ];
    return `%%=RedirectTo(Concat(${args.join(",")}))=%%`;
  }

  // Formato app deep link (Santa Isabel, Spid)
  const base = `https://${brand.appLinkDomain}/?link=https://www.${brand.domain}${brand.searchPath}%3Ffq=H%3A${categoryId}%26`;
  const args = [
    `'${base}'`,
    `@utm_source`,
    `'%26'`,
    `@utm_medium`,
    `'%26'`,
    `'utm_campaign=${campaign}'`,
    `'_'`,
    `@fechaenvio`,
    `'%26'`,
    `'utm_content=${slug}'`,
    `'%26'`,
    `'apn=${brand.apn}'`,
    `'%26'`,
    `'ibi=${brand.ibi}'`,
    `'%26'`,
    `'efr=0'`,
    `'%26'`,
    `'isi=${brand.isi}'`,
  ];
  return `%%=RedirectTo(Concat(${args.join(",")}))=%%`;
}

/**
 * Punto de entrada principal. Orquesta parseo + slug + generación AMPscript.
 */
export function generateAMPscript(
  description: string,
  url: string,
  brand: BrandConfig,
  campaign: string,
): AMPscriptResult | null {
  const slug = generateSlug(description);
  const { categoryId } = parseUrl(url);

  if (!categoryId || !slug || !campaign) return null;

  const ampscript = buildAMPscript(brand, categoryId, slug, campaign);

  return { ampscript, slug, categoryId, brand };
}
