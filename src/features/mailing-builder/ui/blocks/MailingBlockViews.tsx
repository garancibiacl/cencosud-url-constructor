import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { CodeXml, Copy, GripHorizontal, ImageIcon, ImageOff, LayoutGrid, MoveDown, MoveUp, Trash2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ButtonBlock, HeroBlock, ImageBlock, MailingBlock, ProductBlock, ProductDdBlock, RawHtmlBlock, SpacerBlock, TextBlock } from "../../logic/schema/block.types";
import { imageLibraryBridge } from "../imageLibraryBridge";
import { inspectorFocusBridge } from "../inspectorFocusBridge";
import { TextFloatingToolbar } from "../editor/TextFloatingToolbar";

const getPaddingStyle = (block: MailingBlock): CSSProperties => ({
  paddingTop: block.layout.padding?.top ?? 0,
  paddingRight: block.layout.padding?.right ?? 0,
  paddingBottom: block.layout.padding?.bottom ?? 0,
  paddingLeft: block.layout.padding?.left ?? 0,
  backgroundColor: block.layout.backgroundColor,
});

const canvasShell = (isSelected?: boolean) =>
  `overflow-hidden rounded-md border transition ${isSelected ? "border-primary shadow-[var(--shadow-card)]" : "border-border bg-card"}`;

const inlineFieldClass = "border-transparent bg-transparent px-0 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0";

// ---------------------------------------------------------------------------
// ContentEditableDiv — edición inline sin reset de cursor
// ---------------------------------------------------------------------------

const ContentEditableDiv = forwardRef<HTMLDivElement, {
  html: string;
  onChange: (html: string) => void;
  className?: string;
  style?: CSSProperties;
  autoFocus?: boolean;
}>(function ContentEditableDiv({ html, onChange, className, style, autoFocus }, forwardedRef) {
  const innerRef = useRef<HTMLDivElement>(null);
  const ref = (forwardedRef as React.RefObject<HTMLDivElement | null>) ?? innerRef;
  const isFocused = useRef(false);

  // Montar con el HTML inicial y opcionalmente enfocar
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = html;
    if (autoFocus) {
      ref.current.focus();
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincronizar cambios externos (no los propios del teclado)
  useEffect(() => {
    if (!isFocused.current && ref.current) {
      ref.current.innerHTML = html;
    }
  }, [html, ref]);

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => onChange(e.currentTarget.innerHTML),
    [onChange],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      isFocused.current = false;
      // Forzar guardado final — evita que el sync-effect revierta el contenido
      // si el re-render del store aún no llegó cuando se pierde el foco.
      onChange(e.currentTarget.innerHTML);
    },
    [onChange],
  );

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => { isFocused.current = true; }}
      onBlur={handleBlur}
      onInput={handleInput}
      className={className}
      style={style}
      onClick={(e) => e.stopPropagation()}
    />
  );
});

// ---------------------------------------------------------------------------
// ImageEditOverlay — overlay URL sobre imagen clickeable
// ---------------------------------------------------------------------------

