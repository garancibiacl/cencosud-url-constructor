import { describe, expect, it } from "vitest";
import {
  buildPromoName,
  cleanTextToSlug,
  hydrateBatchRows,
  hydrateUrl,
  normalizeBaseUrl,
} from "@/hooks/useUrlHydrator";

describe("useUrlHydrator helpers", () => {
  it("builds nombre_promo with description between campaign and week", () => {
    expect(
      buildPromoName({
        ubicacion: "home",
        componente: "banner",
        campana: "especial-semanasanta",
        descripcion: "cientos-productos-a-1000",
        semana: "s12",
        fecha: "20032026",
      }),
    ).toBe("home-banner-especial-semanasanta-cientos-productos-a-1000-s12-20032026");
  });

  it("cleans dirty description text into a short slug", () => {
    expect(cleanTextToSlug("Prensa/TV - TRUTRO ENTERO $2.790")).toBe("trutro-entero");
  });

  it("normalizes base urls removing protocol and domain", () => {
    expect(normalizeBaseUrl("https://www.example.com/busca?fq=H%3A27791")).toBe(
      "/busca?fq=H%3A27791",
    );
  });

  it("uses & when the base url already has search params", () => {
    expect(
      hydrateUrl("/busca?fq=H%3A27791", {
        ubicacion: "home",
        componente: "banner",
        campana: "especial-semanasanta",
        descripcion: "trutro-entero",
        semana: "s12",
        fecha: "20032026",
      }),
    ).toBe("/busca?fq=H%3A27791&nombre_promo=home-banner-especial-semanasanta-trutro-entero-s12-20032026");
  });

  it("pairs descriptions and urls line by line for batch generation", () => {
    expect(
      hydrateBatchRows(
        "/busca?fq=H%3A27791\n/santas-ofertas",
        "Prensa/TV - TRUTRO ENTERO $2.790\nCiclos - TODAS LAS OFERTAS CICLO 1",
        {
          ubicacion: "home",
          componente: "grilla",
          campana: "especial",
          semana: "s12",
          fecha: "20032026",
        },
      ).map((row) => row.finalUrl),
    ).toEqual([
      "/busca?fq=H%3A27791&nombre_promo=home-grilla-especial-trutro-entero-s12-20032026",
      "/santas-ofertas?nombre_promo=home-grilla-especial-ciclos-todas-ofertas-ciclo-1-s12-20032026",
    ]);
  });

  it("flags rows with missing pair values", () => {
    expect(
      hydrateBatchRows(
        "/busca?fq=H%3A27791",
        "Prensa/TV - TRUTRO ENTERO $2.790\nDescripcion sin url",
        {
          ubicacion: "home",
          componente: "grilla",
          campana: "especial",
          semana: "s12",
          fecha: "20032026",
        },
      )[1].hasError,
    ).toBe(true);
  });
});
