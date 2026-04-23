import type { BrandId } from "../brands/brand.types";
import { brandShells } from "../brands/brandShells";

export interface PresetSection {
  id: string;
  label: string;
  brand: BrandId;
  category: "header" | "footer";
  html: string;
}

export const presetSections: PresetSection[] = [
  {
    id: "jumbo-header",
    label: "Header Jumbo",
    brand: "jumbo",
    category: "header",
    html: brandShells.jumbo.header,
  },
  {
    id: "santa-isabel-header",
    label: "Header Santa Isabel",
    brand: "santa-isabel",
    category: "header",
    html: brandShells["santa-isabel"].header,
  },
];

export const presetSectionsMap: Record<string, PresetSection> = Object.fromEntries(
  presetSections.map((p) => [p.id, p])
);
