/**
 * Tipos para el sistema de layout Row / Column.
 *
 * Jerarquía del documento:
 *   MailingDocument → MailingRow[] → MailingColumn[] → MailingBlock[]
 *
 * Cada Row es un contenedor horizontal de N columnas que suman 12 partes.
 * Cada Column tiene un colSpan (1-12) y aloja bloques de forma vertical.
 */

import type { MailingBlock } from "./block.types";

// ---------------------------------------------------------------------------
// Presets de columna
// ---------------------------------------------------------------------------

export type ColumnPreset =
  | "full"       // [12]
  | "half"       // [6, 6]
  | "third"      // [4, 4, 4]
  | "quarter"    // [3, 3, 3, 3]
  | "two-one"    // [8, 4]
  | "one-two";   // [4, 8]

export interface ColumnPresetDefinition {
  label: string;
  spans: number[];
  /** Representación visual compacta para el picker de UI. */
  visual: string[];
}

export const COLUMN_PRESETS: Record<ColumnPreset, ColumnPresetDefinition> = {
  full:     { label: "Completo",    spans: [12],       visual: ["100%"] },
  half:     { label: "1/2 · 1/2",  spans: [6, 6],     visual: ["50%", "50%"] },
  third:    { label: "1/3 × 3",    spans: [4, 4, 4],  visual: ["33%", "33%", "33%"] },
  quarter:  { label: "1/4 × 4",    spans: [3, 3, 3, 3], visual: ["25%", "25%", "25%", "25%"] },
  "two-one": { label: "2/3 · 1/3", spans: [8, 4],     visual: ["66%", "33%"] },
  "one-two": { label: "1/3 · 2/3", spans: [4, 8],     visual: ["33%", "66%"] },
};

// ---------------------------------------------------------------------------
// Estructuras
// ---------------------------------------------------------------------------

export interface MailingColumn {
  id: string;
  /** Partes sobre 12 que ocupa esta columna dentro de la fila. */
  colSpan: number;
  blocks: MailingBlock[];
  meta?: {
    backgroundColor?: string;
    padding?: { top?: number; right?: number; bottom?: number; left?: number };
  };
}

export interface MailingRow {
  id: string;
  columns: MailingColumn[];
  meta?: {
    label?: string;
    backgroundColor?: string;
    padding?: { top?: number; right?: number; bottom?: number; left?: number };
  };
}
