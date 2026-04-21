/**
 * Migración de documentos legacy que usan el campo `blocks: MailingBlock[]`
 * al nuevo esquema `rows: MailingRow[]`.
 *
 * Cada bloque legacy se convierte en una Row de una sola columna full-width.
 * Si el documento ya tiene `rows`, se devuelve intacto.
 */

import type { MailingBlock } from "../schema/block.types";
import type { MailingDocument } from "../schema/mailing.types";
import { fullWidthRow } from "./createRow";

type LegacyDocument = Omit<MailingDocument, "rows"> & {
  rows?: MailingDocument["rows"];
  /** @deprecated Reemplazado por rows. */
  blocks?: MailingBlock[];
};

export function migrateLegacyDocument(doc: LegacyDocument): MailingDocument {
  if (doc.rows && doc.rows.length > 0) {
    // Ya tiene rows — sin migración necesaria.
    return doc as MailingDocument;
  }

  const legacy = doc.blocks ?? [];
  const rows = legacy.map((block) => fullWidthRow(block));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { blocks: _dropped, ...rest } = doc;
  return { ...rest, rows };
}
