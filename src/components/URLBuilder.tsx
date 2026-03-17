import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronsUpDown,
  Copy,
  ExternalLink,
  Layers3,
  Plus,
  RotateCcw,
  Rows3,
  Settings2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import type { URLParams } from "@/lib/url-builder";
import type { BatchRow } from "@/hooks/useUrlHydrator";
import { useUrlHydrator } from "@/hooks/useUrlHydrator";
import {
  buildWeekOptions,
  findWeekOption,
  getCurrentISOWeekValue,
  getCurrentISOWeekYear,
  parseWeekSelectionInput,
  type WeekOption,
} from "@/lib/week-options";

type GlobalParamKey = Exclude<keyof URLParams, "descripcion">;

const CUSTOM_WEEK_LABELS: Record<string, string> = {
  s12: "KV SANTA YAPA",
};

const dropdownOptions: Record<GlobalParamKey, { value: string; label: string }[]> = {
  ubicacion: [
    { value: "home", label: "Home" },
    { value: "categoria", label: "Categoria" },
    { value: "producto", label: "Producto" },
    { value: "landing", label: "Landing" },
    { value: "checkout", label: "Checkout" },
    { value: "carrito", label: "Carrito" },
    { value: "buscador", label: "Buscador" },
    { value: "mi-cuenta", label: "Mi Cuenta" },
  ],
  componente: [
    { value: "grilla", label: "Grilla" },
    { value: "banner", label: "Banner" },
    { value: "huincha", label: "Huincha" },
    { value: "vitrina", label: "Vitrina" },
    { value: "carrusel", label: "Carrusel" },
    { value: "contador", label: "Contador" },
    { value: "banner-hero", label: "Banner Hero" },
    { value: "banner-secondary", label: "Banner Secundario" },
    { value: "banner-strip", label: "Banner Strip" },
    { value: "slider", label: "Slider / Carrusel" },
    { value: "popup", label: "Pop-up" },
    { value: "boton-cta", label: "Boton CTA" },
    { value: "card", label: "Card / Tarjeta" },
    { value: "menu", label: "Menu / Navegacion" },
    { value: "footer", label: "Footer" },
    { value: "header", label: "Header" },
  ],
  campana: [
    { value: "especial", label: "Especial" },
    { value: "proveedor", label: "Proveedor" },
    { value: "semanasanta", label: "Semana Santa" },
    { value: "cyber-day", label: "Cyber Day" },
    { value: "black-friday", label: "Black Friday" },
    { value: "navidad", label: "Navidad" },
    { value: "aniversario", label: "Aniversario" },
    { value: "oferta-semanal", label: "Oferta Semanal" },
  ],
  semana: [],
  fecha: (() => {
    const dates: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 90; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = date.getFullYear();
      dates.push({
        value: `${dd}${mm}${yyyy}`,
        label: `${dd}/${mm}/${yyyy}`,
      });
    }
    return dates;
  })(),
};

const globalFieldOrder: { key: GlobalParamKey; label: string; placeholder: string }[] = [
  { key: "ubicacion", label: "Ubicacion", placeholder: "Seleccionar ubicacion" },
  { key: "componente", label: "Componente", placeholder: "Seleccionar componente" },
  { key: "campana", label: "Campana", placeholder: "Seleccionar campana" },
  { key: "semana", label: "Semana Actual", placeholder: "Seleccionar semana" },
  { key: "fecha", label: "Fecha", placeholder: "Seleccionar fecha" },
];

interface ComboFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  customValueFormatter?: (value: string) => string;
}

