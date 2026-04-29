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

import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { Copy, GripHorizontal, GripVertical, LayoutGrid, MoveDown, MoveUp, Plus, Trash2 } from "lucide-react";
import { inspectorFocusBridge } from "../inspectorFocusBridge";
import { blockActionBridge } from "../blockActionBridge";

// Custom MIME types — permiten distinguir tipo de drag en dragOver (sin leer contenido)
const SECTION_DRAG_TYPE = "application/mailing-section";
const ROW_DRAG_TYPE    = "application/mailing-row";
const BLOCK_DRAG_TYPE  = "application/mailing-block";
import { Button } from "@/components/ui/button";
import { blockRegistry } from "../../logic/registry/blockRegistry";
import { layoutRegistry, layoutRegistryMap } from "../../logic/registry/layoutRegistry";
import type { LayoutColumnSchema } from "../../logic/schema/layout-schema.types";
import type { MailingColumn, MailingRow } from "../../logic/schema/row.types";
import type { MailingBlock, MailingBlockType } from "../../logic/schema/block.types";
import { ColumnPlaceholder } from "./ColumnPlaceholder";
import { BlockDropIndicator } from "./RowDropIndicator";

// ---------------------------------------------------------------------------
// Tip — tooltip pill sin flecha, estilo dark pill
// ---------------------------------------------------------------------------

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group/tip relative">
      {children}
      <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 scale-95 whitespace-nowrap rounded-full bg-gray-900 px-3 py-1.5 text-xs font-medium leading-none text-white opacity-0 shadow-xl transition-all duration-150 group-hover/tip:scale-100 group-hover/tip:opacity-100">
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Level color tokens
// ---------------------------------------------------------------------------

const LEVEL = {
  row:   { border: "#7C3AED", bg: "#7C3AED14", hover: "#7C3AED22", label: "Sección" },
  col:   { border: "#2563EB", bg: "#2563EB10", hover: "#2563EB1A", label: "Columna" },
  block: { border: "#4B5563", bg: "#4B556308", hover: "#4B556318", label: "" },
} as const;

// ---------------------------------------------------------------------------
// InsertionGap — drop zone visible entre bloques durante un drag
// ---------------------------------------------------------------------------

