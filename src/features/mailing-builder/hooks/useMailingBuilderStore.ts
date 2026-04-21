import { create } from "zustand";
import type { MailingBlock, MailingBlockType } from "../logic/schema/block.types";
import type { ColumnPreset, MailingColumn, MailingRow } from "../logic/schema/row.types";
import type { MailingDocument, MailingSettings } from "../logic/schema/mailing.types";
import { COLUMN_PRESETS } from "../logic/schema/row.types";
import { blockRegistry } from "../logic/registry/blockRegistry";
import { createColumn, createRow } from "../logic/builders/createRow";
import { createDefaultMailing } from "../logic/builders/createDefaultMailing";

// ---------------------------------------------------------------------------
// Tipos del estado
// ---------------------------------------------------------------------------

interface MailingBuilderState {
  document: MailingDocument;

  /** ID del bloque seleccionado (para el inspector). */
  selectedBlockId: string | null;
  /** ID de la row que contiene el bloque/columna seleccionado/a. */
  selectedRowId: string | null;
  /** ID de la columna seleccionada (destino para "añadir bloque"). */
  selectedColId: string | null;

  devicePreview: "desktop" | "mobile";
  activeMailingId: string | null;

  // ── Selección ─────────────────────────────────────────────────────────────
  /** Selecciona un bloque; opcionalmente proporciona contexto row/col. */
  selectBlock: (blockId: string | null, rowId?: string | null, colId?: string | null) => void;
  /** Selecciona una row (sin bloque específico). */
  selectRow: (rowId: string | null) => void;

  // ── Operaciones de Row ────────────────────────────────────────────────────
  addRow: (preset?: ColumnPreset, afterRowId?: string) => void;
  removeRow: (rowId: string) => void;
  moveRow: (fromIndex: number, toIndex: number) => void;
  duplicateRow: (rowId: string) => void;
  /** Cambia el preset de columnas de una row, migrando bloques existentes. */
  setRowPreset: (rowId: string, preset: ColumnPreset) => void;

  // ── Operaciones de Bloque ─────────────────────────────────────────────────
  /**
   * Inserta un bloque nuevo.
   * - Si hay colId seleccionado: lo añade al final de esa columna.
   * - Si no: crea una Row full-width al final del documento.
   */
  insertBlock: (type: MailingBlockType) => void;
  /** Inserta un bloque nuevo en una columna y posición específicas (drag & drop desde panel). */
  insertBlockAtColumn: (type: MailingBlockType, rowId: string, colId: string, index: number) => void;
  removeBlock: (blockId: string) => void;
  duplicateBlock: (blockId: string) => void;
  /** Mueve un bloque dentro de la misma columna. */
  moveBlockWithinColumn: (rowId: string, colId: string, fromIndex: number, toIndex: number) => void;
  /** Mueve un bloque a cualquier columna (drag & drop cross-column). */
  moveBlockToColumn: (blockId: string, toRowId: string, toColId: string, toIndex: number) => void;
  /** Reemplaza un bloque por su id (inmutable). */
  updateBlock: (nextBlock: MailingBlock) => void;

  // ── Operaciones de Documento ──────────────────────────────────────────────
  updateDocumentName: (name: string) => void;
  updateSettings: <K extends keyof MailingSettings>(key: K, value: MailingSettings[K]) => void;
  updateLinkTracking: <K extends keyof MailingSettings["linkTracking"]>(key: K, value: MailingSettings["linkTracking"][K]) => void;
  updateDocument: (updater: (current: MailingDocument) => MailingDocument) => void;
  replaceDocument: (document: MailingDocument, mailingId?: string | null) => void;
  setActiveMailingId: (mailingId: string | null) => void;
}

// ---------------------------------------------------------------------------
// Helpers inmutables
// ---------------------------------------------------------------------------

const mapRows = (
  rows: MailingRow[],
  rowId: string,
  fn: (row: MailingRow) => MailingRow,
): MailingRow[] => rows.map((r) => (r.id === rowId ? fn(r) : r));

const mapColumns = (
  row: MailingRow,
  colId: string,
  fn: (col: MailingColumn) => MailingColumn,
): MailingRow => ({
  ...row,
  columns: row.columns.map((c) => (c.id === colId ? fn(c) : c)),
});

/** Busca un bloque en todo el árbol rows → columns → blocks */
const findBlock = (
  rows: MailingRow[],
  blockId: string,
): { block: MailingBlock; rowId: string; colId: string; index: number } | null => {
  for (const row of rows) {
    for (const col of row.columns) {
      const index = col.blocks.findIndex((b) => b.id === blockId);
      if (index >= 0) return { block: col.blocks[index], rowId: row.id, colId: col.id, index };
    }
  }
  return null;
};

