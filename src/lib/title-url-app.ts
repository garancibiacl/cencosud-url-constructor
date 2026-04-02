const normalizeTitleValue = (value: string) =>
  value
    .replace(/[´`’]/g, "'")
    .replace(/\b&\s*co\b/gi, "& Co")
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
    const cleanTitle = extractCleanTitle(dirtyTitle);
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

export const parseBulkWebSpreadsheetPaste = (
  pastedText: string,
): BulkWebSpreadsheetPasteResult | null => {
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

  const detectedPairs = parsedRows.filter((row) => row.description && row.baseUrl);

  if (detectedPairs.length === 0) {
    return null;
  }

  return {
    descriptionsText: parsedRows.map((row) => row.description).join("\n"),
    baseUrlsText: parsedRows.map((row) => row.baseUrl).join("\n"),
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
  const displayName = [productName, brandDetail].filter(Boolean).join(" ").trim();

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
