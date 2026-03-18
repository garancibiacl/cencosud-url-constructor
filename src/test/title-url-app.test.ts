import { describe, expect, it } from "vitest";
import {
  buildAppBatchRows,
  cleanProductTitle,
  extractCleanTitle,
  extractCollectionCode,
} from "@/lib/title-url-app";

describe("title-url-app helpers", () => {
  it("extracts the core product title removing prefixes and promo details", () => {
    expect(
      extractCleanTitle("Prensa/TV - Santa Yapa-PACK NÉCTAR WATT´S VARIEDADES 6X200CC 3X2"),
    ).toBe("Néctar Watt's");
  });

  it("removes date ranges and everything after 'al' before selecting the title core", () => {
    expect(
      cleanProductTitle(
        "Prensa/TV - Santa Yapa-PACK NÉCTAR WATT´S VARIEDADES 6X200CC 3X2 - 10/03/2026 al 23/03/2026",
      ),
    ).toBe("Néctar Watt's");
  });

  it("drops generic category labels and starts from the first commercial word", () => {
    expect(cleanProductTitle("Especial - Todas las ofertas del especial...")).toBe(
      "Todas Las Ofertas",
    );
  });

  it("removes dates, prices and formats the title in sentence case", () => {
    expect(extractCleanTitle("Catalogo - PACK ARROZ TUCAPEL 1KG $2.990 21/03/2026")).toBe(
      "Arroz Tucapel",
    );
  });

  it("extracts the last digits from the final url parameter and pads them", () => {
    expect(
      extractCollectionCode("https://www.sitio.cl/busca?ft=algo&fq=H%3A10063"),
    ).toBe("10063");
  });

  it("supports 4 or 5 digits after %3A or plain A at the end of the url", () => {
    expect(extractCollectionCode("https://www.sitio.cl/busca?fq=H%3A9655")).toBe("9655");
    expect(extractCollectionCode("https://www.sitio.cl/busca?fq=H%3A10047")).toBe("10047");
    expect(extractCollectionCode("https://www.sitio.cl/busca?fq=H:A10047")).toBe("10047");
  });

  it("builds batch rows line by line for title and url inputs", () => {
    expect(
      buildAppBatchRows(
        "Prensa/TV - Santa Yapa-PACK NÉCTAR WATT´S VARIEDADES 6X200CC 3X2\nCatalogo - PACK ARROZ TUCAPEL 1KG $2.990",
        "https://www.sitio.cl/busca?fq=H%3A10063\n/busca?fq=H%3A27791",
      ),
    ).toEqual([
      {
        index: 0,
        dirtyTitle: "Prensa/TV - Santa Yapa-PACK NÉCTAR WATT´S VARIEDADES 6X200CC 3X2",
        sourceUrl: "https://www.sitio.cl/busca?fq=H%3A10063",
        cleanTitle: "Néctar Watt's",
        collectionCode: "10063",
        hasError: false,
      },
      {
        index: 1,
        dirtyTitle: "Catalogo - PACK ARROZ TUCAPEL 1KG $2.990",
        sourceUrl: "/busca?fq=H%3A27791",
        cleanTitle: "Arroz Tucapel",
        collectionCode: "27791",
        hasError: false,
      },
    ]);
  });
});
