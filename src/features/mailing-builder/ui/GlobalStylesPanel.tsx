import { useState } from "react";
import { Paintbrush2, Type, MousePointerClick } from "lucide-react";
import type { GlobalStyles } from "../logic/schema/mailing.types";

const FONT_OPTIONS = [
  "Arial", "Helvetica", "Georgia", "Trebuchet MS", "Verdana",
  "Times New Roman", "Tahoma", "Impact", "Courier New",
];

interface GlobalStylesPanelProps {
  value: GlobalStyles;
  onChange: (patch: GlobalStyles) => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[32px] items-center justify-between gap-3">
      <span className="shrink-0 text-[12px] font-medium text-foreground/80">{label}</span>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function FontSelect({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value ?? "Arial"}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-md border border-input bg-background px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      style={{ minWidth: 130 }}
    >
      {FONT_OPTIONS.map((f) => (
        <option key={f} value={f}>{f}</option>
      ))}
    </select>
  );
}

function NumberInput({ value, onChange, min = 0, max = 200, unit = "px" }: {
  value?: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={value ?? ""}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-8 w-16 rounded-md border border-input bg-background px-2 text-center text-[12px] focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <span className="text-[11px] text-muted-foreground">{unit}</span>
    </div>
  );
}

function ColorDot({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <label className="relative flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-border/60 shadow-sm">
      <span
        className="absolute inset-0"
        style={{ backgroundColor: value || "#000000" }}
      />
      <input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  );
}

type TabId = "typography" | "buttons";

export function GlobalStylesPanel({ value, onChange }: GlobalStylesPanelProps) {
  const [tab, setTab] = useState<TabId>("typography");

  const typo = value.typography ?? {};
  const btn  = value.button ?? {};

  const setTypo = (patch: typeof typo) =>
    onChange({ ...value, typography: { ...typo, ...patch } });
  const setBtn = (patch: typeof btn) =>
    onChange({ ...value, button: { ...btn, ...patch } });

  return (
    <div className="space-y-4">
      {/* Header pill tabs */}
      <div
        className="flex items-center gap-0.5 rounded-full p-0.5"
        style={{ backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}
      >
        {([
          { id: "typography" as TabId, Icon: Type,              label: "Tipografia" },
          { id: "buttons"    as TabId, Icon: MousePointerClick, label: "Botones"    },
        ]).map(({ id, Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all"
            style={tab === id
              ? { backgroundColor: "#fff", color: "#7c3aed", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }
              : { color: "#64748b" }
            }
          >
            <Icon className="h-3 w-3 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* Tipografia */}
      {tab === "typography" && (
        <div className="space-y-4">

          <div className="flex gap-2 rounded-xl border border-violet-200/60 bg-violet-50/60 p-3">
            <Paintbrush2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
            <p className="text-[11px] leading-relaxed text-violet-700">
              Estos valores se usan como <strong>fallback global</strong>. Los bloques con configuracion propia tienen prioridad.
            </p>
          </div>

          {/* Cuerpo */}
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 bg-secondary/30 px-4 py-2.5">
              <span className="text-[13px] font-bold tracking-tight text-foreground">Texto del cuerpo</span>
            </div>
            <div className="space-y-3 p-4">
              <Row label="Fuente">
                <FontSelect value={typo.fontFamily} onChange={(v) => setTypo({ fontFamily: v })} />
              </Row>
              <Row label="Tamano">
                <NumberInput value={typo.bodyFontSize} onChange={(v) => setTypo({ bodyFontSize: v })} min={8} max={72} />
              </Row>
              <Row label="Color">
                <ColorDot value={typo.bodyColor} onChange={(v) => setTypo({ bodyColor: v })} />
              </Row>
            </div>
          </div>

          {/* Encabezados */}
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 bg-secondary/30 px-4 py-2.5">
              <span className="text-[13px] font-bold tracking-tight text-foreground">Encabezados</span>
            </div>
            <div className="space-y-3 p-4">
              <Row label="Fuente">
                <FontSelect value={typo.headingFontFamily} onChange={(v) => setTypo({ headingFontFamily: v })} />
              </Row>
              <Row label="Tamano">
                <NumberInput value={typo.headingFontSize} onChange={(v) => setTypo({ headingFontSize: v })} min={8} max={96} />
              </Row>
              <Row label="Color">
                <ColorDot value={typo.headingColor} onChange={(v) => setTypo({ headingColor: v })} />
              </Row>
            </div>
          </div>

          {/* Enlaces */}
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 bg-secondary/30 px-4 py-2.5">
              <span className="text-[13px] font-bold tracking-tight text-foreground">Enlaces</span>
            </div>
            <div className="space-y-3 p-4">
              <Row label="Color">
                <ColorDot value={typo.linkColor} onChange={(v) => setTypo({ linkColor: v })} />
              </Row>
            </div>
          </div>

        </div>
      )}

      {/* Botones */}
      {tab === "buttons" && (
        <div className="space-y-4">

          <div className="flex gap-2 rounded-xl border border-violet-200/60 bg-violet-50/60 p-3">
            <Paintbrush2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
            <p className="text-[11px] leading-relaxed text-violet-700">
              Estilo base de todos los botones del mailing. Cada boton puede sobreescribir con su propio inspector.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 bg-secondary/30 px-4 py-2.5">
              <span className="text-[13px] font-bold tracking-tight text-foreground">Texto del boton</span>
            </div>
            <div className="space-y-3 p-4">
              <Row label="Fuente">
                <FontSelect value={btn.fontFamily} onChange={(v) => setBtn({ fontFamily: v })} />
              </Row>
              <Row label="Tamano">
                <NumberInput value={btn.fontSize} onChange={(v) => setBtn({ fontSize: v })} min={8} max={32} />
              </Row>
              <Row label="Color texto">
                <ColorDot value={btn.color} onChange={(v) => setBtn({ color: v })} />
              </Row>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 bg-secondary/30 px-4 py-2.5">
              <span className="text-[13px] font-bold tracking-tight text-foreground">Apariencia</span>
            </div>
            <div className="space-y-3 p-4">
              <Row label="Color de fondo">
                <ColorDot value={btn.bgColor} onChange={(v) => setBtn({ bgColor: v })} />
              </Row>
              <Row label="Esquinas">
                <NumberInput value={btn.borderRadius} onChange={(v) => setBtn({ borderRadius: v })} min={0} max={50} />
              </Row>
              <Row label="Borde (px)">
                <NumberInput value={btn.borderWidth} onChange={(v) => setBtn({ borderWidth: v })} min={0} max={10} />
              </Row>
              <Row label="Color borde">
                <ColorDot value={btn.borderColor} onChange={(v) => setBtn({ borderColor: v })} />
              </Row>
            </div>
          </div>

          {/* Preview del boton */}
          <div className="flex justify-center py-2">
            <div
              style={{
                display: "inline-block",
                fontFamily: btn.fontFamily ?? "Arial",
                fontSize: `${btn.fontSize ?? 16}px`,
                color: btn.color ?? "#ffffff",
                backgroundColor: btn.bgColor ?? "#7c3aed",
                borderRadius: `${btn.borderRadius ?? 8}px`,
                border: btn.borderWidth ? `${btn.borderWidth}px solid ${btn.borderColor ?? "#000"}` : "none",
                padding: "10px 24px",
                fontWeight: 600,
                lineHeight: 1.2,
                cursor: "default",
                userSelect: "none",
              }}
            >
              Ver oferta
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
