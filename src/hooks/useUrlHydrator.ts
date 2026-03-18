import { useMemo } from "react";
import type { URLParams } from "@/lib/url-builder";

export interface BatchRow {
  index: number;
  baseUrl: string;
  rawDescription: string;
  slug: string;
  finalUrl: string;
  hasError: boolean;
  errorMessage?: string;
}

const DESCRIPTION_STOPWORDS = new Set([
  "bombazo",
  "exclusivo",
  "exclusiva",
  "ecomm",
  "online",
  "cyber",
  "mega",
  "imperdible",
  "imperdibles",
  "prensa",
  "tv",
  "radio",
  "web",
  "app",
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "y",
  "cia",
]);

export const compactDescriptionReference = (value: string) =>
  value
    .replace(
      /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?(?:\/[a-záéíóúñ]+)?\b(?:\s+al\s+\d{1,2}\/\d{1,2}(?:\/\d{2,4})?(?:\/[a-záéíóúñ]+)?)?/gi,
      " ",
    )
    .replace(/\$\s?\d+(?:[.,]\d+)*/g, " ")
    .replace(/\(\s*p\.?\s*ref\.?\s*[^)]*\)/gi, " ")
    .replace(/\(\s*ppum\s*[^)]*\)/gi, " ")
    .replace(/\s+-\s*$/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+-\s+/g, " - ")
    .trim();

export const cleanTextToSlug = (value: string) => {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b(?:\s+al\s+\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b)?/g, " ")
    .replace(
      /^\s*(?:(?:bombazo(?:s)?|especial(?:es)?|exclusiv[ao]s?|prensa\s*\/\s*tv|santa\s+yapa|ecomm|online|web|app)\s+)*-\s*/g,
      " ",
    )
    .replace(
      /^\s*(?:(?:bombazo(?:s)?|especial(?:es)?|exclusiv[ao]s?|prensa\s*\/\s*tv|santa\s+yapa|ecomm|online|web|app)\s*)+/g,
      " ",
    )
    .replace(/(\d)[.,](\d)/g, "$1$2")
    .replace(/\$\s?\d+(?:[.,]\d+)*/g, " ")
    .replace(/[%&$@]/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized
    .split(" ")
    .filter(Boolean)
    .filter((word) => /[a-z0-9]/.test(word))
    .filter((word) => !DESCRIPTION_STOPWORDS.has(word))
    .slice(0, 6)
    .join("-")
    .replace(/-+/g, "-");
};

export const buildPromoName = (params: URLParams) =>
  [
    params.ubicacion,
    params.componente,
    params.campana,
    params.descripcion,
    params.semana,
    params.fecha,
  ]
    .filter(Boolean)
    .join("-");

export const normalizeBaseUrl = (baseUrl: string) => {
  try {
    const url = new URL(baseUrl);
    return url.pathname + url.search;
  } catch {
    return baseUrl.trim();
  }
};

export const hydrateUrl = (baseUrl: string, params: URLParams) => {
  const cleanUrl = normalizeBaseUrl(baseUrl);
  const promoName = buildPromoName(params);

  if (!promoName) {
    return cleanUrl;
  }

  const separator = cleanUrl.includes("?") ? "&" : "?";
  return `${cleanUrl}${separator}nombre_promo=${promoName}`;
};

export const hydrateBatchRows = (
  baseUrlsText: string,
  descriptionsText: string,
  context: Omit<URLParams, "descripcion">,
): BatchRow[] => {
  const baseUrls = baseUrlsText.split("\n").map((line) => line.trim());
  const descriptions = descriptionsText.split("\n").map((line) => line.trim());
  const maxLength = Math.max(baseUrls.length, descriptions.length);

  return Array.from({ length: maxLength }, (_, index) => {
    const baseUrl = baseUrls[index] ?? "";
    const rawDescription = descriptions[index] ?? "";
    const slug = cleanTextToSlug(rawDescription);
    const hasMissingUrl = !baseUrl && !!rawDescription;
    const hasMissingDescription = !!baseUrl && !rawDescription;
    const hasError = hasMissingUrl || hasMissingDescription;

    return {
      index,
      baseUrl,
      rawDescription,
      slug,
      finalUrl:
        !hasError && baseUrl && slug
          ? hydrateUrl(baseUrl, { ...context, descripcion: slug })
          : "",
      hasError,
      errorMessage: hasMissingUrl
        ? "Falta URL base"
        : hasMissingDescription
          ? "Falta descripcion"
          : undefined,
    };
  }).filter((row) => row.baseUrl || row.rawDescription);
};

export const useUrlHydrator = () =>
  useMemo(
    () => ({
      compactDescriptionReference,
      cleanTextToSlug,
      hydrateUrl,
      hydrateBatchRows,
    }),
    [],
  );
