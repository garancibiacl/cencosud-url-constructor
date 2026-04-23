import type { LayoutSchema } from "../schema/layout-schema.types";

export const layoutRegistry: LayoutSchema[] = [
  {
    id: "full",
    label: "Completo",
    description: "Una columna a ancho completo",
    columns: [
      {
        id: "main",
        colSpan: 12,
        placeholders: [
          { type: "hero", label: "Contenido principal" },
          { type: "text", label: "Texto" },
        ],
      },
    ],
    tags: ["content"],
  },
  {
    id: "half",
    label: "1/2 · 1/2",
    description: "Dos columnas iguales",
    columns: [
      {
        id: "left",
        colSpan: 6,
        placeholders: [
          { type: "image", label: "Imagen" },
          { type: "text", label: "Texto" },
        ],
      },
      {
        id: "right",
        colSpan: 6,
        placeholders: [
          { type: "image", label: "Imagen" },
          { type: "text", label: "Texto" },
        ],
      },
    ],
    tags: ["catalog"],
  },
  {
    id: "two-one",
    label: "2/3 · 1/3",
    description: "Columna principal con lateral",
    columns: [
      {
        id: "main",
        colSpan: 8,
        placeholders: [
          { type: "image", label: "Imagen" },
          { type: "text", label: "Descripción" },
        ],
      },
      {
        id: "aside",
        colSpan: 4,
        placeholders: [
          { type: "button", label: "CTA" },
        ],
      },
    ],
    tags: ["content"],
  },
  {
    id: "one-two",
    label: "1/3 · 2/3",
    description: "Lateral con columna principal",
    columns: [
      {
        id: "aside",
        colSpan: 4,
        placeholders: [
          { type: "button", label: "CTA" },
        ],
      },
      {
        id: "main",
        colSpan: 8,
        placeholders: [
          { type: "image", label: "Imagen" },
          { type: "text", label: "Descripción" },
        ],
      },
    ],
    tags: ["content"],
  },
  {
    id: "third",
    label: "1/3 × 3",
    description: "Tres columnas iguales",
    columns: [
      {
        id: "col-1",
        colSpan: 4,
        placeholders: [
          { type: "image", label: "Imagen" },
          { type: "text", label: "Texto" },
        ],
      },
      {
        id: "col-2",
        colSpan: 4,
        placeholders: [
          { type: "image", label: "Imagen" },
          { type: "text", label: "Texto" },
        ],
      },
      {
        id: "col-3",
        colSpan: 4,
        placeholders: [
          { type: "image", label: "Imagen" },
          { type: "text", label: "Texto" },
        ],
      },
    ],
    tags: ["catalog"],
  },
  {
    id: "quarter",
    label: "1/4 × 4",
    description: "Cuatro columnas iguales",
    columns: [
      {
        id: "col-1",
        colSpan: 3,
        placeholders: [
          { type: "image", label: "Imagen" },
        ],
      },
      {
        id: "col-2",
        colSpan: 3,
        placeholders: [
          { type: "image", label: "Imagen" },
        ],
      },
      {
        id: "col-3",
        colSpan: 3,
        placeholders: [
          { type: "image", label: "Imagen" },
        ],
      },
      {
        id: "col-4",
        colSpan: 3,
        placeholders: [
          { type: "image", label: "Imagen" },
        ],
      },
    ],
    tags: ["catalog"],
  },
];

export const layoutRegistryMap: Record<string, LayoutSchema> = Object.fromEntries(
  layoutRegistry.map((l) => [l.id, l]),
);
