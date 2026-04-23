import { useCallback, useRef, useState } from "react";

export const SECTION_DRAG_TYPE = "application/mailing-section";
export const ROW_DRAG_TYPE = "application/mailing-row";

export interface RowDragMeta {
  rowId: string;
  fromIndex: number;
}

/**
 * Manages drop-indicator state for section inserts and row reorders on the canvas.
 *
 * - `dropIndex` — the gap index (0 = before first row, n = after last row) where the
 *   drop indicator should be rendered.
 * - `rowDragRef` — populated on row-drag-start so the drop handler knows fromIndex.
 * - `canvasDropHandlers` — attach to the outermost canvas container element.
 *
 * Rows must have `data-row-drop` on their wrapper so resolveIndex can measure positions.
 */
export function useCanvasDrop({
  containerRef,
  rowCount,
  onInsertSection,
  onReorderRow,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  rowCount: number;
  onInsertSection: (layoutId: string, atIndex: number) => void;
  onReorderRow: (fromIndex: number, toIndex: number) => void;
}) {
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const rowDragRef = useRef<RowDragMeta | null>(null);

  // Returns the gap index closest to clientY within the rows container.
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

  const onDragOver = useCallback((e: React.DragEvent) => {
    const { types } = e.dataTransfer;
    if (!types.includes(SECTION_DRAG_TYPE) && !types.includes(ROW_DRAG_TYPE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = types.includes(SECTION_DRAG_TYPE) ? "copy" : "move";
    setDropIndex(resolveIndex(e.clientY));
  }, [resolveIndex]);

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
      // Adjust for gap semantics: gap `target` means "before the element at target".
      // After removing from fromIndex, elements shift if fromIndex < target.
      const toIndex = src.fromIndex < target ? target - 1 : target;
      if (toIndex !== src.fromIndex) onReorderRow(src.fromIndex, toIndex);
    }
  }, [dropIndex, rowCount, onInsertSection, onReorderRow]);

  return {
    dropIndex,
    rowDragRef,
    canvasDropHandlers: { onDragOver, onDragLeave, onDrop },
  };
}
