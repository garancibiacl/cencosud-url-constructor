import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ButtonBlock, HeroBlock, ImageBlock, MailingBlock, SpacerBlock, TextBlock } from "../../logic/schema/block.types";

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

function ContentEditableDiv({
  html,
  onChange,
  className,
  style,
  autoFocus,
}: {
  html: string;
  onChange: (html: string) => void;
  className?: string;
  style?: CSSProperties;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
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
  }, [html]);

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
}

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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

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

      {/* Overlay con input URL */}
      {open && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]"
          onClick={(e) => e.stopPropagation()}
        >
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
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Block views
// ---------------------------------------------------------------------------

export function HeroBlockView({ block, isSelected, onChange }: { block: HeroBlock; isSelected?: boolean; onChange?: (nextBlock: HeroBlock) => void }) {
  return (
    <article className={canvasShell(isSelected)}>
      <div className="relative aspect-[5/3] w-full overflow-hidden bg-secondary group/img">
        <img
          src={block.props.imageUrl || "/placeholder.svg"}
          alt={block.props.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {isSelected && onChange && (
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
  const handleChange = useCallback(
    (html: string) => onChange?.({ ...block, props: { ...block.props, html } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onChange, block.id],
  );

  return (
    <article className={canvasShell(isSelected)} style={getPaddingStyle(block)}>
      {isSelected && onChange ? (
        <ContentEditableDiv
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
  return (
    <article className={canvasShell(isSelected)} style={getPaddingStyle(block)}>
      <div className="relative overflow-hidden rounded-sm bg-secondary group/img">
        <img
          src={block.props.src || "/placeholder.svg"}
          alt={block.props.alt || "Imagen del bloque"}
          className="h-auto w-full object-cover"
          loading="lazy"
        />
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