function InsertionGap({
  isActive,
  isDragging,
  isLast = false,
}: {
  isActive: boolean;
  isDragging: boolean;
  isLast?: boolean;
}) {
  if (!isDragging && !isActive) return null;
  if (isActive) return <BlockDropIndicator />;
  return (
    <div
      aria-hidden
      className={`pointer-events-none flex items-center px-0.5 ${isLast ? "h-12" : "h-4"}`}
    >
      <span className="h-px flex-1 rounded-full border-t border-dashed border-violet-300/40 dark:border-violet-700/30" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Block label map
// ---------------------------------------------------------------------------

const BLOCK_LABELS: Record<string, string> = {
  hero: "Hero",
  text: "Texto",
  image: "Imagen",
  button: "Botón",
  spacer: "Espacio",
};

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
  selectedRowId: string | null;
  selectedLevel: "row" | "col" | "block" | null;
  devicePreview?: "desktop" | "mobile";
  onSelectBlock: (blockId: string, rowId: string, colId: string) => void;
  onSelectRow: (rowId: string) => void;
  onSelectCol: (colId: string, rowId: string) => void;
  onUpdateBlock: (nextBlock: MailingBlock) => void;
  onRemoveBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onMoveBlockWithinColumn: (rowId: string, colId: string, from: number, to: number) => void;
  onMoveBlockToColumn: (blockId: string, toRowId: string, toColId: string, toIndex: number) => void;
  onMoveRow: (fromIndex: number, toIndex: number) => void;
  onDuplicateRow: (rowId: string) => void;
  onRemoveRow: (rowId: string) => void;
  onSetRowPreset: (rowId: string, preset: string) => void;
  onInsertBlock: (type: MailingBlockType, rowId: string, colId: string, index: number) => void;
  onMutateRowLayout?: (rowId: string, layoutId: string) => void;
  dragRef: React.MutableRefObject<DragSource | null>;
  rowDragRef: React.MutableRefObject<{ rowId: string; fromIndex: number } | null>;
}

// ---------------------------------------------------------------------------
// SelectionBreadcrumb
// ---------------------------------------------------------------------------

interface SelectionBreadcrumbProps {
  rowIndex: number;
  colFraction: string | null;
  blockLabel: string | null;
  level: "row" | "col" | "block" | null;
  onRow: () => void;
  onCol: () => void;
  onBlock: () => void;
}

function SelectionBreadcrumb({
  rowIndex,
  colFraction,
  blockLabel,
  level,
  onRow,
  onCol,
  onBlock,
}: SelectionBreadcrumbProps) {
  const crumbs: { label: string; onClick: () => void; active: boolean }[] = [
    { label: `Sección ${rowIndex + 1}`, onClick: onRow, active: level === "row" },
  ];

  if (level === "col" || level === "block") {
    crumbs.push({
      label: colFraction ? `Col ${colFraction}` : "Columna",
      onClick: onCol,
      active: level === "col",
    });
  }

  if (level === "block" && blockLabel) {
    crumbs.push({ label: blockLabel, onClick: onBlock, active: true });
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-card px-2 py-0.5 shadow-md text-[10px] font-medium">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-0.5">
          {i > 0 && <span className="text-muted-foreground/40 mx-0.5">›</span>}
          <button
            type="button"
            onClick={crumb.onClick}
            className={`rounded px-1 py-0.5 transition-colors ${
              crumb.active
                ? "text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {crumb.label}
          </button>
        </span>
      ))}
    </div>
  );
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
  selectedRowId,
  selectedLevel,
  devicePreview,
  onSelectBlock,
  onSelectRow,
  onSelectCol,
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
  onMutateRowLayout,
  dragRef,
  rowDragRef,
}: RowCanvasProps) {
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [dropTargetColId, setDropTargetColId] = useState<string | null>(null);
  const [appendDragOver, setAppendDragOver] = useState(false);

  // Reset all drag state on dragend (cancelled drags, drops with stopPropagation).
  useEffect(() => {
    const reset = () => { setAppendDragOver(false); setDropTargetColId(null); };
    document.addEventListener("dragend", reset);
    return () => document.removeEventListener("dragend", reset);
  }, []);

  const isThisRowActive = selectedRowId === row.id;
  const isRowLevel = isThisRowActive && selectedLevel === "row";
  const isColOrBlockLevel = isThisRowActive && (selectedLevel === "col" || selectedLevel === "block");

  // Determine active layout from layoutId or infer from spans for legacy rows
  const currentLayoutId = row.layoutId ?? null;

  // Breadcrumb data
  const activeCol = row.columns.find((c) => c.id === selectedColId);
  const colFraction = activeCol ? `${Math.round((activeCol.colSpan / 12) * 100)}%` : null;
  const activeBlock = activeCol?.blocks.find((b) => b.id === selectedBlockId);
  const blockLabel = activeBlock ? (BLOCK_LABELS[activeBlock.type] ?? null) : null;

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
    e.dataTransfer.setData(BLOCK_DRAG_TYPE, block.id);
  }, [dragRef]);

  const handleColDragOver = useCallback((e: React.DragEvent, colId: string) => {
    const { types } = e.dataTransfer;
    if (types.includes(SECTION_DRAG_TYPE) || types.includes(ROW_DRAG_TYPE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetColId(colId);
  }, []);

  const handleColDragLeave = useCallback(() => setDropTargetColId(null), []);

  const handleColDrop = useCallback((e: React.DragEvent, toColId: string, toIndex?: number) => {
    const { types } = e.dataTransfer;
    if (types.includes(SECTION_DRAG_TYPE) || types.includes(ROW_DRAG_TYPE)) return;
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

  // ── Append zone: catches block drops below all columns (adds to widest col)
  const handleAppendDragOver = useCallback((e: React.DragEvent) => {
    const { types } = e.dataTransfer;
    if (!types.includes(BLOCK_DRAG_TYPE)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setAppendDragOver(true);
  }, []);

  const handleAppendDragLeave = useCallback(() => setAppendDragOver(false), []);

  const handleAppendDrop = useCallback((e: React.DragEvent) => {
    const { types } = e.dataTransfer;
    if (!types.includes(BLOCK_DRAG_TYPE)) return;
    e.preventDefault();
    e.stopPropagation();
    setAppendDragOver(false);

    const data = e.dataTransfer.getData("text/plain");
    const currentRow = rowRef.current;
    // Target the widest column (or first if all equal)
    const targetCol = currentRow.columns.reduce((best, col) =>
      col.colSpan >= best.colSpan ? col : best, currentRow.columns[0]);
    const insertAt = targetCol.blocks.length;

    if (data.startsWith("new:")) {
      const type = data.slice(4) as MailingBlockType;
      onInsertBlock(type, currentRow.id, targetCol.id, insertAt);
      dragRef.current = null;
      return;
    }

    const src = dragRef.current;
    if (!src) return;
    if (src.srcRowId === currentRow.id && src.srcColId === targetCol.id) {
      onMoveBlockWithinColumn(currentRow.id, targetCol.id, src.srcIndex, insertAt);
    } else {
      onMoveBlockToColumn(src.blockId, currentRow.id, targetCol.id, insertAt);
    }
    dragRef.current = null;
  }, [dragRef, onInsertBlock, onMoveBlockWithinColumn, onMoveBlockToColumn]);

  // Stable callbacks for column-level selection
  const handleSelectRow = useCallback(() => onSelectRow(row.id), [onSelectRow, row.id]);

  // Callback for clicking a placeholder button within a column
  const makeInsertInColumn = useCallback(
    (colId: string) => (type: MailingBlockType) => onInsertBlock(type, row.id, colId, 0),
    [row.id, onInsertBlock],
  );

  // ── Row border/bg styles
  const rowBorderStyle = isRowLevel
    ? { borderColor: LEVEL.row.border, backgroundColor: LEVEL.row.bg }
    : isColOrBlockLevel
      ? { borderColor: `${LEVEL.row.border}60` }
      : undefined;

  // Schema for the current row (if any)
  const rowSchema = currentLayoutId ? layoutRegistryMap[currentLayoutId] : undefined;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className={`group/row relative rounded-lg border transition-colors ${
        isThisRowActive ? "" : "border-border bg-background hover:border-violet-500/20"
      }`}
      style={rowBorderStyle}
    >
      {/* Sección label */}
      {isThisRowActive && (
        <div
          className="absolute -top-2.5 left-2 z-20 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-white"
          style={{ backgroundColor: isRowLevel ? LEVEL.row.border : `${LEVEL.row.border}99` }}
        >
          Sección {rowIndex + 1}
        </div>
      )}

      {/* Breadcrumb */}
      {isThisRowActive && (
        <div className="absolute -top-7 left-0 z-30">
          <SelectionBreadcrumb
            rowIndex={rowIndex}
            colFraction={colFraction}
            blockLabel={blockLabel}
            level={selectedLevel}
            onRow={handleSelectRow}
            onCol={() => {
              if (activeCol) onSelectCol(activeCol.id, row.id);
            }}
            onBlock={() => {
              if (activeBlock && activeCol) {
                onSelectBlock(activeBlock.id, row.id, activeCol.id);
              }
            }}
          />
        </div>
      )}

      {/* Toolbar de fila */}
      <div data-mailing-block="true" className="flex items-center justify-between gap-2 border-b border-dashed border-border/60 px-3 py-1.5">
        <div className="flex items-center gap-1">
          {/* Row drag handle */}
          <span
            draggable
            onDragStart={(e) => {
              e.stopPropagation();
              e.dataTransfer.setData("text/plain", `row:${row.id}`);
              e.dataTransfer.setData(ROW_DRAG_TYPE, row.id);
              e.dataTransfer.effectAllowed = "move";
              rowDragRef.current = { rowId: row.id, fromIndex: rowIndex };
            }}
            className="flex h-7 w-6 cursor-grab items-center justify-center rounded text-violet-400/50 transition hover:bg-violet-50 hover:text-violet-500 active:cursor-grabbing"
            title="Reordenar sección"
          >
            <GripVertical size={16} strokeWidth={1.5} />
          </span>
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
              <LayoutGrid size={14} strokeWidth={1.5} />
            </Button>
            {showPresetPicker && (
              <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-border bg-card p-2 shadow-lg">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Layout de columnas
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {layoutRegistry.map((layout) => {
                    const isActive = currentLayoutId === layout.id;
                    return (
                      <button
                        key={layout.id}
                        type="button"
                        title={layout.label}
                        onClick={() => {
                          if (onMutateRowLayout) {
                            onMutateRowLayout(row.id, layout.id);
                          } else {
                            onSetRowPreset(row.id, layout.id);
                          }
                          setShowPresetPicker(false);
                        }}
                        className={`flex flex-col gap-1 rounded px-1.5 py-1.5 transition ${
                          isActive ? "" : "hover:bg-secondary/60"
                        }`}
                        style={isActive ? {
                          backgroundColor: "var(--mb-brand-10)",
                          outline: "1px solid var(--mb-brand-30)",
                          outlineOffset: "-1px",
                        } : undefined}
                      >
                        <div className="flex items-center gap-0.5">
                          {layout.columns.map((col, i) => (
                            <div
                              key={i}
                              className={`h-5 rounded-sm border border-dashed ${
                                isActive
                                  ? "border-violet-400/60 bg-violet-100/60 dark:border-violet-600/50 dark:bg-violet-900/30"
                                  : "border-muted-foreground/30 bg-muted-foreground/10"
                              }`}
                              style={{ flex: col.colSpan }}
                            />
                          ))}
                        </div>
                        <span className="text-[9px] font-medium leading-none text-muted-foreground/70">
                          {layout.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <Tip label="Mover fila arriba">
            <Button size="icon" variant="ghost" className="h-7 w-7 disabled:pointer-events-none"
              disabled={rowIndex === 0} onClick={() => onMoveRow(rowIndex, rowIndex - 1)}>
              <MoveUp size={14} strokeWidth={1.75} />
            </Button>
          </Tip>
          <Tip label="Mover fila abajo">
            <Button size="icon" variant="ghost" className="h-7 w-7 disabled:pointer-events-none"
              disabled={rowIndex === totalRows - 1} onClick={() => onMoveRow(rowIndex, rowIndex + 1)}>
              <MoveDown size={14} strokeWidth={1.75} />
            </Button>
          </Tip>
          <Tip label="Duplicar fila">
            <Button size="icon" variant="ghost" className="h-7 w-7"
              onClick={() => onDuplicateRow(row.id)}>
              <Copy size={14} strokeWidth={1.75} />
            </Button>
          </Tip>
          <Tip label="Eliminar fila">
            <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-red-50 hover:text-red-500"
              onClick={() => onRemoveRow(row.id)}>
              <Trash2 size={14} strokeWidth={1.75} />
            </Button>
          </Tip>
        </div>
      </div>

      {/* Grid de columnas */}
      <div
        className={`flex gap-0 divide-dashed divide-border/50 p-2 ${
          devicePreview === "mobile" && row.columns.length > 1
            ? "flex-col divide-y"
            : "divide-x"
        }`}
        onClick={handleSelectRow}
      >
        {row.columns.map((col, colIndex) => {
          const colSchema = rowSchema?.columns[colIndex];
          return (
            <ColumnCanvas
              key={col.id}
              col={col}
              colSchema={colSchema}
              rowId={row.id}
              rowIndex={rowIndex}
              totalRows={totalRows}
              isDropTarget={dropTargetColId === col.id}
              selectedBlockId={selectedBlockId}
              selectedColId={selectedColId}
              selectedLevel={selectedLevel}
              isRowActive={isThisRowActive}
              devicePreview={devicePreview}
              onSelectBlock={onSelectBlock}
              onSelectCol={(colId) => onSelectCol(colId, row.id)}
              onSelectRow={handleSelectRow}
              onUpdateBlock={onUpdateBlock}
              onRemoveBlock={onRemoveBlock}
              onDuplicateBlock={onDuplicateBlock}
              onMoveBlockWithinColumn={onMoveBlockWithinColumn}
              onMoveRow={onMoveRow}
              onBlockDragStart={handleBlockDragStart}
              onDragOver={handleColDragOver}
              onDragLeave={handleColDragLeave}
              onDrop={handleColDrop}
              onInsertBlockInColumn={makeInsertInColumn(col.id)}
            />
          );
        })}
      </div>

      {/* Zona de arrastre inferior — visible cuando un bloque pasa por aquí */}
      <div
        onDragOver={handleAppendDragOver}
        onDragLeave={handleAppendDragLeave}
        onDrop={handleAppendDrop}
        className={`mx-2 mb-2 overflow-hidden rounded-md border border-dashed transition-all duration-150 ${
          appendDragOver
            ? "h-10 border-violet-400 bg-violet-50/60 dark:bg-violet-950/30"
            : "h-3 border-violet-200/50 dark:border-violet-800/30"
        }`}
      >
        {appendDragOver && (
          <div className="flex h-full items-center justify-center gap-1.5">
            <span className="text-[10px] font-semibold text-violet-500">
              Agregar en esta sección
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// ColumnCanvas — memoizado: solo rerenderiza cuando SU columna cambia
// ---------------------------------------------------------------------------

interface ColumnCanvasProps {
  col: MailingColumn;
  colSchema?: LayoutColumnSchema;
  rowId: string;
  rowIndex: number;
  totalRows: number;
  isDropTarget: boolean;
  isRowActive: boolean;
  selectedBlockId: string | null;
  selectedColId: string | null;
  selectedLevel: "row" | "col" | "block" | null;
  devicePreview?: "desktop" | "mobile";
  onSelectBlock: (blockId: string, rowId: string, colId: string) => void;
  onSelectCol: (colId: string) => void;
  onSelectRow: () => void;
  onUpdateBlock: (nextBlock: MailingBlock) => void;
  onRemoveBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onMoveBlockWithinColumn: (rowId: string, colId: string, from: number, to: number) => void;
  onMoveRow: (from: number, to: number) => void;
  onBlockDragStart: (e: React.DragEvent, block: MailingBlock, colId: string, index: number) => void;
  onDragOver: (e: React.DragEvent, colId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, colId: string, toIndex?: number) => void;
  onInsertBlockInColumn: (type: MailingBlockType) => void;
}

const ColumnCanvas = memo(function ColumnCanvas({
  col,
  colSchema,
  rowId,
  rowIndex,
  totalRows,
  isDropTarget,
  isRowActive,
  selectedBlockId,
  selectedColId,
  selectedLevel,
  devicePreview,
  onSelectBlock,
  onSelectCol,
  onSelectRow,
  onUpdateBlock,
  onRemoveBlock,
  onDuplicateBlock,
  onMoveBlockWithinColumn,
  onMoveRow,
  onBlockDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onInsertBlockInColumn,
}: ColumnCanvasProps) {
  const isColSelected = selectedColId === col.id && isRowActive;
  const isColLevel = isColSelected && selectedLevel === "col";
  const isBlockLevel = isColSelected && selectedLevel === "block";
  const fraction = `${Math.round((col.colSpan / 12) * 100)}%`;

  // ── Block drop indicator state ────────────────────────────────────────────
  const colRef = useRef<HTMLDivElement>(null);
  const [blockDropIndex, setBlockDropIndex] = useState<number | null>(null);

  // Reset on dragend — covers cancelled drags and drops that call stopPropagation.
  useEffect(() => {
    const reset = () => setBlockDropIndex(null);
    document.addEventListener("dragend", reset);
    return () => document.removeEventListener("dragend", reset);
  }, []);

  const resolveBlockDropIndex = useCallback((clientY: number): number => {
    const el = colRef.current;
    if (!el) return col.blocks.length;
    const items = el.querySelectorAll<HTMLElement>("[data-block-drop]");
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return i;
    }
    return items.length;
  }, [col.blocks.length]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    const { types } = e.dataTransfer;
    if (!types.includes(BLOCK_DRAG_TYPE)) return;
    e.preventDefault();
    // No stopPropagation: el canvas también necesita saber si el cursor está en una
    // columna (data-column-area) para decidir si mostrar el RowDropIndicator.
    onDragOver(e, col.id);
    setBlockDropIndex(resolveBlockDropIndex(e.clientY));
  }, [col.id, onDragOver, resolveBlockDropIndex]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const el = colRef.current;
    if (!el || !el.contains(e.relatedTarget as Node)) {
      setBlockDropIndex(null);
      onDragLeave();
    }
  }, [onDragLeave]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(BLOCK_DRAG_TYPE)) return;
    e.stopPropagation(); // evitar que el canvas cree también una nueva fila
    const idx = blockDropIndex ?? col.blocks.length;
    setBlockDropIndex(null);
    onDrop(e, col.id, idx);
  }, [blockDropIndex, col.blocks.length, col.id, onDrop]);

  // Column outline style
  const colStyle: React.CSSProperties = {
    width: devicePreview === "mobile" ? "100%" : fraction,
    minWidth: 0,
    ...(isDropTarget ? {
      backgroundColor: "var(--mb-brand-10)",
      outline: "1px solid var(--mb-brand-30)",
      outlineOffset: "-1px",
    } : isColLevel ? {
      outline: `2px solid ${LEVEL.col.border}`,
      outlineOffset: "-1px",
      backgroundColor: LEVEL.col.bg,
    } : isBlockLevel ? {
      outline: `1px solid ${LEVEL.col.border}60`,
      outlineOffset: "-1px",
    } : {}),
  };

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey) {
      onSelectRow();
    } else {
      onSelectCol(col.id);
    }
  }, [col.id, onSelectCol, onSelectRow]);

  const handleSelectColCallback = useCallback(() => onSelectCol(col.id), [col.id, onSelectCol]);

  return (
    <div
      ref={colRef}
      data-column-area
      className={`relative flex flex-col gap-1.5 px-1.5 py-1.5 transition-colors ${
        isDropTarget || isColSelected ? "rounded" : ""
      }`}
      style={colStyle}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {/* Column fraction label */}
      <span className="select-none text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground/40">
        {fraction}
      </span>

      {/* "Columna" label when column active */}
      {isColSelected && (
        <div
          className="absolute -top-2 right-1 z-20 rounded px-1 py-0.5 text-[8px] font-bold uppercase tracking-widest"
          style={{
            color: LEVEL.col.border,
            backgroundColor: isColLevel ? LEVEL.col.bg : "transparent",
          }}
        >
          {fraction}
        </div>
      )}

      {/* Bloques con zonas de inserción entre ellos */}
      {col.blocks.map((block, index) => (
        <React.Fragment key={block.id}>
          <InsertionGap
            isActive={blockDropIndex === index}
            isDragging={blockDropIndex !== null}
          />
          <BlockItem
            block={block}
            index={index}
            totalInCol={col.blocks.length}
            colId={col.id}
            rowId={rowId}
            rowIndex={rowIndex}
            totalRows={totalRows}
            isSelected={block.id === selectedBlockId && isRowActive}
            onSelectBlock={onSelectBlock}
            onSelectCol={handleSelectColCallback}
            onUpdateBlock={onUpdateBlock}
            onRemoveBlock={onRemoveBlock}
            onDuplicateBlock={onDuplicateBlock}
            onMoveBlockWithinColumn={onMoveBlockWithinColumn}
            onMoveRow={onMoveRow}
            onBlockDragStart={onBlockDragStart}
          />
        </React.Fragment>
      ))}

      {/* Zona de inserción al final (después del último bloque) — isLast para área mayor */}
      <InsertionGap
        isActive={blockDropIndex === col.blocks.length}
        isDragging={blockDropIndex !== null}
        isLast
      />

      {/* Zona vacía si la columna no tiene bloques */}
      {col.blocks.length === 0 && (
        colSchema?.placeholders ? (
          <ColumnPlaceholder
            slots={colSchema.placeholders}
            onInsert={onInsertBlockInColumn}
            isDragOver={isDropTarget}
          />
        ) : (
          <div
            className="flex min-h-[64px] items-center justify-center rounded-md border border-dashed transition-colors"
            style={{ borderColor: "var(--mb-brand-30)" }}
          >
            <p className="select-none text-[10px]" style={{ color: "var(--mb-brand-50)" }}>
              {isDropTarget ? "Suelta aquí" : "Arrastra un bloque aquí"}
            </p>
          </div>
        )
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
  rowIndex: number;
  totalRows: number;
  isSelected: boolean;
  onSelectBlock: (blockId: string, rowId: string, colId: string) => void;
  onSelectCol: () => void;
  onUpdateBlock: (nextBlock: MailingBlock) => void;
  onRemoveBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onMoveBlockWithinColumn: (rowId: string, colId: string, from: number, to: number) => void;
  onMoveRow: (from: number, to: number) => void;
  onBlockDragStart: (e: React.DragEvent, block: MailingBlock, colId: string, index: number) => void;
}

const BlockItem = memo(function BlockItem({
  block,
  index,
  totalInCol,
  colId,
  rowId,
  rowIndex,
  totalRows,
  isSelected,
  onSelectBlock,
  onSelectCol,
  onUpdateBlock,
  onRemoveBlock,
  onDuplicateBlock,
  onMoveBlockWithinColumn,
  onMoveRow,
  onBlockDragStart,
}: BlockItemProps) {
  const BlockView = blockRegistry[block.type].View;

  const handleSelect = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (e.shiftKey) onSelectCol();
      else onSelectBlock(block.id, rowId, colId);
    },
    [block.id, rowId, colId, onSelectBlock, onSelectCol],
  );

  const handleMoveUp = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (index > 0) onMoveBlockWithinColumn(rowId, colId, index, index - 1);
      else onMoveRow(rowIndex, rowIndex - 1);
    },
    [rowId, colId, index, rowIndex, onMoveBlockWithinColumn, onMoveRow],
  );

  const handleMoveDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (index < totalInCol - 1) onMoveBlockWithinColumn(rowId, colId, index, index + 1);
      else onMoveRow(rowIndex, rowIndex + 1);
    },
    [rowId, colId, index, totalInCol, rowIndex, onMoveBlockWithinColumn, onMoveRow],
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

  // Expone duplicate/remove al blockActionBridge para que las vistas internas
  // (ej. SectionWrapper en ProductDd) puedan disparar acciones de bloque.
  useEffect(() => {
    return blockActionBridge.register(block.id, (action) => {
      if (action === "duplicate") onDuplicateBlock(block.id);
      if (action === "remove")    onRemoveBlock(block.id);
    });
  }, [block.id, onDuplicateBlock, onRemoveBlock]);

  const handleChange = useCallback(
    (nextBlock: typeof block) => onUpdateBlock(nextBlock as MailingBlock),
    [onUpdateBlock],
  );

  return (
    <div className="relative" data-mailing-block="true">
      {/* data-block-drop: marcador para que ColumnCanvas calcule la posición del indicador */}
      <div
        data-block-drop
        data-mailing-block="true"
        className={`group/block relative rounded-lg border transition-all ${
          isSelected ? "shadow-sm" : "border-transparent bg-card hover:border-border/60"
        }`}
        style={isSelected ? {
          border: `1.5px dashed ${LEVEL.block.border}`,
          backgroundColor: LEVEL.block.bg,
        } : undefined}
        onClick={handleSelect}
        onClickCapture={() => inspectorFocusBridge.focus(block.id, "apariencia")}
      >
        <div className="p-1.5">
          <BlockView block={block} isSelected={isSelected} onChange={handleChange as never} />
        </div>

        {/* Toolbar inline — visible solo cuando está seleccionado */}
        {isSelected && (
          <div
            className="flex items-center justify-center gap-0.5 border-t border-dashed px-2 py-1.5"
            style={{ borderColor: `${LEVEL.block.border}60` }}
            data-mailing-block="true"
            onClick={(e) => e.stopPropagation()}
          >
            <Tip label="Mover">
              <span
                draggable
                onDragStart={handleDragStart}
                className="flex h-7 w-7 cursor-grab items-center justify-center rounded-full text-violet-400/60 transition-all duration-150 hover:bg-violet-50 hover:text-violet-600 hover:shadow-sm active:cursor-grabbing"
              >
                <GripHorizontal size={16} strokeWidth={1.75} />
              </span>
            </Tip>

            <div className="mx-0.5 h-3.5 w-px bg-border/60" />

            <Tip label="Mover arriba">
              <button
                type="button"
                disabled={index === 0 && rowIndex === 0}
                onClick={handleMoveUp}
                className="flex h-7 w-7 items-center justify-center rounded-full text-violet-400/60 transition-all duration-150 hover:bg-violet-50 hover:text-violet-600 hover:shadow-sm disabled:pointer-events-none disabled:opacity-30"
              >
                <MoveUp size={16} strokeWidth={1.75} />
              </button>
            </Tip>

            <Tip label="Mover abajo">
              <button
                type="button"
                disabled={index === totalInCol - 1 && rowIndex === totalRows - 1}
                onClick={handleMoveDown}
                className="flex h-7 w-7 items-center justify-center rounded-full text-violet-400/60 transition-all duration-150 hover:bg-violet-50 hover:text-violet-600 hover:shadow-sm disabled:pointer-events-none disabled:opacity-30"
              >
                <MoveDown size={16} strokeWidth={1.75} />
              </button>
            </Tip>

            <div className="mx-0.5 h-3.5 w-px bg-border/60" />

            <Tip label="Duplicar">
              <button
                type="button"
                onClick={handleDuplicate}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-all duration-150 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-sm"
              >
                <Copy size={16} strokeWidth={1.75} />
              </button>
            </Tip>

            <Tip label="Eliminar">
              <button
                type="button"
                onClick={handleRemove}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-all duration-150 hover:bg-red-50 hover:text-red-500 hover:shadow-sm"
              >
                <Trash2 size={16} strokeWidth={1.75} />
              </button>
            </Tip>
          </div>
        )}
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// AddRowButton — selector de layout para agregar filas
// ---------------------------------------------------------------------------

export function AddRowButton({ onAdd }: { onAdd: (layoutId: string) => void }) {
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
        <Plus size={16} strokeWidth={1.5} />
        Agregar fila
      </Button>
      {open && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-lg border border-border bg-card p-2 shadow-lg">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Elegir layout
          </p>
          <div className="flex flex-wrap gap-1.5">
            {layoutRegistry.map((layout) => (
              <button
                key={layout.id}
                type="button"
                title={layout.label}
                onClick={() => { onAdd(layout.id); setOpen(false); }}
                className="flex flex-col gap-1 rounded border border-border px-2 py-1.5 transition hover:border-border/80 hover:bg-secondary/60"
              >
                <div className="flex items-center gap-0.5">
                  {layout.columns.map((col, i) => (
                    <span
                      key={i}
                      className="block h-4 rounded-sm bg-muted-foreground/30"
                      style={{ width: `${(col.colSpan / 12) * 48}px` }}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-medium text-muted-foreground/70">{layout.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
