/**
 * SectionLayoutPicker — visual layout selector for the Secciones sidebar tab.
 *
 * Each card represents a LayoutSchema from the registry. Clicking a card calls
 * addRowFromLayout(layout.id), appending a new empty row to the document. Cards
 * are also draggable — drop them on the canvas drop zone to insert at a specific position.
 */

import { GripHorizontal } from "lucide-react";
import { layoutRegistry } from "../../logic/registry/layoutRegistry";
import { useMailingBuilderStore } from "../../hooks/useMailingBuilderStore";

// ---------------------------------------------------------------------------
// LayoutPreview — proportional column boxes using flex
// ---------------------------------------------------------------------------

function LayoutPreview({ spans }: { spans: number[] }) {
  return (
    <div className="flex gap-1.5 px-3 pb-3">
      {spans.map((span, i) => (
        <div
          key={i}
          className="h-10 rounded border-[1.5px] border-dashed border-violet-400/60 bg-violet-50/40 transition-colors group-hover:border-violet-400 group-hover:bg-violet-50/70 dark:border-violet-600/50 dark:bg-violet-950/20 dark:group-hover:border-violet-500 dark:group-hover:bg-violet-950/40"
          style={{ flex: span }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionLayoutPicker
// ---------------------------------------------------------------------------

export function SectionLayoutPicker() {
  const addRowFromLayout = useMailingBuilderStore((s) => s.addRowFromLayout);

  return (
    <div className="space-y-2 p-3">
      {layoutRegistry.map((layout) => (
        <button
          key={layout.id}
          type="button"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", `section:${layout.id}`);
            e.dataTransfer.setData("application/mailing-section", layout.id);
            e.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => addRowFromLayout(layout.id)}
          title={layout.label}
          className="group w-full cursor-pointer rounded-xl border border-border bg-secondary/30 pt-2 text-left transition-all duration-150 hover:border-violet-300 hover:bg-violet-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:hover:border-violet-700 dark:hover:bg-violet-950/20"
        >
          {/* Drag-handle dots */}
          <div className="flex justify-center pb-1.5">
            <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground/30 transition-colors group-hover:text-violet-400" />
          </div>
          {/* Column visual */}
          <LayoutPreview spans={layout.columns.map((c) => c.colSpan)} />
        </button>
      ))}
    </div>
  );
}
