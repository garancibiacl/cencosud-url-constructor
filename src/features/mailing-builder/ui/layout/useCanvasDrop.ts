import { useCallback, useEffect, useRef, useState } from "react";

export const SECTION_DRAG_TYPE = "application/mailing-section";
export const ROW_DRAG_TYPE     = "application/mailing-row";
export const BLOCK_DRAG_TYPE   = "application/mailing-block";

export interface RowDragMeta {
  rowId: string;
  fromIndex: number;
}

/**
 * Manages drop-indicator state for section inserts, row reorders, and
 * block-between-rows drops on the canvas.
 *
 * - `dropIndex` — gap index (0 = before first row, n = after last) for the indicator.
 * - `rowDragRef` — populated on row-drag-start.
 * - `canvasDropHandlers` — attach to the outermost canvas container element.
 *
 * Rows must have `data-row-drop` on their wrappers so resolveIndex can measure them.
 * Columns must have `data-column-area` so we can skip the row indicator when the
 * cursor is inside an existing column (column handles its own BlockDropIndicator).
 */
export function useCanvasDrop({
  containerRef,
  rowCount,
  onInsertSection,
  onReorderRow,
  onInsertBlockAsRow,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  rowCount: number;
  onInsertSection: (layoutId: string, atIndex: number) => void;
  onReorderRow: (fromIndex: number, toIndex: number) => void;
  onInsertBlockAsRow: (blockData: string, atIndex: number) => void;
}) {
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const rowDragRef = useRef<RowDragMeta | null>(null);

  // Reset indicator when any drag ends (covers drops inside columns that call stopPropagation).
  useEffect(() => {
    const reset = () => { setDropIndex(null); rowDragRef.current = null; };
    document.addEventListener("dragend", reset);
    return () => document.removeEventListener("dragend", reset);
  }, []);

  // Gap index closest to clientY within the rows container.
  const resolveIndex = useCallback((clientY: number): number => {
    const el = containerRef.current;
    if (!el) return rowCount;
    const items = el.querySelectorAll<HTMLElement>("[data-row-drop]");
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return i;
    }
    return items.length;
  }, [containerRef, rowCount]);

  // Returns true when the cursor is inside any column's bounding rect.
  // Columns add data-column-area so we can skip the row indicator while the
  // cursor is over a column (the column handles BlockDropIndicator itself).
  const isCursorInColumn = useCallback((clientX: number, clientY: number): boolean => {
    const el = containerRef.current;
    if (!el) return false;
    const cols = el.querySelectorAll<HTMLElement>("[data-column-area]");
    for (let i = 0; i < cols.length; i++) {
      const r = cols[i].getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        return true;
      }
    }
    return false;
  }, [containerRef]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    const { types } = e.dataTransfer;
    const isSection = types.includes(SECTION_DRAG_TYPE);
    const isRow     = types.includes(ROW_DRAG_TYPE);
    const isBlock   = types.includes(BLOCK_DRAG_TYPE);
    if (!isSection && !isRow && !isBlock) return;

    if (isBlock) {
      // When cursor is inside a column, the column handles its own indicator.
      // Don't show the between-rows indicator in that case.
      if (isCursorInColumn(e.clientX, e.clientY)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setDropIndex(resolveIndex(e.clientY));
      return;
    }

    e.preventDefault();
    e.dataTransfer.dropEffect = isSection ? "copy" : "move";
    setDropIndex(resolveIndex(e.clientY));
  }, [resolveIndex, isCursorInColumn]);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    const el = containerRef.current;
    if (!el || !el.contains(e.relatedTarget as Node)) setDropIndex(null);
  }, [containerRef]);

  const onDrop = useCallback((e: React.DragEvent) => {
    const target = dropIndex ?? rowCount;
    setDropIndex(null);

    if (e.dataTransfer.types.includes(SECTION_DRAG_TYPE)) {
      e.preventDefault();
      e.stopPropagation();
      const layoutId = e.dataTransfer.getData(SECTION_DRAG_TYPE);
      if (layoutId) onInsertSection(layoutId, target);

    } else if (e.dataTransfer.types.includes(ROW_DRAG_TYPE)) {
      e.preventDefault();
      e.stopPropagation();
      const src = rowDragRef.current;
      rowDragRef.current = null;
      if (!src) return;
      const toIndex = src.fromIndex < target ? target - 1 : target;
      if (toIndex !== src.fromIndex) onReorderRow(src.fromIndex, toIndex);

    } else if (e.dataTransfer.types.includes(BLOCK_DRAG_TYPE)) {
      // Only fires when dropped between rows (columns call stopPropagation on their drop)
      e.preventDefault();
      e.stopPropagation();
      const blockData = e.dataTransfer.getData("text/plain");
      if (blockData) onInsertBlockAsRow(blockData, target);
    }
  }, [dropIndex, rowCount, onInsertSection, onReorderRow, onInsertBlockAsRow]);

  return {
    dropIndex,
    rowDragRef,
    canvasDropHandlers: { onDragOver, onDragLeave, onDrop },
  };
}
