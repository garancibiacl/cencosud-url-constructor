import type { BrandId, BrandTheme } from "./brand.types";

export const brandThemes: Record<BrandId, BrandTheme> = {
  "santa-isabel": {
    id: "santa-isabel",
    name: "Santa Isabel",
    primaryColor: "#de0610",
    primaryForeground: "#FFFFFF",
    fontFamily: "'Montserrat', Arial, sans-serif",
    websiteUrl: "https://www.santaisabel.cl/",
    logoUrl: "/brands/santa-isabel.png",
  },
  "jumbo": {
    id: "jumbo",
    name: "Jumbo",
    primaryColor: "#0A8920",
    primaryForeground: "#FFFFFF",
    fontFamily: "'Montserrat', Arial, sans-serif",
    websiteUrl: "https://www.jumbo.cl/",
    logoUrl: "/brands/jumbo.png",
  },
  "spid": {
    id: "spid",
    name: "Spid",
    primaryColor: "#E91E8C",
    primaryForeground: "#FFFFFF",
    fontFamily: "'Montserrat', Arial, sans-serif",
    websiteUrl: "https://www.spid.cl/",
    logoUrl: "/brands/spid.png",
  },
};
