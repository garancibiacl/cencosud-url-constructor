import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import React from "react";
import { inspectorFocusBridge } from "../inspectorFocusBridge";
import { ColorPickerCanvas, hexToHsv, hsvToHex } from "../editor/ColorPickerCanvas";
import type { ReactNode } from "react";
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight,
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp,
  ArrowLeftRight, ArrowUpDown,
  AlertCircle, Check, ChevronDown, ChevronRight, ChevronUp, ChevronsUpDown, ClipboardPaste,
  Image as ImageIcon, Link2, Monitor,
  MonitorSmartphone, PenLine, PenSquare, Plus, RotateCcw, Settings2, Smartphone,
  Upload,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BRAND_CONFIGS, BRAND_LIST } from "@/features/ampscript-builder/logic/ampscript.brands";
import { parseUrl, generateSlug, generateAMPscript } from "@/features/ampscript-builder/logic/ampscript.engine";
import { parseSingleWebSpreadsheetPaste } from "@/lib/title-url-app";
import type { BrandId } from "@/features/ampscript-builder/logic/ampscript.types";
import { useBrandContext } from "./BrandContext";
import type {
  ButtonBlock, HeroBlock, ImageBlock, ProductBlock, ProductDdBlock, RawHtmlBlock, SpacerBlock, TextBlock,
} from "../../logic/schema/block.types";
import { imageLibraryBridge } from "../imageLibraryBridge";

// ─────────────────────────────────────────────────────────────────────────────
// AMPscript Dialog + UrlInput
// ─────────────────────────────────────────────────────────────────────────────

const CAMPAIGNS_BY_BRAND: Record<string, { value: string; label: string; freeText?: boolean }[]> = {
  jumbo: [
    { value: "jumbo-ofertas",        label: "Jumbo Ofertas" },
    { value: "exclusivas-ecommerce", label: "Exclusivas Ecommerce" },
    { value: "prime",                label: "Prime" },
    { value: "mi-cupon",             label: "Mi Cupón" },
    { value: "marcas-propias",       label: "Marcas Propias" },
    { value: "recetas",              label: "Recetas", freeText: true },
  ],
  sisa: [
    { value: "santas-ofertas",       label: "Santas Ofertas" },
    { value: "exclusivas-ecommerce", label: "Exclusivas Ecommerce" },
    { value: "mi-cupon",             label: "Mi Cupón" },
  ],
  spid: [
    { value: "exclusivas-ecommerce", label: "Exclusivas Ecommerce" },
    { value: "mi-cupon",             label: "Mi Cupón" },
  ],
};

