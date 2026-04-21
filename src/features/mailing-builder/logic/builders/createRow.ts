import type { MailingBlock } from "../schema/block.types";
import type { ColumnPreset, MailingColumn, MailingRow } from "../schema/row.types";
import { COLUMN_PRESETS } from "../schema/row.types";

const uid = () => crypto.randomUUID().slice(0, 12);

export function createColumn(colSpan: number, blocks: MailingBlock[] = []): MailingColumn {
  return { id: `col-${uid()}`, colSpan, blocks };
}

/** Crea una Row vacía con las columnas del preset indicado. */
export function createRow(preset: ColumnPreset = "full"): MailingRow {
  const { spans } = COLUMN_PRESETS[preset];
  return {
    id: `row-${uid()}`,
    columns: spans.map((span) => createColumn(span)),
  };
}

/**
 * Atajo: Row con una única columna full-width que contiene los bloques dados.
 * Usado en migraciones y en la creación de templates.
 */
export function fullWidthRow(...blocks: MailingBlock[]): MailingRow {
  return {
    id: `row-${uid()}`,
    columns: [createColumn(12, blocks)],
  };
}
