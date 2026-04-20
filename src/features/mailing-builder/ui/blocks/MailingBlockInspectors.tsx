import type { ReactNode } from "react";
import { AlignHorizontalJustifyCenter, Image as ImageIcon, Layers3, Link2, Ruler, Type, WholeWord } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ButtonBlock, HeroBlock, ImageBlock, SpacerBlock, TextBlock } from "../../logic/schema/block.types";

type SharedProps<TBlock> = {
  block: TBlock;
  onChange: (nextBlock: TBlock) => void;
};

type SectionProps = {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
};

function InspectorSection({ title, icon, children }: SectionProps) {
  return (
    <section className="space-y-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{icon}{title}</p>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">{icon}{label}</Label>
      {children}
    </div>
  );
}

function LayoutFields<TBlock extends { layout: { colSpan: number; padding?: { top?: number; right?: number; bottom?: number; left?: number } } }>({
  block,
  onChange,
}: SharedProps<TBlock>) {
  const updatePadding = (side: "top" | "right" | "bottom" | "left", value: number) => {
    onChange({
      ...block,
      layout: {
        ...block.layout,
        padding: {
          ...block.layout.padding,
          [side]: value,
        },
      },
    } as TBlock);
  };

  return (
    <InspectorSection title="Layout" icon={<Layers3 className="h-3.5 w-3.5" />}>
      <Field label="Columnas" icon={<Ruler className="h-3.5 w-3.5" />}>
        <Input
          type="number"
          min={1}
          max={12}
          value={block.layout.colSpan}
          onChange={(event) => onChange({ ...block, layout: { ...block.layout, colSpan: Number(event.target.value) || 1 } } as TBlock)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Padding top" icon={<Ruler className="h-3.5 w-3.5" />}>
          <Input type="number" value={block.layout.padding?.top ?? 0} onChange={(event) => updatePadding("top", Number(event.target.value) || 0)} />
        </Field>
        <Field label="Padding right" icon={<Ruler className="h-3.5 w-3.5" />}>
          <Input type="number" value={block.layout.padding?.right ?? 0} onChange={(event) => updatePadding("right", Number(event.target.value) || 0)} />
        </Field>
        <Field label="Padding bottom" icon={<Ruler className="h-3.5 w-3.5" />}>
          <Input type="number" value={block.layout.padding?.bottom ?? 0} onChange={(event) => updatePadding("bottom", Number(event.target.value) || 0)} />
        </Field>
        <Field label="Padding left" icon={<Ruler className="h-3.5 w-3.5" />}>
          <Input type="number" value={block.layout.padding?.left ?? 0} onChange={(event) => updatePadding("left", Number(event.target.value) || 0)} />
        </Field>
      </div>
    </InspectorSection>
  );
}

export function HeroBlockInspector({ block, onChange }: SharedProps<HeroBlock>) {
  return (
    <div className="space-y-5">
      <InspectorSection title="Contenido" icon={<Type className="h-3.5 w-3.5" />}>
        <Field label="Título" icon={<WholeWord className="h-3.5 w-3.5" />}>
          <Input value={block.props.title} onChange={(event) => onChange({ ...block, props: { ...block.props, title: event.target.value } })} />
        </Field>
        <Field label="Bajada" icon={<AlignHorizontalJustifyCenter className="h-3.5 w-3.5" />}>
          <Textarea value={block.props.subtitle ?? ""} onChange={(event) => onChange({ ...block, props: { ...block.props, subtitle: event.target.value } })} />
        </Field>
        <Field label="Imagen URL" icon={<ImageIcon className="h-3.5 w-3.5" />}>
          <Input value={block.props.imageUrl} onChange={(event) => onChange({ ...block, props: { ...block.props, imageUrl: event.target.value } })} />
        </Field>
        <Field label="CTA label" icon={<WholeWord className="h-3.5 w-3.5" />}>
          <Input value={block.props.ctaLabel ?? ""} onChange={(event) => onChange({ ...block, props: { ...block.props, ctaLabel: event.target.value } })} />
        </Field>
        <Field label="Link CTA" icon={<Link2 className="h-3.5 w-3.5" />}>
          <Input value={block.props.href ?? ""} onChange={(event) => onChange({ ...block, props: { ...block.props, href: event.target.value } })} />
        </Field>
      </InspectorSection>
      <LayoutFields block={block} onChange={onChange} />
    </div>
  );
}

export function TextBlockInspector({ block, onChange }: SharedProps<TextBlock>) {
  return (
    <div className="space-y-5">
      <InspectorSection title="Contenido" icon={<Type className="h-3.5 w-3.5" />}>
        <Field label="HTML" icon={<WholeWord className="h-3.5 w-3.5" />}>
          <Textarea className="min-h-[160px]" value={block.props.html} onChange={(event) => onChange({ ...block, props: { ...block.props, html: event.target.value } })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Alineación" icon={<AlignHorizontalJustifyCenter className="h-3.5 w-3.5" />}>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={block.props.align ?? "left"}
              onChange={(event) => onChange({ ...block, props: { ...block.props, align: event.target.value as TextBlock["props"]["align"] } })}
            >
              <option value="left">Izquierda</option>
              <option value="center">Centro</option>
              <option value="right">Derecha</option>
            </select>
          </Field>
          <Field label="Font size" icon={<Type className="h-3.5 w-3.5" />}>
            <Input type="number" value={block.props.fontSize ?? 16} onChange={(event) => onChange({ ...block, props: { ...block.props, fontSize: Number(event.target.value) || 16 } })} />
          </Field>
        </div>
        <Field label="Line height" icon={<Ruler className="h-3.5 w-3.5" />}>
          <Input type="number" value={block.props.lineHeight ?? 24} onChange={(event) => onChange({ ...block, props: { ...block.props, lineHeight: Number(event.target.value) || 24 } })} />
        </Field>
      </InspectorSection>
      <LayoutFields block={block} onChange={onChange} />
    </div>
  );
}

export function ImageBlockInspector({ block, onChange }: SharedProps<ImageBlock>) {
  return (
    <div className="space-y-5">
      <InspectorSection title="Contenido" icon={<ImageIcon className="h-3.5 w-3.5" />}>
        <Field label="Imagen URL" icon={<ImageIcon className="h-3.5 w-3.5" />}>
          <Input value={block.props.src} onChange={(event) => onChange({ ...block, props: { ...block.props, src: event.target.value } })} />
        </Field>
        <Field label="Alt" icon={<Type className="h-3.5 w-3.5" />}>
          <Input value={block.props.alt} onChange={(event) => onChange({ ...block, props: { ...block.props, alt: event.target.value } })} />
        </Field>
        <Field label="Link" icon={<Link2 className="h-3.5 w-3.5" />}>
          <Input value={block.props.href ?? ""} onChange={(event) => onChange({ ...block, props: { ...block.props, href: event.target.value } })} />
        </Field>
      </InspectorSection>
      <LayoutFields block={block} onChange={onChange} />
    </div>
  );
}

export function ButtonBlockInspector({ block, onChange }: SharedProps<ButtonBlock>) {
  return (
    <div className="space-y-5">
      <InspectorSection title="Contenido" icon={<MousePointerClick className="h-3.5 w-3.5" />}>
        <Field label="Label" icon={<WholeWord className="h-3.5 w-3.5" />}>
          <Input value={block.props.label} onChange={(event) => onChange({ ...block, props: { ...block.props, label: event.target.value } })} />
        </Field>
        <Field label="Link" icon={<Link2 className="h-3.5 w-3.5" />}>
          <Input value={block.props.href} onChange={(event) => onChange({ ...block, props: { ...block.props, href: event.target.value } })} />
        </Field>
        <Field label="Alineación" icon={<AlignHorizontalJustifyCenter className="h-3.5 w-3.5" />}>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={block.props.align ?? "center"}
            onChange={(event) => onChange({ ...block, props: { ...block.props, align: event.target.value as ButtonBlock["props"]["align"] } })}
          >
            <option value="left">Izquierda</option>
            <option value="center">Centro</option>
            <option value="right">Derecha</option>
          </select>
        </Field>
      </InspectorSection>
      <LayoutFields block={block} onChange={onChange} />
    </div>
  );
}

export function SpacerBlockInspector({ block, onChange }: SharedProps<SpacerBlock>) {
  return (
    <div className="space-y-5">
      <InspectorSection title="Espaciado" icon={<Ruler className="h-3.5 w-3.5" />}>
        <Field label="Altura" icon={<Ruler className="h-3.5 w-3.5" />}>
          <Input type="number" value={block.props.height} onChange={(event) => onChange({ ...block, props: { ...block.props, height: Number(event.target.value) || 0 } })} />
        </Field>
      </InspectorSection>
      <LayoutFields block={block} onChange={onChange} />
    </div>
  );
}