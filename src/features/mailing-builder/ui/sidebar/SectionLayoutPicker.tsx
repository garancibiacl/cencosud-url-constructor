/**
 * SectionLayoutPicker — visual layout selector for the Secciones sidebar tab.
 *
 * Each card represents a LayoutSchema from the registry. Clicking a card calls
 * addRowFromLayout(layout.id), appending a new empty row to the document. Cards
 * are also draggable — drop them on the canvas drop zone to insert at a specific position.
 *
 * Also includes an "Encabezados" section with preset brand header cards (Jumbo, Santa Isabel).
 */

import { useState } from "react";
import { ChevronDown, ChevronRight, GripHorizontal } from "lucide-react";
import { layoutRegistry } from "../../logic/registry/layoutRegistry";
import { presetSections } from "../../logic/registry/presetSections";
import { useMailingBuilderStore } from "../../hooks/useMailingBuilderStore";
import { BLOCK_DRAG_TYPE } from "../layout/useCanvasDrop";

// ---------------------------------------------------------------------------
// LayoutPreview — proportional column boxes using flex
// ---------------------------------------------------------------------------

function LayoutPreview({ spans }: { spans: number[] }) {
  return (
    <div className="flex min-w-0 gap-1.5 px-3 pb-3">
      {spans.map((span, i) => (
        <div
          key={i}
          className="h-10 min-w-0 rounded border-[1.5px] border-dashed border-violet-400/60 bg-violet-50/40 transition-colors group-hover:border-violet-400 group-hover:bg-violet-50/70 dark:border-violet-600/50 dark:bg-violet-950/20 dark:group-hover:border-violet-500 dark:group-hover:bg-violet-950/40"
          style={{ flex: span }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PresetHeaderThumbnail — iframe scaled preview of the real header HTML
// ---------------------------------------------------------------------------

// Sidebar aside is 272px. SectionLayoutPicker p-3 (24px) + button mx-3 for thumbnail (24px) = 224px available.
const RENDER_WIDTH = 600;
const CONTAINER_WIDTH = 224;
const IFRAME_HEIGHT = 180;
const scale = CONTAINER_WIDTH / RENDER_WIDTH;

function PresetHeaderThumbnail({ html, label }: { html: string; label: string }) {
  const srcDoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#fff;font-family:Arial,Helvetica,sans-serif;overflow:hidden;}
img{max-width:100%!important;height:auto!important;display:block!important;}
table{border-collapse:collapse;width:100%;}
</style>
</head>
<body>${html}</body>
</html>`;

  return (
    <div
      className="mx-3 mb-3 rounded-md border border-border/60 bg-white"
      style={{
        height: `${Math.ceil(IFRAME_HEIGHT * scale)}px`,
        overflow: "hidden",
        // CSS contain:paint forces clip at the border box, even for CSS-transformed children.
        // This fixes the known issue where transform:scale() bypasses overflow:hidden.
        contain: "paint",
      }}
    >
      <iframe
        srcDoc={srcDoc}
        title={label}
        scrolling="no"
        style={{
          width: `${RENDER_WIDTH}px`,
          height: `${IFRAME_HEIGHT}px`,
          border: "none",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
          display: "block",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionLayoutPicker
// ---------------------------------------------------------------------------

export function SectionLayoutPicker() {
  const addRowFromLayout = useMailingBuilderStore((s) => s.addRowFromLayout);
  const insertPresetBlockAsRowAt = useMailingBuilderStore((s) => s.insertPresetBlockAsRowAt);
  const rowCount = useMailingBuilderStore((s) => s.document.rows.length);

  const [headersOpen, setHeadersOpen] = useState(true);

  return (
    <div className="space-y-2 p-3">

      {/* ── Layouts section ──────────────────────────────────────────────── */}
      <p className="px-0 pb-1 pt-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
        Elige un layout para agregar
      </p>

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
          className="group w-full overflow-hidden cursor-pointer rounded-xl border border-border bg-secondary/30 pt-2 text-left transition-all duration-150 hover:border-violet-300 hover:bg-violet-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:hover:border-violet-700 dark:hover:bg-violet-950/20"
        >
          {/* Drag-handle dots */}
          <div className="flex justify-center pb-1.5">
            <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground/30 transition-colors group-hover:text-violet-400" />
          </div>
          {/* Column visual */}
          <LayoutPreview spans={layout.columns.map((c) => c.colSpan)} />
        </button>
      ))}

      {/* ── Encabezados section ──────────────────────────────────────────── */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setHeadersOpen((v) => !v)}
          className="flex w-full items-center justify-between px-0 pb-1 text-left"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/60">
            Encabezados
          </p>
          {headersOpen
            ? <ChevronDown className="h-3 w-3 text-muted-foreground/40" />
            : <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
          }
        </button>

        {headersOpen && (
          <div className="mt-1 space-y-2">
            {presetSections.map((preset) => (
              <button
                key={preset.id}
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", `preset:${preset.id}`);
                  e.dataTransfer.setData(BLOCK_DRAG_TYPE, `preset:${preset.id}`);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => insertPresetBlockAsRowAt(preset.id, rowCount)}
                title={preset.label}
                className="group w-full overflow-hidden cursor-pointer rounded-xl border border-border bg-secondary/30 pt-2 text-left transition-all duration-150 hover:border-primary/30 hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {/* Drag-handle dots */}
                <div className="flex justify-center pb-1.5">
                  <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground/30 transition-colors group-hover:text-primary/60" />
                </div>
                {/* Brand thumbnail */}
                <PresetHeaderThumbnail html={preset.html} label={preset.label} />
                {/* Label */}
                <div className="px-3 pb-2.5">
                  <p className="text-[11px] font-medium text-foreground/80">{preset.label}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