/** Elimina un bloque del árbol sin importar dónde esté */
const deleteBlockFromRows = (rows: MailingRow[], blockId: string): MailingRow[] =>
  rows.map((row) => ({
    ...row,
    columns: row.columns.map((col) => ({
      ...col,
      blocks: col.blocks.filter((b) => b.id !== blockId),
    })),
  }));

/** Actualiza un bloque sin importar dónde esté */
const replaceBlockInRows = (rows: MailingRow[], nextBlock: MailingBlock): MailingRow[] =>
  rows.map((row) => ({
    ...row,
    columns: row.columns.map((col) => ({
      ...col,
      blocks: col.blocks.map((b) => (b.id === nextBlock.id ? nextBlock : b)),
    })),
  }));

const cloneBlock = (block: MailingBlock): MailingBlock =>
  structuredClone({ ...block, id: `${block.type}-${crypto.randomUUID().slice(0, 8)}` });

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useMailingBuilderStore = create<MailingBuilderState>((set, get) => ({
  document: createDefaultMailing(),
  selectedBlockId: null,
  selectedRowId: null,
  selectedColId: null,
  devicePreview: "desktop",
  activeMailingId: null,

  // ── Selección ─────────────────────────────────────────────────────────────

  selectBlock: (blockId, rowId = null, colId = null) =>
    set({ selectedBlockId: blockId, selectedRowId: rowId, selectedColId: colId }),

  selectRow: (rowId) =>
    set({ selectedRowId: rowId, selectedBlockId: null, selectedColId: null }),

  // ── Row ───────────────────────────────────────────────────────────────────

  addRow: (preset = "full", afterRowId) => set((state) => {
    const newRow = createRow(preset);
    const rows = [...state.document.rows];

    if (afterRowId) {
      const idx = rows.findIndex((r) => r.id === afterRowId);
      if (idx >= 0) {
        rows.splice(idx + 1, 0, newRow);
      } else {
        rows.push(newRow);
      }
    } else {
      rows.push(newRow);
    }

    return {
      document: { ...state.document, rows },
      selectedRowId: newRow.id,
      selectedColId: newRow.columns[0]?.id ?? null,
      selectedBlockId: null,
    };
  }),

  removeRow: (rowId) => set((state) => ({
    document: {
      ...state.document,
      rows: state.document.rows.filter((r) => r.id !== rowId),
    },
    selectedBlockId: state.selectedRowId === rowId ? null : state.selectedBlockId,
    selectedRowId: state.selectedRowId === rowId ? null : state.selectedRowId,
    selectedColId: state.selectedRowId === rowId ? null : state.selectedColId,
  })),

  moveRow: (fromIndex, toIndex) => set((state) => {
    const rows = [...state.document.rows];
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= rows.length || toIndex >= rows.length) return state;
    const [moved] = rows.splice(fromIndex, 1);
    rows.splice(toIndex, 0, moved);
    return { document: { ...state.document, rows } };
  }),

  duplicateRow: (rowId) => set((state) => {
    const index = state.document.rows.findIndex((r) => r.id === rowId);
    if (index < 0) return state;

    const cloned: MailingRow = structuredClone({
      ...state.document.rows[index],
      id: `row-${crypto.randomUUID().slice(0, 12)}`,
      columns: state.document.rows[index].columns.map((col) => ({
        ...col,
        id: `col-${crypto.randomUUID().slice(0, 12)}`,
        blocks: col.blocks.map((b) => ({ ...b, id: `${b.type}-${crypto.randomUUID().slice(0, 8)}` })),
      })),
    });

    const rows = [...state.document.rows];
    rows.splice(index + 1, 0, cloned);
    return {
      document: { ...state.document, rows },
      selectedRowId: cloned.id,
      selectedBlockId: null,
      selectedColId: cloned.columns[0]?.id ?? null,
    };
  }),

  setRowPreset: (rowId, preset) => set((state) => {
    const row = state.document.rows.find((r) => r.id === rowId);
    if (!row) return state;

    const { spans } = COLUMN_PRESETS[preset];
    const existing = row.columns;

    const newColumns: MailingColumn[] = spans.map((span, idx) => {
      if (idx < existing.length) {
        // Reutilizar columna existente con nuevo span
        return { ...existing[idx], colSpan: span };
      }
      return createColumn(span);
    });

    // Bloques huérfanos (columnas que sobran) → se meten en la última columna
    if (existing.length > spans.length) {
      const orphans = existing.slice(spans.length).flatMap((col) => col.blocks);
      const last = newColumns[newColumns.length - 1];
      newColumns[newColumns.length - 1] = { ...last, blocks: [...last.blocks, ...orphans] };
    }

    return {
      document: {
        ...state.document,
        rows: mapRows(state.document.rows, rowId, (r) => ({ ...r, columns: newColumns })),
      },
    };
  }),

  // ── Bloque ────────────────────────────────────────────────────────────────

  insertBlock: (type) => set((state) => {
    const newBlock = blockRegistry[type].create();
    const { selectedRowId, selectedColId } = state;

    // Caso 1: hay columna seleccionada → añadir allí
    if (selectedRowId && selectedColId) {
      const rows = mapRows(state.document.rows, selectedRowId, (row) =>
        mapColumns(row, selectedColId, (col) => ({
          ...col,
          blocks: [...col.blocks, newBlock],
        })),
      );
      return { document: { ...state.document, rows }, selectedBlockId: newBlock.id };
    }

    // Caso 2: sin contexto → nueva row full-width al final
    const newRow: MailingRow = {
      id: `row-${crypto.randomUUID().slice(0, 12)}`,
      columns: [createColumn(12, [newBlock])],
    };

    return {
      document: { ...state.document, rows: [...state.document.rows, newRow] },
      selectedBlockId: newBlock.id,
      selectedRowId: newRow.id,
      selectedColId: newRow.columns[0].id,
    };
  }),

  insertBlockAtColumn: (type, rowId, colId, index) => set((state) => {
    const newBlock = blockRegistry[type].create();
    const rows = mapRows(state.document.rows, rowId, (row) =>
      mapColumns(row, colId, (col) => {
        const blocks = [...col.blocks];
        blocks.splice(index, 0, newBlock);
        return { ...col, blocks };
      }),
    );
    return {
      document: { ...state.document, rows },
      selectedBlockId: newBlock.id,
      selectedRowId: rowId,
      selectedColId: colId,
    };
  }),

  removeBlock: (blockId) => set((state) => ({
    document: { ...state.document, rows: deleteBlockFromRows(state.document.rows, blockId) },
    selectedBlockId: state.selectedBlockId === blockId ? null : state.selectedBlockId,
  })),

  duplicateBlock: (blockId) => set((state) => {
    const found = findBlock(state.document.rows, blockId);
    if (!found) return state;

    const { rowId, colId, index } = found;
    const cloned = cloneBlock(found.block);

    const rows = mapRows(state.document.rows, rowId, (row) =>
      mapColumns(row, colId, (col) => {
        const blocks = [...col.blocks];
        blocks.splice(index + 1, 0, cloned);
        return { ...col, blocks };
      }),
    );

    return {
      document: { ...state.document, rows },
      selectedBlockId: cloned.id,
      selectedRowId: rowId,
      selectedColId: colId,
    };
  }),

  moveBlockWithinColumn: (rowId, colId, fromIndex, toIndex) => set((state) => {
    const rows = mapRows(state.document.rows, rowId, (row) =>
      mapColumns(row, colId, (col) => {
        const blocks = [...col.blocks];
        if (fromIndex < 0 || toIndex < 0 || fromIndex >= blocks.length || toIndex >= blocks.length) {
          return col;
        }
        const [moved] = blocks.splice(fromIndex, 1);
        blocks.splice(toIndex, 0, moved);
        return { ...col, blocks };
      }),
    );
    return { document: { ...state.document, rows } };
  }),

  moveBlockToColumn: (blockId, toRowId, toColId, toIndex) => set((state) => {
    const found = findBlock(state.document.rows, blockId);
    if (!found) return state;

    // 1. Eliminar de origen
    let rows = deleteBlockFromRows(state.document.rows, blockId);

    // 2. Insertar en destino
    rows = mapRows(rows, toRowId, (row) =>
      mapColumns(row, toColId, (col) => {
        const blocks = [...col.blocks];
        const insertAt = Math.min(toIndex, blocks.length);
        blocks.splice(insertAt, 0, found.block);
        return { ...col, blocks };
      }),
    );

    return {
      document: { ...state.document, rows },
      selectedBlockId: blockId,
      selectedRowId: toRowId,
      selectedColId: toColId,
    };
  }),

  updateBlock: (nextBlock) => set((state) => ({
    document: { ...state.document, rows: replaceBlockInRows(state.document.rows, nextBlock) },
  })),

  // ── Documento ─────────────────────────────────────────────────────────────

  updateDocumentName: (name) => set((state) => ({
    document: { ...state.document, name },
  })),

  updateSettings: (key, value) => set((state) => ({
    document: {
      ...state.document,
      settings: { ...state.document.settings, [key]: value },
    },
  })),

  updateLinkTracking: (key, value) => set((state) => ({
    document: {
      ...state.document,
      settings: {
        ...state.document.settings,
        linkTracking: { ...state.document.settings.linkTracking, [key]: value },
      },
    },
  })),

  updateDocument: (updater) => set((state) => ({
    document: updater(state.document),
  })),

  replaceDocument: (document, mailingId = null) =>
    set({ document, activeMailingId: mailingId, selectedBlockId: null, selectedRowId: null, selectedColId: null }),

  setActiveMailingId: (mailingId) => set({ activeMailingId: mailingId }),
}));
