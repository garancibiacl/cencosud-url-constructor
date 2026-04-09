import { applyBrandDictionary, containsKnownBrand, isKnownBrand } from "@/lib/brand-dictionary";

const normalizeTitleValue = (value: string) =>
  value
    .replace(/[´`’]/g, "'")
    .replace(/\s*&\s*co\b/gi, " & Co")
    .replace(/\bdescto\.?\b/gi, "dcto.")
    .replace(/\bdcto\b(?!\.)/gi, "dcto.")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\s+/g, " ")
    .trim();

const toTitleCase = (value: string) =>
  value
    .toLocaleLowerCase("es-CL")
    .replace(/(^|[\s/+(])\p{L}/gu, (match) => match.toLocaleUpperCase("es-CL"));

const DATE_RANGE_PATTERN =
  /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b(?:\s+al\s+.*)?/gi;

const LEADING_SOURCE_PATTERN =
  /^\s*(?:(?:prensa\s*\/\s*tv|santa\s+yapa|ciclos|exclusivas|bombazo|catalogo)\s*-\s*)+/i;

const PROMOTIONAL_NOISE_PATTERNS = [
  /\bpack\b/gi,
  /\bvariedades?\b/gi,
  /\b\d+\s*[xX]\s*\d+\b/gi,
  /\bc\/u\b/gi,
  /\bprecio\s+ref\b/gi,
  /\bahorro\b/gi,
  /\bppum\b/gi,
  /\bdcto\b/gi,
  /\btmp\b/gi,
  /\bref\b/gi,
];

const MULTIPACK_FORMAT_PATTERN =
  /\b\d+\s*[xX]\s*\d+(?:[.,]\d+)?\s*(?:cc|ml|l|g|gr|kg)\b/gi;

const TRAILING_FORMAT_PATTERN =
  /\b\d+(?:[.,]\d+)?\s*(?:cc|ml|l|g|gr|kg)\b(?:\s*[xX]\s*\d+)?$/i;

const GENERIC_CATEGORY_PATTERNS = [
  /\bespecial(?:es)?\b/gi,
  /\bbombazos?\b/gi,
  /\bexclusivas?\b/gi,
  /\bprensa\s*\/\s*tv\b/gi,
  /\bsanta\s+yapa\b/gi,
];

const APP_SOURCE_SEGMENT_PATTERNS = [
  /^\s*prensa\s*\/\s*tv\s*$/i,
  /^\s*santa\s+yapa\s*$/i,
  /^\s*catalogo\s*$/i,
  /^\s*bombazo(?:s)?\s*$/i,
  /^\s*exclusivas?\s*$/i,
  /^\s*exclusivo\s+ecomm\s*$/i,
  /^\s*ciclos?\s*$/i,
  /^\s*especial(?:es)?\s*$/i,
  /^\s*vitrina\s+proveedor\s*$/i,
];

const APP_GENERIC_PRODUCT_PREFIX_PATTERNS = [
  /^\s*bombazo(?:s)?\s+exclusivo\s+ecomm\s*-\s*/i,
  /^\s*todos?\s+los?\s+productos?\s+de\s+/i,
  /^\s*todas?\s+las?\s+ofertas?\s+del?\s+/i,
  /^\s*todas?\s+las?\s+ofertas?\s+de\s+/i,
  /^\s*exclusivo\s+ecomm\s*-\s*/i,
  /^\s*todo(?:s|as)?\s+/i,
];

const APP_PRESERVED_COMMERCIAL_PATTERNS = [
  /\btodas?\s+las?\s+ofertas?\s+del?\s+ciclo\b/i,
];

const APP_LEADING_SOURCE_SEQUENCE_PATTERN =
  /^\s*(?:(?:prensa\s*\/\s*tv|santa\s+yapa|catalogo|bombazo(?:s)?|exclusivas?|exclusivo\s+ecomm|ciclos?|especial(?:es)?|vitrina\s+proveedor)\s*-\s*)+/i;

const BRAND_MARKERS = [
  /\bcuisine\s*&\s*co\b/i,
  /\bm[aá]xima\b/i,
  /\bwatt'?s\b/i,
  /\btucapel\b/i,
  /\bpanamei\b/i,
  /\bpanamel\b/i,
];

const splitMeaningfulWords = (value: string) =>
  value
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

const cleanupCommercialDescription = (dirtyTitle: string, options?: { keepTrailingFormat?: boolean }) => {
  const normalized = normalizeTitleValue(dirtyTitle);

  if (!normalized) {
    return "";
  }

  let cleaned = normalized;

  cleaned = cleaned.replace(DATE_RANGE_PATTERN, " ");
  cleaned = cleaned.replace(LEADING_SOURCE_PATTERN, "");
  cleaned = cleaned.replace(MULTIPACK_FORMAT_PATTERN, " ");

  for (const pattern of PROMOTIONAL_NOISE_PATTERNS) {
    cleaned = cleaned.replace(pattern, " ");
  }

  for (const pattern of GENERIC_CATEGORY_PATTERNS) {
    cleaned = cleaned.replace(pattern, " ");
  }

  if (!options?.keepTrailingFormat) {
    cleaned = cleaned.replace(TRAILING_FORMAT_PATTERN, " ");
  }

  cleaned = cleaned
    .replace(/\$\s*\d[\d.,]*/g, " ")
    .replace(options?.keepTrailingFormat ? /\b\d+(?:[.,]\d+)?\s*%\b/g : /\b\d[\d.,]*\b/g, " ")
    .replace(/\s+-\s+/g, " ")
    .replace(/[-|_/]+/g, " ")
    .replace(/^[\s\-/|]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[^A-Za-zÀ-ÿ0-9]+|[^A-Za-zÀ-ÿ0-9']+$/g, "")
    .trim();

  return cleaned;
};

const normalizeLabelValue = (value: string) =>
  value
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s*&\s*/g, " & ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[,\s]+|[,\s]+$/g, "")
    .trim();

const normalizeVariantConnector = (value: string) =>
  value
    .replace(/\s+[Oo]\s+(?=\p{L})/gu, " | ")
    .replace(/\s*\|\s*\|\s*/g, " | ")
    .replace(/\s{2,}/g, " ")
    .trim();

const formatDisplayLabel = (value: string) =>
  normalizeVariantConnector(
    toTitleCase(normalizeLabelValue(value)).replace(
      /\b(\d+(?:[.,]\d+)?)(cc|ml|l|g|gr|kg)\b/gi,
      (_, amount: string, unit: string) => `${amount}${unit.toUpperCase()}`,
    ),
  );

const normalizeAppSegment = (value: string) => {
  let normalized = cleanupCommercialDescription(value, { keepTrailingFormat: true });

  for (const pattern of APP_GENERIC_PRODUCT_PREFIX_PATTERNS) {
    normalized = normalized.replace(pattern, "");
  }

  return normalized.trim();
};

const extractAppPromotionalTitle = (value: string) => {
  let normalized = normalizeTitleValue(value);

  normalized = normalized.replace(DATE_RANGE_PATTERN, " ");
  normalized = normalized.replace(APP_LEADING_SOURCE_SEQUENCE_PATTERN, "");
  normalized = normalized.replace(/^\s*-\s*/, "");

  for (const pattern of APP_GENERIC_PRODUCT_PREFIX_PATTERNS) {
    normalized = normalized.replace(pattern, "");
  }

  normalized = normalized
    .replace(/\$\s*\d[\d.,]*/g, " ")
    .replace(/\bde\s+dcto\.?/gi, " dcto.")
    .replace(/\s*-\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[^A-Za-zÀ-ÿ0-9]+|[^A-Za-zÀ-ÿ0-9%'.]+$/g, "")
    .trim();

  return normalized
    ? formatEditableCleanTitleInput(normalized)
        .replace(/\bdcto\b\.?/gi, "dcto.")
        .replace(/\bdcto\.\.+/gi, "dcto.")
    : "";
};

const formatClipboardDisplayName = (value: string) => {
  const normalized = normalizeVariantConnector(normalizeLabelValue(value))
    .replace(/\s*-\s*/g, " ")
    .replace(/[_/|]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  const sentenceCaseValue = normalized
    .toLocaleLowerCase("es-CL")
    .replace(/^\p{L}/u, (char) => char.toLocaleUpperCase("es-CL"));

  return applyBrandDictionary(sentenceCaseValue).replace(
    /\b(\d+(?:[.,]\d+)?)(cc|ml|l|g|gr|kg)\b/gi,
    (_, amount: string, unit: string) => `${amount}${unit.toUpperCase()}`,
  );
};

export const formatEditableCleanTitleInput = (value: string) => {
  const normalized = normalizeTitleValue(value)
    .replace(/\s*-\s*/g, " ")
    .replace(/[_/|]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  const sentenceCaseValue = normalized
    .toLocaleLowerCase("es-CL")
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      if (index !== 0) {
        return word;
      }

      return word.replace(/^\p{L}/u, (char) => char.toLocaleUpperCase("es-CL"));
    })
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return applyBrandDictionary(sentenceCaseValue);
};

export const extractAppCleanTitle = (dirtyTitle: string) => {
  const normalized = normalizeTitleValue(dirtyTitle).replace(DATE_RANGE_PATTERN, " ").trim();

  if (!normalized) {
    return "";
  }

  if (APP_PRESERVED_COMMERCIAL_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return "Todas las Ofertas";
  }

  if (containsKnownBrand(normalized) && /(?:hasta|dcto|\b\d+(?:[.,]\d+)?\s*%)/i.test(normalized)) {
    const promotionalTitle = extractAppPromotionalTitle(normalized);
    if (promotionalTitle) {
      return promotionalTitle;
    }
  }

  const segments = normalized
    .split(/\s+-\s+/)
    .map((segment) => normalizeAppSegment(segment))
    .filter(Boolean)
    .filter((segment) => !APP_SOURCE_SEGMENT_PATTERNS.some((pattern) => pattern.test(segment)));

  if (segments.length === 0) {
    return "";
  }

  if (segments.length === 1) {
    const extractedTitle = formatEditableCleanTitleInput(extractCleanTitle(segments[0]));
    return extractedTitle || formatEditableCleanTitleInput(segments[0]);
  }

  const [firstSegment, secondSegment] = segments;
  const formattedSecondSegment = formatEditableCleanTitleInput(secondSegment);

  if (isKnownBrand(firstSegment) && secondSegment) {
    return formatEditableCleanTitleInput(`${firstSegment} ${formattedSecondSegment}`);
  }

  if (!isKnownBrand(firstSegment) && secondSegment && containsKnownBrand(secondSegment)) {
    return formattedSecondSegment;
  }

  return formatEditableCleanTitleInput(extractCleanTitle(segments.join(" ")));
};

const getBrandMarkerIndex = (value: string) => {
  let firstIndex = -1;

  for (const marker of BRAND_MARKERS) {
    const match = marker.exec(value);
    if (!match || match.index < 0) {
      continue;
    }

    if (firstIndex === -1 || match.index < firstIndex) {
      firstIndex = match.index;
    }
  }

  return firstIndex;
};

export interface ProductDescriptionSplit {
  productName: string;
  brandDetail: string;
}

export const splitProductDescription = (dirtyTitle: string): ProductDescriptionSplit => {
  const cleaned = cleanupCommercialDescription(dirtyTitle, { keepTrailingFormat: true });

  if (!cleaned) {
    return { productName: "", brandDetail: "" };
  }

  const brandIndex = getBrandMarkerIndex(cleaned);

  if (brandIndex >= 0) {
    return {
      productName: formatDisplayLabel(cleaned.slice(0, brandIndex)),
      brandDetail: formatDisplayLabel(cleaned.slice(brandIndex)),
    };
  }

  const trailingFormatMatch = cleaned.match(TRAILING_FORMAT_PATTERN);
  if (trailingFormatMatch) {
    const detail = normalizeLabelValue(trailingFormatMatch[0]);
    const productName = normalizeLabelValue(
      cleaned.slice(0, cleaned.length - trailingFormatMatch[0].length),
    );

    return {
      productName: formatDisplayLabel(productName),
      brandDetail: formatDisplayLabel(detail),
    };
  }

  const words = splitMeaningfulWords(cleaned);
  if (words.length <= 3) {
    return {
      productName: formatDisplayLabel(cleaned),
      brandDetail: "",
    };
  }

  return {
    productName: formatDisplayLabel(words.slice(0, 3).join(" ")),
    brandDetail: formatDisplayLabel(words.slice(3).join(" ")),
  };
};

export const cleanProductTitle = (dirtyTitle: string) => splitProductDescription(dirtyTitle).productName;

export const extractCleanTitle = cleanProductTitle;

export const extractBrandDetail = (dirtyTitle: string) =>
  splitProductDescription(dirtyTitle).brandDetail;

export const extractCollectionCode = (rawUrl: string) => {
  const trimmed = rawUrl.trim();

  if (!trimmed) {
    return "";
  }

  const withoutHash = trimmed.split("#")[0];
  const encodedMatch = withoutHash.match(/(?:%3A|:A)(\d+)(?:[&#]|$)/i);
  if (encodedMatch) {
    return encodedMatch[1];
  }

  const plainMatch = withoutHash.match(/A(\d+)(?:[&#]|$)/i);
  if (plainMatch) {
    return plainMatch[1];
  }

  return "";
};

export interface AppBatchRow {
  index: number;
  dirtyTitle: string;
  sourceUrl: string;
  cleanTitle: string;
  collectionCode: string;
  hasError: boolean;
}

export const buildAppBatchRows = (dirtyTitles: string, urls: string): AppBatchRow[] => {
  const titleLines = dirtyTitles.split("\n");
  const urlLines = urls.split("\n");
  const totalRows = Math.max(titleLines.length, urlLines.length);

  return Array.from({ length: totalRows }, (_, index) => {
    const dirtyTitle = (titleLines[index] ?? "").trim();
    const sourceUrl = (urlLines[index] ?? "").trim();
    const cleanTitle = extractAppCleanTitle(dirtyTitle);
    const collectionCode = extractCollectionCode(sourceUrl);

    return {
      index,
      dirtyTitle,
      sourceUrl,
      cleanTitle,
      collectionCode,
      hasError: Boolean((dirtyTitle && !sourceUrl) || (!dirtyTitle && sourceUrl)),
    };
  }).filter((row) => row.dirtyTitle || row.sourceUrl);
};

export const buildBulkAppClipboardRows = (
  rows: Array<Pick<Partial<AppBatchRow>, "cleanTitle" | "collectionCode">>,
) =>
  rows.flatMap((row) => {
    const cleanTitle = String(row.cleanTitle ?? "").trim();
    const collectionCode = String(row.collectionCode ?? "").trim();

    if (!cleanTitle || !collectionCode) {
      return [];
    }

    return [`${cleanTitle}\t${collectionCode}`];
  });

const looksLikeBaseUrlCell = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  return (
    trimmed.startsWith("/") ||
    /^https?:\/\//i.test(trimmed) ||
    /^www\.[^\s]+\.[^\s]+/i.test(trimmed)
  );
};

export interface BulkWebSpreadsheetPasteResult {
  descriptionsText: string;
  baseUrlsText: string;
}

export interface SingleWebSpreadsheetPasteResult {
  description: string;
  baseUrl: string;
}

const parseSpreadsheetRows = (pastedText: string) => {
  const normalized = pastedText.replace(/\r\n/g, "\n").trim();

  if (!normalized.includes("\t")) {
    return null;
  }

  const parsedRows = normalized
    .split("\n")
    .map((line) => line.split("\t").map((cell) => cell.trim()))
    .map((cells) => {
      const description = cells.find((cell) => cell.length > 0) ?? "";
      const baseUrl = cells.find(looksLikeBaseUrlCell) ?? "";
      return { description, baseUrl };
    })
    .filter((row) => row.description || row.baseUrl);

  if (parsedRows.length === 0) {
    return null;
  }

  return parsedRows;
};

export const parseBulkWebSpreadsheetPaste = (
  pastedText: string,
): BulkWebSpreadsheetPasteResult | null => {
  const parsedRows = parseSpreadsheetRows(pastedText);

  if (!parsedRows) {
    return null;
  }

  const detectedPairs = parsedRows.filter((row) => row.description && row.baseUrl);

  if (detectedPairs.length === 0) {
    return null;
  }

  return {
    descriptionsText: parsedRows.map((row) => row.description).join("\n"),
    baseUrlsText: parsedRows.map((row) => row.baseUrl).join("\n"),
  };
};

export const parseSingleWebSpreadsheetPaste = (
  pastedText: string,
): SingleWebSpreadsheetPasteResult | null => {
  const parsedRows = parseSpreadsheetRows(pastedText);

  if (!parsedRows) {
    return null;
  }

  const firstDetectedPair = parsedRows.find((row) => row.description && row.baseUrl);

  if (!firstDetectedPair) {
    return null;
  }

  return {
    description: firstDetectedPair.description,
    baseUrl: firstDetectedPair.baseUrl,
  };
};

export const parseBulkAppSpreadsheetPaste = parseBulkWebSpreadsheetPaste;

export interface WebClipboardRow {
  productName?: string;
  brandDetail?: string;
  finalUrl?: string;
  collectionCode?: string;
}

export const buildWebClipboardBlock = (row: WebClipboardRow) => {
  const productName = String(row.productName ?? "").trim();
  const brandDetail = String(row.brandDetail ?? "").trim();
  const finalUrl = String(row.finalUrl ?? "").trim();
  const collectionCode = String(row.collectionCode ?? "").trim();
  const displayName = formatClipboardDisplayName(
    [productName, brandDetail].filter(Boolean).join(" ").trim(),
  );

  if (!displayName || !finalUrl || !collectionCode) {
    return "";
  }

  return `Nombre: ${displayName}\nUrl: ${finalUrl}\nCodigo: ${collectionCode}`;
};

export const buildBulkWebClipboardRows = (rows: WebClipboardRow[]) =>
  rows.flatMap((row) => {
    const block = buildWebClipboardBlock(row);
    return block ? [block] : [];
  });
