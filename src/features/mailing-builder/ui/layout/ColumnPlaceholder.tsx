import { Image, MousePointerClick, Rows2, Type } from "lucide-react";
import type { PlaceholderSlot } from "../../logic/schema/layout-schema.types";
import type { MailingBlockType } from "../../logic/schema/block.types";

const SLOT_ICONS: Record<string, React.ElementType> = {
  image:   Image,
  text:    Type,
  button:  MousePointerClick,
  hero:    Rows2,
  spacer:  Rows2,
  product: Image,
};

const SLOT_LABELS: Record<string, string> = {
  image:   "Imagen",
  text:    "Texto",
  button:  "Botón",
  hero:    "Hero",
  spacer:  "Espacio",
  product: "Producto",
};

interface ColumnPlaceholderProps {
  slots: PlaceholderSlot[];
  onInsert: (type: MailingBlockType) => void;
  isDragOver?: boolean;
}

export function ColumnPlaceholder({ slots, onInsert, isDragOver }: ColumnPlaceholderProps) {
  return (
    <div
      className={`flex min-h-[80px] flex-col items-center justify-center gap-2 rounded-md border border-dashed p-2 transition-colors ${
        isDragOver
          ? "border-violet-400 bg-violet-50/60 dark:bg-violet-950/30"
          : "border-border/60"
      }`}
    >
      {isDragOver ? (
        <p className="select-none text-[10px] font-medium text-violet-500">Soltar aquí</p>
      ) : (
        <>
          <p className="select-none text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40">
            Agregar bloque
          </p>
          <div className="flex flex-wrap justify-center gap-1">
            {slots.map((slot, i) => {
              const Icon = SLOT_ICONS[slot.type] ?? Type;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onInsert(slot.type); }}
                  title={`Agregar ${SLOT_LABELS[slot.type] ?? slot.label}`}
                  className="flex items-center gap-1 rounded-md border border-dashed border-violet-300/60 bg-violet-50/40 px-2 py-1 text-[10px] font-medium text-violet-500 transition-colors hover:border-violet-400 hover:bg-violet-100/60 dark:border-violet-700/50 dark:bg-violet-950/20 dark:text-violet-400 dark:hover:bg-violet-900/30"
                >
                  <Icon size={12} strokeWidth={1.5} />
                  {slot.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
