/**
 * NewTemplateModal — selector de plantillas estilo Brevo/Webflow.
 * Sidebar con navegación + panel dinámico a la derecha.
 */

import { useMemo, useState } from "react";
import {
  AlignLeft, BookMarked, ChevronDown, ChevronUp, Code2,
  Eye, GripHorizontal, LayoutDashboard, Search, SlidersHorizontal,
  Sparkles, X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { mailingTemplates } from "../logic/templates/mailingTemplates";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ScratchMode = "dragdrop" | "simple" | "html";
type NavSection = "basic" | "ready" | "saved";
type SortOrder = "name" | "date";

export interface SavedMailingEntry {
  id: string;
  name: string;
  updatedAt: string;
  currentVersion: number;
}

export interface NewTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onScratch: (mode: ScratchMode) => void;
  onUseTemplate: (templateId: string) => void;
  onUseSaved: (mailingId: string) => void;
  savedMailings?: SavedMailingEntry[];
  loadingSaved?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Datos mock de plantillas
// ─────────────────────────────────────────────────────────────────────────────

interface TemplateItem {
  id: string;
  label: string;
  description: string;
  variant: WireframeVariant;
  category?: string;
}

type WireframeVariant =
  | "default" | "promo" | "editorial" | "two-col" | "catalog" | "newsletter"
  | "promo-color" | "catalog-color" | "editorial-color" | "notification-color";

const BASIC_TEMPLATES: TemplateItem[] = [
  { id: "default-blank", label: "Plantilla predeterminada", description: "Base limpia y flexible", variant: "default" },
  { id: "promo-hero",    label: "Vender un producto",       description: "Hero + texto + CTA",          variant: "promo" },
  { id: "editorial",     label: "Contar una historia",      description: "Narrativo con imagen",         variant: "editorial" },
  { id: "catalogo-2col", label: "Catálogo 2 columnas",      description: "Dos productos lado a lado",    variant: "two-col" },
  { id: "catalogo-corto","label": "Catálogo corto",          description: "Hero + imagen + remate",       variant: "catalog" },
  { id: "newsletter-mock","label": "Newsletter",             description: "Digest de contenidos",         variant: "newsletter" },
];

const READY_CATEGORIES = ["Todos", "Promoción", "Catálogo", "Captación", "Transaccional"];

const READY_TEMPLATES: TemplateItem[] = [
  { id: "promo-hero",    label: "Promo destacada",     description: "Campaña de producto",    variant: "promo-color",         category: "Promoción" },
  { id: "catalogo-2col", label: "Product Highlights",  description: "Varios productos",       variant: "catalog-color",       category: "Catálogo" },
  { id: "editorial",     label: "Subscription",        description: "Captación y bienvenida", variant: "editorial-color",     category: "Captación" },
  { id: "catalogo-corto","label": "Notificación",       description: "Confirmación y avisos",  variant: "notification-color",  category: "Transaccional" },
  { id: "promo-hero",    label: "Black Friday",         description: "Promo de alto impacto",  variant: "promo-color",         category: "Promoción" },
  { id: "catalogo-2col", label: "Entrada de blog",      description: "Editorial de marca",     variant: "editorial-color",     category: "Captación" },
];

// ─────────────────────────────────────────────────────────────────────────────
// EmailWireframe — miniaturas CSS de cada layout de email
// ─────────────────────────────────────────────────────────────────────────────

function EmailWireframe({ variant }: { variant: WireframeVariant }) {
  const base = "w-full h-full bg-white flex flex-col gap-1 p-2";

  if (variant === "default") return (
    <div className={base}>
      <div className="flex justify-center pt-0.5"><div className="h-2.5 w-12 rounded-sm bg-slate-300" /></div>
      <div className="h-px bg-slate-100" />
      <div className="flex flex-col items-center gap-1 py-1">
        <div className="h-2 w-3/4 rounded bg-slate-200" />
        <div className="h-1.5 w-1/2 rounded bg-slate-150" />
      </div>
      <div className="flex-1 rounded-sm bg-slate-100 flex items-center justify-center min-h-0">
        <div className="flex flex-col items-center gap-1">
          <div className="h-7 w-7 rounded-full bg-slate-300" />
          <div className="h-1.5 w-10 rounded bg-slate-200" />
        </div>
      </div>
      <div className="space-y-1 px-1">
        <div className="h-1.5 w-full rounded bg-slate-100" />
        <div className="h-1.5 w-5/6 rounded bg-slate-100" />
        <div className="h-1.5 w-4/6 rounded bg-slate-100" />
      </div>
      <div className="flex justify-center pb-0.5">
        <div className="h-4 w-2/5 rounded-full bg-slate-300" />
      </div>
    </div>
  );

  if (variant === "promo") return (
    <div className={base}>
      <div className="flex justify-between items-center px-1">
        <div className="h-2 w-8 rounded-sm bg-slate-300" />
        <div className="h-1.5 w-12 rounded bg-slate-200" />
      </div>
      <div className="flex-1 rounded-sm bg-slate-200 relative flex items-end min-h-0">
        <div className="absolute top-2 left-2 h-3 w-16 rounded bg-white/70" />
        <div className="absolute top-6 left-2 h-2 w-10 rounded bg-white/50" />
        <div className="w-full h-5 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
      <div className="space-y-1 px-1">
        <div className="h-1.5 w-full rounded bg-slate-150" />
        <div className="h-1.5 w-4/5 rounded bg-slate-150" />
      </div>
      <div className="flex justify-center">
        <div className="h-4 w-2/5 rounded-full bg-slate-400" />
      </div>
    </div>
  );

  if (variant === "editorial") return (
    <div className={base}>
      <div className="flex justify-center pt-0.5"><div className="h-2 w-10 rounded-sm bg-slate-300" /></div>
      <div className="px-1 space-y-1 pt-0.5">
        <div className="h-2.5 w-full rounded bg-slate-250" />
        <div className="h-1.5 w-4/5 rounded bg-slate-200" />
        <div className="h-1.5 w-3/4 rounded bg-slate-200" />
      </div>
      <div className="flex-1 rounded-sm bg-slate-150 min-h-0" />
      <div className="space-y-1 px-1">
        <div className="h-1.5 w-full rounded bg-slate-100" />
        <div className="h-1.5 w-5/6 rounded bg-slate-100" />
      </div>
      <div className="flex">
        <div className="h-3.5 w-1/4 rounded bg-slate-350" />
      </div>
    </div>
  );

  if (variant === "two-col") return (
    <div className={base}>
      <div className="flex justify-center pt-0.5"><div className="h-2 w-12 rounded-sm bg-slate-300" /></div>
      <div className="h-8 rounded-sm bg-slate-200 flex items-center justify-center">
        <div className="h-1.5 w-20 rounded bg-white/60" />
      </div>
      <div className="flex gap-1 flex-1 min-h-0">
        <div className="flex-1 space-y-1">
          <div className="h-10 w-full rounded-sm bg-slate-150" />
          <div className="h-1.5 w-full rounded bg-slate-100" />
          <div className="h-1.5 w-4/5 rounded bg-slate-100" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="h-10 w-full rounded-sm bg-slate-150" />
          <div className="h-1.5 w-full rounded bg-slate-100" />
          <div className="h-1.5 w-4/5 rounded bg-slate-100" />
        </div>
      </div>
      <div className="flex justify-center">
        <div className="h-4 w-2/5 rounded-full bg-slate-300" />
      </div>
    </div>
  );

  if (variant === "catalog") return (
    <div className={base}>
      <div className="flex justify-center"><div className="h-2 w-10 rounded-sm bg-slate-300" /></div>
      <div className="h-10 rounded-sm bg-slate-200" />
      <div className="h-8 rounded-sm bg-slate-150 flex items-center justify-center">
        <div className="h-5 w-5 rounded bg-slate-250" />
      </div>
      <div className="space-y-1 px-1">
        <div className="h-1.5 w-full rounded bg-slate-100" />
        <div className="h-1.5 w-3/5 rounded bg-slate-100" />
      </div>
      <div className="flex justify-center">
        <div className="h-4 w-2/5 rounded-full bg-slate-300" />
      </div>
    </div>
  );

  if (variant === "newsletter") return (
    <div className={base}>
      <div className="flex justify-between items-center px-1">
        <div className="h-2 w-10 rounded-sm bg-slate-300" />
        <div className="h-1.5 w-14 rounded bg-slate-150" />
      </div>
      <div className="h-px bg-slate-150" />
      {[0.9, 0.7, 0.85].map((w, i) => (
        <div key={i} className="flex gap-1.5 items-start">
          <div className="h-6 w-8 shrink-0 rounded-sm bg-slate-150" />
          <div className="flex-1 space-y-1 pt-0.5">
            <div className="h-1.5 rounded bg-slate-200" style={{ width: `${w * 100}%` }} />
            <div className="h-1.5 w-full rounded bg-slate-100" />
          </div>
        </div>
      ))}
      <div className="flex justify-center">
        <div className="h-3.5 w-1/3 rounded-full bg-slate-300" />
      </div>
    </div>
  );

  // ── Color variants (para "Listo para usar") ──────────────────────────────

  if (variant === "promo-color") return (
    <div className="w-full h-full bg-white flex flex-col gap-1 p-0">
      <div className="flex items-center justify-between px-2 py-1.5 bg-rose-600">
        <div className="h-2 w-10 rounded-sm bg-white/70" />
        <div className="text-[7px] font-bold text-white/80">PROMO</div>
      </div>
      <div className="flex-1 bg-rose-50 flex items-center justify-center px-2">
        <div className="space-y-1 w-full">
          <div className="h-2.5 w-4/5 mx-auto rounded bg-rose-200" />
          <div className="h-1.5 w-3/5 mx-auto rounded bg-rose-150" />
        </div>
      </div>
      <div className="px-2 space-y-1">
        <div className="h-1.5 w-full rounded bg-slate-150" />
        <div className="h-1.5 w-5/6 rounded bg-slate-100" />
      </div>
      <div className="flex justify-center pb-1.5">
        <div className="h-4 w-2/5 rounded-full bg-rose-500" />
      </div>
    </div>
  );

  if (variant === "catalog-color") return (
    <div className="w-full h-full bg-white flex flex-col gap-1 p-0">
      <div className="flex justify-center py-1.5 bg-sky-600">
        <div className="h-2.5 w-14 rounded-sm bg-white/80" />
      </div>
      <div className="flex gap-1 flex-1 px-1.5 min-h-0">
        <div className="flex-1 space-y-1">
          <div className="h-10 w-full rounded-sm bg-sky-100" />
          <div className="h-1.5 w-full rounded bg-slate-150" />
          <div className="h-3 w-2/3 rounded-full bg-sky-400" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="h-10 w-full rounded-sm bg-sky-100" />
          <div className="h-1.5 w-full rounded bg-slate-150" />
          <div className="h-3 w-2/3 rounded-full bg-sky-400" />
        </div>
      </div>
      <div className="flex justify-center pb-1.5">
        <div className="h-4 w-2/5 rounded-full bg-sky-600" />
      </div>
    </div>
  );

  if (variant === "editorial-color") return (
    <div className="w-full h-full bg-white flex flex-col gap-1 p-0">
      <div className="flex items-center gap-2 px-2 py-1.5 bg-violet-700">
        <div className="h-2 w-8 rounded-sm bg-white/70" />
        <div className="h-px flex-1 bg-white/20" />
      </div>
      <div className="px-2 space-y-1 pt-0.5">
        <div className="h-2 w-4/5 rounded bg-violet-200" />
        <div className="h-1.5 w-3/5 rounded bg-slate-150" />
      </div>
      <div className="flex-1 bg-violet-50 mx-2 rounded-sm min-h-0" />
      <div className="px-2 space-y-1 pb-0.5">
        <div className="h-1.5 w-full rounded bg-slate-100" />
        <div className="h-1.5 w-4/5 rounded bg-slate-100" />
      </div>
      <div className="flex pb-1.5 px-2">
        <div className="h-3.5 w-1/3 rounded-full bg-violet-500" />
      </div>
    </div>
  );

  if (variant === "notification-color") return (
    <div className="w-full h-full bg-white flex flex-col gap-1 p-0">
      <div className="flex justify-center py-1.5 bg-emerald-600">
        <div className="h-2.5 w-12 rounded-sm bg-white/80" />
      </div>
      <div className="flex flex-col items-center gap-1 px-2 pt-1">
        <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center">
          <div className="h-3 w-3 rounded-sm bg-emerald-400" />
        </div>
        <div className="h-2 w-3/5 rounded bg-emerald-200" />
      </div>
      <div className="px-2 space-y-1 flex-1">
        <div className="h-1.5 w-full rounded bg-slate-100" />
        <div className="h-1.5 w-5/6 rounded bg-slate-100" />
        <div className="h-1.5 w-4/6 rounded bg-slate-100" />
      </div>
      <div className="flex justify-center pb-1.5">
        <div className="h-4 w-2/5 rounded-full bg-emerald-500" />
      </div>
    </div>
  );

  return <div className="w-full h-full bg-slate-50" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// TemplateCard
// ─────────────────────────────────────────────────────────────────────────────

function TemplateCard({
  item,
  onUse,
  onPreview,
}: {
  item: TemplateItem;
  onUse: (id: string) => void;
  onPreview?: (id: string) => void;
}) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md overflow-hidden cursor-default">
      {/* Preview thumbnail */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-50">
        <EmailWireframe variant={item.variant} />

        {/* Overlay on hover */}
        <div className="absolute inset-0 flex flex-col items-center justify-end gap-2 bg-black/0 pb-3 opacity-0 transition-all duration-200 group-hover:bg-black/20 group-hover:opacity-100">
          {onPreview && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPreview(item.id); }}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-white"
              title="Vista previa"
            >
              <Eye className="h-3.5 w-3.5 text-foreground/70" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onUse(item.id)}
            className="rounded-full border border-white/80 bg-white px-4 py-1.5 text-xs font-semibold text-foreground shadow-md transition hover:bg-white/90"
          >
            Usar plantilla
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="border-t border-border/60 px-3 py-3">
        <p className="text-sm font-semibold text-foreground leading-tight">{item.label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
      </div>

      {/* Bottom CTA always visible */}
      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={() => onUse(item.id)}
          className="w-full rounded-lg border border-border py-1.5 text-xs font-medium text-foreground/70 transition hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
        >
          Usar plantilla
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ScratchMenu — opciones de "Crear desde cero"
// ─────────────────────────────────────────────────────────────────────────────

const SCRATCH_OPTIONS: {
  mode: ScratchMode;
  icon: typeof LayoutDashboard;
  label: string;
  desc: string;
}[] = [
  {
    mode: "dragdrop",
    icon: LayoutDashboard,
    label: "Editor Drag and Drop",
    desc: "Crea un email de marca con bloques reutilizables.",
  },
  {
    mode: "simple",
    icon: AlignLeft,
    label: "Editor sencillo",
    desc: "Crea un email basado en texto con imágenes adjuntas.",
  },
  {
    mode: "html",
    icon: Code2,
    label: "Código HTML personalizado",
    desc: "Crea un email totalmente personalizado con HTML.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SavedTemplateCard
// ─────────────────────────────────────────────────────────────────────────────

function SavedTemplateCard({
  mailing,
  onUse,
}: {
  mailing: SavedMailingEntry;
  onUse: (id: string) => void;
}) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md overflow-hidden">
      {/* Preview */}
      <div className="relative h-36 bg-slate-50 flex items-center justify-center">
        <div className="space-y-2 w-3/4">
          <div className="h-3 w-2/3 mx-auto rounded bg-slate-300" />
          <div className="h-8 w-full rounded-sm bg-slate-200" />
          <div className="h-2 w-full rounded bg-slate-150" />
          <div className="h-2 w-4/5 rounded bg-slate-150" />
        </div>
        <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 opacity-0 shadow-sm transition group-hover:opacity-100">
          <Eye className="h-3.5 w-3.5 text-foreground/60" />
        </div>
      </div>

      {/* Info */}
      <div className="border-t border-border/60 px-3 py-2.5">
        <p className="text-[10px] text-muted-foreground/60">
          v{mailing.currentVersion} · {new Date(mailing.updatedAt).toLocaleDateString("es-CL")}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-foreground leading-tight">{mailing.name}</p>
      </div>

      {/* CTA */}
      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={() => onUse(mailing.id)}
          className="w-full rounded-lg border border-border py-1.5 text-xs font-medium text-foreground/70 transition hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
        >
          Usar plantilla
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SkeletonCard — loading state
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-xl border border-border overflow-hidden">
      <div className="h-44 animate-pulse bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-7 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NewTemplateModal — componente principal
// ─────────────────────────────────────────────────────────────────────────────

export function NewTemplateModal({
  open,
  onClose,
  onScratch,
  onUseTemplate,
  onUseSaved,
  savedMailings = [],
  loadingSaved = false,
}: NewTemplateModalProps) {
  const [activeSection, setActiveSection] = useState<NavSection>("basic");
  const [scratchOpen, setScratchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [savedSearch, setSavedSearch] = useState("");
  const [savedSort, setSavedSort] = useState<SortOrder>("date");

  const filteredReady = useMemo(
    () => activeCategory === "Todos"
      ? READY_TEMPLATES
      : READY_TEMPLATES.filter((t) => t.category === activeCategory),
    [activeCategory],
  );

  const filteredSaved = useMemo(() => {
    const q = savedSearch.toLowerCase();
    const filtered = savedMailings.filter((m) => m.name.toLowerCase().includes(q));
    return [...filtered].sort((a, b) =>
      savedSort === "name"
        ? a.name.localeCompare(b.name)
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [savedMailings, savedSearch, savedSort]);

  if (!open) return null;

  const handleSelectSection = (section: NavSection) => {
    setActiveSection(section);
    setScratchOpen(false);
  };

  const navItemClass = (section: NavSection) =>
    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer select-none ${
      activeSection === section && !scratchOpen
        ? "bg-primary/10 font-semibold text-primary border-l-2 border-primary"
        : "text-foreground/70 hover:bg-secondary/60 hover:text-foreground border-l-2 border-transparent"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[3px] animate-in fade-in-0 duration-200"
      onClick={onClose}
    >
      <div
        className="relative mx-4 flex h-[700px] w-full max-w-[1060px] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Sidebar izquierdo ──────────────────────────────────────────── */}
        <aside className="flex w-[252px] shrink-0 flex-col border-r border-border bg-card">
          {/* Header sidebar */}
          <div className="border-b border-border px-5 py-5">
            <h2 className="text-lg font-bold text-foreground">Crear un email</h2>
          </div>

          <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
            {/* Botón "Crear desde cero" */}
            <button
              type="button"
              onClick={() => setScratchOpen((v) => !v)}
              className={`flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                scratchOpen
                  ? "bg-foreground text-background"
                  : "bg-foreground text-background hover:bg-foreground/85"
              }`}
            >
              <span className="flex items-center gap-2">
                <GripHorizontal className="h-4 w-4" />
                Crear desde cero
              </span>
              {scratchOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {/* Menú de opciones "desde cero" */}
            {scratchOpen && (
              <div className="mt-1 overflow-hidden rounded-lg border border-border bg-card shadow-md animate-in fade-in-0 slide-in-from-top-2 duration-150">
                {SCRATCH_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.mode}
                      type="button"
                      onClick={() => { onScratch(opt.mode); onClose(); }}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border"
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground/60" />
                      <span>
                        <span className="block text-sm font-semibold text-foreground">{opt.label}</span>
                        <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Nav separador */}
            <div className="my-2 px-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground/50">Plantillas</p>
            </div>

            {/* Secciones de plantillas */}
            <button type="button" className={navItemClass("basic")} onClick={() => handleSelectSection("basic")}>
              <BookMarked className="h-4 w-4 shrink-0" />
              Plantillas básicas
            </button>
            <button type="button" className={navItemClass("ready")} onClick={() => handleSelectSection("ready")}>
              <Sparkles className="h-4 w-4 shrink-0" />
              Listo para usar
            </button>
            <button type="button" className={navItemClass("saved")} onClick={() => handleSelectSection("saved")}>
              <BookMarked className="h-4 w-4 shrink-0" />
              Tus plantillas
            </button>
          </div>
        </aside>

        {/* ── Panel derecho ──────────────────────────────────────────────── */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Header panel */}
          <div className="flex items-start justify-between border-b border-border px-8 py-5">
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {activeSection === "basic"  && "Todas las plantillas básicas"}
                {activeSection === "ready"  && "Listo para usar"}
                {activeSection === "saved"  && "Todas las plantillas guardadas"}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {activeSection === "basic"  && "Las plantillas básicas te dan una base flexible para tus emails."}
                {activeSection === "ready"  && "Plantillas diseñadas para resultados inmediatos. Personaliza con tu marca."}
                {activeSection === "saved"  && "Utiliza una de tus plantillas de email guardadas para empezar rápido."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-4 mt-0.5 shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Toolbar (filtros / búsqueda) */}
          {activeSection === "ready" && (
            <div className="flex items-center gap-2 border-b border-border px-8 py-3">
              <span className="text-xs font-medium text-muted-foreground mr-1">Categoría:</span>
              {READY_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-foreground/70 hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {activeSection === "saved" && (
            <div className="flex items-center gap-3 border-b border-border px-8 py-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  value={savedSearch}
                  onChange={(e) => setSavedSearch(e.target.value)}
                  placeholder="Buscar por nombre o ID"
                  className="pl-9 h-8 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => setSavedSort((s) => s === "name" ? "date" : "name")}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/70 transition hover:bg-secondary/60 hover:text-foreground"
              >
                <SlidersHorizontal className="h-3 w-3" />
                Ordenar por: {savedSort === "name" ? "Nombre" : "Fecha"}
              </button>
            </div>
          )}

          {/* Contenido con scroll */}
          <div className="flex-1 overflow-y-auto px-8 py-6">

            {/* ── Plantillas básicas ───────────────────────────────────── */}
            {activeSection === "basic" && (
              <div className="grid grid-cols-3 gap-5">
                {BASIC_TEMPLATES.map((item, i) => (
                  <TemplateCard
                    key={`${item.id}-${i}`}
                    item={item}
                    onUse={(id) => { onUseTemplate(id); onClose(); }}
                  />
                ))}
              </div>
            )}

            {/* ── Listo para usar ──────────────────────────────────────── */}
            {activeSection === "ready" && (
              <div className="grid grid-cols-3 gap-5">
                {filteredReady.map((item, i) => (
                  <TemplateCard
                    key={`${item.id}-${i}`}
                    item={item}
                    onUse={(id) => { onUseTemplate(id); onClose(); }}
                    onPreview={() => {}}
                  />
                ))}
              </div>
            )}

            {/* ── Plantillas guardadas ─────────────────────────────────── */}
            {activeSection === "saved" && (
              <>
                {loadingSaved ? (
                  <div className="grid grid-cols-3 gap-5">
                    {[1, 2, 3].map((k) => <SkeletonCard key={k} />)}
                  </div>
                ) : filteredSaved.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border">
                    <BookMarked className="h-8 w-8 text-muted-foreground/30" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">No hay plantillas guardadas</p>
                      <p className="text-xs text-muted-foreground">
                        {savedSearch ? "Ninguna plantilla coincide con tu búsqueda." : "Guarda un borrador como plantilla para reutilizarlo aquí."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-5">
                    {filteredSaved.map((mailing) => (
                      <SavedTemplateCard
                        key={mailing.id}
                        mailing={mailing}
                        onUse={(id) => { onUseSaved(id); onClose(); }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
