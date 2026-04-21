/**
 * RowCanvas — renderiza una Row con sus columnas y bloques en el canvas de edición.
 *
 * PERFORMANCE:
 *   - RowCanvas:    React.memo — solo rerenderiza cuando SU row cambia
 *   - ColumnCanvas: React.memo — solo rerenderiza cuando SU columna cambia
 *   - BlockItem:    React.memo — solo rerenderiza cuando SU bloque o selección cambia
 *
 *   Zustand garantiza inmutabilidad: replaceBlockInRows / mapRows / mapColumns
 *   solo crean nuevas referencias para el path afectado. Con memo, los N-1
 *   componentes no afectados se saltean el render completamente.
 */

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Bookmark, Copy, GripHorizontal, MoveDown, MoveUp, Plus, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blockRegistry } from "../../logic/registry/blockRegistry";
import type { ColumnPreset, MailingColumn, MailingRow } from "../../logic/schema/row.types";
import { COLUMN_PRESETS } from "../../logic/schema/row.types";
import type { MailingBlock, MailingBlockType } from "../../logic/schema/block.types";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface DragSource {
  blockId: string;
  srcRowId: string;
  srcColId: string;
  srcIndex: number;
}

export interface RowCanvasProps {
  row: MailingRow;
  rowIndex: number;
  totalRows: number;
  selectedBlockId: string | null;
  selectedColId: string | null;
  onSelectBlock: (blockId: string, rowId: string, colId: string) => void;
  onSelectRow: (rowId: string) => void;
  onUpdateBlock: (nextBlock: MailingBlock) => void;
  onRemoveBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onMoveBlockWithinColumn: (rowId: string, colId: string, from: number, to: number) => void;
  onMoveBlockToColumn: (blockId: string, toRowId: string, toColId: string, toIndex: number) => void;
  onMoveRow: (fromIndex: number, toIndex: number) => void;
  onDuplicateRow: (rowId: string) => void;
  onRemoveRow: (rowId: string) => void;
  onSetRowPreset: (rowId: string, preset: ColumnPreset) => void;
  onInsertBlock: (type: MailingBlockType, rowId: string, colId: string, index: number) => void;
  dragRef: React.MutableRefObject<DragSource | null>;
}

// ---------------------------------------------------------------------------
// RowCanvas — memoizado: solo rerenderiza cuando SU fila cambia
// ---------------------------------------------------------------------------

