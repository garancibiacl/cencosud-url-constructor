import { describe, expect, it } from "vitest";
import {
  buildBulkAppClipboardRows,
  buildBulkWebClipboardRows,
  buildAppBatchRows,
  cleanProductTitle,
  extractBrandDetail,
  extractCleanTitle,
  extractCollectionCode,
  parseBulkAppSpreadsheetPaste,
  parseBulkWebSpreadsheetPaste,
  parseSingleWebSpreadsheetPaste,
  splitProductDescription,
} from "@/lib/title-url-app";

describe("title-url-app helpers", () => {
  it("extracts the core product title removing prefixes and promo details", () => {
    expect(
      extractCleanTitle("Prensa/TV - Santa Yapa-PACK NÉCTAR WATT´S VARIEDADES 6X200CC 3X2"),
    ).toBe("Néctar");
  });

  it("removes date ranges and everything after 'al' before selecting the title core", () => {
    expect(
      cleanProductTitle(
        "Prensa/TV - Santa Yapa-PACK NÉCTAR WATT´S VARIEDADES 6X200CC 3X2 - 10/03/2026 al 23/03/2026",
      ),
    ).toBe("Néctar");
  });

  it("drops generic category labels and starts from the first commercial word", () => {
    expect(cleanProductTitle("Especial - Todas las ofertas del especial...")).toBe(
      "Todas Las Ofertas",
    );
  });

  it("removes dates, prices and formats the title in sentence case", () => {
    expect(extractCleanTitle("Catalogo - PACK ARROZ TUCAPEL 1KG $2.990 21/03/2026")).toBe(
      "Arroz",
    );
  });

  it("splits the product name from brand and format for spreadsheet columns", () => {
    expect(
      splitProductDescription(
        "Prensa/TV - LECHE ENTERA, SEMI O DESCREMADA CUISINE & CO 1L PRECIO REF $1.190 - 24/03/2026 al 06/04/2026",
      ),
    ).toEqual({
      productName: "Leche Entera, Semi | Descremada",
      brandDetail: "Cuisine & Co 1L",
    });
    expect(extractBrandDetail("Prensa/TV - ACEITE VEGETAL MÁXIMA 900ML PRECIO REF $1.590")).toBe(
      "Máxima 900ML",
    );
    expect(splitProductDescription("Prensa/TV - ATÚN LOMITO AGUA O ACEITE CUISINE & CO 91GR")).toEqual({
      productName: "Atún Lomito Agua | Aceite",
      brandDetail: "Cuisine & Co 91GR",
    });
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

  it("extracts the collection code from resolved cms web links with extra query params", () => {
    expect(
      extractCollectionCode("/busca?fq=H%3A10042&nombre_promo=home-grilla-bombazo-todos-vinos"),
    ).toBe("10042");
    expect(
      extractCollectionCode(
        "https://www.sitio.cl/busca?fq=H%3A10113&nombre_promo=home-banner-leche-s14-31032026",
      ),
    ).toBe("10113");
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
        cleanTitle: "Néctar",
        collectionCode: "10063",
        hasError: false,
      },
      {
        index: 1,
        dirtyTitle: "Catalogo - PACK ARROZ TUCAPEL 1KG $2.990",
        sourceUrl: "/busca?fq=H%3A27791",
        cleanTitle: "Arroz",
        collectionCode: "27791",
        hasError: false,
      },
    ]);
  });

  it("builds tab-delimited clipboard rows and ignores incomplete values", () => {
    expect(
      buildBulkAppClipboardRows([
        { cleanTitle: "Todos Los Vinos Botella", collectionCode: "10042" },
        { cleanTitle: "  ", collectionCode: "10103" },
        { cleanTitle: "Leche Entera, Semi O", collectionCode: undefined },
        { cleanTitle: "Atún Lomito Agua O", collectionCode: "10103" },
      ]),
    ).toEqual([
      "Todos Los Vinos Botella\t10042",
      "Atún Lomito Agua O\t10103",
    ]);
  });

  it("builds block clipboard rows for cms web and ignores incomplete values", () => {
    expect(
      buildBulkWebClipboardRows([
        {
          productName: "Leche Entera",
          brandDetail: "Cuisine & Co 1L",
          finalUrl: "/busca?fq=H%3A10113&nombre_promo=home-banner-leche-s14",
          collectionCode: "10113",
        },
        {
          productName: "Aceite Vegetal",
          brandDetail: "",
          finalUrl: "/busca?fq=H%3A10102&nombre_promo=home-banner-aceite-s14",
          collectionCode: "10102",
        },
        {
          productName: "",
          brandDetail: "",
          finalUrl: "/busca?fq=H%3A10110&nombre_promo=home-banner-arroz-s14",
          collectionCode: "10110",
        },
      ]),
    ).toEqual([
      "Nombre: Leche Entera Cuisine & Co 1L\nUrl: /busca?fq=H%3A10113&nombre_promo=home-banner-leche-s14\nCodigo: 10113",
      "Nombre: Aceite Vegetal\nUrl: /busca?fq=H%3A10102&nombre_promo=home-banner-aceite-s14\nCodigo: 10102",
    ]);
  });

  it("parses spreadsheet paste rows for cms web bulk inputs", () => {
    expect(
      parseBulkWebSpreadsheetPaste(
        [
          "Bombazo exclusivo ecomm - LECHE EN POLVO NIDO BUEN DÍA 700G 35% - 06/04/2026 al 08/04/2026\t0\thttps://www.santaisabel.cl/busca?fq=H%3A10280",
          "Bombazo exclusivo ecomm - TODO GALLETAS COSTA 3X2 - 06/04/2026 al 08/04/2026\t0\thttps://www.santaisabel.cl/busca?fq=H%3A10281",
        ].join("\n"),
      ),
    ).toEqual({
      descriptionsText:
        "Bombazo exclusivo ecomm - LECHE EN POLVO NIDO BUEN DÍA 700G 35% - 06/04/2026 al 08/04/2026\n" +
        "Bombazo exclusivo ecomm - TODO GALLETAS COSTA 3X2 - 06/04/2026 al 08/04/2026",
      baseUrlsText:
        "https://www.santaisabel.cl/busca?fq=H%3A10280\nhttps://www.santaisabel.cl/busca?fq=H%3A10281",
    });
  });

  it("extracts the first complete description and url pair for cms web individual paste", () => {
    expect(
      parseSingleWebSpreadsheetPaste(
        [
          "\tBombazo exclusivo ecomm - LECHE EN POLVO NIDO BUEN DÍA 700G 35% - 06/04/2026 al 08/04/2026\t\thttps://www.santaisabel.cl/busca?fq=H%3A10280\t",
          "Fila incompleta\t\t\t",
        ].join("\n"),
      ),
    ).toEqual({
      description:
        "Bombazo exclusivo ecomm - LECHE EN POLVO NIDO BUEN DÍA 700G 35% - 06/04/2026 al 08/04/2026",
      baseUrl: "https://www.santaisabel.cl/busca?fq=H%3A10280",
    });
  });

  it("extracts the first complete description and url pair for cms app individual paste", () => {
    expect(
      parseSingleWebSpreadsheetPaste(
        [
          "Prensa/TV - Santa Yapa-PACK NECTAR WATT'S VARIEDADES 6X200CC 3X2\t\t/busca?fq=H%3A10063",
          "\t\t",
        ].join("\n"),
      ),
    ).toEqual({
      description: "Prensa/TV - Santa Yapa-PACK NECTAR WATT'S VARIEDADES 6X200CC 3X2",
      baseUrl: "/busca?fq=H%3A10063",
    });
  });

  it("ignores regular single-column paste in cms web bulk parser", () => {
    expect(
      parseBulkWebSpreadsheetPaste(
        "Bombazo exclusivo ecomm - LECHE EN POLVO NIDO BUEN DÍA 700G 35% - 06/04/2026 al 08/04/2026",
      ),
    ).toBeNull();
  });

  it("parses spreadsheet paste rows for cms app bulk inputs", () => {
    expect(
      parseBulkAppSpreadsheetPaste(
        [
          "Prensa/TV - Santa Yapa-PACK NECTAR WATT'S VARIEDADES 6X200CC 3X2\t0\thttps://www.sitio.cl/busca?fq=H%3A10063",
          "Catalogo - PACK ARROZ TUCAPEL 1KG $2.990\t0\t/busca?fq=H%3A27791",
        ].join("\n"),
      ),
    ).toEqual({
      descriptionsText:
        "Prensa/TV - Santa Yapa-PACK NECTAR WATT'S VARIEDADES 6X200CC 3X2\n" +
        "Catalogo - PACK ARROZ TUCAPEL 1KG $2.990",
      baseUrlsText: "https://www.sitio.cl/busca?fq=H%3A10063\n/busca?fq=H%3A27791",
    });
  });

  it("returns null for cms web individual paste when there is no complete pair", () => {
    expect(parseSingleWebSpreadsheetPaste("Solo descripcion sin tabs")).toBeNull();
    expect(parseSingleWebSpreadsheetPaste("Descripcion\t\t")).toBeNull();
  });
});
