import { useState, useMemo, useEffect } from "react";
import type { ReactNode } from "react";
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight,
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp,
  ArrowLeftRight, ArrowUpDown,
  AlertCircle, Check, ChevronRight, ChevronsUpDown, ClipboardPaste,
  Image as ImageIcon, Link2, Monitor,
  MonitorSmartphone, PenLine, Plus, Settings2, Smartphone,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
import type {
  ButtonBlock, HeroBlock, ImageBlock, ProductBlock, RawHtmlBlock, SpacerBlock, TextBlock,
} from "../../logic/schema/block.types";

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
  onInsert,
}: {
  open: boolean;
  onClose: () => void;
  initialUrl: string;
  onInsert: (ampscript: string, categoryId: string) => void;
}) {
  const [brandId, setBrandId] = useState<BrandId>("sisa");
  const [campaign, setCampaign] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState(initialUrl);
  const [pasteFlash, setPasteFlash] = useState(false);

  useEffect(() => {
    if (open) {
      setUrl(initialUrl);
      setDescription("");
      setCampaign("");
      setPasteFlash(false);
    }
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

function AMPscriptUrlInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const isAMPscript = value.startsWith("%%=");

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
        <div className="space-y-1">
          <span className="text-xs text-foreground/60">URL de imagen</span>
          <Input
            value={block.props.imageUrl ?? ""}
            onChange={(e) => setProps({ imageUrl: e.target.value })}
            placeholder="https://..."
            className="h-7 text-xs"
            autoFocus
          />
        </div>
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
