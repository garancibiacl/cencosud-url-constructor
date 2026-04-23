import type { BrandConfig, BrandId } from "./ampscript.types";

export const BRAND_CONFIGS: Record<BrandId, BrandConfig> = {
  sisa: {
    id: "sisa",
    label: "Santa Isabel",
    color: "bg-green-500/15 text-green-700 dark:text-green-300",
    domain: "santaisabel.cl",
    campaign: "santasofertas",
    appLinkDomain: "sisaapp.page.link",
    apn: "com.cencosud.cl.sisa",
    ibi: "com.cencosud.santaisabel.cl",
    isi: "1585842731",
    searchPath: "/busca",
  },
  jumbo: {
    id: "jumbo",
    label: "Jumbo",
    color: "bg-red-500/15 text-red-700 dark:text-red-300",
    domain: "jumbo.cl",
    campaign: "jumboofertas",
    appLinkDomain: "jumboapp.page.link",
    apn: "com.cencosud.cl.jumbo",
    ibi: "com.cencosud.jumbo.cl",
    isi: "1398619622",
    searchPath: "/busca",
  },
  spid: {
    id: "spid",
    label: "Spid",
    color: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
    domain: "spid.cl",
    campaign: "spidofertas",
    appLinkDomain: "spidapp.page.link",
    apn: "com.cencosud.cl.spid",
    ibi: "com.cencosud.spid.cl",
    isi: "1234567890",
    searchPath: "/busca",
  },
};

export const BRAND_LIST = Object.values(BRAND_CONFIGS);
