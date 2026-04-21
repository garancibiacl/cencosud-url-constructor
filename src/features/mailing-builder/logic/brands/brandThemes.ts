import type { BrandId, BrandTheme } from "./brand.types";

export const brandThemes: Record<BrandId, BrandTheme> = {
  "santa-isabel": {
    id: "santa-isabel",
    name: "Santa Isabel",
    primaryColor: "#de0610",
    primaryForeground: "#FFFFFF",
    fontFamily: "'Montserrat', Arial, sans-serif",
    websiteUrl: "https://www.santaisabel.cl/",
  },
  "jumbo": {
    id: "jumbo",
    name: "Jumbo",
    primaryColor: "#0A8920",
    primaryForeground: "#FFFFFF",
    fontFamily: "'Montserrat', Arial, sans-serif",
    websiteUrl: "https://www.jumbo.cl/",
  },
};