const ComboField = ({
  label,
  value,
  onChange,
  placeholder,
  options,
  customValueFormatter,
}: ComboFieldProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedLabel = options.find((option) => option.value === value)?.label;

  const handleCustomValue = () => {
    const nextValue = customValueFormatter
      ? customValueFormatter(search)
      : search.trim().replace(/\s+/g, "-").toLowerCase();
    if (!nextValue) {
      return;
    }
    onChange(nextValue);
    setSearch("");
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex h-12 w-full items-center justify-between rounded-2xl border border-border bg-secondary px-4 text-left text-sm text-foreground transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/15">
            <span className={value ? "text-foreground" : "text-muted-foreground"}>
              {selectedLabel || value || placeholder}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] rounded-2xl border border-border p-0 shadow-card" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar o escribir..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                <button
                  onClick={handleCustomValue}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Plus size={14} />
                  Usar "{search}" como valor personalizado
                </button>
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onChange(option.value);
                      setSearch("");
                      setOpen(false);
                    }}
                  >
                    <Check className={`mr-2 h-4 w-4 ${value === option.value ? "opacity-100" : "opacity-0"}`} />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              {search.trim() && !options.some((option) => option.label.toLowerCase() === search.toLowerCase()) && (
                <CommandGroup heading="Personalizado">
                  <CommandItem value={`custom-${search}`} onSelect={handleCustomValue}>
                    <Plus className="mr-2 h-4 w-4" />
                    Usar "{search}"
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

interface WeekSelectorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: WeekOption[];
  currentWeekValue: string;
}

const WeekSelectorField = ({
  label,
  value,
  onChange,
  placeholder,
  options,
  currentWeekValue,
}: WeekSelectorFieldProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedWeek = findWeekOption(options, value);
  const currentWeek = findWeekOption(options, currentWeekValue);
  const suggestedWeek = parseWeekSelectionInput(search, options, getCurrentISOWeekYear());
  const monthGroups = useMemo(() => {
    const groups = new Map<string, { heading: string; options: WeekOption[] }>();

    for (const option of options) {
      const group = groups.get(option.monthKey);
      if (group) {
        group.options.push(option);
      } else {
        groups.set(option.monthKey, { heading: option.monthLabel, options: [option] });
      }
    }

    return Array.from(groups.values());
  }, [options]);

  const selectWeek = (weekValue: string) => {
    onChange(weekValue);
    setSearch("");
    setOpen(false);
  };

  const normalizedSearch = search.trim().toLowerCase();
  const showSuggestedWeek =
    suggestedWeek && suggestedWeek.value !== value && suggestedWeek.value !== currentWeekValue;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        {label}
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex h-12 w-full items-center justify-between rounded-2xl border border-border bg-secondary px-4 text-left text-sm text-foreground transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/15">
            <div className="min-w-0">
              <span className={value ? "text-foreground" : "text-muted-foreground"}>
                {selectedWeek?.label || value || placeholder}
              </span>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] rounded-2xl border border-border p-0 shadow-card"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Escribe semana o fecha..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No se encontraron semanas.</CommandEmpty>

              {currentWeek && (
                <CommandGroup heading="Accesos rapidos">
                  <CommandItem
                    value={`actual ${currentWeek.searchValue}`}
                    onSelect={() => selectWeek(currentWeek.value)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${value === currentWeek.value ? "opacity-100" : "opacity-0"}`}
                    />
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <span className="truncate">{currentWeek.label}</span>
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Hoy
                      </span>
                    </div>
                  </CommandItem>
                </CommandGroup>
              )}

              {showSuggestedWeek && suggestedWeek && (
                <CommandGroup heading="Detectado desde tu input">
                  <CommandItem
                    value={`detectado ${suggestedWeek.searchValue}`}
                    onSelect={() => selectWeek(suggestedWeek.value)}
                  >
                    <Check className="mr-2 h-4 w-4 opacity-0" />
                    <div className="min-w-0">
                      <p className="truncate">{suggestedWeek.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Seleccionar automaticamente esta semana
                      </p>
                    </div>
                  </CommandItem>
                </CommandGroup>
              )}

              {monthGroups.map((group) => {
                const visibleOptions = group.options.filter((option) => {
                  if (!normalizedSearch) {
                    return true;
                  }

                  return option.searchValue.includes(normalizedSearch);
                });

                if (visibleOptions.length === 0) {
                  return null;
                }

                return (
                  <CommandGroup key={group.heading} heading={group.heading}>
                    {visibleOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.searchValue}
                        onSelect={() => selectWeek(option.value)}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${value === option.value ? "opacity-100" : "opacity-0"}`}
                        />
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                          <span className="truncate">{option.label}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

interface BulkEditableRowProps {
  row: BatchRow;
  defaultContext: Omit<URLParams, "descripcion">;
  onCopy: (value: string, title: string, description: string) => Promise<void>;
  onResolvedChange: (rowId: string, finalUrl: string) => void;
  weekOptions: WeekOption[];
  currentWeekValue: string;
  isoWeekYear: number;
}

const BulkEditableRow = ({
  row,
  defaultContext,
  onCopy,
  onResolvedChange,
  weekOptions,
  currentWeekValue,
  isoWeekYear,
}: BulkEditableRowProps) => {
  const { hydrateUrl } = useUrlHydrator();
  const rowId = `${row.index}-${row.baseUrl}-${row.rawDescription}`;
  const [isOpen, setIsOpen] = useState(false);
  const [localParams, setLocalParams] = useState<URLParams>({
    ...defaultContext,
    descripcion: row.slug,
  });
  const [hasManualSlug, setHasManualSlug] = useState(false);

  useEffect(() => {
    setLocalParams({
      ...defaultContext,
      descripcion: row.slug,
    });
    setHasManualSlug(false);
  }, [defaultContext, row.slug, row.baseUrl, row.rawDescription]);

  const hasMissingUrl = !row.baseUrl && !!row.rawDescription;
  const hasMissingDescription = !!row.baseUrl && !row.rawDescription;
  const hasError = hasMissingUrl || hasMissingDescription;
  const resolvedUrl =
    !hasError && row.baseUrl && localParams.descripcion
      ? hydrateUrl(row.baseUrl, localParams)
      : "";

  useEffect(() => {
    onResolvedChange(rowId, resolvedUrl);
  }, [onResolvedChange, resolvedUrl, rowId]);

  const updateLocalParam = (key: keyof URLParams, value: string) => {
    setLocalParams((current) => {
      if (key === "fecha") {
        const matchedWeek = parseWeekSelectionInput(value, weekOptions, isoWeekYear);
        return {
          ...current,
          fecha: value,
          semana: matchedWeek?.value ?? current.semana,
        };
      }

      return { ...current, [key]: value };
    });
    if (key === "descripcion") {
      setHasManualSlug(true);
    }
  };

  const resetRow = () => {
    setLocalParams({
      ...defaultContext,
      descripcion: row.slug,
    });
    setHasManualSlug(false);
  };

  return (
    <>
      <TableRow className={hasError ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-muted/30"}>
        <TableCell className="align-top">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {row.index + 1}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="break-all font-mono text-xs text-foreground">{row.baseUrl || "Sin URL"}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOpen((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/20 hover:text-foreground"
                >
                  <Settings2 size={14} className="text-primary" />
                  Ajustes por fila
                  <motion.span animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.18 }}>
                    <ChevronsUpDown size={14} />
                  </motion.span>
                </button>
                {hasError && (
                  <span className="inline-flex rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                    {hasMissingUrl ? "Falta URL base" : "Falta descripcion"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell className="align-top">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
            {localParams.descripcion || "sin-slug"}
          </span>
          {hasManualSlug && (
            <p className="mt-2 text-[11px] font-medium text-muted-foreground">Slug manual activo</p>
          )}
        </TableCell>
        <TableCell className="align-top">
          <div className="flex items-start gap-3">
            <p className="min-w-0 flex-1 break-all font-mono text-xs text-foreground">
              {resolvedUrl || "Link no disponible"}
            </p>
            <button
              onClick={() =>
                onCopy(resolvedUrl, "Link copiado", `Se copio el link de la fila ${row.index + 1}.`)
              }
              disabled={!resolvedUrl}
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl bg-accent px-3 text-xs font-semibold text-accent-foreground shadow-sm transition-all hover:brightness-95 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Copy size={14} />
              Copiar
            </button>
          </div>
        </TableCell>
      </TableRow>

      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={3} className="pt-0">
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                className="overflow-hidden"
              >
                <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {globalFieldOrder.map((field) => (
                      field.key === "semana" ? (
                        <WeekSelectorField
                          key={`${rowId}-${field.key}`}
                          label={field.label}
                          placeholder={field.placeholder}
                          value={localParams.semana}
                          onChange={(value) => updateLocalParam("semana", value)}
                          options={weekOptions}
                          currentWeekValue={currentWeekValue}
                        />
                      ) : (
                        <ComboField
                          key={`${rowId}-${field.key}`}
                          label={field.label}
                          placeholder={field.placeholder}
                          value={localParams[field.key]}
                          onChange={(value) => updateLocalParam(field.key, value)}
                          options={dropdownOptions[field.key]}
                          customValueFormatter={
                            field.key === "fecha"
                              ? (rawValue) => rawValue.trim().replace(/\D/g, "")
                              : undefined
                          }
                        />
                      )
                    ))}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        Descripcion (Slug)
                      </label>
                      <input
                        type="text"
                        value={localParams.descripcion}
                        onChange={(event) => updateLocalParam("descripcion", event.target.value)}
                        placeholder={row.slug || "trutro-entero"}
                        className="h-12 rounded-2xl border border-border bg-background px-4 font-mono text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {hasManualSlug
                        ? "El slug fue editado manualmente y prevalece sobre la limpieza automatica."
                        : "Este slug sigue el valor limpio calculado desde la descripcion masiva."}
                    </p>
                    <button
                      onClick={resetRow}
                      className="inline-flex h-10 items-center rounded-xl border border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/20 hover:text-foreground"
                    >
                      Resetear Fila
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </TableCell>
      </TableRow>
    </>
  );
};

const URLBuilder = () => {
  const { cleanTextToSlug, hydrateBatchRows, hydrateUrl } = useUrlHydrator();
  const isoWeekYear = useMemo(() => getCurrentISOWeekYear(), []);
  const weekOptions = useMemo(
    () => buildWeekOptions(isoWeekYear, CUSTOM_WEEK_LABELS),
    [isoWeekYear],
  );
  const currentWeekValue = useMemo(() => getCurrentISOWeekValue(), []);

  const [activeTab, setActiveTab] = useState("individual");
  const [globalParams, setGlobalParams] = useState<Omit<URLParams, "descripcion">>({
    ubicacion: "",
    componente: "",
    campana: "",
    semana: currentWeekValue,
    fecha: "",
  });
  const [singleBaseUrl, setSingleBaseUrl] = useState("");
  const [singleDescription, setSingleDescription] = useState("");
  const [bulkDescriptions, setBulkDescriptions] = useState("");
  const [bulkBaseUrls, setBulkBaseUrls] = useState("");
  const [bulkResolvedLinks, setBulkResolvedLinks] = useState<Record<string, string>>({});

  const singleSlug = cleanTextToSlug(singleDescription);
  const singleFinalUrl = hydrateUrl(singleBaseUrl, {
    ...globalParams,
    descripcion: singleSlug,
  });
  const batchRows = useMemo(
    () => hydrateBatchRows(bulkBaseUrls, bulkDescriptions, globalParams),
    [bulkBaseUrls, bulkDescriptions, globalParams, hydrateBatchRows],
  );

  useEffect(() => {
    setBulkResolvedLinks({});
  }, [batchRows]);

  const validBatchLinks = batchRows
    .map((row) => bulkResolvedLinks[`${row.index}-${row.baseUrl}-${row.rawDescription}`] || "")
    .filter(Boolean);

  const updateGlobalParam = (key: GlobalParamKey, value: string) => {
    setGlobalParams((current) => {
      if (key === "fecha") {
        const matchedWeek = parseWeekSelectionInput(value, weekOptions, isoWeekYear);
        return {
          ...current,
          fecha: value,
          semana: matchedWeek?.value ?? current.semana,
        };
      }

      return { ...current, [key]: value };
    });
  };

  const clearAll = () => {
    setGlobalParams({
      ubicacion: "",
      componente: "",
      campana: "",
      semana: currentWeekValue,
      fecha: "",
    });
    setSingleBaseUrl("");
    setSingleDescription("");
    setBulkDescriptions("");
    setBulkBaseUrls("");
  };

  const copyValue = async (value: string, title: string, description: string) => {
    if (!value) {
      return;
    }
    await navigator.clipboard.writeText(value);
    toast({ title, description });
  };

  const handleRowResolvedChange = (rowId: string, finalUrl: string) => {
    setBulkResolvedLinks((current) => {
      if (current[rowId] === finalUrl) {
        return current;
      }
      return { ...current, [rowId]: finalUrl };
    });
  };

  const contentVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const globalContextSection = (
    <section className="mt-4 rounded-[28px] border border-border bg-card p-6 shadow-card md:p-8">
      <div className="mb-5 flex items-center gap-3">
        <Layers3 className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
            Contexto Global
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Estos selectores alimentan la nomenclatura individual y tambien el lote masivo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {globalFieldOrder.map((field) => (
          field.key === "semana" ? (
            <WeekSelectorField
              key={field.key}
              label={field.label}
              placeholder={field.placeholder}
              value={globalParams.semana}
              onChange={(value) => updateGlobalParam("semana", value)}
              options={weekOptions}
              currentWeekValue={currentWeekValue}
            />
          ) : (
            <ComboField
              key={field.key}
              label={field.label}
              placeholder={field.placeholder}
              value={globalParams[field.key]}
              onChange={(value) => updateGlobalParam(field.key, value)}
              options={dropdownOptions[field.key]}
              customValueFormatter={
                field.key === "fecha" ? (rawValue) => rawValue.trim().replace(/\D/g, "") : undefined
              }
            />
          )
        ))}
      </div>
    </section>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6 md:px-8 lg:px-12 lg:py-8">
        <header className="rounded-[24px] border border-border bg-card px-6 py-6 shadow-card md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  Constructor de URLs Inteligente
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  Alterna entre construccion individual y procesamiento por lote para generar links promocionales consistentes.
                </p>
              </div>
            </div>

            <button
              onClick={clearAll}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-elevated transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              aria-label="Limpiar todos los campos"
            >
              <RotateCcw className="h-4 w-4" />
              Limpiar todo
            </button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between gap-4">
            <TabsList className="h-auto rounded-2xl bg-card p-1 shadow-card">
              <TabsTrigger
                value="individual"
                className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Constructor Individual
              </TabsTrigger>
              <TabsTrigger
                value="masivo"
                className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Constructor Masivo
              </TabsTrigger>
            </TabsList>

            {activeTab === "masivo" && (
              <button
                onClick={() =>
                  copyValue(
                    validBatchLinks.join("\n"),
                    "Links copiados",
                    `${validBatchLinks.length} links validos copiados al portapapeles.`,
                  )
                }
                disabled={validBatchLinks.length === 0}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:brightness-95 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Copy size={16} />
                Copiar todos los links
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "individual" ? (
              <motion.div key="individual" variants={contentVariants} initial="initial" animate="animate" exit="exit">
                <TabsContent value="individual" forceMount className="mt-4">
                  <div className="space-y-4">
                    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.9fr)]">
                      <section className="rounded-[28px] border border-border bg-card p-6 shadow-card md:p-8">
                        <div className="space-y-6">
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                              URL Base
                            </label>
                            <input
                              type="text"
                              value={singleBaseUrl}
                              onChange={(event) => setSingleBaseUrl(event.target.value)}
                              placeholder="https://www.santaisabel.cl/santas-ofertas"
                              className="h-12 rounded-2xl border border-border bg-secondary px-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15"
                            />
                          </div>

                          <div className="rounded-[24px] border border-border bg-secondary/70 p-4 md:p-5">
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center justify-between gap-3">
                                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                  Descripcion del Banner / Grilla
                                </label>
                                <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                                  {singleSlug || "slug pendiente"}
                                </span>
                              </div>

                              <textarea
                                value={singleDescription}
                                onChange={(event) => setSingleDescription(event.target.value)}
                                placeholder='Pega un texto como: "Prensa/TV - TRUTRO ENTERO $2.790"'
                                rows={4}
                                className="min-h-[112px] rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15"
                              />

                              <span className="w-fit rounded-full bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
                                {singleSlug || "trutro-entero"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="rounded-[28px] border border-primary/10 bg-primary p-6 text-primary-foreground shadow-elevated md:p-8">
                        <div className="mb-6 flex items-start justify-between gap-4">
                          <div className="space-y-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-foreground/12">
                              <ExternalLink size={20} className="text-primary-foreground" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-foreground/72">
                                Link Final
                              </h3>
                              <p className="mt-2 max-w-sm text-sm leading-6 text-primary-foreground/80">
                                Preview inmediato con slug inteligente y concatenacion automatica.
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              copyValue(singleFinalUrl, "Link copiado", "El link individual fue copiado al portapapeles.")
                            }
                            disabled={!singleFinalUrl}
                            className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-2xl bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:brightness-95 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Copy size={16} />
                            Copiar Link
                          </button>
                        </div>

                        <div className="rounded-2xl bg-black/10 p-4">
                          <code className="block min-h-[96px] break-all font-mono text-sm leading-7 text-primary-foreground/95">
                            {singleFinalUrl || "/santas-ofertas?nombre_promo=home-grilla-trutro-entero-s12-20032026"}
                          </code>
                        </div>
                      </section>
                    </div>

                    {globalContextSection}
                  </div>
                </TabsContent>
              </motion.div>
            ) : (
              <motion.div key="masivo" variants={contentVariants} initial="initial" animate="animate" exit="exit">
                <TabsContent value="masivo" forceMount className="mt-4">
                  <div className="grid gap-8">
                    <section className="rounded-[28px] border border-border bg-card p-6 shadow-card md:p-8">
                      <div className="mb-5 flex items-center gap-3">
                        <Rows3 className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
                            Procesamiento por Lote
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            La linea 1 de descripciones se empareja con la linea 1 de URLs, y asi sucesivamente.
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                            Lista de Descripciones
                          </label>
                          <textarea
                            value={bulkDescriptions}
                            onChange={(event) => setBulkDescriptions(event.target.value)}
                            rows={10}
                            placeholder={"Prensa/TV - TRUTRO ENTERO $2.790\nCiclos - TODAS LAS OFERTAS CICLO 1"}
                            className="min-h-[240px] rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15"
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                            Lista de URLs Base
                          </label>
                          <textarea
                            value={bulkBaseUrls}
                            onChange={(event) => setBulkBaseUrls(event.target.value)}
                            rows={10}
                            placeholder={"/busca?fq=H%3A27791\n/santas-ofertas"}
                            className="min-h-[240px] rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15"
                          />
                        </div>
                      </div>
                    </section>

                    {globalContextSection}

                    <section className="rounded-[28px] border border-border bg-card p-6 shadow-card md:p-8">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
                            Resultados Masivos
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Las filas incompletas se marcan en rojo para advertir inconsistencias.
                          </p>
                        </div>

                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                          {batchRows.length} filas
                        </span>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>URL Base</TableHead>
                            <TableHead>Slug generado</TableHead>
                            <TableHead>Link Final</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {batchRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-muted-foreground">
                                Agrega descripciones y URLs para generar el lote.
                              </TableCell>
                            </TableRow>
                          ) : (
                            batchRows.map((row) => (
                              <BulkEditableRow
                                key={`${row.index}-${row.baseUrl}-${row.rawDescription}-${globalParams.ubicacion}-${globalParams.componente}-${globalParams.campana}-${globalParams.semana}-${globalParams.fecha}`}
                                row={row}
                                defaultContext={globalParams}
                                onCopy={copyValue}
                                onResolvedChange={handleRowResolvedChange}
                                weekOptions={weekOptions}
                                currentWeekValue={currentWeekValue}
                                isoWeekYear={isoWeekYear}
                              />
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </section>
                  </div>
                </TabsContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Tabs>

        {activeTab === "individual" && !singleBaseUrl && (
          <div className="flex items-center gap-2 rounded-2xl border border-warning-border bg-warning-bg p-4 text-sm text-warning-foreground">
            <AlertCircle size={16} className="shrink-0" />
            <span>Ingresa una URL base para comenzar a construir el link.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default URLBuilder;
