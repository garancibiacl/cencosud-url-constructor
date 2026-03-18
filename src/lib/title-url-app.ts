const normalizeTitleValue = (value: string) =>
  value
    .replace(/[´`’]/g, "'")
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

const TECHNICAL_NOISE_PATTERNS = [
  /\bpack\b/gi,
  /\bvariedades?\b/gi,
  /\b\d+\s*[xX]\s*\d+(?:[.,]\d+)?\s*(?:cc|ml|l|g|gr|kg)\b/gi,
  /\b\d+(?:[.,]\d+)?\s*(?:cc|ml|l|g|gr|kg)\b/gi,
  /\b\d+\s*[xX]\s*\d+\b/gi,
  /\bc\/u\b/gi,
  /\bprecio\s+ref\b/gi,
  /\bahorro\b/gi,
  /\bppum\b/gi,
];

const GENERIC_CATEGORY_PATTERNS = [
  /\bespecial(?:es)?\b/gi,
  /\bbombazos?\b/gi,
  /\bexclusivas?\b/gi,
  /\bprensa\s*\/\s*tv\b/gi,
  /\bsanta\s+yapa\b/gi,
];

const STOP_WORDS = new Set(["el", "la", "los", "las", "de", "del"]);

const splitMeaningfulWords = (value: string) =>
  value
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

export const cleanProductTitle = (dirtyTitle: string) => {
  const normalized = normalizeTitleValue(dirtyTitle);

  if (!normalized) {
    return "";
  }

  let cleaned = normalized;

  cleaned = cleaned.replace(DATE_RANGE_PATTERN, " ");
  cleaned = cleaned.replace(LEADING_SOURCE_PATTERN, "");

  for (const pattern of TECHNICAL_NOISE_PATTERNS) {
    cleaned = cleaned.replace(pattern, " ");
  }

  for (const pattern of GENERIC_CATEGORY_PATTERNS) {
    cleaned = cleaned.replace(pattern, " ");
  }

  cleaned = cleaned
    .replace(/\$\s*\d[\d.,]*/g, " ")
    .replace(/\b\d[\d.,]*\b/g, " ")
    .replace(/\s+-\s+/g, " ")
    .replace(/[-|_/]+/g, " ")
    .replace(/^[\s\-\/|]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[^A-Za-zÀ-ÿ0-9]+|[^A-Za-zÀ-ÿ0-9']+$/g, "")
    .trim();

  const significantWords = splitMeaningfulWords(cleaned);
  const firstCommercialIndex = significantWords.findIndex(
    (word) => !STOP_WORDS.has(word.toLocaleLowerCase("es-CL")),
  );
  const commercialWords =
    firstCommercialIndex >= 0 ? significantWords.slice(firstCommercialIndex) : significantWords;
  const selectedWords = significantWords.slice(0, significantWords.length >= 4 ? 4 : 3);

  const wordsForTitle =
    commercialWords.length >= 4 ? commercialWords.slice(0, 4) : commercialWords.slice(0, 3);
  const trimmedWordsForTitle = [...wordsForTitle];

  while (
    trimmedWordsForTitle.length > 0 &&
    STOP_WORDS.has(trimmedWordsForTitle[trimmedWordsForTitle.length - 1].toLocaleLowerCase("es-CL"))
  ) {
    trimmedWordsForTitle.pop();
  }

  return toTitleCase(
    (trimmedWordsForTitle.length > 0 ? trimmedWordsForTitle : selectedWords).join(" ").trim(),
  );
};

export const extractCleanTitle = cleanProductTitle;

export const extractCollectionCode = (rawUrl: string) => {
  const trimmed = rawUrl.trim();

  if (!trimmed) {
    return "";
  }

  const withoutHash = trimmed.split("#")[0];
  const encodedMatch = withoutHash.match(/%3A(\d+)$/i);
  if (encodedMatch) {
    return encodedMatch[1];
  }

  const plainMatch = withoutHash.match(/A(\d+)$/i);
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
