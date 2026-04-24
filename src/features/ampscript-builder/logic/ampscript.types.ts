export type BrandId = "sisa" | "jumbo" | "spid";

export interface BrandConfig {
  id: BrandId;
  label: string;
  color: string;           // Tailwind bg color class para badge
  domain: string;          // ej: santaisabel.cl
  campaign: string;        // ej: santasofertas
  appLinkDomain: string;   // ej: sisaapp.page.link
  apn: string;             // Android package name
  ibi: string;             // iOS bundle id
  isi: string;             // iOS App Store ID
  searchPath: string;      // ej: /busca
  /** true → deep link de app con %26; false → URL web directa con & */
  deepLink: boolean;
}

export interface ParsedUrlData {
  categoryId: string | null;
  recipeSlug: string | null;
  rawUrl: string;
  isValid: boolean;
}

export interface AMPscriptResult {
  ampscript: string;
  slug: string;
  categoryId: string;
  brand: BrandConfig;
}