function ImageEditOverlay({
  src,
  onChange,
  blockId,
  libraryField,
}: {
  src: string;
  onChange: (src: string) => void;
  blockId?: string;
  libraryField?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImageClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const readFileAsDataUrl = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target?.result as string);
      setOpen(false);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFileAsDataUrl(file);
    e.target.value = "";
  }, [readFileAsDataUrl]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) readFileAsDataUrl(file);
  }, [readFileAsDataUrl]);

  return (
    <>
      {/* Hover hint sobre imagen */}
      {!open && (
        <div
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 opacity-0 transition-all group-hover/img:bg-black/25 group-hover/img:opacity-100"
          style={{ zIndex: 10 }}
          onClick={handleImageClick}
        >
          <div className="flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1.5 text-xs font-medium shadow-md">
            <ImageIcon className="h-3 w-3" />
            Cambiar imagen
          </div>
        </div>
      )}

      {/* Overlay con input URL, biblioteca y carga de archivo */}
      {open && (
        <div
          className={`absolute inset-0 flex items-center justify-center backdrop-blur-[1px] transition-colors ${isDragOver ? "bg-blue-500/30" : "bg-black/40"}`}
          onClick={(e) => e.stopPropagation()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragOver ? (
            <div className="flex flex-col items-center gap-2 rounded-lg bg-card px-5 py-4 shadow-xl ring-2 ring-blue-500">
              <Upload className="h-5 w-5 text-blue-500" />
              <span className="text-xs font-medium text-blue-600">Suelta la imagen aquí</span>
            </div>
          ) : (
            <div className="mx-4 flex w-full max-w-xs items-center gap-1.5 rounded-lg bg-card px-3 py-2.5 shadow-xl ring-1 ring-border">
              <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={src}
                onChange={(e) => onChange(e.target.value)}
                onBlur={() => setOpen(false)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setOpen(false); }}
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
                placeholder="https://..."
                onClick={(e) => e.stopPropagation()}
              />
              {blockId && libraryField && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    imageLibraryBridge.open(blockId, libraryField);
                  }}
                  className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title="Elegir desde biblioteca"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Subir imagen desde disco"
              >
                <Upload className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Block views
// ---------------------------------------------------------------------------

export function HeroBlockView({ block, isSelected, onChange }: { block: HeroBlock; isSelected?: boolean; onChange?: (nextBlock: HeroBlock) => void }) {
  const [isHeroDragOver, setIsHeroDragOver] = useState(false);
  const [heroImgError, setHeroImgError] = useState(false);

  useEffect(() => { setHeroImgError(false); }, [block.props.imageUrl]);

  const readHeroFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange?.({ ...block, props: { ...block.props, imageUrl: e.target?.result as string } });
    };
    reader.readAsDataURL(file);
  }, [block, onChange]);

  const handleHeroDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onChange) setIsHeroDragOver(true);
  }, [onChange]);

  const handleHeroDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHeroDragOver(false);
  }, []);

  const handleHeroDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHeroDragOver(false);
    if (!onChange) return;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) readHeroFile(file);
  }, [onChange, readHeroFile]);

  return (
    <article className={canvasShell(isSelected)}>
      <div
        className={`relative aspect-[5/3] w-full overflow-hidden bg-secondary group/img transition-[box-shadow] ${isHeroDragOver ? "ring-2 ring-inset ring-blue-500" : ""}`}
        onDragOver={handleHeroDragOver}
        onDragLeave={handleHeroDragLeave}
        onDrop={handleHeroDrop}
      >
        {block.props.imageUrl && heroImgError ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground/50">
            <ImageOff className="h-8 w-8" />
            <span className="text-xs">No se pudo cargar la imagen</span>
          </div>
        ) : (
          <img
            src={block.props.imageUrl || "/placeholder.svg"}
            alt={block.props.title}
            className="h-full w-full object-cover"
            onError={() => setHeroImgError(true)}
          />
        )}
        {isHeroDragOver && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-blue-500/20">
            <Upload className="h-6 w-6 text-blue-600" />
            <span className="rounded-full bg-card/90 px-3 py-1 text-xs font-medium text-blue-600 shadow">Suelta la imagen aquí</span>
          </div>
        )}
        {isSelected && onChange && !isHeroDragOver && (
          <ImageEditOverlay
            src={block.props.imageUrl ?? ""}
            onChange={(imageUrl) => onChange({ ...block, props: { ...block.props, imageUrl } })}
            blockId={block.id}
            libraryField="imageUrl"
          />
        )}
      </div>
      <div className="space-y-3" style={getPaddingStyle(block)}>
        <div className="space-y-2">
          {isSelected && onChange ? (
            <Input
              value={block.props.title}
              onChange={(event) => onChange({ ...block, props: { ...block.props, title: event.target.value } })}
              className={`${inlineFieldClass} h-auto text-[28px] font-semibold leading-tight text-foreground`}
              placeholder="Título del hero"
              autoFocus
              onClick={(event) => event.stopPropagation()}
            />
          ) : (
            <h3 className="text-[28px] font-semibold leading-tight text-foreground">{block.props.title}</h3>
          )}
          {isSelected && onChange ? (
            <Input
              value={block.props.subtitle ?? ""}
              onChange={(event) => onChange({ ...block, props: { ...block.props, subtitle: event.target.value } })}
              className={`${inlineFieldClass} text-sm leading-6 text-muted-foreground`}
              placeholder="Bajada del bloque"
              onClick={(event) => event.stopPropagation()}
            />
          ) : block.props.subtitle ? <p className="text-sm leading-6 text-muted-foreground">{block.props.subtitle}</p> : null}
        </div>
        {block.props.ctaLabel ? (
          <div className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground">
            {isSelected && onChange ? (
              <Input
                value={block.props.ctaLabel}
                onChange={(event) => onChange({ ...block, props: { ...block.props, ctaLabel: event.target.value } })}
                className={`${inlineFieldClass} h-auto min-w-[140px] text-primary-foreground placeholder:text-primary-foreground/70`}
                placeholder="CTA"
                onClick={(event) => event.stopPropagation()}
              />
            ) : (
              block.props.ctaLabel
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function TextBlockView({ block, isSelected, onChange }: { block: TextBlock; isSelected?: boolean; onChange?: (nextBlock: TextBlock) => void }) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback(
    (html: string) => onChange?.({ ...block, props: { ...block.props, html } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onChange, block.id],
  );

  return (
    <article className={canvasShell(isSelected)} style={getPaddingStyle(block)}>
      {isSelected && onChange ? (
        <>
          <ContentEditableDiv
            ref={contentRef}
            html={block.props.html}
            onChange={handleChange}
            autoFocus
            className="prose prose-sm max-w-none min-h-[60px] rounded px-1 py-0.5 text-foreground outline-none focus:ring-1 focus:ring-ring/50 [&_*]:text-inherit [&_a]:text-primary"
            style={{
              textAlign: block.props.align,
              fontSize: block.props.fontSize,
              lineHeight: block.props.lineHeight,
            }}
          />
          <TextFloatingToolbar containerRef={contentRef} />
        </>
      ) : (
        <div
          className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-a:text-primary"
          style={{
            textAlign: block.props.align,
            fontSize: block.props.fontSize,
            lineHeight: block.props.lineHeight,
          }}
          dangerouslySetInnerHTML={{ __html: block.props.html }}
        />
      )}
    </article>
  );
}

export function ImageBlockView({ block, isSelected, onChange }: { block: ImageBlock; isSelected?: boolean; onChange?: (nextBlock: ImageBlock) => void }) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [block.props.src]);

  return (
    <article className={canvasShell(isSelected)} style={getPaddingStyle(block)}>
      <div className="relative overflow-hidden rounded-sm bg-secondary group/img">
        {block.props.src && imgError ? (
          <div className="flex min-h-[120px] w-full flex-col items-center justify-center gap-2 text-muted-foreground/50">
            <ImageOff className="h-7 w-7" />
            <span className="text-xs">No se pudo cargar la imagen</span>
          </div>
        ) : (
          <img
            src={block.props.src || "/placeholder.svg"}
            alt={block.props.alt || "Imagen del bloque"}
            className="h-auto w-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
        {isSelected && onChange && (
          <ImageEditOverlay
            src={block.props.src ?? ""}
            onChange={(src) => onChange({ ...block, props: { ...block.props, src } })}
            blockId={block.id}
            libraryField="src"
          />
        )}
      </div>
      {isSelected && onChange ? (
        <div className="mt-2">
          <Input
            value={block.props.alt}
            onChange={(event) => onChange({ ...block, props: { ...block.props, alt: event.target.value } })}
            className={`${inlineFieldClass} text-xs text-muted-foreground`}
            placeholder="Texto alternativo (alt)"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : block.props.alt ? <p className="mt-2 text-xs text-muted-foreground">{block.props.alt}</p> : null}
    </article>
  );
}

export function ButtonBlockView({ block, isSelected, onChange }: { block: ButtonBlock; isSelected?: boolean; onChange?: (nextBlock: ButtonBlock) => void }) {
  const alignment = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }[block.props.align ?? "center"];

  return (
    <article className={canvasShell(isSelected)} style={getPaddingStyle(block)}>
      <div className={`flex ${alignment}`}>
        <div className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-card)]">
          {isSelected && onChange ? (
            <Input
              value={block.props.label}
              onChange={(event) => onChange({ ...block, props: { ...block.props, label: event.target.value } })}
              className={`${inlineFieldClass} h-auto text-primary-foreground placeholder:text-primary-foreground/70`}
              placeholder="Texto del botón"
              autoFocus
              onClick={(event) => event.stopPropagation()}
            />
          ) : (
            block.props.label
          )}
        </div>
      </div>
    </article>
  );
}

export function SpacerBlockView({ block, isSelected }: { block: SpacerBlock; isSelected?: boolean }) {
  return (
    <article className={canvasShell(isSelected)}>
      <div className="flex items-center justify-between border-b border-dashed border-border px-4 py-2 text-xs text-muted-foreground">
        <span>Spacer</span>
        <span>{block.props.height}px</span>
      </div>
      <div className="bg-secondary/40" style={{ height: block.props.height }} />
    </article>
  );
}

type BlockViewProps<TBlock extends MailingBlock> = {
  block: TBlock;
  isSelected?: boolean;
  onChange?: (nextBlock: TBlock) => void;
};

const RAW_HTML_RENDER_WIDTH = 600;
const RAW_HTML_RENDER_HEIGHT = 200;

export function RawHtmlBlockView({ block, isSelected }: BlockViewProps<RawHtmlBlock>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setScale(w / RAW_HTML_RENDER_WIDTH);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const srcDoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#fff;font-family:Arial,Helvetica,sans-serif;overflow:hidden;}img{max-width:100%!important;height:auto!important;display:block!important;}table{border-collapse:collapse;width:100%;}</style></head><body>${block.props.html}</body></html>`;

  return (
    <div className={canvasShell(isSelected)} style={getPaddingStyle(block)}>
      {/* Badge label */}
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10">
          <CodeXml className="h-3 w-3 text-primary/60" />
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">
          {block.props.presetLabel ?? "Sección HTML"} · solo lectura
        </span>
      </div>
      {/* Scaled iframe preview */}
      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded-b-md border-t border-border/50"
        style={{
          height: `${Math.ceil(RAW_HTML_RENDER_HEIGHT * scale)}px`,
          contain: "paint",
        }}
      >
        <iframe
          srcDoc={srcDoc}
          title={block.props.presetLabel ?? "preview"}
          scrolling="no"
          style={{
            width: `${RAW_HTML_RENDER_WIDTH}px`,
            height: `${RAW_HTML_RENDER_HEIGHT}px`,
            border: "none",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            pointerEvents: "none",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}

export function ProductBlockView({ block, isSelected, onChange }: { block: ProductBlock; isSelected?: boolean; onChange?: (nextBlock: ProductBlock) => void }) {
  const [productImgError, setProductImgError] = useState(false);
  useEffect(() => { setProductImgError(false); }, [block.props.imageUrl]);

  return (
    <article className={canvasShell(isSelected)} style={getPaddingStyle(block)}>
      <div className="flex flex-col border border-border/60 bg-white font-sans" style={{ borderBottom: "1px solid #e5e7eb" }}>
        {/* Product image */}
        <div className="relative flex h-[200px] items-center justify-center bg-white group/img px-4 py-3">
          {block.props.imageUrl && productImgError ? (
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground/40">
              <ImageOff className="h-6 w-6" />
              <span className="text-[10px]">Sin imagen</span>
            </div>
          ) : (
            <img
              src={block.props.imageUrl || "/placeholder.svg"}
              alt={block.props.name}
              className="max-h-full max-w-[152px] object-contain"
              onError={() => setProductImgError(true)}
            />
          )}
          {isSelected && onChange && (
            <ImageEditOverlay
              src={block.props.imageUrl ?? ""}
              onChange={(imageUrl) => onChange({ ...block, props: { ...block.props, imageUrl } })}
              blockId={block.id}
              libraryField="imageUrl"
            />
          )}
        </div>

        {/* Price */}
        <div className="px-4 pt-1">
          <div className="text-sm font-bold text-[#333333]">{block.props.price || "$ 0"}</div>
        </div>

        {/* Unit badge */}
        {block.props.unit && (
          <div className="px-4 pt-1">
            <span className="inline-block rounded-full bg-[#f3f4f6] px-1.5 py-0.5 text-[11px] text-black">
              {block.props.unit}
            </span>
          </div>
        )}

        {/* Brand */}
        <div className="flex h-9 items-center px-4 text-[14px] text-[#6b7280]">
          {block.props.brand || <span className="text-[#d1d5db]">Marca / variante</span>}
        </div>

        {/* Product name */}
        <div className="h-[60px] overflow-hidden px-4">
          <p className="text-[14px] font-normal leading-[18px] text-black">{block.props.name || "Nombre del producto"}</p>
        </div>

        {/* CTA button */}
        <div className="px-4 pb-4 pt-3">
          <div className="flex h-9 w-40 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            {block.props.ctaLabel || "Agregar"}
          </div>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// ProductDd — section reorder helpers
// ---------------------------------------------------------------------------

const DEFAULT_SECTION_ORDER = ["logo", "discount", "price", "priceTag", "ahorro", "name"] as const;


const SECTION_DND_TYPE = "application/mailing-section";

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

function SectionWrapper({ id, index, order, isSelected, onChange, block, isActive, children }: {
  id: string;
  index: number;
  order: string[];
  isSelected: boolean | undefined;
  onChange: ((b: ProductDdBlock) => void) | undefined;
  block: ProductDdBlock;
  isActive: boolean;
  children: React.ReactNode;
}) {
  const [dropSide, setDropSide] = useState<"top" | "bottom" | null>(null);

  if (!isSelected || !onChange) return <>{children}</>;

  const canUp   = index > 0;
  const canDown = index < order.length - 1;

  const move = (dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= order.length) return;
    const o = [...order];
    [o[index], o[next]] = [o[next], o[index]];
    onChange({ ...block, props: { ...block.props, sectionOrder: o } });
  };

  const duplicate = () => {
    const o = [...order];
    o.splice(index + 1, 0, id);
    onChange({ ...block, props: { ...block.props, sectionOrder: o } });
  };

  const remove = () => {
    onChange({ ...block, props: { ...block.props, sectionOrder: order.filter((_, i) => i !== index) } });
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(SECTION_DND_TYPE, String(index));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(SECTION_DND_TYPE)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDropSide(e.clientY < rect.top + rect.height / 2 ? "top" : "bottom");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setDropSide(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fromIndex = parseInt(e.dataTransfer.getData(SECTION_DND_TYPE), 10);
    if (isNaN(fromIndex) || fromIndex === index) { setDropSide(null); return; }
    const rect  = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;
    const o = [...order];
    const [item] = o.splice(fromIndex, 1);
    // Recalculate insert position after removal
    const adj = fromIndex < index ? index - 1 : index;
    o.splice(before ? adj : adj + 1, 0, item);
    onChange({ ...block, props: { ...block.props, sectionOrder: o } });
    setDropSide(null);
  };

  const dropIndicator: React.CSSProperties = dropSide
    ? { boxShadow: dropSide === "top" ? "0 -2px 0 rgba(255,255,255,0.7)" : "0 2px 0 rgba(255,255,255,0.7)" }
    : {};

  return (
    <div
      className="relative"
      data-section-key={`${id}_${index}`}
      style={dropIndicator}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      {isActive && (
        <div
          className="flex items-center justify-center py-2"
          data-section-toolbar="true"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-0.5 rounded-full bg-white px-1.5 py-1 shadow-[0_2px_12px_rgba(0,0,0,0.14)] ring-1 ring-black/6">

            {/* Grip — violet */}
            <Tip label="Mover">
              <span
                draggable
                onDragStart={handleDragStart}
                className="flex h-7 w-7 cursor-grab items-center justify-center rounded-full text-violet-400 transition-all duration-150 hover:bg-violet-50 hover:text-violet-600 hover:shadow-sm active:cursor-grabbing"
              >
                <GripHorizontal size={15} strokeWidth={1.75} />
              </span>
            </Tip>

            <div className="mx-0.5 h-3.5 w-px bg-gray-200" />

            {/* Move up — violet */}
            <Tip label="Mover arriba">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => { e.stopPropagation(); move(-1); }}
                disabled={!canUp}
                className="flex h-7 w-7 items-center justify-center rounded-full text-violet-400 transition-all duration-150 hover:bg-violet-50 hover:text-violet-600 hover:shadow-sm disabled:pointer-events-none disabled:opacity-25"
              >
                <MoveUp size={15} strokeWidth={1.75} />
              </button>
            </Tip>

            {/* Move down — violet */}
            <Tip label="Mover abajo">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => { e.stopPropagation(); move(1); }}
                disabled={!canDown}
                className="flex h-7 w-7 items-center justify-center rounded-full text-violet-400 transition-all duration-150 hover:bg-violet-50 hover:text-violet-600 hover:shadow-sm disabled:pointer-events-none disabled:opacity-25"
              >
                <MoveDown size={15} strokeWidth={1.75} />
              </button>
            </Tip>

            <div className="mx-0.5 h-3.5 w-px bg-gray-200" />

            {/* Duplicate — indigo */}
            <Tip label="Duplicar">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => { e.stopPropagation(); duplicate(); }}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-all duration-150 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-sm"
              >
                <Copy size={15} strokeWidth={1.75} />
              </button>
            </Tip>

            {/* Delete — red destructive */}
            <Tip label="Eliminar">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => { e.stopPropagation(); remove(); }}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-all duration-150 hover:bg-red-50 hover:text-red-500 hover:shadow-sm"
              >
                <Trash2 size={15} strokeWidth={1.75} />
              </button>
            </Tip>

          </div>
        </div>
      )}
    </div>
  );
}

export function ProductDdBlockView({ block, isSelected, onChange }: {
  block: ProductDdBlock;
  isSelected?: boolean;
  onChange?: (nextBlock: ProductDdBlock) => void;
}) {
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const editorAreaRef = useRef<HTMLDivElement>(null);
  const isDraggingBadge = useRef(false);
  const [imgError, setImgError] = useState(false);
  const [isEditingBadge, setIsEditingBadge] = useState(false);
  const [activeSectionKey, setActiveSectionKey] = useState<string | null>(null);
  const badgeLabelRef = useRef<HTMLSpanElement>(null);
  useEffect(() => { setImgError(false); }, [block.props.imageUrl]);
  useEffect(() => { if (!isSelected) { setIsEditingBadge(false); setActiveSectionKey(null); } }, [isSelected]);

  function handleBadgeDragStart(e: React.MouseEvent) {
    if (!onChange || !isSelected) return;
    e.preventDefault();
    e.stopPropagation();
    isDraggingBadge.current = true;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDraggingBadge.current || !imageContainerRef.current) return;
      const rect = imageContainerRef.current.getBoundingClientRect();
      const left = Math.min(100, Math.max(0, ((ev.clientX - rect.left) / rect.width) * 100));
      const top  = Math.min(100, Math.max(0, ((ev.clientY - rect.top)  / rect.height) * 100));
      onChange({ ...block, props: { ...block.props, badgeTop: top, badgeLeft: left } });
    };

    const handleMouseUp = () => {
      isDraggingBadge.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  const logoAlignClass = (
    { left: "justify-start", center: "justify-center", right: "justify-end" } as const
  )[block.props.logoAlign ?? "left"];

  const base = block.layout.borderRadius ?? 0;
  const tl = block.layout.borderRadiusTL ?? base;
  const tr = block.layout.borderRadiusTR ?? base;
  const brr = block.layout.borderRadiusBR ?? base;
  const bl = block.layout.borderRadiusBL ?? base;
  const hasRadius = tl > 0 || tr > 0 || brr > 0 || bl > 0;

  const cardStyle: React.CSSProperties = {
    minHeight: 220,
    borderRadius: hasRadius ? `${tl}px ${tr}px ${brr}px ${bl}px` : undefined,
    border: block.layout.borderWidth
      ? `${block.layout.borderWidth}px solid ${block.layout.borderColor ?? "#e5e7eb"}`
      : undefined,
    overflow: hasRadius ? "hidden" : undefined,
  };
  const leftColStyle: React.CSSProperties = hasRadius
    ? { borderRadius: `${tl}px 0 0 ${bl}px`, overflow: "hidden" }
    : {};
  const rightColStyle: React.CSSProperties = hasRadius
    ? { borderRadius: `0 ${tr}px ${brr}px 0`, overflow: "hidden" }
    : {};

  const sectionRing = (key: string): React.CSSProperties =>
    isSelected && activeSectionKey === key
      ? { outline: "2px solid rgba(139,92,246,0.75)", outlineOffset: 2, borderRadius: 4 }
      : {};

  const sectionOrder: string[] = block.props.sectionOrder ?? [...DEFAULT_SECTION_ORDER as unknown as string[]];

  return (
    <article
      className={canvasShell(isSelected)}
      style={{
        paddingTop: block.layout.padding?.top ?? 0,
        paddingRight: block.layout.padding?.right ?? 0,
        paddingBottom: block.layout.padding?.bottom ?? 0,
        paddingLeft: block.layout.padding?.left ?? 0,
        backgroundColor: block.layout.backgroundColor,
      }}
      onClickCapture={(e) => {
        if ((e.target as HTMLElement).closest("[data-section-toolbar]")) return;
        const sectionKeyEl = (e.target as HTMLElement).closest("[data-section-key]");
        const focusSectionEl = (e.target as HTMLElement).closest("[data-focus-section]");
        const key = sectionKeyEl?.getAttribute("data-section-key")
          ?? focusSectionEl?.getAttribute("data-focus-section")
          ?? null;
        const focusSection = focusSectionEl?.getAttribute("data-focus-section") ?? "apariencia";
        inspectorFocusBridge.focus(block.id, focusSection);
        setActiveSectionKey(key);
      }}
    >
      <div className="flex overflow-hidden font-sans" style={cardStyle}>

        {/* ── LEFT COLUMN: imagen + badge ───────────────────────────── */}
        <div
          ref={imageContainerRef}
          data-focus-section="imagen"
          className="relative shrink-0 self-stretch bg-[#f9fafb] overflow-hidden group/img"
          style={{ width: "48%", minHeight: 200, ...leftColStyle, ...sectionRing("imagen") }}
        >
          {/* Imagen */}
          {block.props.imageUrl && imgError ? (
            <div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground/40 w-full h-full absolute inset-0">
              <ImageOff className="h-6 w-6" />
              <span className="text-[10px]">Sin imagen</span>
            </div>
          ) : (
            <img
              src={block.props.imageUrl || "/placeholder.svg"}
              alt={block.props.name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          )}

          {/* Badge principal — draggable + doble click para editar */}
          <span
            ref={badgeLabelRef}
            className={`absolute font-bold leading-none shadow-md ${isEditingBadge ? "cursor-text" : "cursor-grab select-none active:cursor-grabbing"}`}
            style={{
              top: `${block.props.badgeTop}%`,
              left: `${block.props.badgeLeft}%`,
              backgroundColor: block.props.discountBadgeBg,
              color: block.props.discountBadgeFg,
              fontSize: block.props.badgeFontSize ?? 12,
              borderRadius: (block.props.badgeRadiusTL !== undefined || block.props.badgeRadiusTR !== undefined || block.props.badgeRadiusBR !== undefined || block.props.badgeRadiusBL !== undefined)
                ? `${block.props.badgeRadiusTL ?? block.props.badgeBorderRadius ?? 20}px ${block.props.badgeRadiusTR ?? block.props.badgeBorderRadius ?? 20}px ${block.props.badgeRadiusBR ?? block.props.badgeBorderRadius ?? 20}px ${block.props.badgeRadiusBL ?? block.props.badgeBorderRadius ?? 20}px`
                : block.props.badgeBorderRadius ?? 20,
              border: (block.props.badgeBorderWidth ?? 0) > 0
                ? `${block.props.badgeBorderWidth}px solid ${block.props.badgeBorderColor ?? "#000000"}`
                : "none",
              padding: "4px 10px",
              transform: "translate(-50%, -50%)",
              whiteSpace: "nowrap",
              outline: isEditingBadge ? "2px solid rgba(139,92,246,0.6)" : "none",
              minWidth: 20,
              zIndex: 20,
            }}
            contentEditable={isSelected && isEditingBadge}
            suppressContentEditableWarning
            data-focus-section="badge-principal"
            onMouseDown={(e) => {
              if (isEditingBadge) { e.stopPropagation(); return; }
              handleBadgeDragStart(e);
            }}
            onMouseEnter={(e) => e.stopPropagation()}
            onDoubleClick={(e) => {
              if (!isSelected || !onChange) return;
              e.stopPropagation();
              setIsEditingBadge(true);
              setTimeout(() => {
                if (badgeLabelRef.current) {
                  badgeLabelRef.current.focus();
                  const range = document.createRange();
                  range.selectNodeContents(badgeLabelRef.current);
                  window.getSelection()?.removeAllRanges();
                  window.getSelection()?.addRange(range);
                }
              }, 0);
            }}
            onBlur={(e) => {
              if (!isEditingBadge) return;
              const newText = e.currentTarget.textContent ?? "";
              onChange?.({ ...block, props: { ...block.props, discountLabel: newText } });
              setIsEditingBadge(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); }
              if (e.key === "Escape") {
                e.preventDefault();
                if (badgeLabelRef.current) badgeLabelRef.current.textContent = block.props.discountLabel;
                setIsEditingBadge(false);
              }
              e.stopPropagation();
            }}
          >
            {!isEditingBadge && (block.props.discountLabel || "Descuento Doble")}
          </span>

          {/* Badge secundaria — fija esquina superior derecha */}
          {block.props.secondBadge && (
            <span
              className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold leading-none"
              style={{
                backgroundColor: block.props.secondBadgeBg ?? "#F97316",
                color: block.props.secondBadgeFg ?? "#FFFFFF",
              }}
            >
              {block.props.secondBadge}
            </span>
          )}

          {/* ImageEditOverlay cuando seleccionado */}
          {isSelected && onChange && (
            <ImageEditOverlay
              src={block.props.imageUrl ?? ""}
              onChange={(imageUrl) => onChange({ ...block, props: { ...block.props, imageUrl } })}
              blockId={block.id}
              libraryField="imageUrl"
            />
          )}
        </div>

        {/* ── RIGHT COLUMN: fondo de color, precio grande, ahorro, desde ── */}
        <div
          ref={editorAreaRef}
          className="flex flex-1 min-w-0 flex-col justify-center"
          style={{
            backgroundColor: block.props.rightBgColor ?? "#3DBE4A",
            padding: "12px 14px",
            gap: "6px",
            overflow: "hidden",
            ...rightColStyle,
          }}
        >
          {sectionOrder.map((sectionId, mapIndex) => {
            const sectionJsx = renderSection(sectionId, mapIndex);
            if (!sectionJsx) return null;
            return (
              <SectionWrapper
                key={`${sectionId}_${mapIndex}`}
                id={sectionId}
                index={mapIndex}
                order={sectionOrder}
                isSelected={isSelected}
                onChange={onChange}
                block={block}
                isActive={!!isSelected && activeSectionKey === `${sectionId}_${mapIndex}`}
              >
                {sectionJsx}
              </SectionWrapper>
            );
          })}

          {/* Floating toolbar — aparece al seleccionar texto en cualquier campo */}
          {isSelected && onChange && <TextFloatingToolbar containerRef={editorAreaRef} />}

        </div>
      </div>
    </article>
  );

  function renderSection(id: string, idx: number): React.ReactNode {
    switch (id) {
      case "logo":
        if (!block.props.logoUrl) return null;
        return (
          <div className={`flex ${logoAlignClass}`} data-focus-section="logo" style={{ marginBottom: 4, ...sectionRing(`${id}_${idx}`) }}>
            <img
              src={block.props.logoUrl}
              alt="logo"
              style={{ width: block.props.logoSize ?? 60 }}
              className="h-auto object-contain"
            />
          </div>
        );

      case "discount":
        if (!block.props.discountNumber) return null;
        return (
          <div
            className="flex items-center leading-none gap-2"
            data-focus-section="descuento"
            style={{
              ...sectionRing(`${id}_${idx}`),
              justifyContent: block.props.discountAlign === "center" ? "center" : block.props.discountAlign === "right" ? "flex-end" : "flex-start",
            }}
          >
            {/* Número grande */}
            <span
              className="font-black leading-none"
              style={{ fontSize: 64, color: block.props.discountNumberColor ?? "#ffffff" }}
            >
              {block.props.discountNumber}
            </span>
            {/* Símbolo + texto apilados */}
            <div className="flex flex-col justify-center">
              <span
                className="font-black leading-none"
                style={{ fontSize: 32, color: block.props.discountSymbolColor ?? "#ffffff" }}
              >
                {block.props.discountSymbol ?? "%"}
              </span>
              <span
                className="font-bold"
                style={{ fontSize: 14, color: block.props.discountTextColor ?? "#ffffff", lineHeight: 1.2, marginTop: 2 }}
              >
                {block.props.discountText ?? "DCTO."}
              </span>
            </div>
            {/* Badge Oferta — a la derecha del símbolo */}
            {(block.props.ofertaShow && (block.props.ofertaLabel || block.props.ofertaLogoUrl)) && (
              <div
                className="flex items-center gap-1 self-center"
                style={{
                  backgroundColor: block.props.ofertaBg ?? "transparent",
                  borderRadius: block.props.ofertaBorderRadius ?? 6,
                  padding: block.props.ofertaBg && block.props.ofertaBg !== "transparent" ? "3px 8px" : 0,
                }}
              >
                {block.props.ofertaLabel && (
                  <span
                    className="text-[10px] font-bold whitespace-nowrap"
                    style={{ color: block.props.ofertaLabelFg ?? "#1a5c2a" }}
                  >
                    {block.props.ofertaLabel}
                  </span>
                )}
                {block.props.ofertaLogoUrl && (
                  <img
                    src={block.props.ofertaLogoUrl}
                    alt=""
                    style={{ width: block.props.ofertaLogoSize ?? 60, height: "auto", display: "block" }}
                  />
                )}
              </div>
            )}
          </div>
        );

      case "price":
        if (!block.props.price) return null;
        return (
          <div
            className="flex items-baseline leading-none"
            data-focus-section="precios"
            style={{
              justifyContent: block.props.priceAlign === "center" ? "center" : block.props.priceAlign === "right" ? "flex-end" : "flex-start",
              ...sectionRing(`${id}_${idx}`),
            }}
          >
            <div
              className="font-bold leading-none"
              style={{
                fontSize: block.props.priceSize ?? 50,
                color: block.props.priceFg ?? "#ffffff",
              }}
            >
              {isSelected && onChange ? (
                <ContentEditableDiv
                  html={block.props.price}
                  onChange={(html) => onChange({ ...block, props: { ...block.props, price: html } })}
                  className="min-w-[40px] rounded px-0.5 outline-none focus:ring-1 focus:ring-white/40"
                />
              ) : (
                <span dangerouslySetInnerHTML={{ __html: block.props.price }} />
              )}
            </div>
            {block.props.unit && (
              <span
                className="ml-1 text-[18px] font-bold leading-none"
                style={{ color: block.props.priceFg ?? "#ffffff" }}
              >
                {block.props.unit}
              </span>
            )}
          </div>
        );

      case "priceTag":
        if (!block.props.priceTagShow) return null;
        return (
          <div
            className="mt-1 flex"
            data-focus-section="precio-tag"
            style={{
              justifyContent:
                block.props.priceTagAlign === "center" ? "center"
                : block.props.priceTagAlign === "right" ? "flex-end"
                : "flex-start",
              ...sectionRing(`${id}_${idx}`),
            }}
          >
          <div className="flex items-stretch" style={{ maxWidth: 220 }}>
            {/* Parte izquierda — label */}
            <div
              className="flex items-center px-2 py-0.5 text-[13px] font-black leading-tight"
              style={{
                backgroundColor: block.props.priceTagLabelBg ?? "#ffffff",
                color: block.props.priceTagLabelFg ?? "#23af3d",
                borderRadius: `${block.props.priceTagRadius ?? 10}px 0 0 ${block.props.priceTagRadius ?? 10}px`,
              }}
            >
              {isSelected && onChange ? (
                <ContentEditableDiv
                  html={block.props.priceTagLabel ?? "Ahorro"}
                  onChange={(html) => onChange({ ...block, props: { ...block.props, priceTagLabel: html } })}
                  className="outline-none min-w-[30px] whitespace-nowrap"
                />
              ) : (
                <span dangerouslySetInnerHTML={{ __html: block.props.priceTagLabel ?? "Ahorro" }} />
              )}
            </div>
            {/* Parte derecha — valor */}
            <div
              className="flex items-center px-2.5 py-0.5 text-[16px] font-black leading-tight"
              style={{
                backgroundColor: block.props.priceTagValueBg ?? "#000000",
                color: block.props.priceTagValueFg ?? "#ffffff",
                borderRadius: `0 ${block.props.priceTagRadius ?? 10}px ${block.props.priceTagRadius ?? 10}px 0`,
              }}
            >
              {isSelected && onChange ? (
                <ContentEditableDiv
                  html={block.props.priceTagValue ?? "$ 1.640"}
                  onChange={(html) => onChange({ ...block, props: { ...block.props, priceTagValue: html } })}
                  className="outline-none min-w-[40px] whitespace-nowrap"
                />
              ) : (
                <span dangerouslySetInnerHTML={{ __html: block.props.priceTagValue ?? "$ 1.640" }} />
              )}
            </div>
          </div>
          </div>
        );

      case "ahorro":
        if (!block.props.ahorroLabel) return null;
        return (
          <div data-focus-section="col-derecha" style={sectionRing(`${id}_${idx}`)}>
            <span
              className="inline-block rounded-[6px] px-2.5 py-1 text-[13px] font-bold text-white leading-tight"
              style={{ background: "rgba(0,0,0,0.2)" }}
            >
              {isSelected && onChange ? (
                <>
                  Ahorro{" "}
                  <ContentEditableDiv
                    html={block.props.ahorroLabel}
                    onChange={(html) => onChange({ ...block, props: { ...block.props, ahorroLabel: html } })}
                    className="inline min-w-[30px] outline-none focus:ring-1 focus:ring-white/40"
                  />
                </>
              ) : (
                <>Ahorro <span dangerouslySetInnerHTML={{ __html: block.props.ahorroLabel }} /></>
              )}
            </span>
          </div>
        );

      case "name":
        if (!block.props.name) return null;
        return (
          <div
            className="leading-snug"
            data-focus-section="producto"
            style={{
              color: "rgba(255,255,255,0.9)",
              marginTop: 6,
              fontSize: 24,
              fontWeight: 600,
              wordBreak: "break-word",
              overflowWrap: "break-word",
              minWidth: 0,
              textAlign: block.props.nameAlign ?? "left",
              ...sectionRing(`${id}_${idx}`),
            }}
          >
            {isSelected && onChange ? (
              <ContentEditableDiv
                html={block.props.name}
                onChange={(html) => onChange({ ...block, props: { ...block.props, name: html } })}
                className="w-full rounded px-0.5 outline-none focus:ring-1 focus:ring-white/40 break-words"
              />
            ) : (
              <span dangerouslySetInnerHTML={{ __html: block.props.name }} />
            )}
          </div>
        );

      default:
        return null;
    }
  }
}
