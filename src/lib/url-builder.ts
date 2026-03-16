export interface URLParams {
  ubicacion: string;
  componente: string;
  campana: string;
  descripcion: string;
  semana: string;
  fecha: string;
}

export const sanitizeCustomValue = (value: string) =>
  value.trim().replace(/\s+/g, "-").toLowerCase();

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
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "y",
  "co",
  "cia",
]);

export const processDetailedDescription = (value: string) => {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/(\d)[.,](\d)/g, "$1$2")
    .replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, " ")
    .replace(/[%&$@]/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const keywords = normalized
    .split(" ")
    .filter(Boolean)
    .filter((word) => /[a-z0-9]/.test(word))
    .filter((word) => !DESCRIPTION_STOPWORDS.has(word))
    .slice(0, 5);

  return keywords.join("-").replace(/-+/g, "-");
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

export const cleanDestinationUrl = (baseUrl: string) => {
  try {
    const urlObj = new URL(baseUrl);
    return urlObj.pathname + urlObj.search;
  } catch {
    return baseUrl;
  }
};

export const buildFinalUrl = (baseUrl: string, params: URLParams) => {
  const cleanUrl = cleanDestinationUrl(baseUrl);
  const promoName = buildPromoName(params);

  if (!promoName) {
    return cleanUrl;
  }

  const separator = cleanUrl.includes("?") ? "&" : "?";
  return `${cleanUrl}${separator}nombre_promo=${promoName}`;
};