function CampaignComboField({
  value,
  onChange,
  brandId,
}: {
  value: string;
  onChange: (v: string) => void;
  brandId: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const options = CAMPAIGNS_BY_BRAND[brandId] ?? [];
  const selectedOption = options.find((o) => o.value === value);
  const selectedLabel = selectedOption?.label;
  const isFreeText = selectedOption?.freeText;

  function applyCustom() {
    const next = search.trim().toLowerCase().replace(/\s+/g, "-");
    if (!next) return;
    onChange(next);
    setSearch("");
    setOpen(false);
  }

  return (
    <div className="space-y-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Campaña</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-8 w-full items-center justify-between rounded-md border border-border bg-card px-3 text-left text-xs text-foreground transition hover:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
          >
            <span className={value ? "text-foreground" : "text-muted-foreground/60"}>
              {selectedLabel ?? value ?? "Seleccionar campaña"}
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 rounded-lg border border-border p-0 shadow-lg"
          align="start"
          side="bottom"
        >
          <Command>
            <CommandInput placeholder="Buscar o escribir..." value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>
                <button
                  type="button"
                  onClick={applyCustom}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-muted-foreground transition hover:text-foreground"
                >
                  <Plus className="h-3 w-3" />
                  Usar "{search}" como valor
                </button>
              </CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => { onChange(opt.value); setSearch(""); setOpen(false); }}
                    className="text-xs"
                  >
                    <Check className={`mr-2 h-3 w-3 shrink-0 ${value === opt.value ? "opacity-100" : "opacity-0"}`} />
                    <span>{opt.label}</span>
                    {opt.freeText && (
                      <span className="ml-auto text-[9px] text-muted-foreground/60">texto libre</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              {search.trim() && !options.some((o) => o.label.toLowerCase() === search.toLowerCase()) && (
                <CommandGroup heading="Personalizado">
                  <CommandItem value={`custom-${search}`} onSelect={applyCustom} className="text-xs">
                    <Plus className="mr-2 h-3 w-3" />
                    Usar "{search}"
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <div className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
          <span className="text-[10px] text-muted-foreground/60">utm_campaign:</span>
          <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[10px] text-violet-600 dark:text-violet-400">
            {value}
          </code>
          {isFreeText && (
            <span className="text-[9px] text-amber-600 dark:text-amber-400">— nombre en Descripción</span>
          )}
        </div>
      )}
    </div>
  );
}

function AMPscriptDialog({
  open,
  onClose,
  initialUrl,
  initialBrand,
  onInsert,
}: {
  open: boolean;
  onClose: () => void;
  initialUrl: string;
  initialBrand?: BrandId;
  onInsert: (ampscript: string, categoryId: string) => void;
}) {
  const [brandId, setBrandId] = useState<BrandId>(initialBrand ?? "sisa");
  const [campaign, setCampaign] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState(initialUrl);
  const [pasteFlash, setPasteFlash] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Pre-populate URL from the field only when the URL slot is currently empty (first open).
    // Description, campaign, and brand are never auto-cleared so the user
    // can refine the same campaign across multiple opens without losing their work.
    if (initialUrl && !url) setUrl(initialUrl);
    setPasteFlash(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const brand = BRAND_CONFIGS[brandId];
  const isRecipe = campaign === "recetas";
  const parsed = useMemo(() => parseUrl(url), [url]);
  const slug = useMemo(() => generateSlug(description), [description]);
  const result = useMemo(() => generateAMPscript(description, url, brand, campaign), [description, url, brand, campaign]);

  function handleSmartPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").trim();
    if (!text) return;

    // Caso 1: fila tabulada (desde Excel) — rellena descripción + URL, salta celdas de fechas
    if (text.includes("\t")) {
      e.preventDefault();
      const parsed = parseSingleWebSpreadsheetPaste(text);
      if (!parsed) return;
      if (parsed.description) setDescription(parsed.description);
      if (parsed.baseUrl) setUrl(parsed.baseUrl);
      setPasteFlash(true);
      setTimeout(() => setPasteFlash(false), 2000);
      return;
    }

    // Caso 2: URL suelta pegada en el campo descripción — la redirige al campo URL
    if (/^https?:\/\//i.test(text)) {
      e.preventDefault();
      setUrl(text);
    }
  }

  function handleUrlPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").trim();
    if (!text.includes("\t")) return;
    e.preventDefault();
    const parsed = parseSingleWebSpreadsheetPaste(text);
    if (!parsed) return;
    if (parsed.description) setDescription(parsed.description);
    if (parsed.baseUrl) setUrl(parsed.baseUrl);
    setPasteFlash(true);
    setTimeout(() => setPasteFlash(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-lg gap-0 p-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15">
              <Zap className="h-3.5 w-3.5 text-violet-600" />
            </div>
            <DialogTitle className="text-sm font-semibold">Generar AMPscript SFMC</DialogTitle>
          </div>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto">
          <div className="space-y-4 p-5">

            {/* Brand */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Marca</span>
              <div className="flex gap-2">
                {BRAND_LIST.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      const nextOptions = CAMPAIGNS_BY_BRAND[b.id] ?? [];
                      if (!nextOptions.some((o) => o.value === campaign)) setCampaign("");
                      setBrandId(b.id as BrandId);
                    }}
                    className={`relative flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      brandId === b.id
                        ? "border-violet-400 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                        : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
                    }`}
                  >
                    {brandId === b.id && (
                      <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-violet-500">
                        <Check className="h-2 w-2 text-white" />
                      </span>
                    )}
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Campaña — combobox con búsqueda + personalizado */}
            <CampaignComboField value={campaign} onChange={setCampaign} brandId={brandId} />

            {/* Descripción — oculta en modo Recetas (utm_content viene del slug de la URL) */}
            {!isRecipe && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Descripción de campaña
                </span>
                {pasteFlash && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                    <ClipboardPaste className="h-3 w-3" />
                    Pegado desde Excel
                  </span>
                )}
              </div>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onPaste={handleSmartPaste}
                placeholder="Ej: Bombazo exclusivo ecomm todo San José — o pega desde Excel"
                className="h-8 text-xs"
              />
              {slug && (
                <div className="flex items-center gap-1.5">
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                  <span className="text-[10px] text-muted-foreground/60">utm_content:</span>
                  <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[10px] text-violet-600 dark:text-violet-400">
                    {slug}
                  </code>
                </div>
              )}
            </div>
            )}

            {/* URL de destino */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                URL de destino
              </span>
              <Textarea
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={handleUrlPaste}
                placeholder={
                  isRecipe
                    ? `Ej: https://www.${brand.domain}/recetas/ensalada_verde_vinagreta_naranja`
                    : `Ej: https://www.${brand.domain}${brand.searchPath}?fq=H:1234 — o pega desde Excel`
                }
                rows={3}
                className="resize-none font-mono text-xs"
              />
              {url.trim() && (
                <div className="flex items-center gap-1.5">
                  {isRecipe ? (
                    parsed.recipeSlug ? (
                      <>
                        <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                        <span className="text-[10px] text-muted-foreground/60">utm_content:</span>
                        <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                          {parsed.recipeSlug}
                        </code>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 shrink-0 text-amber-500" />
                        <span className="text-[10px] text-amber-600">URL debe contener /recetas/{"{nombre}"}</span>
                      </>
                    )
                  ) : parsed.categoryId ? (
                    <>
                      <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                      <span className="text-[10px] text-muted-foreground/60">categoryId:</span>
                      <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                        {parsed.categoryId}
                      </code>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 shrink-0 text-amber-500" />
                      <span className="text-[10px] text-amber-600">No se detectó fq=H: en la URL</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Output — código AMPscript con chips */}
            {result ? (
              <div className="overflow-hidden rounded-lg border border-violet-200/50 bg-slate-950">
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
                  <div className="flex gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  </div>
                  <span className="font-mono text-[10px] font-medium text-white/40">AMPscript · SFMC</span>
                  <span className={`ml-auto inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${brand.color}`}>
                    {brand.label}
                  </span>
                </div>
                <p className="break-all p-4 font-mono text-[10px] leading-relaxed text-emerald-300">
                  {result.ampscript}
                </p>
                <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-2.5">
                  {[
                    { label: isRecipe ? "receta" : "categoryId", value: result.categoryId },
                    { label: "utm_content", value: result.slug },
                    { label: "campaign", value: `${campaign}_@fechaenvio` },
                  ].map(({ label, value: v }) => (
                    <div key={label} className="flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1">
                      <span className="text-[9px] font-medium text-white/40">{label}</span>
                      <code className="font-mono text-[10px] text-white/70">{v}</code>
                    </div>
                  ))}
                </div>
              </div>
            ) : (description.trim() || url.trim() || campaign) ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                <Zap className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />
                <p className="text-[11px] text-muted-foreground/60">
                  {!campaign
                    ? "Selecciona una campaña"
                    : isRecipe
                    ? "Ingresa una URL tipo /recetas/nombre-de-la-receta"
                    : !description.trim()
                    ? "Escribe una descripción"
                    : "Ingresa una URL con fq=H:categoryId"}
                </p>
              </div>
            ) : null}

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-secondary/60"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!result}
            onClick={() => result && onInsert(result.ampscript, result.categoryId)}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Zap className="h-3 w-3" />
            Insertar AMPscript
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
}

const MAILING_TO_AMPSCRIPT_BRAND: Record<string, BrandId> = {
  "santa-isabel": "sisa",
  "jumbo": "jumbo",
  "spid": "spid",
};

function AMPscriptUrlInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const isAMPscript = value.startsWith("%%=");
  const mailingBrand = useBrandContext();
  const documentBrand = mailingBrand ? (MAILING_TO_AMPSCRIPT_BRAND[mailingBrand] ?? "sisa") : undefined;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
        <div className="relative flex-1 min-w-0">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className={`h-7 text-xs ${isAMPscript ? "pr-8 font-mono text-[9px] text-violet-700 dark:text-violet-300" : ""}`}
          />
          {isAMPscript && (
            <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 rounded px-1 py-0.5 text-[8px] font-bold bg-violet-500/15 text-violet-600">
              SF
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Generar AMPscript SFMC"
          className={`flex h-7 shrink-0 items-center gap-1 rounded-md border px-1.5 text-[10px] font-bold transition ${
            isAMPscript
              ? "border-violet-300 bg-violet-500/10 text-violet-600"
              : "border-border bg-card text-muted-foreground/60 hover:bg-secondary/60 hover:text-foreground"
          }`}
        >
          <Zap className="h-3 w-3" />
          <span>SF</span>
        </button>
      </div>
      {isAMPscript && (
        <div className="flex items-center gap-1 pl-5">
          <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] font-medium text-violet-600">AMPscript SFMC</span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[9px] text-muted-foreground/40 transition hover:text-destructive"
          >
            × quitar
          </button>
        </div>
      )}
      <AMPscriptDialog
        open={open}
        onClose={() => setOpen(false)}
        initialUrl={isAMPscript ? "" : value}
        initialBrand={documentBrand}
        onInsert={(ampscript) => {
          onChange(ampscript);
          setOpen(false);
        }}
      />
    </div>
  );
}

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
  const display = Number.isInteger(value) ? String(value) : parseFloat(value.toFixed(2)).toString();
  const [draft, setDraft] = React.useState<string | null>(null);

  const commit = (raw: string) => {
    const parsed = parseFloat(raw);
    onChange(clamp(isNaN(parsed) ? min : parsed));
    setDraft(null);
  };

  return (
    <div className={`flex h-7 items-center overflow-hidden rounded-md border border-border bg-card ${className}`}>
      <button
        type="button"
        onClick={() => { setDraft(null); onChange(clamp(parseFloat((value - step).toFixed(4)))); }}
        className="flex h-full w-6 items-center justify-center text-muted-foreground/60 transition hover:bg-secondary/60 hover:text-foreground"
        tabIndex={-1}
      >
        <span className="select-none text-sm leading-none">−</span>
      </button>
      <input
        type="text"
        inputMode="decimal"
        value={draft ?? display}
        onFocus={(e) => { setDraft(display); e.target.select(); }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { commit((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).blur(); } if (e.key === "Escape") { setDraft(null); (e.target as HTMLInputElement).blur(); } }}
        className="w-10 bg-transparent text-center text-xs text-foreground focus:outline-none"
      />
      <span className="pr-1.5 text-[10px] select-none text-muted-foreground/40">{unit}</span>
      <button
        type="button"
        onClick={() => { setDraft(null); onChange(clamp(parseFloat((value + step).toFixed(4)))); }}
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
// ─────────────────────────────────────────────────────────────────────────────
// ColorPicker — modern picker built on react-colorful
// ─────────────────────────────────────────────────────────────────────────────

const RECENT_COLORS_KEY = "mailing-builder:recent-colors";
const RECENT_MAX = 8;

// Cencosud brand palette — shown as a fixed swatch row
const BRAND_PALETTE = [
  { label: "Jumbo",         color: "#0A8920" },
  { label: "Santa Isabel",  color: "#de0610" },
  { label: "Spid",          color: "#E91E8C" },
  { label: "Blanco",        color: "#FFFFFF" },
  { label: "Negro",         color: "#000000" },
  { label: "Gris claro",    color: "#F3F4F6" },
  { label: "Gris medio",    color: "#9CA3AF" },
  { label: "Naranja",       color: "#F97316" },
];

import { hexToRgb, rgbToHex } from "../editor/ColorPickerCanvas";

type ColorMode = "hex" | "rgb";

function isValidHex(hex: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

function readRecentColors(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_COLORS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function pushRecentColor(color: string) {
  if (!isValidHex(color)) return;
  const list = readRecentColors().filter((c) => c.toLowerCase() !== color.toLowerCase());
  list.unshift(color);
  localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
}

// Checker pattern for transparent/empty
const CHECKER_BG =
  "linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%)," +
  "linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%)";

function MiniSwatch({ color, active, onClick, title }: { color: string; active?: boolean; onClick: () => void; title?: string }) {
  return (
    <button
      type="button"
      title={title ?? color}
      onClick={onClick}
      className={`h-6 w-6 shrink-0 rounded-md border-2 transition-transform hover:scale-110 ${
        active ? "border-primary shadow-md" : "border-transparent hover:border-border"
      }`}
      style={{ backgroundColor: color }}
    />
  );
}

function ColorSwatch({
  value,
  onChange,
  defaultColor,
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
  defaultColor?: string;
}) {
  const display = value && value !== "transparent" ? value : undefined;
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(display ?? "#ffffff");
  const [hsv, setHsv] = useState(() => hexToHsv(display ?? "#ffffff"));
  const [colorMode, setColorMode] = useState<ColorMode>("hex");
  const [modeOpen, setModeOpen] = useState(false);
  const [rgbInput, setRgbInput] = useState(() => hexToRgb(display ?? "#ffffff"));
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const initialColor = useRef(display ?? defaultColor ?? "#ffffff");

  // Sync inputs when value changes externally
  useEffect(() => {
    if (display) {
      setHexInput(display);
      setHsv(hexToHsv(display));
      setRgbInput(hexToRgb(display));
    }
  }, [display]);

  // Load recent colors on open
  useEffect(() => {
    if (open) setRecentColors(readRecentColors());
  }, [open]);

  const applyHex = useCallback((hex: string) => {
    setHexInput(hex);
    setRgbInput(hexToRgb(hex));
    setHsv(hexToHsv(hex));
    onChange(hex);
  }, [onChange]);

  const handleCanvasChange = useCallback((newHsv: ReturnType<typeof hexToHsv>) => {
    const hex = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    setHsv(newHsv);
    setHexInput(hex);
    setRgbInput(hexToRgb(hex));
    onChange(hex);
  }, [onChange]);

  const handleHexInputChange = useCallback((raw: string) => {
    const val = raw.startsWith("#") ? raw : `#${raw}`;
    setHexInput(val);
    if (isValidHex(val)) applyHex(val);
  }, [applyHex]);

  const handleRgbChannel = useCallback((channel: "r" | "g" | "b", raw: string) => {
    const n = Math.min(255, Math.max(0, parseInt(raw) || 0));
    const next = { ...rgbInput, [channel]: n };
    setRgbInput(next);
    applyHex(rgbToHex(next.r, next.g, next.b));
  }, [rgbInput, applyHex]);

  const handleClose = useCallback((open: boolean) => {
    if (!open && display) pushRecentColor(display);
    setOpen(open);
  }, [display]);

  const handleReset = useCallback(() => {
    applyHex(initialColor.current);
  }, [applyHex]);

  return (
    <Popover open={open} onOpenChange={handleClose}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-8 w-full items-center gap-2 rounded-md border border-border bg-card px-2 text-left transition-colors hover:border-primary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {display ? (
            <span
              className="h-5 w-5 shrink-0 rounded border border-border/60 shadow-inner"
              style={{ backgroundColor: display }}
            />
          ) : (
            <span
              className="h-5 w-5 shrink-0 rounded border border-border/60"
              style={{
                backgroundImage: CHECKER_BG,
                backgroundSize: "6px 6px",
                backgroundPosition: "0 0,3px 3px",
                backgroundColor: "#fff",
              }}
            />
          )}
          <span className="font-mono text-[12px] text-foreground/70">{display?.toUpperCase() ?? "—"}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-64 p-0"
        style={{ boxShadow: "0 4px 6px rgba(0,0,0,.08), 0 10px 40px rgba(0,0,0,.18), 0 20px 60px rgba(0,0,0,.12)" }}
        align="start"
        side="bottom"
        sideOffset={6}
      >
        {/* Custom canvas: sat/bright + vertical hue */}
        <div className="px-3 pt-3 pb-2">
          <ColorPickerCanvas hsv={hsv} onChange={handleCanvasChange} height={150} />
        </div>

        {/* Input row: HEX or RGB + format selector + reset */}
        <div className="flex items-center gap-1.5 px-3 pb-2">
          {colorMode === "hex" ? (
            <div className="flex flex-1 items-center rounded-md border border-border bg-secondary/30 px-2 focus-within:border-primary/60">
              <span className="font-mono text-[12px] text-muted-foreground/60">#</span>
              <input
                type="text"
                maxLength={6}
                value={hexInput.replace(/^#/, "")}
                onChange={(e) => handleHexInputChange(e.target.value)}
                className="w-full bg-transparent py-1.5 pl-0.5 pr-1 font-mono text-[13px] uppercase text-foreground outline-none"
                placeholder="000000"
                spellCheck={false}
              />
            </div>
          ) : (
            <div className="flex flex-1 gap-1">
              {(["r", "g", "b"] as const).map((ch) => (
                <div key={ch} className="flex flex-1 flex-col items-center gap-0.5">
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={rgbInput[ch]}
                    onChange={(e) => handleRgbChannel(ch, e.target.value)}
                    className="w-full rounded-md border border-border bg-secondary/30 py-1.5 text-center font-mono text-[12px] text-foreground outline-none focus:border-primary/60 [appearance:textfield]"
                  />
                  <span className="text-[9px] uppercase text-muted-foreground/50">{ch}</span>
                </div>
              ))}
            </div>
          )}

          {/* Format selector */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setModeOpen((v) => !v)}
              className="flex h-8 items-center gap-0.5 rounded-md border border-border bg-secondary/30 px-2 text-[11px] font-semibold text-foreground/70 transition hover:border-primary/40 hover:text-foreground"
            >
              {colorMode.toUpperCase()}
              <ChevronUp className={`h-3 w-3 transition-transform ${modeOpen ? "rotate-180" : ""}`} />
            </button>
            {modeOpen && (
              <div className="absolute top-full left-0 mt-1 overflow-hidden rounded-lg border border-border bg-card shadow-lg z-10">
                {(["hex", "rgb"] as ColorMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setColorMode(m); setModeOpen(false); }}
                    className={`block w-full px-3 py-1.5 text-left text-[12px] font-medium transition hover:bg-secondary ${colorMode === m ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset */}
          <button
            type="button"
            title="Restablecer color original"
            onClick={handleReset}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground/50 transition hover:border-primary/40 hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Brand palette */}
        <div className="border-t border-border/50 px-3 py-2">
          <p className="mb-1.5 text-[11px] font-bold tracking-wide text-foreground">
            Colores de marca
          </p>
          <div className="flex flex-wrap gap-1.5">
            {BRAND_PALETTE.map((b) => (
              <MiniSwatch
                key={b.color}
                color={b.color}
                title={b.label}
                active={display?.toLowerCase() === b.color.toLowerCase()}
                onClick={() => {
                  applyHex(b.color);
                }}
              />
            ))}
          </div>
        </div>

        {/* Recent colors */}
        {recentColors.length > 0 && (
          <div className="border-t border-border/50 px-3 py-2">
            <p className="mb-1.5 text-[11px] font-bold tracking-wide text-foreground">
              Usados recientemente
            </p>
            <div className="flex flex-wrap gap-1.5">
              {recentColors.map((c) => (
                <MiniSwatch
                  key={c}
                  color={c}
                  active={display?.toLowerCase() === c.toLowerCase()}
                  onClick={() => {
                    applyHex(c);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
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
// ImageFieldInput — URL input + library button + local upload
// ─────────────────────────────────────────────────────────────────────────────

function ImageFieldInput({
  label,
  value,
  onChange,
  blockId,
  field,
  placeholder = "https://...",
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  blockId: string;
  field: string;
  placeholder?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => onChange(ev.target?.result as string);
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [onChange],
  );

  return (
    <div className="space-y-1">
      {label && <span className="text-xs text-foreground/60">{label}</span>}
      <div className="flex items-center gap-1">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-7 flex-1 text-xs"
        />
        <button
          type="button"
          onClick={() => imageLibraryBridge.open(blockId, field)}
          title="Elegir desde biblioteca"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground/60 transition hover:bg-secondary/60 hover:text-foreground"
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Subir desde disco"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground/60 transition hover:bg-secondary/60 hover:text-foreground"
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
    </div>
  );
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
        <ImageFieldInput
          label="URL de imagen"
          value={block.props.imageUrl ?? ""}
          onChange={(imageUrl) => onChange({ ...block, props: { ...block.props, imageUrl } })}
          blockId={block.id}
          field="imageUrl"
        />
      </InspSection>

      <InspSection title="Contenido">
        <InlineEditHint>Edita título, bajada y CTA directamente en el canvas</InlineEditHint>
      </InspSection>

      <InspSection title="Enlace CTA">
        <div className="space-y-1">
          <span className="text-xs text-foreground/60">URL destino</span>
          <AMPscriptUrlInput
            value={block.props.href ?? ""}
            onChange={(href) => onChange({ ...block, props: { ...block.props, href } })}
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
        <ImageFieldInput
          label="URL de la imagen de fondo"
          value={block.layout.backgroundImage ?? ""}
          onChange={(backgroundImage) => setLayout({ backgroundImage })}
          blockId={block.id}
          field="backgroundImage"
        />
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
        <ImageFieldInput
          label="URL de imagen"
          value={block.props.src}
          onChange={(src) => onChange({ ...block, props: { ...block.props, src } })}
          blockId={block.id}
          field="src"
        />
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
          <AMPscriptUrlInput
            value={block.props.href ?? ""}
            onChange={(href) => onChange({ ...block, props: { ...block.props, href } })}
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
          <AMPscriptUrlInput
            value={block.props.href ?? ""}
            onChange={(href) => onChange({ ...block, props: { ...block.props, href } })}
          />
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
// ProductBlockInspector
// ─────────────────────────────────────────────────────────────────────────────

export function ProductBlockInspector({ block, onChange }: SharedProps<ProductBlock>) {
  const setProps = (patch: Partial<typeof block.props>) =>
    onChange({ ...block, props: { ...block.props, ...patch } });

  return (
    <div className="space-y-3">

      <InspSection title="Visual">
        {block.props.imageUrl && (
          <div className="overflow-hidden rounded-md border border-border bg-secondary/30">
            <img src={block.props.imageUrl} alt="preview" className="h-24 w-full object-contain" />
          </div>
        )}
        <ImageFieldInput
          label="URL de imagen"
          value={block.props.imageUrl ?? ""}
          onChange={(imageUrl) => setProps({ imageUrl })}
          blockId={block.id}
          field="imageUrl"
        />
      </InspSection>

      <InspSection title="Producto">
        <div className="space-y-1">
          <span className="text-xs text-foreground/60">Nombre</span>
          <Input
            value={block.props.name}
            onChange={(e) => setProps({ name: e.target.value })}
            placeholder="Nombre del producto"
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <span className="text-xs text-foreground/60">Marca / variante</span>
          <Input
            value={block.props.brand ?? ""}
            onChange={(e) => setProps({ brand: e.target.value })}
            placeholder="Ej: Paris, Nestle, 500g..."
            className="h-7 text-xs"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-xs text-foreground/60">Precio</span>
            <Input
              value={block.props.price}
              onChange={(e) => setProps({ price: e.target.value })}
              placeholder="$ 9.990"
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-foreground/60">Unidad</span>
            <Input
              value={block.props.unit ?? ""}
              onChange={(e) => setProps({ unit: e.target.value })}
              placeholder="c/u, kg..."
              className="h-7 text-xs"
            />
          </div>
        </div>
      </InspSection>

      <InspSection title="Enlace">
        <div className="space-y-1">
          <span className="text-xs text-foreground/60">URL del producto</span>
          <AMPscriptUrlInput
            value={block.props.href ?? ""}
            onChange={(href) => setProps({ href })}
          />
        </div>
        <div className="space-y-1">
          <span className="text-xs text-foreground/60">Texto del botón CTA</span>
          <Input
            value={block.props.ctaLabel ?? ""}
            onChange={(e) => setProps({ ctaLabel: e.target.value })}
            placeholder="Agregar"
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
// RawHtmlBlockInspector
// ─────────────────────────────────────────────────────────────────────────────

export function RawHtmlBlockInspector({ block }: { block: RawHtmlBlock; onChange: (next: RawHtmlBlock) => void }) {
  return (
    <div className="space-y-3 p-4">
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="text-xs font-medium text-foreground">{block.props.presetLabel ?? "Sección HTML fija"}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Esta sección es un bloque HTML estandarizado de marca. No es editable desde el canvas.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Strips HTML tags to plain text — used for inspector fields that display
// HTML-formatted values (prices, names) edited via the canvas toolbar.
function htmlToText(html: string): string {
  if (!html || !html.includes("<")) return html;
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent ?? "";
}

// InspField — input con floating label estilo Material Design outlined
// ─────────────────────────────────────────────────────────────────────────────

function InspField({
  label,
  value,
  onChange,
  placeholder,
  onEditClick,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onEditClick?: () => void;
  type?: string;
}) {
  return (
    <div className="relative rounded-md border border-border bg-card transition-colors focus-within:border-primary/60">
      <span className="pointer-events-none absolute -top-[9px] left-2.5 bg-card px-1 text-[10px] font-medium leading-none text-muted-foreground/70">
        {label}
      </span>
      <div className="flex items-center">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md bg-transparent px-3 py-[9px] text-[13px] text-foreground outline-none placeholder:text-muted-foreground/40"
        />
        {onEditClick && (
          <button
            type="button"
            onClick={onEditClick}
            className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground/40 transition-colors hover:bg-secondary hover:text-foreground"
            tabIndex={-1}
          >
            <PenSquare className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InspSectionCollapsible — InspSection con cabecera colapsable
// ─────────────────────────────────────────────────────────────────────────────

function InspSectionCollapsible({
  title,
  children,
  defaultOpen = true,
  forceOpen,
  forceClose,
  sectionRef,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  forceOpen?: boolean;
  forceClose?: boolean;
  sectionRef?: React.RefObject<HTMLDivElement>;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  useEffect(() => {
    if (forceClose) setOpen(false);
  }, [forceClose]);

  return (
    <div
      ref={sectionRef}
      className={`overflow-hidden rounded-xl border bg-card transition-all duration-150 ${
        open
          ? "border-violet-400/40 shadow-[0_2px_4px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.08),0_0_0_1px_rgba(139,92,246,0.14)]"
          : "border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)]"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between px-4 py-2.5 transition-colors ${
          open
            ? "bg-violet-50/70 border-b border-violet-200/60 hover:bg-violet-50"
            : "bg-secondary/30 border-b border-border/50 hover:bg-secondary/50"
        }`}
      >
        <span className={`text-[13px] font-bold tracking-tight transition-colors ${open ? "text-violet-700" : "text-foreground"}`}>
          {title}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-all duration-200 ${
            open ? "text-violet-500 rotate-0" : "text-muted-foreground/60 -rotate-90"
          }`}
        />
      </button>
      {open && (
        <div className="space-y-3 p-4 animate-in fade-in-0 slide-in-from-top-1 duration-150">
          {children}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BorderRadiusEditor — control de 4 esquinas con toggle vincular/desvincular
// ─────────────────────────────────────────────────────────────────────────────

function CornerIcon({ corner }: { corner: "tl" | "tr" | "br" | "bl" }) {
  // Cada ícono: dos líneas rectas (lados del cuadrado) + arco en la esquina correspondiente
  const paths: Record<string, string> = {
    tl: "M4 14 L4 7 Q4 4 7 4 L14 4",
    tr: "M10 4 L17 4 Q20 4 20 7 L20 14",
    br: "M20 10 L20 17 Q20 20 17 20 L10 20",
    bl: "M14 20 L7 20 Q4 20 4 17 L4 10",
  };
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[corner]} />
    </svg>
  );
}

function BorderRadiusEditor({
  layout,
  onChange,
}: {
  layout: import("../../logic/schema/layout.types").BlockLayout;
  onChange: (patch: Partial<import("../../logic/schema/layout.types").BlockLayout>) => void;
}) {
  const base = layout.borderRadius ?? 0;
  const tl = layout.borderRadiusTL ?? base;
  const tr = layout.borderRadiusTR ?? base;
  const br = layout.borderRadiusBR ?? base;
  const bl = layout.borderRadiusBL ?? base;
  const linked = layout.borderRadiusTL === undefined && layout.borderRadiusTR === undefined &&
    layout.borderRadiusBR === undefined && layout.borderRadiusBL === undefined;

  const setLinked = (v: number) => onChange({
    borderRadius: v,
    borderRadiusTL: undefined, borderRadiusTR: undefined,
    borderRadiusBR: undefined, borderRadiusBL: undefined,
  });

  const setCorner = (corner: "TL" | "TR" | "BR" | "BL", v: number) => onChange({
    borderRadiusTL: corner === "TL" ? v : tl,
    borderRadiusTR: corner === "TR" ? v : tr,
    borderRadiusBR: corner === "BR" ? v : br,
    borderRadiusBL: corner === "BL" ? v : bl,
  });

  const toggleLink = () => {
    if (linked) {
      onChange({ borderRadiusTL: base, borderRadiusTR: base, borderRadiusBR: base, borderRadiusBL: base });
    } else {
      setLinked(tl);
    }
  };

  return (
    <div className="space-y-2">
      {linked ? (
        /* Modo vinculado — un solo stepper */
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
            </svg>
            <PxStepper value={base} onChange={setLinked} min={0} max={60} />
          </div>
          <button
            type="button"
            onClick={toggleLink}
            title="Desvincular esquinas"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-secondary/40 text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </button>
        </div>
      ) : (
        /* Modo desvinculado — 4 esquinas */
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            {/* Top-left */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/20 px-2 py-1">
              <CornerIcon corner="tl" />
              <input
                type="number" min={0} max={60} value={tl}
                onChange={(e) => setCorner("TL", Math.min(60, Math.max(0, Number(e.target.value))))}
                className="w-full bg-transparent text-center text-[12px] font-medium text-foreground outline-none"
              />
            </div>
            {/* Top-right */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/20 px-2 py-1">
              <CornerIcon corner="tr" />
              <input
                type="number" min={0} max={60} value={tr}
                onChange={(e) => setCorner("TR", Math.min(60, Math.max(0, Number(e.target.value))))}
                className="w-full bg-transparent text-center text-[12px] font-medium text-foreground outline-none"
              />
            </div>
            {/* Bottom-left */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/20 px-2 py-1">
              <CornerIcon corner="bl" />
              <input
                type="number" min={0} max={60} value={bl}
                onChange={(e) => setCorner("BL", Math.min(60, Math.max(0, Number(e.target.value))))}
                className="w-full bg-transparent text-center text-[12px] font-medium text-foreground outline-none"
              />
            </div>
            {/* Bottom-right */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/20 px-2 py-1">
              <CornerIcon corner="br" />
              <input
                type="number" min={0} max={60} value={br}
                onChange={(e) => setCorner("BR", Math.min(60, Math.max(0, Number(e.target.value))))}
                className="w-full bg-transparent text-center text-[12px] font-medium text-foreground outline-none"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={toggleLink}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/60 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
            </svg>
            Vincular esquinas
          </button>
        </div>
      )}
    </div>
  );
}

function BadgeRadiusEditor({
  value,
  tl, tr, br, bl,
  onChange,
}: {
  value: number;
  tl?: number; tr?: number; br?: number; bl?: number;
  onChange: (patch: { badgeBorderRadius?: number; badgeRadiusTL?: number; badgeRadiusTR?: number; badgeRadiusBR?: number; badgeRadiusBL?: number }) => void;
}) {
  const linked = tl === undefined && tr === undefined && br === undefined && bl === undefined;
  const rTL = tl ?? value; const rTR = tr ?? value; const rBR = br ?? value; const rBL = bl ?? value;

  const setLinked = (v: number) => onChange({ badgeBorderRadius: v, badgeRadiusTL: undefined, badgeRadiusTR: undefined, badgeRadiusBR: undefined, badgeRadiusBL: undefined });
  const setCorner = (corner: "TL"|"TR"|"BR"|"BL", v: number) => onChange({ badgeRadiusTL: corner==="TL"?v:rTL, badgeRadiusTR: corner==="TR"?v:rTR, badgeRadiusBR: corner==="BR"?v:rBR, badgeRadiusBL: corner==="BL"?v:rBL });
  const toggleLink = () => linked
    ? onChange({ badgeRadiusTL: value, badgeRadiusTR: value, badgeRadiusBR: value, badgeRadiusBL: value })
    : setLinked(rTL);

  return (
    <div className="space-y-2">
      {linked ? (
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
            </svg>
            <PxStepper value={value} onChange={setLinked} min={0} max={60} />
          </div>
          <button type="button" onClick={toggleLink} title="Desvincular esquinas"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-secondary/40 text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            {(["tl","tr","bl","br"] as const).map((c) => {
              const cornerKey = c.toUpperCase() as "TL"|"TR"|"BR"|"BL";
              const val = c==="tl"?rTL:c==="tr"?rTR:c==="bl"?rBL:rBR;
              return (
                <div key={c} className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/20 px-2 py-1">
                  <CornerIcon corner={c} />
                  <input type="number" min={0} max={60} value={val}
                    onChange={(e) => setCorner(cornerKey, Math.min(60, Math.max(0, Number(e.target.value))))}
                    className="w-full bg-transparent text-center text-[12px] font-medium text-foreground outline-none" />
                </div>
              );
            })}
          </div>
          <button type="button" onClick={toggleLink}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/60 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
            </svg>
            Vincular esquinas
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductDdBlockInspector
// ─────────────────────────────────────────────────────────────────────────────

export function ProductDdBlockInspector({ block, onChange }: SharedProps<ProductDdBlock>) {
  const setProps = (patch: Partial<typeof block.props>) =>
    onChange({ ...block, props: { ...block.props, ...patch } });

  // ── Foco inteligente desde el canvas ──────────────────────────────────────
  const [focusedSection, setFocusedSection] = useState<string | null>(null);
  const sectionRefs: Record<string, React.RefObject<HTMLDivElement>> = {
    imagen:            useRef<HTMLDivElement>(null),
    "badge-principal": useRef<HTMLDivElement>(null),
    descuento:         useRef<HTMLDivElement>(null),
    precios:           useRef<HTMLDivElement>(null),
    "precio-tag":      useRef<HTMLDivElement>(null),
    "col-derecha":     useRef<HTMLDivElement>(null),
    producto:          useRef<HTMLDivElement>(null),
    logo:              useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    inspectorFocusBridge.register((blockId, section) => {
      if (blockId !== block.id) return;
      setFocusedSection(section);
      // Doble rAF: primer frame aplica forceOpen (expande sección), segundo frame hace scroll ya con el DOM expandido
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const el = sectionRefs[section]?.current;
        if (!el) return;
        const viewport = el.closest("[data-radix-scroll-area-viewport]") as HTMLElement | null;
        if (viewport) {
          const elTop = el.getBoundingClientRect().top;
          const vpTop = viewport.getBoundingClientRect().top;
          viewport.scrollBy({ top: elTop - vpTop - 12, behavior: "smooth" });
        } else {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setFocusedSection(null);
      }));
    });
    return () => inspectorFocusBridge.unregister();
  }, [block.id]);

  return (
    <div className="space-y-2.5">

      {/* 1. Imagen */}
      <InspSectionCollapsible title="Imagen del producto" defaultOpen={false} sectionRef={sectionRefs["imagen"]} forceOpen={focusedSection === "imagen"} forceClose={focusedSection !== null && focusedSection !== "imagen"}>
        {block.props.imageUrl && (
          <div className="overflow-hidden rounded-lg border border-border bg-secondary/30">
            <img src={block.props.imageUrl} alt="preview" className="h-28 w-full object-contain" />
          </div>
        )}
        <ImageFieldInput
          label="URL de imagen"
          value={block.props.imageUrl ?? ""}
          onChange={(imageUrl) => setProps({ imageUrl })}
          blockId={block.id}
          field="imageUrl"
        />
      </InspSectionCollapsible>

      {/* 2. Badge principal */}
      <InspSectionCollapsible title="Badge principal" defaultOpen={false} sectionRef={sectionRefs["badge-principal"]} forceOpen={focusedSection === "badge-principal"} forceClose={focusedSection !== null && focusedSection !== "badge-principal"}>
        <InspField
          label="Texto del badge"
          value={block.props.discountLabel}
          onChange={(v) => setProps({ discountLabel: v })}
          placeholder="Descuento Doble"
        />
        {/* Colores fondo / texto */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground/70">Color fondo</span>
            <ColorSwatch
              value={block.props.discountBadgeBg}
              onChange={(v) => setProps({ discountBadgeBg: v ?? "#E8001D" })}
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground/70">Color texto</span>
            <ColorSwatch
              value={block.props.discountBadgeFg}
              onChange={(v) => setProps({ discountBadgeFg: v ?? "#FFFFFF" })}
            />
          </div>
        </div>
        {/* Tipografía y forma — cada uno en su fila */}
        <InspRow label="Tamaño fuente">
          <PxStepper value={block.props.badgeFontSize ?? 12} onChange={(v) => setProps({ badgeFontSize: v })} min={8} max={32} unit="px" />
        </InspRow>
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-muted-foreground/70">Radio esquinas</span>
          <BadgeRadiusEditor
            value={block.props.badgeBorderRadius ?? 20}
            tl={block.props.badgeRadiusTL}
            tr={block.props.badgeRadiusTR}
            br={block.props.badgeRadiusBR}
            bl={block.props.badgeRadiusBL}
            onChange={(patch) => setProps(patch)}
          />
        </div>
        {/* Borde: grosor + color en la misma fila compacta */}
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-medium text-muted-foreground/70 shrink-0">Borde</span>
          <div className="flex items-center gap-1.5 flex-1">
            <PxStepper value={block.props.badgeBorderWidth ?? 0} onChange={(v) => setProps({ badgeBorderWidth: v })} min={0} max={10} unit="px" />
          </div>
          <ColorSwatch
            value={block.props.badgeBorderColor ?? "#000000"}
            onChange={(v) => setProps({ badgeBorderColor: v ?? "#000000" })}
          />
        </div>
        {/* Posición */}
        <InspRow label="Pos. vertical (%)">
          <PxStepper value={block.props.badgeTop} onChange={(v) => setProps({ badgeTop: v })} min={0} max={100} unit="%" />
        </InspRow>
        <InspRow label="Pos. horizontal (%)">
          <PxStepper value={block.props.badgeLeft} onChange={(v) => setProps({ badgeLeft: v })} min={0} max={100} unit="%" />
        </InspRow>
      </InspSectionCollapsible>

      {/* 3. Badge secundaria */}
      <InspSectionCollapsible title="Badge secundaria" defaultOpen={false} forceClose={focusedSection !== null}>
        <InspField
          label="Texto (opcional)"
          value={block.props.secondBadge ?? ""}
          onChange={(v) => setProps({ secondBadge: v })}
          placeholder="Ej: Solo Hoy, -50%..."
        />
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground/70">Color fondo</span>
            <ColorSwatch value={block.props.secondBadgeBg} onChange={(v) => setProps({ secondBadgeBg: v })} />
          </div>
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground/70">Color texto</span>
            <ColorSwatch value={block.props.secondBadgeFg} onChange={(v) => setProps({ secondBadgeFg: v })} />
          </div>
        </div>
      </InspSectionCollapsible>

      {/* 4a. Descuento porcentual */}
      <InspSectionCollapsible title="Descuento %" defaultOpen={false} sectionRef={sectionRefs["descuento"]} forceOpen={focusedSection === "descuento"} forceClose={focusedSection !== null && focusedSection !== "descuento"}>
        {/* Valores — grid 3 col compacto */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-muted-foreground/60">Número</span>
            <InspField label="" value={block.props.discountNumber ?? ""} onChange={(v) => setProps({ discountNumber: v })} placeholder="30" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-muted-foreground/60">Símbolo</span>
            <InspField label="" value={block.props.discountSymbol ?? "%"} onChange={(v) => setProps({ discountSymbol: v })} placeholder="%" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-muted-foreground/60">Texto</span>
            <InspField label="" value={block.props.discountText ?? "DCTO."} onChange={(v) => setProps({ discountText: v })} placeholder="DCTO." />
          </div>
        </div>
        {/* Colores — InspRow para tener espacio suficiente al hex */}
        <InspRow label="Color número">
          <ColorSwatch value={block.props.discountNumberColor ?? "#ffffff"} onChange={(v) => setProps({ discountNumberColor: v ?? "#ffffff" })} />
        </InspRow>
        <InspRow label="Color símbolo">
          <ColorSwatch value={block.props.discountSymbolColor ?? "#ffffff"} onChange={(v) => setProps({ discountSymbolColor: v ?? "#ffffff" })} />
        </InspRow>
        <InspRow label="Color texto">
          <ColorSwatch value={block.props.discountTextColor ?? "#ffffff"} onChange={(v) => setProps({ discountTextColor: v ?? "#ffffff" })} />
        </InspRow>

        {/* Badge Oferta */}
        <div className="mt-1 border-t border-border/50 pt-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium text-foreground">Badge Oferta</span>
            <Switch
              checked={block.props.ofertaShow ?? false}
              onCheckedChange={(v) => setProps({ ofertaShow: v })}
            />
          </div>
          {(block.props.ofertaShow ?? false) && (
            <>
              <ImageFieldInput
                label="Logo URL (opcional)"
                value={block.props.ofertaLogoUrl ?? ""}
                onChange={(ofertaLogoUrl) => setProps({ ofertaLogoUrl })}
                blockId={block.id}
                field="ofertaLogoUrl"
              />
              <InspRow label="Tamaño logo (px)">
                <PxStepper value={block.props.ofertaLogoSize ?? 60} onChange={(v) => setProps({ ofertaLogoSize: v })} min={20} max={200} />
              </InspRow>
            </>
          )}
        </div>
      </InspSectionCollapsible>

      {/* 4. Precios */}
      <InspSectionCollapsible title="Precios" defaultOpen={false} sectionRef={sectionRefs["precios"]} forceOpen={focusedSection === "precios"} forceClose={focusedSection !== null && focusedSection !== "precios"}>
        <InspField
          label="Precio oferta"
          value={htmlToText(block.props.price)}
          onChange={(v) => setProps({ price: v })}
          placeholder="$ 9.990"
        />
        <InspRow label="Tamaño precio (px)">
          <PxStepper value={block.props.priceSize ?? 50} onChange={(v) => setProps({ priceSize: v })} min={20} max={80} />
        </InspRow>
        <InspRow label="Color del texto precio">
          <ColorSwatch value={block.props.priceFg ?? "#ffffff"} onChange={(v) => setProps({ priceFg: v ?? "#ffffff" })} />
        </InspRow>
      </InspSectionCollapsible>

      {/* 4b. Etiqueta dual de precio */}
      <InspSectionCollapsible title="Etiqueta bajo precio" defaultOpen={false} sectionRef={sectionRefs["precio-tag"]} forceOpen={focusedSection === "precio-tag"} forceClose={focusedSection !== null && focusedSection !== "precio-tag"}>
        {/* Toggle principal */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-foreground">Mostrar etiqueta</span>
          <Switch
            checked={block.props.priceTagShow ?? false}
            onCheckedChange={(v) => setProps({ priceTagShow: v })}
          />
        </div>

        {(block.props.priceTagShow ?? false) && (
          <>
            {/* Preview del badge */}
            <div className="flex items-stretch overflow-hidden rounded-lg" style={{ maxWidth: 200 }}>
              <div
                className="px-2 py-1 text-[12px] font-black"
                style={{
                  backgroundColor: block.props.priceTagLabelBg ?? "#ffffff",
                  color: block.props.priceTagLabelFg ?? "#23af3d",
                  borderRadius: `${block.props.priceTagRadius ?? 10}px 0 0 ${block.props.priceTagRadius ?? 10}px`,
                }}
              >
                {block.props.priceTagLabel ?? "Ahorro"}
              </div>
              <div
                className="px-2.5 py-1 text-[14px] font-black"
                style={{
                  backgroundColor: block.props.priceTagValueBg ?? "#000000",
                  color: block.props.priceTagValueFg ?? "#ffffff",
                  borderRadius: `0 ${block.props.priceTagRadius ?? 10}px ${block.props.priceTagRadius ?? 10}px 0`,
                }}
              >
                {block.props.priceTagValue ?? "$ 1.640"}
              </div>
            </div>

            {/* Parte izquierda */}
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Parte izquierda</p>
            <InspField
              label="Texto"
              value={block.props.priceTagLabel ?? "Ahorro"}
              onChange={(v) => setProps({ priceTagLabel: v })}
              placeholder="Ahorro"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground/70">Color fondo</span>
                <ColorSwatch value={block.props.priceTagLabelBg ?? "#ffffff"} onChange={(v) => setProps({ priceTagLabelBg: v ?? "#ffffff" })} />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground/70">Color texto</span>
                <ColorSwatch value={block.props.priceTagLabelFg ?? "#23af3d"} onChange={(v) => setProps({ priceTagLabelFg: v ?? "#23af3d" })} />
              </div>
            </div>

            {/* Parte derecha */}
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Parte derecha</p>
            <InspField
              label="Texto"
              value={block.props.priceTagValue ?? "$ 1.640"}
              onChange={(v) => setProps({ priceTagValue: v })}
              placeholder="$ 1.640"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground/70">Color fondo</span>
                <ColorSwatch value={block.props.priceTagValueBg ?? "#000000"} onChange={(v) => setProps({ priceTagValueBg: v ?? "#000000" })} />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground/70">Color texto</span>
                <ColorSwatch value={block.props.priceTagValueFg ?? "#ffffff"} onChange={(v) => setProps({ priceTagValueFg: v ?? "#ffffff" })} />
              </div>
            </div>

            {/* Radio */}
            <InspRow label="Radio de esquinas">
              <PxStepper
                value={block.props.priceTagRadius ?? 10}
                onChange={(v) => setProps({ priceTagRadius: v })}
                min={0}
                max={30}
              />
            </InspRow>
            {/* Alineación */}
            <InspRow label="Alineación">
              <SegmentedAlign
                value={block.props.priceTagAlign ?? "left"}
                onChange={(v) => setProps({ priceTagAlign: v })}
              />
            </InspRow>
          </>
        )}
      </InspSectionCollapsible>

      {/* 4c. Columna derecha */}
      <InspSectionCollapsible title="Columna derecha" defaultOpen={false} sectionRef={sectionRefs["col-derecha"]} forceOpen={focusedSection === "col-derecha"} forceClose={focusedSection !== null && focusedSection !== "col-derecha"}>
        <InspRow label="Fondo columna derecha">
          <ColorSwatch value={block.props.rightBgColor ?? "#3DBE4A"} onChange={(v) => setProps({ rightBgColor: v ?? "#3DBE4A" })} />
        </InspRow>
        <InspField
          label="Ahorro (ej: $ 1.640)"
          value={htmlToText(block.props.ahorroLabel ?? "")}
          onChange={(v) => setProps({ ahorroLabel: v })}
          placeholder="$ 1.640"
        />
        <InspField
          label="Desde (ej: Desde $6.459 x kg)"
          value={htmlToText(block.props.desdeLabel ?? "")}
          onChange={(v) => setProps({ desdeLabel: v })}
          placeholder="Desde $6.459 x kg"
        />
      </InspSectionCollapsible>

      {/* 5. Producto */}
      <InspSectionCollapsible title="Producto" defaultOpen={false} sectionRef={sectionRefs["producto"]} forceOpen={focusedSection === "producto"} forceClose={focusedSection !== null && focusedSection !== "producto"}>
        <InspField
          label="Nombre del producto"
          value={htmlToText(block.props.name)}
          onChange={(v) => setProps({ name: v })}
          placeholder="Nombre del producto"
        />
        <InspField
          label="Marca / variante"
          value={htmlToText(block.props.brand ?? "")}
          onChange={(v) => setProps({ brand: v })}
          placeholder="Ej: Nestlé, 500g, Rojo..."
        />
        <div className="grid grid-cols-2 gap-2.5">
          <InspField
            label="Unidad"
            value={block.props.unit ?? ""}
            onChange={(v) => setProps({ unit: v })}
            placeholder="c/u, kg..."
          />
          <InspField
            label="Texto botón CTA"
            value={block.props.ctaLabel ?? ""}
            onChange={(v) => setProps({ ctaLabel: v })}
            placeholder="Agregar"
          />
        </div>
      </InspSectionCollapsible>

      {/* 6. Logo de marca */}
      <InspSectionCollapsible title="Logo de marca" defaultOpen={false} sectionRef={sectionRefs["logo"]} forceOpen={focusedSection === "logo"} forceClose={focusedSection !== null && focusedSection !== "logo"}>
        {block.props.logoUrl && (
          <div className="overflow-hidden rounded-lg border border-border bg-secondary/30 p-2">
            <img src={block.props.logoUrl} alt="logo" className="mx-auto h-12 object-contain" />
          </div>
        )}
        <ImageFieldInput
          label="URL del logo (opcional)"
          value={block.props.logoUrl ?? ""}
          onChange={(logoUrl) => setProps({ logoUrl })}
          blockId={block.id}
          field="logoUrl"
        />
        <div className="grid grid-cols-2 gap-2.5 items-end">
          <InspRow label="Tamaño">
            <PxStepper value={block.props.logoSize ?? 60} onChange={(v) => setProps({ logoSize: v })} min={20} max={200} />
          </InspRow>
          <InspRow label="Alineación">
            <SegmentedAlign value={block.props.logoAlign ?? "left"} onChange={(v) => setProps({ logoAlign: v })} />
          </InspRow>
        </div>
      </InspSectionCollapsible>

      {/* 7. Enlace */}
      <InspSectionCollapsible title="Enlace" defaultOpen={false} forceClose={focusedSection !== null}>
        <AMPscriptUrlInput
          value={block.props.href ?? ""}
          onChange={(href) => setProps({ href })}
        />
      </InspSectionCollapsible>

      {/* 8. Espaciado */}
      <InspSectionCollapsible title="Espaciado" defaultOpen={false} forceClose={focusedSection !== null}>
        <PaddingEditor
          value={padVal(block)}
          onChange={(padding) => onChange({ ...block, layout: { ...block.layout, padding } })}
        />
      </InspSectionCollapsible>

      {/* 9. Apariencia del bloque */}
      <InspSectionCollapsible title="Apariencia del bloque" defaultOpen={false} forceClose={focusedSection !== null}>
        <InspRow label="Color de fondo">
          <ColorSwatch
            value={block.layout.backgroundColor}
            onChange={(v) => onChange({ ...block, layout: { ...block.layout, backgroundColor: v } })}
          />
        </InspRow>
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-muted-foreground/70">Radio de borde</span>
          <BorderRadiusEditor
            layout={block.layout}
            onChange={(patch) => onChange({ ...block, layout: { ...block.layout, ...patch } })}
          />
        </div>
        <InspRow label="Grosor del borde">
          <PxStepper
            value={block.layout.borderWidth ?? 0}
            onChange={(v) => onChange({ ...block, layout: { ...block.layout, borderWidth: v } })}
            min={0}
            max={20}
          />
        </InspRow>
        {(block.layout.borderWidth ?? 0) > 0 && (
          <InspRow label="Color del borde">
            <ColorSwatch
              value={block.layout.borderColor}
              onChange={(v) => onChange({ ...block, layout: { ...block.layout, borderColor: v } })}
            />
          </InspRow>
        )}
      </InspSectionCollapsible>

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