export const RowCanvas = memo(function RowCanvas({
  row,
  rowIndex,
  totalRows,
  selectedBlockId,
  selectedColId,
  onSelectBlock,
  onSelectRow,
  onUpdateBlock,
  onRemoveBlock,
  onDuplicateBlock,
  onMoveBlockWithinColumn,
  onMoveBlockToColumn,
  onMoveRow,
  onDuplicateRow,
  onRemoveRow,
  onSetRowPreset,
  onInsertBlock,
  dragRef,
}: RowCanvasProps) {
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [dropTargetColId, setDropTargetColId] = useState<string | null>(null);
  const isRowSelected = selectedColId !== null && row.columns.some((c) => c.id === selectedColId);
  const currentPreset = detectPreset(row.columns);

  // Ref-pattern: permite que handleColDrop acceda a row.columns actualizado
  // sin recrear el callback (evita que ColumnCanvas rerender por prop nueva).
  const rowRef = useRef(row);
  useEffect(() => { rowRef.current = row; }, [row]);

  // ── Drag handlers (estables para que ColumnCanvas no rerender por estas props)

  const handleBlockDragStart = useCallback((
    e: React.DragEvent,
    block: MailingBlock,
    colId: string,
    index: number,
  ) => {
    e.stopPropagation();
    dragRef.current = { blockId: block.id, srcRowId: rowRef.current.id, srcColId: colId, srcIndex: index };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", block.id);
  }, [dragRef]);

  const handleColDragOver = useCallback((e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetColId(colId);
  }, []);

  const handleColDragLeave = useCallback(() => setDropTargetColId(null), []);

  const handleColDrop = useCallback((e: React.DragEvent, toColId: string, toIndex?: number) => {
    e.preventDefault();
    setDropTargetColId(null);

    const data = e.dataTransfer.getData("text/plain");
    const currentRow = rowRef.current;
    const col = currentRow.columns.find((c) => c.id === toColId);
    const insertAt = toIndex ?? col?.blocks.length ?? 0;

    if (data.startsWith("new:")) {
      const type = data.slice(4) as MailingBlockType;
      onInsertBlock(type, currentRow.id, toColId, insertAt);
      dragRef.current = null;
      return;
    }

    const src = dragRef.current;
    if (!src) return;

    if (src.srcRowId === currentRow.id && src.srcColId === toColId) {
      onMoveBlockWithinColumn(currentRow.id, toColId, src.srcIndex, insertAt);
    } else {
      onMoveBlockToColumn(src.blockId, currentRow.id, toColId, insertAt);
    }
    dragRef.current = null;
  }, [dragRef, onInsertBlock, onMoveBlockWithinColumn, onMoveBlockToColumn]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className={`group/row relative rounded-lg border transition-colors ${
        isRowSelected
          ? "border-primary/50 bg-primary/[0.02]"
          : "border-border bg-background hover:border-border/80"
      }`}
    >
      {/* Toolbar de fila */}
      <div className="flex items-center justify-between gap-2 border-b border-dashed border-border/60 px-3 py-1.5">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/60">
            Fila {rowIndex + 1}
          </span>
          {/* Preset picker */}
          <div className="relative">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setShowPresetPicker((v) => !v)}
              title="Cambiar layout de columnas"
            >
              <Settings2 className="h-3 w-3" />
            </Button>
            {showPresetPicker && (
              <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-border bg-card p-2 shadow-lg">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Layout de columnas
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(COLUMN_PRESETS) as ColumnPreset[]).map((preset) => {
                    const def = COLUMN_PRESETS[preset];
                    const isActive = currentPreset === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        title={def.label}
                        onClick={() => { onSetRowPreset(row.id, preset); setShowPresetPicker(false); }}
                        className={`flex items-center gap-0.5 rounded px-1.5 py-1 transition ${
                          isActive ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-secondary/60"
                        }`}
                      >
                        {def.spans.map((span, i) => (
                          <span
                            key={i}
                            className={`block h-5 rounded-sm ${isActive ? "bg-primary/60" : "bg-muted-foreground/30"}`}
                            style={{ width: `${(span / 12) * 60}px` }}
                          />
                        ))}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            disabled={rowIndex === 0}
            onClick={() => onMoveRow(rowIndex, rowIndex - 1)}
            title="Mover fila arriba"
          >
            <MoveUp className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            disabled={rowIndex === totalRows - 1}
            onClick={() => onMoveRow(rowIndex, rowIndex + 1)}
            title="Mover fila abajo"
          >
            <MoveDown className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onDuplicateRow(row.id)}
            title="Duplicar fila"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-destructive/70 hover:text-destructive"
            onClick={() => onRemoveRow(row.id)}
            title="Eliminar fila"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Grid de columnas */}
      <div
        className="flex gap-0 divide-x divide-dashed divide-border/50 p-2"
        onClick={() => onSelectRow(row.id)}
      >
        {row.columns.map((col) => (
          <ColumnCanvas
            key={col.id}
            col={col}
            rowId={row.id}
            isDropTarget={dropTargetColId === col.id}
            selectedBlockId={selectedBlockId}
            selectedColId={selectedColId}
            onSelectBlock={onSelectBlock}
            onUpdateBlock={onUpdateBlock}
            onRemoveBlock={onRemoveBlock}
            onDuplicateBlock={onDuplicateBlock}
            onMoveBlockWithinColumn={onMoveBlockWithinColumn}
            onBlockDragStart={handleBlockDragStart}
            onDragOver={handleColDragOver}
            onDragLeave={handleColDragLeave}
            onDrop={handleColDrop}
          />
        ))}
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// ColumnCanvas — memoizado: solo rerenderiza cuando SU columna cambia
// ---------------------------------------------------------------------------

interface ColumnCanvasProps {
  col: MailingColumn;
  rowId: string;
  isDropTarget: boolean;
  selectedBlockId: string | null;
  selectedColId: string | null;
  onSelectBlock: (blockId: string, rowId: string, colId: string) => void;
  onUpdateBlock: (nextBlock: MailingBlock) => void;
  onRemoveBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onMoveBlockWithinColumn: (rowId: string, colId: string, from: number, to: number) => void;
  onBlockDragStart: (e: React.DragEvent, block: MailingBlock, colId: string, index: number) => void;
  onDragOver: (e: React.DragEvent, colId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, colId: string, toIndex?: number) => void;
}

const ColumnCanvas = memo(function ColumnCanvas({
  col,
  rowId,
  isDropTarget,
  selectedBlockId,
  selectedColId,
  onSelectBlock,
  onUpdateBlock,
  onRemoveBlock,
  onDuplicateBlock,
  onMoveBlockWithinColumn,
  onBlockDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: ColumnCanvasProps) {
  const isColSelected = selectedColId === col.id;
  const fraction = `${Math.round((col.colSpan / 12) * 100)}%`;

  return (
    <div
      className={`flex flex-col gap-1.5 px-1.5 py-1.5 transition-colors ${
        isDropTarget ? "bg-primary/5 ring-1 ring-primary/30 ring-inset rounded" : ""
      } ${isColSelected ? "ring-1 ring-primary/20 ring-inset rounded" : ""}`}
      style={{ width: fraction, minWidth: 0 }}
      onDragOver={(e) => onDragOver(e, col.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, col.id)}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Label de columna */}
      <span className="select-none text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground/40">
        {fraction}
      </span>

      {/* Bloques — cada uno memoizado individualmente */}
      {col.blocks.map((block, index) => (
        <BlockItem
          key={block.id}
          block={block}
          index={index}
          totalInCol={col.blocks.length}
          colId={col.id}
          rowId={rowId}
          isSelected={block.id === selectedBlockId}
          onSelectBlock={onSelectBlock}
          onUpdateBlock={onUpdateBlock}
          onRemoveBlock={onRemoveBlock}
          onDuplicateBlock={onDuplicateBlock}
          onMoveBlockWithinColumn={onMoveBlockWithinColumn}
          onBlockDragStart={onBlockDragStart}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        />
      ))}

      {/* Drop zone al final de la columna */}
      <BlockDropZone
        onDrop={(e) => onDrop(e, col.id, col.blocks.length)}
        onDragOver={(e) => onDragOver(e, col.id)}
        onDragLeave={onDragLeave}
      />

      {/* Zona vacía si la columna no tiene bloques */}
      {col.blocks.length === 0 && (
        <div className="flex min-h-[64px] items-center justify-center rounded-md border border-dashed border-border/60">
          <p className="select-none text-[10px] text-muted-foreground/40">Arrastra un bloque aquí</p>
        </div>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// BlockItem — memoizado: solo rerenderiza cuando SU bloque o su posición cambia
// ---------------------------------------------------------------------------

interface BlockItemProps {
  block: MailingBlock;
  index: number;
  totalInCol: number;
  colId: string;
  rowId: string;
  isSelected: boolean;
  onSelectBlock: (blockId: string, rowId: string, colId: string) => void;
  onUpdateBlock: (nextBlock: MailingBlock) => void;
  onRemoveBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onMoveBlockWithinColumn: (rowId: string, colId: string, from: number, to: number) => void;
  onBlockDragStart: (e: React.DragEvent, block: MailingBlock, colId: string, index: number) => void;
  onDragOver: (e: React.DragEvent, colId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, colId: string, toIndex?: number) => void;
}

const BlockItem = memo(function BlockItem({
  block,
  index,
  totalInCol,
  colId,
  rowId,
  isSelected,
  onSelectBlock,
  onUpdateBlock,
  onRemoveBlock,
  onDuplicateBlock,
  onMoveBlockWithinColumn,
  onBlockDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: BlockItemProps) {
  const BlockView = blockRegistry[block.type].View;
  const blockRef = useRef<HTMLDivElement>(null);
  const [dropHalf, setDropHalf] = useState<"top" | "bottom" | null>(null);

  const handleSelect = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); onSelectBlock(block.id, rowId, colId); },
    [block.id, rowId, colId, onSelectBlock],
  );

  const handleMoveUp = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); onMoveBlockWithinColumn(rowId, colId, index, index - 1); },
    [rowId, colId, index, onMoveBlockWithinColumn],
  );

  const handleMoveDown = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); onMoveBlockWithinColumn(rowId, colId, index, index + 1); },
    [rowId, colId, index, onMoveBlockWithinColumn],
  );

  const handleDuplicate = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); onDuplicateBlock(block.id); },
    [block.id, onDuplicateBlock],
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); onRemoveBlock(block.id); },
    [block.id, onRemoveBlock],
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => onBlockDragStart(e, block, colId, index),
    [block, colId, index, onBlockDragStart],
  );

  const handleBlockDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOver(e, colId);
    if (!blockRef.current) return;
    const rect = blockRef.current.getBoundingClientRect();
    setDropHalf(e.clientY < rect.top + rect.height / 2 ? "top" : "bottom");
  }, [onDragOver, colId]);

  const handleBlockDragLeave = useCallback(() => {
    setDropHalf(null);
    onDragLeave();
  }, [onDragLeave]);

  const handleBlockDrop = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    const half = dropHalf ?? "bottom";
    setDropHalf(null);
    onDrop(e, colId, half === "top" ? index : index + 1);
  }, [dropHalf, onDrop, colId, index]);

  // BlockView onChange — estable mientras onUpdateBlock sea estable (acción Zustand)
  const handleChange = useCallback(
    (nextBlock: typeof block) => onUpdateBlock(nextBlock as MailingBlock),
    [onUpdateBlock],
  );

  return (
    <div className="relative">
      {/* Pill flotante — solo visible cuando está seleccionado */}
      {isSelected && (
        <div className="absolute -top-5 left-1/2 z-30 -translate-x-1/2">
          <div className="flex items-center gap-0.5 rounded-full border border-border bg-card px-2 py-1 shadow-lg">
            {/* Arrastrar */}
            <span
              draggable
              onDragStart={handleDragStart}
              className="flex h-6 w-6 cursor-grab items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground active:cursor-grabbing"
              title="Arrastrar"
            >
              <GripHorizontal className="h-3.5 w-3.5" />
            </span>

            <div className="mx-0.5 h-3.5 w-px bg-border/60" />

            {/* Subir */}
            <button
              type="button"
              disabled={index === 0}
              onClick={handleMoveUp}
              title="Mover arriba"
              className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-30"
            >
              <MoveUp className="h-3.5 w-3.5" />
            </button>

            {/* Bajar */}
            <button
              type="button"
              disabled={index === totalInCol - 1}
              onClick={handleMoveDown}
              title="Mover abajo"
              className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-30"
            >
              <MoveDown className="h-3.5 w-3.5" />
            </button>

            <div className="mx-0.5 h-3.5 w-px bg-border/60" />

            {/* Duplicar */}
            <button
              type="button"
              onClick={handleDuplicate}
              title="Duplicar"
              className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>

            {/* Guardar */}
            <button
              type="button"
              title="Guardar bloque"
              className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <Bookmark className="h-3.5 w-3.5" />
            </button>

            {/* Eliminar */}
            <button
              type="button"
              onClick={handleRemove}
              title="Eliminar"
              className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-red-50 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div
        ref={blockRef}
        data-mailing-block="true"
        className={`group/block relative rounded-lg border transition-all ${
          isSelected
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-transparent bg-card hover:border-border/60"
        } ${dropHalf ? "ring-2 ring-primary/40" : ""}`}
        onClick={handleSelect}
        onDragOver={handleBlockDragOver}
        onDragLeave={handleBlockDragLeave}
        onDrop={handleBlockDrop}
      >
        {/* Indicador de posición de drop */}
        {dropHalf === "top" && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 rounded-full bg-primary shadow-[0_0_6px_2px_rgba(var(--primary)/0.4)]" />
        )}
        {dropHalf === "bottom" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-0.5 rounded-full bg-primary shadow-[0_0_6px_2px_rgba(var(--primary)/0.4)]" />
        )}

        {/* Vista del bloque */}
        <div className="p-1.5">
          <BlockView
            block={block}
            isSelected={isSelected}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// BlockDropZone — indicador visual de drop entre bloques
// ---------------------------------------------------------------------------

function BlockDropZone({
  onDrop,
  onDragOver,
  onDragLeave,
}: {
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
}) {
  const [active, setActive] = useState(false);

  return (
    <div
      className={`h-1.5 w-full rounded transition-colors ${active ? "bg-primary/50" : ""}`}
      onDragOver={(e) => { setActive(true); onDragOver(e); }}
      onDragLeave={() => { setActive(false); onDragLeave(); }}
      onDrop={(e) => { setActive(false); onDrop(e); }}
    />
  );
}

// ---------------------------------------------------------------------------
// detectPreset — helper que infiere el preset a partir de los colSpans
// ---------------------------------------------------------------------------

function detectPreset(columns: MailingColumn[]): ColumnPreset | null {
  const spans = columns.map((c) => c.colSpan);
  const entry = (Object.entries(COLUMN_PRESETS) as [ColumnPreset, typeof COLUMN_PRESETS[ColumnPreset]][]).find(
    ([, def]) => def.spans.length === spans.length && def.spans.every((s, i) => s === spans[i]),
  );
  return entry ? entry[0] : null;
}

// ---------------------------------------------------------------------------
// AddRowButton — selector de preset para agregar filas
// ---------------------------------------------------------------------------

export function AddRowButton({ onAdd }: { onAdd: (preset: ColumnPreset) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex justify-center">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 border-dashed text-muted-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar fila
      </Button>
      {open && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-lg border border-border bg-card p-2 shadow-lg">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Elegir layout
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(COLUMN_PRESETS) as ColumnPreset[]).map((preset) => {
              const def = COLUMN_PRESETS[preset];
              return (
                <button
                  key={preset}
                  type="button"
                  title={def.label}
                  onClick={() => { onAdd(preset); setOpen(false); }}
                  className="flex items-center gap-0.5 rounded border border-border px-2 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition"
                >
                  {def.spans.map((span, i) => (
                    <span
                      key={i}
                      className="block h-4 rounded-sm bg-muted-foreground/30"
                      style={{ width: `${(span / 12) * 48}px` }}
                    />
                  ))}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
