import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { CodeXml, ImageIcon, ImageOff, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ButtonBlock, HeroBlock, ImageBlock, MailingBlock, ProductBlock, RawHtmlBlock, SpacerBlock, TextBlock } from "../../logic/schema/block.types";
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

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => { isFocused.current = true; }}
      onBlur={() => { isFocused.current = false; }}
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
}: {
  src: string;
  onChange: (src: string) => void;
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
    // Reset so the same file can be re-selected
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
          onClick={handleImageClick}
        >
          <div className="flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1.5 text-xs font-medium shadow-md">
            <ImageIcon className="h-3 w-3" />
            Cambiar imagen
          </div>
        </div>
      )}

      {/* Overlay con input URL y carga de archivo */}
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
            <div className="mx-4 flex w-full max-w-xs items-center gap-2 rounded-lg bg-card px-3 py-2.5 shadow-xl ring-1 ring-border">
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

export function RawHtmlBlockView({ block, isSelected }: BlockViewProps<RawHtmlBlock>) {
  return (
    <div className={canvasShell(isSelected) + " bg-muted/30"} style={getPaddingStyle(block)}>
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
          <CodeXml className="h-3.5 w-3.5 text-primary/60" />
        </div>
        <div>
          <p className="text-xs font-medium text-foreground">{block.props.presetLabel ?? "Sección HTML"}</p>
          <p className="text-[10px] text-muted-foreground">Sección fija — no editable</p>
        </div>
      </div>
      <div className="pointer-events-none overflow-hidden rounded-b-md border-t border-border">
        {block.props.presetId?.includes("jumbo") && (
          <div className="bg-white px-3 py-2">
            <div className="h-5 w-24 rounded bg-[#2DC850]/20 mb-1.5" />
            <div className="h-5 w-full rounded bg-[#2DC850]" />
            <div className="mt-1.5 h-3 w-20 rounded bg-muted/60" />
          </div>
        )}
        {block.props.presetId?.includes("santa-isabel") && (
          <div className="bg-white px-3 py-2">
            <div className="h-5 w-20 rounded bg-[#de0610]/20 mb-1.5" />
            <div className="h-3 w-32 rounded bg-muted/60 mt-1.5" />
          </div>
        )}
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
