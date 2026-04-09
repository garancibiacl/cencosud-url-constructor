const normalizeBrandKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[´`’]/g, "'")
    .toLocaleLowerCase("es-CL")
    .replace(/\s+/g, " ")
    .trim();

export const BRAND_DICTIONARY = {
  "aceite chef": "Aceite Chef",
  "babysec": "Babysec",
  "ciabatta": "Ciabatta",
  "coca-cola": "COCA-COLA",
  "confort": "Confort",
  "corona": "Corona",
  "cuisine & co": "Cuisine & Co",
  "donuts": "Donuts",
  "heineken": "Heineken",
  "hellmann's": "Hellmann's",
  "kraft": "Kraft",
  "lays": "Lays",
  "maggi": "Maggi",
  "masterdog": "Masterdog",
  "maxima": "Máxima",
  "milo": "Milo",
  "minuto verde": "Minuto Verde",
  "nescafe": "Nescafé",
  "nestle la cremeria": "Nestlé La Cremería",
  "nestle": "Nestlé",
  "nova": "Nova",
  "palta hass": "Palta Hass",
  "panamei": "Panamei",
  "receta de abuelo": "Receta de Abuelo",
  "san jose": "San José",
  "sol": "Sol",
  "soprole": "Soprole",
  "super pollo": "Super Pollo",
  "trencito": "Trencito",
  "tucapel": "Tucapel",
  "watt's": "Watt's",
  "zeukid": "Zeukid",
  "nestle chandelle": "Nestlé Chandelle",
  "quix": "Quix",
} as const;

const BRAND_ENTRIES = Object.entries(BRAND_DICTIONARY)
  .map(([rawKey, canonical]) => ({
    canonical,
    key: normalizeBrandKey(rawKey),
    tokens: normalizeBrandKey(rawKey).split(" "),
  }))
  .sort((left, right) => right.tokens.length - left.tokens.length);

export const isKnownBrand = (value: string) => {
  const normalizedValue = normalizeBrandKey(value);

  if (!normalizedValue) {
    return false;
  }

  return BRAND_ENTRIES.some((entry) => entry.key === normalizedValue);
};

export const containsKnownBrand = (value: string) => {
  const normalizedTokens = normalizeBrandKey(value).split(" ").filter(Boolean);

  if (normalizedTokens.length === 0) {
    return false;
  }

  return BRAND_ENTRIES.some((entry) => {
    if (entry.tokens.length > normalizedTokens.length) {
      return false;
    }

    for (let index = 0; index <= normalizedTokens.length - entry.tokens.length; index += 1) {
      const candidate = normalizedTokens.slice(index, index + entry.tokens.length);
      if (candidate.every((token, tokenIndex) => token === entry.tokens[tokenIndex])) {
        return true;
      }
    }

    return false;
  });
};

export const applyBrandDictionary = (value: string) => {
  const rawTokens = value.split(/\s+/).filter(Boolean);

  if (rawTokens.length === 0) {
    return "";
  }

  const normalizedTokens = rawTokens.map((token) => normalizeBrandKey(token));
  const result: string[] = [];

  for (let index = 0; index < rawTokens.length; ) {
    let matchedEntry:
      | {
          canonical: string;
          key: string;
          tokens: string[];
        }
      | undefined;

    for (const entry of BRAND_ENTRIES) {
      const candidate = normalizedTokens.slice(index, index + entry.tokens.length);
      if (candidate.length !== entry.tokens.length) {
        continue;
      }

      if (candidate.every((token, tokenIndex) => token === entry.tokens[tokenIndex])) {
        matchedEntry = entry;
        break;
      }
    }

    if (matchedEntry) {
      result.push(matchedEntry.canonical);
      index += matchedEntry.tokens.length;
      continue;
    }

    result.push(rawTokens[index]);
    index += 1;
  }

  return result.join(" ");
};
