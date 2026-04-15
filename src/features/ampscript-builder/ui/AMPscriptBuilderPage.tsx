import { useState, useMemo } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { Zap, Copy, Check, AlertCircle, ChevronRight, RefreshCw, ClipboardPaste, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { BRAND_CONFIGS, BRAND_LIST } from "../logic/ampscript.brands";
import { generateSlug, parseUrl, generateAMPscript } from "../logic/ampscript.engine";
import { parseSingleWebSpreadsheetPaste } from "@/lib/title-url-app";
import type { BrandId } from "../logic/ampscript.types";

// ── Lista de campañas (igual que URLBuilder) ───────────────────────────────────
const CAMPAIGN_OPTIONS = [
  { value: "bombazo",                          label: "Bombazo" },
  { value: "lo-mejor-de-la-semana",            label: "Lo mejor de la semana" },
  { value: "fondo-surtido",                    label: "Fondo surtido" },
  { value: "super-ofertas-online",             label: "Super Ofertas Online" },
  { value: "torta-del-mes",                    label: "Torta del mes" },
  { value: "ofertas-tc",                       label: "Ofertas TC" },
  { value: "avance",                           label: "Avance" },
  { value: "puntos",                           label: "Puntos" },
  { value: "cencopay",                         label: "Cencopay" },
  { value: "lpm",                              label: "LPM" },
  { value: "tarjeta",                          label: "Tarjeta" },
  { value: "hogar-de-cristo",                  label: "Hogar de cristo" },
  { value: "retiro",                           label: "Retiro" },
  { value: "especial",                         label: "Especial" },
  { value: "proveedor",                        label: "Proveedor" },
  { value: "exlusivas",                        label: "Exclusivas" },
  { value: "semanasanta",                      label: "Semana Santa" },
  { value: "cyber-day",                        label: "Cyber Day" },
  { value: "black-friday",                     label: "Black Friday" },
  { value: "navidad",                          label: "Navidad" },
  { value: "aniversario",                      label: "Aniversario" },
  { value: "oferta-semanal",                   label: "Oferta Semanal" },
];

// ── CampaignComboField ─────────────────────────────────────────────────────────
function CampaignComboField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedLabel = CAMPAIGN_OPTIONS.find((o) => o.value === value)?.label;

  function applyCustom() {
    const next = search.trim().replace(/\s+/g, "-").toLowerCase();
    if (!next) return;
    onChange(next);
    setSearch("");
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Campaña
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 text-left text-sm text-foreground transition-all outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20">
            <span className={value ? "text-foreground" : "text-muted-foreground"}>
              {selectedLabel || value || "Seleccionar campaña"}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] rounded-xl border border-border p-0 shadow-lg"
          align="start"
        >
          <Command>
            <CommandInput
              placeholder="Buscar o escribir..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                <button
                  onClick={applyCustom}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Usar "{search}" como valor personalizado
                </button>
              </CommandEmpty>
              <CommandGroup>
                {CAMPAIGN_OPTIONS.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => { onChange(opt.value); setSearch(""); setOpen(false); }}
                  >
                    <Check className={`mr-2 h-4 w-4 ${value === opt.value ? "opacity-100" : "opacity-0"}`} />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              {search.trim() && !CAMPAIGN_OPTIONS.some((o) => o.label.toLowerCase() === search.toLowerCase()) && (
                <CommandGroup heading="Personalizado">
                  <CommandItem value={`custom-${search}`} onSelect={applyCustom}>
                    <Plus className="mr-2 h-4 w-4" />
                    Usar "{search}"
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <div className="flex items-center gap-2">
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">utm_campaign:</span>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-violet-600 dark:text-violet-400">
            {value}
          </code>
        </div>
      )}
    </div>
  );
}

