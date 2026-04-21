import { useState } from "react";
import type { ReactNode } from "react";
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight,
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp,
  ArrowLeftRight, ArrowUpDown,
  Check, Image as ImageIcon, Link2, Monitor,
  MonitorSmartphone, PenLine, Plus, Settings2, Smartphone,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type {
  ButtonBlock, HeroBlock, ImageBlock, SpacerBlock, TextBlock,
} from "../../logic/schema/block.types";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos compartidos
// ─────────────────────────────────────────────────────────────────────────────

type SharedProps<TBlock> = { block: TBlock; onChange: (next: TBlock) => void };

type PaddingValue = { top: number; right: number; bottom: number; left: number };

// ─────────────────────────────────────────────────────────────────────────────
// PxStepper
// ─────────────────────────────────────────────────────────────────────────────

function PxStepper({
  value = 0,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  unit = "px",
  className = "",
}: {
  value?: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const display = Number.isInteger(value) ? value : parseFloat(value.toFixed(2));

  return (
    <div className={`flex h-7 items-center overflow-hidden rounded-md border border-border bg-card ${className}`}>
      <button
        type="button"
        onClick={() => onChange(clamp(parseFloat((value - step).toFixed(4))))}
        className="flex h-full w-6 items-center justify-center text-muted-foreground/60 transition hover:bg-secondary/60 hover:text-foreground"
        tabIndex={-1}
      >
        <span className="select-none text-sm leading-none">−</span>
      </button>
      <input
        type="number"
        value={display}
        step={step}
        onChange={(e) => onChange(clamp(parseFloat(e.target.value) || min))}
        className="w-10 bg-transparent text-center text-xs text-foreground focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="pr-1.5 text-[10px] select-none text-muted-foreground/40">{unit}</span>
      <button
        type="button"
        onClick={() => onChange(clamp(parseFloat((value + step).toFixed(4))))}
        className="flex h-full w-6 items-center justify-center text-muted-foreground/60 transition hover:bg-secondary/60 hover:text-foreground"
        tabIndex={-1}
      >
        <span className="select-none text-sm leading-none">+</span>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CheckboxToggle — checkbox estilizado azul (estilo Brevo)
// ─────────────────────────────────────────────────────────────────────────────

function CheckboxToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-1.5">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <div
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border transition ${
          checked ? "border-primary bg-primary" : "border-border bg-card"
        }`}
      >
        {checked && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
      </div>
      <span className="text-[11px] text-foreground/60">{label}</span>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SegmentedAlign — 3 opciones (izquierda / centro / derecha)
// ─────────────────────────────────────────────────────────────────────────────

function SegmentedAlign({
  value,
  onChange,
}: {
  value: "left" | "center" | "right";
  onChange: (v: "left" | "center" | "right") => void;
}) {
  const options = [
    { value: "left"   as const, icon: <AlignLeft    className="h-3.5 w-3.5" /> },
    { value: "center" as const, icon: <AlignCenter  className="h-3.5 w-3.5" /> },
    { value: "right"  as const, icon: <AlignRight   className="h-3.5 w-3.5" /> },
  ];
  return (
    <div className="flex h-7 overflow-hidden rounded-md border border-border">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          title={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex flex-1 items-center justify-center transition ${
            value === opt.value
              ? "bg-foreground text-background"
              : "bg-card text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          }`}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SegmentedTextAlign — 4 opciones incluyendo justify
// ─────────────────────────────────────────────────────────────────────────────

function SegmentedTextAlign({
  value,
  onChange,
}: {
  value: "left" | "center" | "right" | "justify";
  onChange: (v: "left" | "center" | "right" | "justify") => void;
}) {
  const options = [
    { value: "left"    as const, icon: <AlignLeft    className="h-3.5 w-3.5" /> },
    { value: "center"  as const, icon: <AlignCenter  className="h-3.5 w-3.5" /> },
    { value: "right"   as const, icon: <AlignRight   className="h-3.5 w-3.5" /> },
    { value: "justify" as const, icon: <AlignJustify className="h-3.5 w-3.5" /> },
  ];
  return (
    <div className="flex h-7 overflow-hidden rounded-md border border-border">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          title={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex flex-1 items-center justify-center transition ${
            value === opt.value
              ? "bg-foreground text-background"
              : "bg-card text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          }`}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LineHeightControl — presets de interlineado + stepper
// ─────────────────────────────────────────────────────────────────────────────

function LhIcon({ gaps }: { gaps: [number, number] }) {
  const [g1, g2] = gaps;
  return (
    <svg viewBox="0 0 10 12" className="h-3 w-2.5 fill-current" aria-hidden>
      <rect x="0" y="0"      width="10" height="1.6" rx="0.8" />
      <rect x="0" y={g1}     width="10" height="1.6" rx="0.8" />
      <rect x="0" y={g1+g2}  width="10" height="1.6" rx="0.8" />
    </svg>
  );
}

const LH_PRESETS: { value: number; icon: ReactNode }[] = [
  { value: 1.0, icon: <LhIcon gaps={[3.5, 3.5]} /> },
  { value: 1.2, icon: <LhIcon gaps={[4.5, 4.5]} /> },
  { value: 1.5, icon: <LhIcon gaps={[5.5, 5.5]} /> },
  { value: 2.0, icon: <Settings2 className="h-3 w-3" /> },
];

function LineHeightControl({
  value = 1.4,
  onChange,
}: {
  value?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 overflow-hidden rounded-md border border-border">
        {LH_PRESETS.map((p) => {
          const active = Math.abs((value ?? 1.4) - p.value) < 0.01;
          return (
            <button
              key={p.value}
              type="button"
              title={`${p.value}×`}
              onClick={() => onChange(p.value)}
              className={`flex w-7 items-center justify-center transition ${
                active
                  ? "bg-foreground text-background"
                  : "bg-card text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              {p.icon}
            </button>
          );
        })}
      </div>
      <PxStepper value={value} onChange={onChange} min={0.5} max={5} step={0.1} unit="×" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ColorSwatch
// ─────────────────────────────────────────────────────────────────────────────

function ColorSwatch({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  const display = value && value !== "transparent" ? value : undefined;
  const inputId = `cs-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <div className="flex h-7 w-full items-center gap-2 rounded-md border border-border bg-card px-2">
      <label htmlFor={inputId} className="flex cursor-pointer items-center gap-1.5">
        {display ? (
          <span
            className="h-4 w-4 shrink-0 rounded border border-border/60 shadow-inner"
            style={{ backgroundColor: display }}
          />
        ) : (
          <span
            className="h-4 w-4 shrink-0 rounded border border-border/60"
            style={{
              backgroundImage:
                "linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%),linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%)",
              backgroundSize: "6px 6px",
              backgroundPosition: "0 0,3px 3px",
              backgroundColor: "#fff",
            }}
          />
        )}
        <span className="font-mono text-[11px] text-foreground/60">{display ?? "—"}</span>
      </label>
      <input
        id={inputId}
        type="color"
        value={display ?? "#ffffff"}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
      {display && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="ml-auto text-xs text-muted-foreground/40 transition hover:text-destructive"
          tabIndex={-1}
          title="Quitar color"
        >
          ×
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PaddingEditor — Agrupar lados: V+H cuando agrupado, 4 lados cuando no
// ─────────────────────────────────────────────────────────────────────────────

function PaddingEditor({
  value,
  onChange,
}: {
  value: PaddingValue;
  onChange: (v: PaddingValue) => void;
}) {
  const vhLinked = value.top === value.bottom && value.left === value.right;
  const [linked, setLinked] = useState(vhLinked);

  const setVertical   = (v: number) => onChange({ ...value, top: v,    bottom: v });
  const setHorizontal = (v: number) => onChange({ ...value, left: v,   right: v });
  const setSide = (side: keyof PaddingValue, v: number) =>
    onChange({ ...value, [side]: v });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground/70">Margen interior</span>
        <CheckboxToggle
          checked={linked}
          onChange={() => setLinked((v) => !v)}
          label="Agrupar lados"
        />
      </div>

      {linked ? (
        <div className="grid grid-cols-2 gap-2">
          {/* Vertical (top + bottom) */}
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3 shrink-0 text-muted-foreground/50" />
            <PxStepper value={value.top} onChange={setVertical} min={0} max={200} />
          </div>
          {/* Horizontal (left + right) */}
          <div className="flex items-center gap-1">
            <ArrowLeftRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
            <PxStepper value={value.left} onChange={setHorizontal} min={0} max={200} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              { side: "top"    as const, icon: <ArrowUp    className="h-3 w-3 shrink-0 text-muted-foreground/50" /> },
              { side: "right"  as const, icon: <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/50" /> },
              { side: "bottom" as const, icon: <ArrowDown  className="h-3 w-3 shrink-0 text-muted-foreground/50" /> },
              { side: "left"   as const, icon: <ArrowLeft  className="h-3 w-3 shrink-0 text-muted-foreground/50" /> },
            ] as const
          ).map(({ side, icon }) => (
            <div key={side} className="flex items-center gap-1">
              {icon}
              <PxStepper value={value[side]} onChange={(v) => setSide(side, v)} min={0} max={200} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InspSection — sección con separador estilo Brevo
// ─────────────────────────────────────────────────────────────────────────────

function InspSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/50 bg-secondary/30 px-4 py-2.5">
        <span className="text-[13px] font-bold tracking-tight text-foreground">
          {title}
        </span>
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InspRow — fila label + control
// ─────────────────────────────────────────────────────────────────────────────

function InspRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[32px] items-center justify-between gap-3">
      <span className="shrink-0 text-[12px] font-medium text-foreground/80">{label}</span>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InlineEditHint — aviso edición canvas
// ─────────────────────────────────────────────────────────────────────────────

function InlineEditHint({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-[12px] font-medium text-primary/80">
      <PenLine className="h-3.5 w-3.5 shrink-0" />
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// padVal — helper padding con fallback a 0
// ─────────────────────────────────────────────────────────────────────────────

function padVal(block: { layout: { padding?: Partial<PaddingValue> } }): PaddingValue {
  return {
    top:    block.layout.padding?.top    ?? 0,
    right:  block.layout.padding?.right  ?? 0,
    bottom: block.layout.padding?.bottom ?? 0,
    left:   block.layout.padding?.left   ?? 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HeroBlockInspector
// ─────────────────────────────────────────────────────────────────────────────

export function HeroBlockInspector({ block, onChange }: SharedProps<HeroBlock>) {
  return (
    <div className="space-y-3">

      <InspSection title="Imagen">
        {block.props.imageUrl && (
          <div className="overflow-hidden rounded-md border border-border bg-secondary/30">
            <img src={block.props.imageUrl} alt="preview" className="h-24 w-full object-cover" />
          </div>
        )}
        <div className="space-y-1">
          <span className="text-xs text-foreground/60">URL de imagen</span>
          <Input
            value={block.props.imageUrl ?? ""}
            onChange={(e) => onChange({ ...block, props: { ...block.props, imageUrl: e.target.value } })}
            placeholder="https://..."
            className="h-7 text-xs"
          />
        </div>
      </InspSection>

      <InspSection title="Contenido">
        <InlineEditHint>Edita título, bajada y CTA directamente en el canvas</InlineEditHint>
      </InspSection>

      <InspSection title="Enlace CTA">
        <div className="space-y-1">
          <span className="text-xs text-foreground/60">URL destino</span>
          <Input
            value={block.props.href ?? ""}
            onChange={(e) => onChange({ ...block, props: { ...block.props, href: e.target.value } })}
            placeholder="https://..."
            className="h-7 text-xs"
          />
        </div>
      </InspSection>

      <InspSection title="Espaciado">
        <PaddingEditor
          value={padVal(block)}
          onChange={(padding) => onChange({ ...block, layout: { ...block.layout, padding } })}
        />
      </InspSection>

      <InspSection title="Fondo">
        <InspRow label="Color">
          <ColorSwatch
            value={block.layout.backgroundColor}
            onChange={(v) => onChange({ ...block, layout: { ...block.layout, backgroundColor: v } })}
          />
        </InspRow>
      </InspSection>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TextBlockInspector — replica UX Brevo completa
// ─────────────────────────────────────────────────────────────────────────────

export function TextBlockInspector({ block, onChange }: SharedProps<TextBlock>) {
  const setLayout = (patch: Partial<typeof block.layout>) =>
    onChange({ ...block, layout: { ...block.layout, ...patch } });
  const setProps = (patch: Partial<typeof block.props>) =>
    onChange({ ...block, props: { ...block.props, ...patch } });

  return (
    <div className="space-y-3">

      {/* ── Diseño ─────────────────────────────────────────────────────────── */}
      <InspSection title="Diseño">

        {/* Ancho */}
        <InspRow label="Ancho">
          <div className="flex items-center gap-1">
            <div className="flex h-7 items-center overflow-hidden rounded-md border border-border bg-card">
              <input
                type="number"
                value={block.layout.width ?? 100}
                onChange={(e) => setLayout({ width: Number(e.target.value) || 100 })}
                className="w-14 bg-transparent px-2 text-center text-xs text-foreground focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="flex h-7 items-center overflow-hidden rounded-md border border-border bg-card">
              <select
                value={block.layout.widthUnit ?? "%"}
                onChange={(e) => setLayout({ widthUnit: e.target.value as "px" | "%" })}
                className="h-full bg-transparent px-1.5 text-xs text-foreground focus:outline-none"
              >
                <option value="%">%</option>
                <option value="px">px</option>
              </select>
            </div>
          </div>
        </InspRow>

        {/* Alineación del bloque */}
        <InspRow label="Alineación del bloque">
          <SegmentedAlign
            value={block.layout.blockAlign ?? "left"}
            onChange={(blockAlign) => setLayout({ blockAlign })}
          />
        </InspRow>

        {/* Alineación del texto */}
        <InspRow label="Alineación del texto">
          <SegmentedTextAlign
            value={(block.props.align as "left" | "center" | "right" | "justify") ?? "left"}
            onChange={(align) => setProps({ align })}
          />
        </InspRow>

        {/* Altura de la línea */}
        <div className="space-y-1.5">
          <span className="text-xs text-foreground/70">Altura de la línea</span>
          <LineHeightControl
            value={block.props.lineHeight ?? 1.4}
            onChange={(lineHeight) => setProps({ lineHeight })}
          />
        </div>

      </InspSection>

      {/* ── Espaciado ──────────────────────────────────────────────────────── */}
      <InspSection title="Espaciado">
        <PaddingEditor
          value={padVal(block)}
          onChange={(padding) => setLayout({ padding })}
        />
        <div className="space-y-2">
          <span className="text-xs text-foreground/70">Margen</span>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              <ArrowUpDown className="h-3 w-3 shrink-0 text-muted-foreground/50" />
              <PxStepper
                value={Math.max(block.layout.marginTop ?? 0, block.layout.marginBottom ?? 0)}
                onChange={(v) => setLayout({ marginTop: v, marginBottom: v })}
                min={0}
                max={200}
              />
            </div>
            <div className="flex items-center gap-1">
              <ArrowLeftRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
              <PxStepper
                value={Math.max(block.layout.marginLeft ?? 0, block.layout.marginRight ?? 0)}
                onChange={(v) => setLayout({ marginLeft: v, marginRight: v })}
                min={0}
                max={200}
              />
            </div>
          </div>
        </div>
      </InspSection>

      {/* ── Fondo ──────────────────────────────────────────────────────────── */}
      <InspSection title="Fondo">
        <InspRow label="Color">
          <ColorSwatch
            value={block.layout.backgroundColor}
            onChange={(v) => setLayout({ backgroundColor: v })}
          />
        </InspRow>
        <InspRow label="Imagen">
          <button
            type="button"
            className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs text-foreground/70 transition hover:bg-secondary/60"
          >
            <ImageIcon className="h-3 w-3" />
            Añadir imagen
          </button>
        </InspRow>
        <div className="space-y-1">
          <span className="text-xs text-foreground/60">URL de la imagen</span>
          <div className="flex items-center gap-1">
            <Input
              value={block.layout.backgroundImage ?? ""}
              onChange={(e) => setLayout({ backgroundImage: e.target.value })}
              placeholder="https://..."
              className="h-7 flex-1 text-xs"
            />
            <button
              type="button"
              title="Insertar variable"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-card font-mono text-[10px] text-muted-foreground/60 transition hover:bg-secondary/60"
            >
              {"{}"}
            </button>
          </div>
        </div>
      </InspSection>

      {/* ── Esquinas redondeadas ───────────────────────────────────────────── */}
      <InspSection title="Esquinas redondeadas">
        <InspRow label="Radio">
          <PxStepper
            value={block.layout.borderRadius ?? 0}
            onChange={(borderRadius) => setLayout({ borderRadius })}
            min={0}
            max={999}
          />
        </InspRow>
      </InspSection>

      {/* ── Bordes ─────────────────────────────────────────────────────────── */}
      <InspSection title="Bordes">
        <div className="flex justify-end">
          <CheckboxToggle
            checked={block.layout.borderAll ?? true}
            onChange={() => setLayout({ borderAll: !(block.layout.borderAll ?? true) })}
            label="Aplicar a todos los lados"
          />
        </div>
        <InspRow label="Tamaño">
          <PxStepper
            value={block.layout.borderWidth ?? 0}
            onChange={(borderWidth) => setLayout({ borderWidth })}
            min={0}
            max={20}
          />
        </InspRow>
        <InspRow label="Color">
          <ColorSwatch
            value={block.layout.borderColor}
            onChange={(v) => setLayout({ borderColor: v })}
          />
        </InspRow>
      </InspSection>

      {/* ── Visibilidad del contenido ──────────────────────────────────────── */}
      <InspSection title="Visibilidad del contenido">
        <p className="text-[11px] leading-relaxed text-muted-foreground/70">
          Muestra u oculta contenido en función del tipo de dispositivo u otras condiciones específicas
        </p>
        <div className="space-y-2">
          <span className="text-xs text-foreground/70">Mostrar en:</span>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { value: "all"     as const, label: "Todos los dispositivos", Icon: MonitorSmartphone },
                { value: "desktop" as const, label: "Solo escritorio",         Icon: Monitor          },
                { value: "mobile"  as const, label: "Solo móvil",              Icon: Smartphone        },
              ] as const
            ).map(({ value, label, Icon }) => {
              const active = (block.layout.visibility ?? "all") === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLayout({ visibility: value })}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition ${
                    active
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground/60 hover:bg-secondary/60"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/70">Condiciones de visualización</span>
          <button
            type="button"
            className="flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] text-foreground/60 transition hover:bg-secondary/60"
          >
            <Plus className="h-3 w-3" />
            Añadir condición
          </button>
        </div>
      </InspSection>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ImageBlockInspector
// ─────────────────────────────────────────────────────────────────────────────

export function ImageBlockInspector({ block, onChange }: SharedProps<ImageBlock>) {
  return (
    <div className="space-y-3">

      <InspSection title="Visual">
        {block.props.src && (
          <div className="overflow-hidden rounded-md border border-border bg-secondary/30">
            <img src={block.props.src} alt={block.props.alt || "preview"} className="h-24 w-full object-cover" />
          </div>
        )}
        <div className="space-y-1">
          <span className="text-xs text-foreground/60">URL de imagen</span>
          <Input
            value={block.props.src}
            onChange={(e) => onChange({ ...block, props: { ...block.props, src: e.target.value } })}
            placeholder="https://..."
            className="h-7 text-xs"
            autoFocus
          />
        </div>
      </InspSection>

      <InspSection title="Accesibilidad">
        <div className="space-y-1">
          <span className="text-xs text-foreground/60">Texto alternativo (alt)</span>
          <Input
            value={block.props.alt}
            onChange={(e) => onChange({ ...block, props: { ...block.props, alt: e.target.value } })}
            placeholder="Descripción de la imagen"
            className="h-7 text-xs"
          />
        </div>
      </InspSection>

      <InspSection title="Enlace">
        <div className="space-y-1">
          <span className="text-xs text-foreground/60">URL destino</span>
          <div className="flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
            <Input
              value={block.props.href ?? ""}
              onChange={(e) => onChange({ ...block, props: { ...block.props, href: e.target.value } })}
              placeholder="https://..."
              className="h-7 text-xs"
            />
          </div>
        </div>
      </InspSection>

      <InspSection title="Espaciado">
        <PaddingEditor
          value={padVal(block)}
          onChange={(padding) => onChange({ ...block, layout: { ...block.layout, padding } })}
        />
      </InspSection>

      <InspSection title="Fondo">
        <InspRow label="Color">
          <ColorSwatch
            value={block.layout.backgroundColor}
            onChange={(v) => onChange({ ...block, layout: { ...block.layout, backgroundColor: v } })}
          />
        </InspRow>
      </InspSection>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ButtonBlockInspector
// ─────────────────────────────────────────────────────────────────────────────

export function ButtonBlockInspector({ block, onChange }: SharedProps<ButtonBlock>) {
  return (
    <div className="space-y-3">

      <InspSection title="Contenido">
        <InlineEditHint>Haz clic en el botón para editar su texto</InlineEditHint>
      </InspSection>

      <InspSection title="Enlace">
        <div className="space-y-1">
          <span className="text-xs text-foreground/60">URL destino</span>
          <div className="flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
            <Input
              value={block.props.href ?? ""}
              onChange={(e) => onChange({ ...block, props: { ...block.props, href: e.target.value } })}
              placeholder="https://..."
              className="h-7 text-xs"
              autoFocus
            />
          </div>
        </div>
      </InspSection>

      <InspSection title="Diseño">
        <InspRow label="Alineación">
          <SegmentedAlign
            value={(block.props.align as "left" | "center" | "right") ?? "center"}
            onChange={(align) => onChange({ ...block, props: { ...block.props, align } })}
          />
        </InspRow>
      </InspSection>

      <InspSection title="Espaciado">
        <PaddingEditor
          value={padVal(block)}
          onChange={(padding) => onChange({ ...block, layout: { ...block.layout, padding } })}
        />
      </InspSection>

      <InspSection title="Fondo">
        <InspRow label="Color del bloque">
          <ColorSwatch
            value={block.layout.backgroundColor}
            onChange={(v) => onChange({ ...block, layout: { ...block.layout, backgroundColor: v } })}
          />
        </InspRow>
      </InspSection>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SpacerBlockInspector
// ─────────────────────────────────────────────────────────────────────────────

export function SpacerBlockInspector({ block, onChange }: SharedProps<SpacerBlock>) {
  return (
    <div className="space-y-3">
      <InspSection title="Altura">
        <InspRow label="Altura del espacio">
          <PxStepper
            value={block.props.height}
            onChange={(height) => onChange({ ...block, props: { ...block.props, height } })}
            min={4}
            max={200}
            step={4}
          />
        </InspRow>
      </InspSection>

      <InspSection title="Fondo">
        <InspRow label="Color">
          <ColorSwatch
            value={block.layout.backgroundColor}
            onChange={(v) => onChange({ ...block, layout: { ...block.layout, backgroundColor: v } })}
          />
        </InspRow>
      </InspSection>
    </div>
  );
}
