import type { CSSProperties } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

export function HeroBlockView({ block, isSelected }: { block: HeroBlock; isSelected?: boolean }) {
  return (
    <article className={canvasShell(isSelected)}>
      <div className="aspect-[5/3] w-full overflow-hidden bg-secondary">
        <img
          src={block.props.imageUrl || "/placeholder.svg"}
          alt={block.props.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="space-y-3" style={getPaddingStyle(block)}>
        <div className="space-y-2">
          <h3 className="text-[28px] font-semibold leading-tight text-foreground">{block.props.title}</h3>
          {block.props.subtitle ? <p className="text-sm leading-6 text-muted-foreground">{block.props.subtitle}</p> : null}
        </div>
        {block.props.ctaLabel ? (
          <div className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground">
            {block.props.ctaLabel}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function TextBlockView({ block, isSelected }: { block: TextBlock; isSelected?: boolean }) {
  return (
    <article className={canvasShell(isSelected)} style={getPaddingStyle(block)}>
      <div
        className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-a:text-primary"
        style={{
          textAlign: block.props.align,
          fontSize: block.props.fontSize,
          lineHeight: `${block.props.lineHeight}px`,
        }}
        dangerouslySetInnerHTML={{ __html: block.props.html }}
      />
    </article>
  );
}

export function ImageBlockView({ block, isSelected }: { block: ImageBlock; isSelected?: boolean }) {
  return (
    <article className={canvasShell(isSelected)} style={getPaddingStyle(block)}>
      <div className="overflow-hidden rounded-sm bg-secondary">
        <img
          src={block.props.src || "/placeholder.svg"}
          alt={block.props.alt || "Imagen del bloque"}
          className="h-auto w-full object-cover"
          loading="lazy"
        />
      </div>
      {block.props.alt ? <p className="mt-2 text-xs text-muted-foreground">{block.props.alt}</p> : null}
    </article>
  );
}

export function ButtonBlockView({ block, isSelected }: { block: ButtonBlock; isSelected?: boolean }) {
  const alignment = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }[block.props.align ?? "center"];

  return (
    <article className={canvasShell(isSelected)} style={getPaddingStyle(block)}>
      <div className={`flex ${alignment}`}>
        <div className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-card)]">
          {block.props.label}
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