export default function AMPscriptBuilderPage() {
  const [description, setDescription] = usePersistedState("ampscript:description", "");
  const [url, setUrl] = usePersistedState("ampscript:url", "");
  const [brandId, setBrandId] = usePersistedState<BrandId>("ampscript:brandId", "sisa");
  const [campaign, setCampaign] = usePersistedState("ampscript:campaign", "");
  const [ampOverride, setAmpOverride] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pasteFlash, setPasteFlash] = useState(false);

  const brand = BRAND_CONFIGS[brandId];

  // Reactivo: se recalcula en cada keystroke
  const slug = useMemo(() => generateSlug(description), [description]);
  const parsedUrl = useMemo(() => parseUrl(url), [url]);
  const result = useMemo(() => {
    // Cuando cambia cualquier input, resetear la edición manual
    setAmpOverride(null);
    return generateAMPscript(description, url, brand, campaign);
  }, [description, url, brand, campaign]);

  // Valor final: override manual o el generado automáticamente
  const displayAmp = ampOverride ?? result?.ampscript ?? "";

  function handleCopy() {
    if (!displayAmp) return;
    navigator.clipboard.writeText(displayAmp).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleReset() {
    setDescription("");
    setUrl("");
    setBrandId("sisa");
    setCampaign("");
    setAmpOverride(null);
  }

  /** Detecta pegado desde Excel (celdas separadas por tab) y rellena ambos campos. */
  function handleSmartPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text");
    if (!text.includes("\t")) return; // pegado normal — no interceptar

    e.preventDefault();
    const parsed = parseSingleWebSpreadsheetPaste(text);
    if (!parsed) return;

    if (parsed.description) setDescription(parsed.description);
    if (parsed.baseUrl) setUrl(parsed.baseUrl);

    // Feedback visual rápido
    setPasteFlash(true);
    setTimeout(() => setPasteFlash(false), 1500);
  }

  const canGenerate = !!displayAmp;

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-card px-4 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
            <Zap className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              AMPscript Builder
            </h1>
            <p className="text-sm text-muted-foreground">
              Genera bloques AMPscript dinámicos para SFMC a partir de URLs de e-commerce.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="self-start gap-1.5 text-muted-foreground hover:text-foreground sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Limpiar
          </Button>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-0 overflow-hidden lg:flex-row">

        {/* Left — Inputs */}
        <aside className="w-full shrink-0 border-b border-border bg-card/50 p-4 sm:p-6 lg:w-96 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="space-y-6">

            {/* Marca */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Marca
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {BRAND_LIST.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBrandId(b.id)}
                    className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-xs font-semibold transition-all duration-150 ${
                      brandId === b.id
                        ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300"
                        : "border-border bg-background text-muted-foreground hover:border-violet-200 hover:text-foreground"
                    }`}
                  >
                    {brandId === b.id && (
                      <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </span>
                    )}
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Campaña */}
            <CampaignComboField value={campaign} onChange={setCampaign} />

            {/* Descripción */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Descripción de campaña
                </Label>
                {pasteFlash && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-150">
                    <ClipboardPaste className="h-3 w-3" />
                    Pegado desde Excel
                  </span>
                )}
              </div>
              <Input
                id="description"
                placeholder="Ej: Ofertas en electrodomésticos grandes — o pega desde Excel"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onPaste={handleSmartPaste}
                className="h-10"
              />
              {/* Slug preview */}
              {slug && (
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">utm_content:</span>
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-violet-600 dark:text-violet-400">
                    {slug}
                  </code>
                </div>
              )}
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label htmlFor="url" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                URL de destino
              </Label>
              <Textarea
                id="url"
                placeholder={`Ej: https://www.${brand.domain}${brand.searchPath}?fq=H:1234 — o pega desde Excel`}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={handleSmartPaste}
                rows={3}
                className="resize-none font-mono text-xs"
              />
              {/* URL parse status */}
              {url && (
                <div className="flex items-center gap-2">
                  {parsedUrl.categoryId ? (
                    <>
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span className="text-xs text-muted-foreground">categoryId:</span>
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                        {parsedUrl.categoryId}
                      </code>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        No se encontró fq=H: en la URL
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>


          </div>
        </aside>

        {/* Right — Output */}
        <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">

          {/* Status + Copy */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${canGenerate ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
              <span className="text-sm font-medium text-muted-foreground">
                {canGenerate ? "AMPscript listo" : "Completa los campos para generar"}
              </span>
            </div>
            <Button
              size="sm"
              onClick={handleCopy}
              disabled={!canGenerate}
              className="gap-1.5"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "¡Copiado!" : "Copiar"}
            </Button>
          </div>

          {/* AMPscript block */}
          <div
            className={`relative flex-1 overflow-hidden rounded-2xl border transition-all duration-200 ${
              canGenerate
                ? "border-violet-200 bg-slate-950 dark:border-violet-800"
                : "border-border bg-muted/30"
            }`}
          >
            {canGenerate ? (
              <>
                {/* Lang badge */}
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-white/10" />
                    <span className="h-3 w-3 rounded-full bg-white/10" />
                    <span className="h-3 w-3 rounded-full bg-white/10" />
                  </div>
                  <span className="text-[11px] font-mono font-medium text-white/40">AMPscript · SFMC</span>
                  <span className={`ml-auto inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${brand.color}`}>
                    {brand.label}
                  </span>
                </div>

                {/* Code — editable textarea */}
                <textarea
                  value={displayAmp}
                  onChange={(e) => setAmpOverride(e.target.value)}
                  spellCheck={false}
                  className="w-full resize-none bg-transparent p-5 font-mono text-sm leading-6 text-emerald-300 outline-none placeholder:text-white/20 focus:ring-0 break-all whitespace-pre-wrap"
                  style={{ minHeight: "80px", height: "auto", fieldSizing: "content" } as React.CSSProperties}
                />

                {/* Params summary */}
                {result && (
                  <div className="border-t border-white/10 px-4 py-3 flex flex-wrap gap-3">
                    <ParamChip label="categoryId" value={result.categoryId} />
                    <ParamChip label="utm_content" value={result.slug} />
                    <ParamChip label="campaign" value={`${campaign}_@fechaenvio`} />
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 p-8 text-center">
                <Zap className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">
                  El bloque AMPscript aparecerá aquí en tiempo real.
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Ingresa una descripción y una URL con fq=H:categoryId
                </p>
              </div>
            )}
          </div>

          {/* Usage tip */}
          {canGenerate && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-900/10">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>Tip:</strong> Pega este bloque directamente en el Content Builder de SFMC.
                La variable <code className="font-mono">@fechaenvio</code> debe estar seteada en tu script de Data Extension.
              </p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function ParamChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5">
      <span className="text-[10px] font-medium text-white/40">{label}</span>
      <code className="font-mono text-[11px] text-white/70">{value}</code>
    </div>
  );
}

/**
 * Resalta sintaxis AMPscript básica sin dependencias externas.
 * Colorea: strings, variables @, keywords %%= =%%, comentarios.
 */
function AMPscriptHighlight({ code }: { code: string }) {
  // Dividimos el código en tokens para colorear
  const parts = code.split(/('(?:[^'\\]|\\.)*'|@\w+|%%=|=%%)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("'") && part.endsWith("'")) {
          return <span key={i} className="text-sky-300">{part}</span>;
        }
        if (part.startsWith("@")) {
          return <span key={i} className="text-amber-300">{part}</span>;
        }
        if (part === "%%=" || part === "=%%") {
          return <span key={i} className="text-violet-400 font-bold">{part}</span>;
        }
        // keywords: RedirectTo, Concat
        const withKeywords = part.replace(
          /\b(RedirectTo|Concat)\b/g,
          "\u00a7\u00a7$1\u00a7\u00a7",
        );
        if (withKeywords.includes("\u00a7\u00a7")) {
          return (
            <span key={i}>
              {withKeywords.split("\u00a7\u00a7").map((seg, j) =>
                seg === "RedirectTo" || seg === "Concat" ? (
                  <span key={j} className="text-violet-300 font-semibold">{seg}</span>
                ) : (
                  <span key={j} className="text-emerald-300">{seg}</span>
                )
              )}
            </span>
          );
        }
        return <span key={i} className="text-emerald-300">{part}</span>;
      })}
    </>
  );
}
