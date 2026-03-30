import { useEffect, useMemo, useRef, useState } from "react";
import { format, isValid, parse } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronsUpDown,
  Copy,
  ExternalLink,
  Layers3,
  Plus,
  RotateCcw,
  Rows3,
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
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import type { URLParams } from "@/lib/url-builder";
import type { BatchRow } from "@/hooks/useUrlHydrator";
import { compactDescriptionReference, useUrlHydrator } from "@/hooks/useUrlHydrator";
import {
  buildBulkAppClipboardRows,
  buildBulkWebClipboardRows,
  buildWebClipboardBlock,
  type AppBatchRow,
  buildAppBatchRows,
  extractBrandDetail,
  extractCleanTitle,
  extractCollectionCode,
} from "@/lib/title-url-app";
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

const DATE_INPUT_FORMATS = ["dd/MM/yyyy", "dd-MM-yyyy", "yyyy-MM-dd", "ddMMyyyy"];

const parseDateValue = (value: string) => {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  for (const formatPattern of DATE_INPUT_FORMATS) {
    const parsedDate = parse(normalized, formatPattern, new Date());
    if (isValid(parsedDate)) {
      return parsedDate;
    }
  }

  return undefined;
};

const formatDateValue = (date: Date) => format(date, "ddMMyyyy");

const formatDateDisplay = (date: Date) => format(date, "dd/MM/yyyy");

const formatEditableTitleCase = (value: string) =>
  value
    .toLocaleLowerCase("es-CL")
    .replace(/(^|[\s/+(])\p{L}/gu, (match) => match.toLocaleUpperCase("es-CL"));

const validateEditableBaseUrl = (value: string) => {
  const normalized = value.trim();

  if (!normalized) {
    return "Falta URL base";
  }

  if (normalized.startsWith("/")) {
    return undefined;
  }

  if (/^https?:\/\//i.test(normalized)) {
    try {
      new URL(normalized);
      return undefined;
    } catch {
      return "La URL no es valida";
    }
  }

  if (/^(www\.|[a-z0-9-]+(?:\.[a-z0-9-]+)+)/i.test(normalized)) {
    return "Agrega https:// al inicio";
  }

  return "Usa una ruta relativa o una URL completa";
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
    { value: "bombazo", label: "Bombazo" },
    { value: "lo-mejor-de-la-semana", label: "Lo mejor de la semana" },
    { value: "fondo-surtido", label: "Fondo surtido" },
    { value: "super-ofertas-online", label: "Super Ofertas Online" },
    { value: "torta-del-mes", label: "Torta del mes" },
    { value: "ofertas-tc", label: "Ofertas TC" },
    { value: "avance", label: "Avance" },
    { value: "puntos", label: "Puntos" },
    { value: "cencopay", label: "Cencopay" },
    { value: "lpm", label: "LPM" },
    { value: "tarjeta", label: "Tarjeta" },
    { value: "hogar-de-cristo", label: "Hogar de cristo" },
    { value: "retiro", label: "Retiro" },
    { value: "dsp-gratis-prime-dsps-gratis-30k", label: "Dsp gratis Prime + dsps gratis 30k" },
    { value: "especial", label: "Especial" },
    { value: "proveedor", label: "Proveedor" },
    { value: "exlusivas", label: "Exlusivas" },
    { value: "semanasanta", label: "Semana Santa" },
    { value: "cyber-day", label: "Cyber Day" },
    { value: "black-friday", label: "Black Friday" },
    { value: "navidad", label: "Navidad" },
    { value: "aniversario", label: "Aniversario" },
    { value: "oferta-semanal", label: "Oferta Semanal" },
  ],
  semana: [],
  fecha: [],
};

const globalFieldOrder: { key: GlobalParamKey; label: string; placeholder: string }[] = [
  { key: "ubicacion", label: "Ubicacion", placeholder: "Seleccionar ubicacion" },
  { key: "componente", label: "Componente", placeholder: "Seleccionar componente" },
  { key: "campana", label: "Campaña", placeholder: "Seleccionar campaña" },
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

interface DateSelectorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const DateSelectorField = ({ label, value, onChange, placeholder }: DateSelectorFieldProps) => {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parseDateValue(value) : undefined;
  const [viewMonth, setViewMonth] = useState<Date>(selectedDate ?? new Date());
  const [inputValue, setInputValue] = useState(
    selectedDate ? formatDateDisplay(selectedDate) : "",
  );

  useEffect(() => {
    setInputValue(selectedDate ? formatDateDisplay(selectedDate) : "");
    if (selectedDate) {
      setViewMonth(selectedDate);
    }
  }, [selectedDate, value]);

  const commitDate = (rawValue: string) => {
    const parsedDate = parseDateValue(rawValue);
    if (!parsedDate) {
      return false;
    }

    onChange(formatDateValue(parsedDate));
    setInputValue(formatDateDisplay(parsedDate));
    setViewMonth(parsedDate);
    return true;
  };

  const handleSelect = (date?: Date) => {
    if (!date) {
      return;
    }

    onChange(formatDateValue(date));
    setInputValue(formatDateDisplay(date));
    setViewMonth(date);
    setOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    onChange(formatDateValue(today));
    setInputValue(formatDateDisplay(today));
    setViewMonth(today);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <div className="flex h-12 items-center rounded-2xl border border-border bg-secondary px-3 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15">
          <input
            type="text"
            value={inputValue}
            onFocus={() => setOpen(true)}
            onChange={(event) => setInputValue(event.target.value)}
            onBlur={() => {
              if (!inputValue.trim()) {
                onChange("");
                return;
              }

              const isCommitted = commitDate(inputValue);
              if (!isCommitted && selectedDate) {
                setInputValue(formatDateDisplay(selectedDate));
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (commitDate(inputValue)) {
                  setOpen(false);
                }
              }
            }}
            placeholder={placeholder.replace("Seleccionar", "Escribe")}
            className="flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-primary transition-colors hover:bg-primary/10"
              aria-label="Abrir calendario"
            >
              <CalendarDays className="h-4 w-4" />
            </button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-auto rounded-2xl border border-border p-0 shadow-card" align="start">
          <div className="border-b border-border px-3 py-3">
            <button
              type="button"
              onClick={handleToday}
              className="inline-flex h-9 items-center rounded-xl bg-[#0052A3] px-3 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#004080]"
            >
              Hoy
            </button>
          </div>
          <Calendar
            mode="single"
            locale={es}
            selected={selectedDate}
            onSelect={handleSelect}
            month={viewMonth}
            onMonthChange={setViewMonth}
            className="p-3"
            classNames={{
              head_cell: "w-10 rounded-md text-[0.75rem] font-semibold uppercase text-muted-foreground",
              cell: "h-10 w-10 p-0 text-center text-sm",
              day: "h-10 w-10 rounded-xl p-0 text-sm font-medium text-foreground transition-colors hover:bg-slate-100 focus:bg-slate-100",
              day_today:
                "bg-[#0052A3] font-semibold text-white hover:bg-[#0052A3] hover:text-white focus:bg-[#0052A3] focus:text-white",
              day_selected:
                "bg-[#EA7120] font-semibold text-white hover:bg-[#EA7120] hover:text-white focus:bg-[#EA7120] focus:text-white",
              day_outside:
                "text-muted-foreground/40 opacity-50 aria-selected:bg-[#EA7120]/20 aria-selected:text-foreground",
              nav_button:
                "flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white p-0 text-foreground transition-colors hover:bg-slate-100 hover:text-foreground",
              caption_label: "text-sm font-semibold text-foreground",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

interface NumberedTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

const NumberedTextarea = ({
  label,
  value,
  onChange,
  rows = 10,
  placeholder,
}: NumberedTextareaProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const visibleLineCount = Math.max(value.split("\n").length, rows, 1);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        {label}
      </label>
      <div className="flex min-h-[240px] overflow-hidden rounded-2xl border border-border bg-secondary">
        <div className="flex w-12 shrink-0 justify-center border-r border-slate-300 bg-slate-50/80 px-2 py-3.5">
          <div
            className="space-y-0.5 text-center font-mono text-xs font-semibold text-primary/80"
            style={{ transform: `translateY(-${scrollTop}px)` }}
          >
            {Array.from({ length: visibleLineCount }, (_, index) => (
              <div key={`${label}-${index + 1}`} className="flex h-8 items-center justify-center">
                {index + 1}
              </div>
            ))}
          </div>
        </div>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          rows={rows}
          placeholder={placeholder}
          className="min-h-[240px] flex-1 resize-none bg-secondary px-4 py-3.5 font-mono text-sm leading-8 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgba(148,163,184,0.28) 31px, rgba(148,163,184,0.28) 32px)",
            backgroundPosition: "0 54px",
          }}
        />
      </div>
    </div>
  );
};

interface BulkEditableRowProps {
  row: BatchRow;
  defaultContext: Omit<URLParams, "descripcion">;
  onCopy: (value: string, title: string, description: string) => Promise<boolean>;
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
  const rowId = `row-${row.index}`;
  const [isOpen, setIsOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState(row.baseUrl);
  const [baseUrlError, setBaseUrlError] = useState<string>();
  const [isRowFlashing, setIsRowFlashing] = useState(false);
  const [localParams, setLocalParams] = useState<URLParams>({
    ...defaultContext,
    descripcion: row.slug,
  });
  const [hasManualSlug, setHasManualSlug] = useState(false);

  useEffect(() => {
    setBaseUrl(row.baseUrl);
    setBaseUrlError(undefined);
    setIsOpen(false);
    setIsRowFlashing(false);
    setLocalParams({
      ...defaultContext,
      descripcion: row.slug,
    });
    setHasManualSlug(false);
  }, [defaultContext, row.slug, row.baseUrl, row.rawDescription]);

  const hasMissingUrl = !baseUrl.trim() && !!row.rawDescription;
  const hasMissingDescription = !!baseUrl.trim() && !row.rawDescription;
  const hasError = hasMissingUrl || hasMissingDescription;
  const productName = extractCleanTitle(row.rawDescription);
  const brandDetail = extractBrandDetail(row.rawDescription);
  const resolvedUrl =
    !hasError && baseUrl && localParams.descripcion
      ? hydrateUrl(baseUrl, localParams)
      : "";
  const collectionCode = extractCollectionCode(resolvedUrl);
  const clipboardBlock = buildWebClipboardBlock({
    productName,
    brandDetail,
    finalUrl: resolvedUrl,
    collectionCode,
  });

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

  const commitBaseUrl = (nextValue: string) => {
    const normalizedValue = nextValue.trim();
    const nextError = validateEditableBaseUrl(normalizedValue);
    setBaseUrlError(nextError);

    if (nextError) {
      return false;
    }

    setBaseUrl(normalizedValue);
    setIsRowFlashing(true);
    return true;
  };

  const handleBaseUrlChange = (nextValue: string) => {
    const nextError = validateEditableBaseUrl(nextValue);
    setBaseUrlError(nextError);
    setBaseUrl(nextValue);
  };

  const handleBaseUrlBlur = () => {
    const nextValue = baseUrl.trim();
    if (!nextValue) {
      setBaseUrl("");
      setBaseUrlError(validateEditableBaseUrl(""));
      return;
    }

    commitBaseUrl(nextValue);
  };

  const commitSlug = (nextValue: string) => {
    const normalizedValue = nextValue.trim();
    updateLocalParam("descripcion", normalizedValue);
    setIsRowFlashing(true);
  };

  const handleSlugChange = (nextValue: string) => {
    updateLocalParam("descripcion", nextValue);
  };

  const resetRow = () => {
    setBaseUrl(row.baseUrl);
    setBaseUrlError(undefined);
    setIsOpen(false);
    setIsRowFlashing(false);
    setLocalParams({
      ...defaultContext,
      descripcion: row.slug,
    });
    setHasManualSlug(false);
  };

  useEffect(() => {
    if (!isRowFlashing) {
      return;
    }

    const timeoutId = window.setTimeout(() => setIsRowFlashing(false), 1200);
    return () => window.clearTimeout(timeoutId);
  }, [isRowFlashing]);

  return (
    <>
      <TableRow
        className={`transition-colors duration-500 ${
          isRowFlashing
            ? "bg-primary/10"
            : hasError
              ? "bg-destructive/5 hover:bg-destructive/10"
              : "hover:bg-muted/30"
        }`}
      >
        <TableCell className="align-top">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {row.index + 1}
            </span>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p
                className="break-all text-[11px] italic text-[#64748b]"
                title={row.baseUrl || "Sin URL original"}
              >
                {row.baseUrl || "Sin URL original"}
              </p>
              <input
                type="text"
                value={baseUrl}
                onChange={(event) => handleBaseUrlChange(event.target.value)}
                onBlur={handleBaseUrlBlur}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitBaseUrl(baseUrl);
                    event.currentTarget.blur();
                  }
                }}
                placeholder="Sin URL"
                size={Math.max(baseUrl.length, 32)}
                style={{ width: `${Math.max(baseUrl.length, 32)}ch` }}
                className={`min-h-10 w-full rounded-xl border bg-transparent px-2 py-2 font-mono text-[11px] text-foreground outline-none transition-colors placeholder:text-muted-foreground ${
                  baseUrlError
                    ? "border-destructive/40 focus:border-destructive"
                    : "border-transparent focus:border-[#0055a5]"
                }`}
              />
              {hasError && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                    {hasMissingUrl ? "Falta URL base" : "Falta descripcion"}
                  </span>
                </div>
              )}

              <button
                onClick={() => setIsOpen((current) => !current)}
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#0055a5] bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-slate-50"
              >
                <span className="text-[#0055a5]">
                  <ChevronsUpDown size={14} />
                </span>
                Ajustes por fila
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
                  <ChevronsUpDown size={14} />
                </motion.span>
              </button>
            </div>
          </div>
        </TableCell>
        <TableCell className="align-top">
          <p
            className="mb-1.5 break-words text-[11px] italic text-[#64748b]"
            title={row.rawDescription || "Sin descripcion original"}
          >
            {compactDescriptionReference(row.rawDescription) || "Sin descripcion original"}
          </p>
          <input
            type="text"
            value={localParams.descripcion}
            onChange={(event) => handleSlugChange(event.target.value)}
            onBlur={(event) => commitSlug(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitSlug(event.currentTarget.value);
                event.currentTarget.blur();
              }
            }}
            placeholder="sin-slug"
            size={Math.max(localParams.descripcion.length, 24)}
            style={{ width: `${Math.max(localParams.descripcion.length, 24)}ch` }}
            className="min-h-10 w-full rounded-xl border border-transparent bg-transparent px-2 py-2 font-mono text-[11px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[#0055a5]"
          />
          {hasManualSlug && (
            <p className="mt-2 text-[11px] font-medium text-muted-foreground">Slug manual activo</p>
          )}
        </TableCell>
        <TableCell className="align-top">
          <div className="flex items-start gap-3">
            <p className="min-w-0 flex-1 break-all font-mono text-xs text-foreground">
              {resolvedUrl || "Link no disponible"}
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    onCopy(
                      clipboardBlock,
                      "Bloque copiado",
                      `Se copio el bloque de la fila ${row.index + 1}.`,
                    )
                  }
                  disabled={!clipboardBlock}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#EA7120] transition-colors hover:bg-[#FCE6D5] hover:text-[#EA7120] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Copiar bloque de la fila ${row.index + 1}`}
                >
                  <Copy size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Copiar en el portapapeles</TooltipContent>
            </Tooltip>
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
                      ) : field.key === "fecha" ? (
                        <DateSelectorField
                          key={`${rowId}-${field.key}`}
                          label={field.label}
                          placeholder={field.placeholder}
                          value={localParams.fecha}
                          onChange={(value) => updateLocalParam("fecha", value)}
                        />
                      ) : (
                        <ComboField
                          key={`${rowId}-${field.key}`}
                          label={field.label}
                          placeholder={field.placeholder}
                          value={localParams[field.key]}
                          onChange={(value) => updateLocalParam(field.key, value)}
                          options={dropdownOptions[field.key]}
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

  const [activeTab, setActiveTab] = useState("cms-web");
  const [webMode, setWebMode] = useState("individual");
  const [appMode, setAppMode] = useState("individual");
  const [globalParams, setGlobalParams] = useState<Omit<URLParams, "descripcion">>({
    ubicacion: "",
    componente: "",
    campana: "",
    semana: currentWeekValue,
    fecha: "",
  });
  const [singleBaseUrl, setSingleBaseUrl] = useState("");
  const [singleDescription, setSingleDescription] = useState("");
  const [singleFinalUrlDraft, setSingleFinalUrlDraft] = useState("");
  const [isSingleFinalUrlEditing, setIsSingleFinalUrlEditing] = useState(false);
  const [singleAppDirtyTitle, setSingleAppDirtyTitle] = useState("");
  const [singleAppUrl, setSingleAppUrl] = useState("");
  const [singleAppCleanTitleDraft, setSingleAppCleanTitleDraft] = useState("");
  const [singleAppCollectionCodeDraft, setSingleAppCollectionCodeDraft] = useState("");
  const [isSingleAppTitleEditing, setIsSingleAppTitleEditing] = useState(false);
  const [isSingleAppCodeEditing, setIsSingleAppCodeEditing] = useState(false);
  const [hasManualSingleAppTitle, setHasManualSingleAppTitle] = useState(false);
  const [hasManualSingleAppCode, setHasManualSingleAppCode] = useState(false);
  const [bulkDescriptions, setBulkDescriptions] = useState("");
  const [bulkBaseUrls, setBulkBaseUrls] = useState("");
  const [bulkAppTitles, setBulkAppTitles] = useState("");
  const [bulkAppUrls, setBulkAppUrls] = useState("");
  const [editableAppRows, setEditableAppRows] = useState<AppBatchRow[]>([]);
  const [bulkResolvedLinks, setBulkResolvedLinks] = useState<Record<string, string>>({});
  const [isBulkWebCopySuccess, setIsBulkWebCopySuccess] = useState(false);
  const [isBulkAppCopySuccess, setIsBulkAppCopySuccess] = useState(false);
  const [showResultsBottomShadow, setShowResultsBottomShadow] = useState(false);
  const resultsScrollRef = useRef<HTMLDivElement>(null);
  const singleFinalUrlInputRef = useRef<HTMLTextAreaElement>(null);
  const singleAppTitleInputRef = useRef<HTMLInputElement>(null);
  const singleAppCodeInputRef = useRef<HTMLInputElement>(null);

  const singleSlug = cleanTextToSlug(singleDescription);
  const singleAppCleanTitle = extractCleanTitle(singleAppDirtyTitle);
  const singleAppCollectionCode = extractCollectionCode(singleAppUrl);
  const singleFinalUrl = hydrateUrl(singleBaseUrl, {
    ...globalParams,
    descripcion: singleSlug,
  });
  const batchRows = useMemo(
    () => hydrateBatchRows(bulkBaseUrls, bulkDescriptions, globalParams),
    [bulkBaseUrls, bulkDescriptions, globalParams, hydrateBatchRows],
  );
  const appBatchRows = useMemo(
    () => buildAppBatchRows(bulkAppTitles, bulkAppUrls),
    [bulkAppTitles, bulkAppUrls],
  );

  useEffect(() => {
    setBulkResolvedLinks({});
  }, [batchRows]);

  useEffect(() => {
    setEditableAppRows(appBatchRows);
  }, [appBatchRows]);

  useEffect(() => {
    if (!isSingleFinalUrlEditing) {
      setSingleFinalUrlDraft(singleFinalUrl);
    }
  }, [isSingleFinalUrlEditing, singleFinalUrl]);

  useEffect(() => {
    if (!isSingleAppTitleEditing && !hasManualSingleAppTitle) {
      setSingleAppCleanTitleDraft(singleAppCleanTitle);
    }
  }, [hasManualSingleAppTitle, isSingleAppTitleEditing, singleAppCleanTitle]);

  useEffect(() => {
    if (!isSingleAppCodeEditing && !hasManualSingleAppCode) {
      setSingleAppCollectionCodeDraft(singleAppCollectionCode);
    }
  }, [hasManualSingleAppCode, isSingleAppCodeEditing, singleAppCollectionCode]);

  useEffect(() => {
    if (!isSingleFinalUrlEditing) {
      return;
    }

    const input = singleFinalUrlInputRef.current;
    if (!input) {
      return;
    }

    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
  }, [isSingleFinalUrlEditing]);

  useEffect(() => {
    if (!isSingleAppTitleEditing) {
      return;
    }

    const input = singleAppTitleInputRef.current;
    if (!input) {
      return;
    }

    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
  }, [isSingleAppTitleEditing]);

  useEffect(() => {
    if (!isSingleAppCodeEditing) {
      return;
    }

    const input = singleAppCodeInputRef.current;
    if (!input) {
      return;
    }

    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
  }, [isSingleAppCodeEditing]);

  useEffect(() => {
    const container = resultsScrollRef.current;
    if (!container) {
      return;
    }

    const nextShowShadow = container.scrollHeight - container.scrollTop - container.clientHeight > 8;
    setShowResultsBottomShadow(nextShowShadow);
  }, [batchRows, activeTab]);

  const validBatchLinks = batchRows
    .map((row) => bulkResolvedLinks[`row-${row.index}`] || "")
    .filter(Boolean);
  const bulkWebClipboardRows = useMemo(
    () =>
      buildBulkWebClipboardRows(
        batchRows.map((row) => ({
          productName: extractCleanTitle(row.rawDescription),
          brandDetail: extractBrandDetail(row.rawDescription),
          finalUrl: bulkResolvedLinks[`row-${row.index}`] || "",
          collectionCode: extractCollectionCode(bulkResolvedLinks[`row-${row.index}`] || ""),
        })),
      ),
    [batchRows, bulkResolvedLinks],
  );
  const bulkWebCopyValue = bulkWebClipboardRows.join("\n\n");
  const bulkAppClipboardRows = useMemo(
    () => buildBulkAppClipboardRows(editableAppRows),
    [editableAppRows],
  );
  const bulkAppCopyValue = bulkAppClipboardRows.join("\n");

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
    setSingleFinalUrlDraft("");
    setIsSingleFinalUrlEditing(false);
    setSingleAppDirtyTitle("");
    setSingleAppUrl("");
    setSingleAppCleanTitleDraft("");
    setSingleAppCollectionCodeDraft("");
    setIsSingleAppTitleEditing(false);
    setIsSingleAppCodeEditing(false);
    setHasManualSingleAppTitle(false);
    setHasManualSingleAppCode(false);
    setBulkDescriptions("");
    setBulkBaseUrls("");
    setBulkAppTitles("");
    setBulkAppUrls("");
  };

  const copyValue = async (value: string, title: string, description: string) => {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      return false;
    }

    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      toast({
        variant: "destructive",
        title: "No se pudo copiar",
        description: "El portapapeles no esta disponible en este navegador.",
      });
      return false;
    }

    try {
      await navigator.clipboard.writeText(normalizedValue);
      toast({ title, description });
      return true;
    } catch {
      toast({
        variant: "destructive",
        title: "No se pudo copiar",
        description: "Hubo un problema al escribir en el portapapeles.",
      });
      return false;
    }
  };

  const handleBulkAppCopy = async () => {
    if (!bulkAppCopyValue) {
      return;
    }

    const didCopy = await copyValue(
      bulkAppCopyValue,
      "Copiado al portapapeles",
      `${bulkAppClipboardRows.length} filas limpias copiadas al portapapeles.`,
    );

    if (didCopy) {
      setIsBulkAppCopySuccess(true);
    }
  };

  const handleBulkWebCopy = async () => {
    if (!bulkWebCopyValue) {
      return;
    }

    const didCopy = await copyValue(
      bulkWebCopyValue,
      "Copiado al portapapeles",
      `${bulkWebClipboardRows.length} filas de CMS Web copiadas al portapapeles.`,
    );

    if (didCopy) {
      setIsBulkWebCopySuccess(true);
    }
  };

  useEffect(() => {
    if (!isBulkAppCopySuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => setIsBulkAppCopySuccess(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [isBulkAppCopySuccess]);

  useEffect(() => {
    if (!isBulkWebCopySuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => setIsBulkWebCopySuccess(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [isBulkWebCopySuccess]);

  const handleRowResolvedChange = (rowId: string, finalUrl: string) => {
    setBulkResolvedLinks((current) => {
      if (current[rowId] === finalUrl) {
        return current;
      }
      return { ...current, [rowId]: finalUrl };
    });
  };

  const updateEditableAppRow = (
    rowIndex: number,
    key: "cleanTitle" | "collectionCode",
    value: string,
  ) => {
    setEditableAppRows((current) =>
      current.map((row) =>
        row.index === rowIndex
          ? {
              ...row,
              [key]: value,
            }
          : row,
      ),
    );
  };

  const contentVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const handleResultsScroll = () => {
    const container = resultsScrollRef.current;
    if (!container) {
      return;
    }

    const nextShowShadow = container.scrollHeight - container.scrollTop - container.clientHeight > 8;
    setShowResultsBottomShadow(nextShowShadow);
  };

  const displayedSingleFinalUrl = singleFinalUrlDraft || singleFinalUrl;
  const displayedSingleAppCleanTitle = hasManualSingleAppTitle
    ? singleAppCleanTitleDraft
    : (singleAppCleanTitleDraft || singleAppCleanTitle);
  const displayedSingleAppCollectionCode = hasManualSingleAppCode
    ? singleAppCollectionCodeDraft
    : (singleAppCollectionCodeDraft || singleAppCollectionCode);

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
              ) : field.key === "fecha" ? (
                <DateSelectorField
                  key={field.key}
                  label={field.label}
                  placeholder={field.placeholder}
                  value={globalParams.fecha}
                  onChange={(value) => updateGlobalParam("fecha", value)}
                />
              ) : (
                <ComboField
                  key={field.key}
              label={field.label}
                  placeholder={field.placeholder}
                  value={globalParams[field.key]}
                  onChange={(value) => updateGlobalParam(field.key, value)}
                  options={dropdownOptions[field.key]}
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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-primary bg-white px-5 text-sm font-semibold text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground hover:shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              aria-label="Limpiar todos los campos"
            >
              <RotateCcw className="h-4 w-4" />
              Limpiar todo
            </button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <TabsList className="flex h-auto w-full flex-wrap rounded-2xl bg-card p-1 shadow-card lg:w-auto">
              <TabsTrigger
                value="cms-web"
                className="flex-1 rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground lg:flex-none"
              >
                CMS WEB
              </TabsTrigger>
              <TabsTrigger
                value="cms-app"
                className="flex-1 rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground lg:flex-none"
              >
                CMS APP
              </TabsTrigger>
            </TabsList>

            {activeTab === "cms-app" && appMode === "masivo" && (
              <button
                onClick={handleBulkAppCopy}
                disabled={!bulkAppCopyValue}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#EA7120] px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#d96517] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isBulkAppCopySuccess ? <Check size={16} /> : <Copy size={16} />}
                {isBulkAppCopySuccess ? "Copiado al portapapeles" : "Copiar Todo"}
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "cms-web" ? (
              <motion.div key="cms-web" variants={contentVariants} initial="initial" animate="animate" exit="exit">
                <TabsContent value="cms-web" forceMount className="mt-4">
                  <div className="grid gap-8">
                    <section className="rounded-[28px] border border-border bg-card p-6 shadow-card md:p-8">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
                            CMS WEB
                          </h3>
                          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                            Centraliza el constructor web individual y masivo bajo un unico flujo con la misma nomenclatura y controles actuales.
                          </p>
                        </div>

                        <Tabs value={webMode} onValueChange={setWebMode}>
                          <TabsList className="h-auto rounded-2xl bg-secondary p-1 shadow-inner">
                            <TabsTrigger
                              value="individual"
                              className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            >
                              Modo Individual
                            </TabsTrigger>
                            <TabsTrigger
                              value="masivo"
                              className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            >
                              Modo Masivo
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    </section>

                    {webMode === "individual" ? (
                      <>
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
                                    copyValue(
                                      displayedSingleFinalUrl,
                                      "Link copiado",
                                      "El link individual fue copiado al portapapeles.",
                                    )
                                  }
                                  disabled={!displayedSingleFinalUrl}
                                  className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-2xl bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:brightness-95 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Copy size={16} />
                                  Copiar Link
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => setIsSingleFinalUrlEditing(true)}
                                className={`block w-full rounded-2xl bg-black/10 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20 ${
                                  isSingleFinalUrlEditing ? "bg-black/15" : "hover:bg-black/15"
                                }`}
                                aria-label="Editar link final"
                              >
                                <textarea
                                  ref={singleFinalUrlInputRef}
                                  value={
                                    displayedSingleFinalUrl ||
                                    "/santas-ofertas?nombre_promo=home-grilla-trutro-entero-s12-20032026"
                                  }
                                  onChange={(event) => setSingleFinalUrlDraft(event.target.value)}
                                  onFocus={() => setIsSingleFinalUrlEditing(true)}
                                  onBlur={() => setIsSingleFinalUrlEditing(false)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Escape") {
                                      event.preventDefault();
                                      setSingleFinalUrlDraft(singleFinalUrl);
                                      setIsSingleFinalUrlEditing(false);
                                    }
                                  }}
                                  rows={3}
                                  spellCheck={false}
                                  aria-label="Link final editable"
                                  className="block min-h-[96px] w-full resize-none bg-transparent font-mono text-sm leading-7 text-primary-foreground/95 outline-none placeholder:text-primary-foreground/60"
                                />
                              </button>
                            </section>
                          </div>

                          {globalContextSection}
                        </div>
                      </>
                    ) : (
                      <>
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

                            <NumberedTextarea
                              label="Lista de URLs Base"
                              value={bulkBaseUrls}
                              onChange={setBulkBaseUrls}
                              rows={10}
                              placeholder={"/busca?fq=H%3A27791\n/santas-ofertas"}
                            />
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

                          <div className="relative">
                            <div
                              ref={resultsScrollRef}
                              onScroll={handleResultsScroll}
                              className="max-h-[60vh] overflow-auto rounded-2xl border border-border [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent"
                            >
                              <table className="min-w-full caption-bottom text-sm">
                                <TableHeader>
                                  <TableRow className="border-b border-border bg-card hover:bg-card">
                                    <TableHead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
                                      URL Base
                                    </TableHead>
                                    <TableHead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
                                      Slug generado
                                    </TableHead>
                                    <TableHead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
                                      Link Final
                                    </TableHead>
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
                                        key={`${row.index}-${globalParams.ubicacion}-${globalParams.componente}-${globalParams.campana}-${globalParams.semana}-${globalParams.fecha}`}
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
                              </table>
                            </div>
                            {showResultsBottomShadow && batchRows.length > 0 && (
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 rounded-b-2xl bg-gradient-to-t from-card via-card/80 to-transparent" />
                            )}
                          </div>

                          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                              El boton copia cada fila como bloque `Nombre`, `Url` y `Codigo`, separado por una linea en blanco.
                            </p>
                            <button
                              onClick={handleBulkWebCopy}
                              disabled={!bulkWebCopyValue}
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#EA7120] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#d96517] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isBulkWebCopySuccess ? <Check size={16} /> : <Copy size={16} />}
                              {isBulkWebCopySuccess ? "Copiado al portapapeles" : "Copiar Todo"}
                            </button>
                          </div>
                        </section>
                      </>
                    )}
                  </div>
                </TabsContent>
              </motion.div>
            ) : (
              <motion.div key="cms-app" variants={contentVariants} initial="initial" animate="animate" exit="exit">
                <TabsContent value="cms-app" forceMount className="mt-4">
                  <div className="space-y-6">
                    <section className="rounded-[28px] border border-border bg-card p-6 shadow-card md:p-8">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
                            CMS APP
                          </h3>
                          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                            Limpia titulos promocionales y extrae el codigo de coleccion desde la URL final usando regex tolerantes a variaciones.
                          </p>
                        </div>

                        <Tabs value={appMode} onValueChange={setAppMode}>
                          <TabsList className="h-auto rounded-2xl bg-secondary p-1 shadow-inner">
                            <TabsTrigger
                              value="individual"
                              className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            >
                              Modo Individual
                            </TabsTrigger>
                            <TabsTrigger
                              value="masivo"
                              className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            >
                              Modo Masivo
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    </section>

                    {appMode === "individual" ? (
                      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.88fr)]">
                        <section className="rounded-[28px] border border-border bg-card p-6 shadow-card md:p-8">
                          <div className="space-y-6">
                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                Titulo Sucio
                              </label>
                              <textarea
                                value={singleAppDirtyTitle}
                                onChange={(event) => setSingleAppDirtyTitle(event.target.value)}
                                placeholder="Prensa/TV - Santa Yapa-PACK NECTAR WATT'S VARIEDADES 6X200CC 3X2"
                                rows={5}
                                className="min-h-[132px] rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15"
                              />
                            </div>

                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                URL Base
                              </label>
                              <input
                                type="text"
                                value={singleAppUrl}
                                onChange={(event) => setSingleAppUrl(event.target.value)}
                                placeholder="https://www.sitio.cl/busca?fq=H%3A10063"
                                className="h-12 rounded-2xl border border-border bg-secondary px-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15"
                              />
                            </div>
                          </div>
                        </section>

                        <section className="rounded-[28px] border border-primary/10 bg-card p-6 shadow-card md:p-8">
                          <div className="mb-6 flex items-start justify-between gap-4">
                            <div className="space-y-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                                <ExternalLink size={20} className="text-primary" />
                              </div>
                              <div>
                                <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-foreground">
                                  Previsualizacion
                                </h3>
                                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                                  Los resultados quedan listos para copiar de forma individual.
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() =>
                                copyValue(
                                  `${displayedSingleAppCleanTitle} --> ${displayedSingleAppCollectionCode}`,
                                  "Contenido copiado",
                                  "Se copiaron Titulo Limpio y Codigo Coleccion.",
                                )
                              }
                              disabled={!displayedSingleAppCleanTitle || !displayedSingleAppCollectionCode}
                              className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-2xl bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:brightness-95 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Copy size={16} />
                              Copiar todo
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div className="rounded-2xl border border-border bg-secondary/50 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                  Titulo Limpio
                                </p>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() =>
                                        copyValue(
                                          displayedSingleAppCleanTitle,
                                          "Titulo copiado",
                                          "El titulo limpio fue copiado al portapapeles.",
                                        )
                                      }
                                      disabled={!displayedSingleAppCleanTitle}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#EA7120] transition-colors hover:bg-[#FCE6D5] hover:text-[#EA7120] disabled:cursor-not-allowed disabled:opacity-40"
                                      aria-label="Copiar titulo limpio"
                                    >
                                      <Copy size={14} />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">Copiar en el portapapeles</TooltipContent>
                                </Tooltip>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsSingleAppTitleEditing(true)}
                                className={`mt-3 block w-full rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 ${
                                  isSingleAppTitleEditing
                                    ? "border-[#0055a5] bg-white shadow-sm ring-4 ring-[#0055a5]/15"
                                    : hasManualSingleAppTitle
                                      ? "border-primary/30 bg-white/60"
                                      : "border-transparent hover:bg-white/40"
                                }`}
                                aria-label="Editar titulo limpio"
                              >
                                <input
                                  ref={singleAppTitleInputRef}
                                  type="text"
                                  value={displayedSingleAppCleanTitle || "Nectar Watt's"}
                                  onChange={(event) => {
                                    setSingleAppCleanTitleDraft(
                                      formatEditableTitleCase(event.target.value),
                                    );
                                    setHasManualSingleAppTitle(true);
                                  }}
                                  onFocus={() => setIsSingleAppTitleEditing(true)}
                                  onBlur={() => {
                                    setHasManualSingleAppTitle(true);
                                    setIsSingleAppTitleEditing(false);
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === "Escape") {
                                      event.preventDefault();
                                      setSingleAppCleanTitleDraft(singleAppCleanTitle);
                                      setHasManualSingleAppTitle(false);
                                      setIsSingleAppTitleEditing(false);
                                    }
                                  }}
                                  className="h-11 w-full rounded-xl bg-transparent px-3 text-lg font-semibold text-slate-700 outline-none"
                                  aria-label="Titulo limpio editable"
                                />
                              </button>
                            </div>

                            <div className="rounded-2xl border border-border bg-secondary/50 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                  Codigo Coleccion
                                </p>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() =>
                                        copyValue(
                                          displayedSingleAppCollectionCode,
                                          "Codigo copiado",
                                          "El codigo de coleccion fue copiado al portapapeles.",
                                        )
                                      }
                                      disabled={!displayedSingleAppCollectionCode}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#EA7120] transition-colors hover:bg-[#FCE6D5] hover:text-[#EA7120] disabled:cursor-not-allowed disabled:opacity-40"
                                      aria-label="Copiar codigo coleccion"
                                    >
                                      <Copy size={14} />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">Copiar en el portapapeles</TooltipContent>
                                </Tooltip>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsSingleAppCodeEditing(true)}
                                className={`mt-3 block w-full rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 ${
                                  isSingleAppCodeEditing
                                    ? "border-[#0055a5] bg-white shadow-sm ring-4 ring-[#0055a5]/15"
                                    : hasManualSingleAppCode
                                      ? "border-primary/30 bg-white/60"
                                      : "border-transparent hover:bg-white/40"
                                }`}
                                aria-label="Editar codigo coleccion"
                              >
                                <input
                                  ref={singleAppCodeInputRef}
                                  type="text"
                                  value={displayedSingleAppCollectionCode || "10047"}
                                  onChange={(event) => {
                                    setSingleAppCollectionCodeDraft(event.target.value);
                                    setHasManualSingleAppCode(true);
                                  }}
                                  onFocus={() => setIsSingleAppCodeEditing(true)}
                                  onBlur={() => {
                                    setHasManualSingleAppCode(true);
                                    setIsSingleAppCodeEditing(false);
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === "Escape") {
                                      event.preventDefault();
                                      setSingleAppCollectionCodeDraft(singleAppCollectionCode);
                                      setHasManualSingleAppCode(false);
                                      setIsSingleAppCodeEditing(false);
                                    }
                                  }}
                                  className="h-11 w-full rounded-xl bg-transparent px-3 font-mono text-lg font-semibold text-slate-700 outline-none"
                                  aria-label="Codigo coleccion editable"
                                />
                              </button>
                            </div>
                          </div>
                        </section>
                      </div>
                    ) : (
                      <section className="rounded-[28px] border border-border bg-card p-6 shadow-card md:p-8">
                        <div className="grid gap-4 lg:grid-cols-2">
                          <NumberedTextarea
                            label="Titulos Sucios"
                            value={bulkAppTitles}
                            onChange={setBulkAppTitles}
                            rows={10}
                            placeholder={"Prensa/TV - Santa Yapa-PACK NECTAR WATT'S VARIEDADES 6X200CC 3X2\nCatalogo - PACK ARROZ TUCAPEL 1KG"}
                          />

                          <NumberedTextarea
                            label="URLs Base"
                            value={bulkAppUrls}
                            onChange={setBulkAppUrls}
                            rows={10}
                            placeholder={"https://www.sitio.cl/busca?fq=H%3A10063\n/busca?fq=H%3A27791"}
                          />
                        </div>

                        <div className="mt-8 rounded-2xl border border-border">
                          <div className="max-h-[560px] overflow-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent">
                            <table className="w-full min-w-[760px] table-fixed caption-bottom text-sm">
                              <colgroup>
                                <col className="w-[50px]" />
                                <col />
                                <col />
                                <col className="w-[112px]" />
                              </colgroup>
                              <TableHeader>
                                <TableRow className="border-b border-border bg-card hover:bg-card">
                                  <TableHead className="sticky top-0 z-10 w-[50px] bg-card px-2 shadow-[0_1px_0_hsl(var(--border))]">
                                    #
                                  </TableHead>
                                  <TableHead className="sticky top-0 z-10 bg-card px-2 shadow-[0_1px_0_hsl(var(--border))]">
                                    Titulo Limpio
                                  </TableHead>
                                  <TableHead className="sticky top-0 z-10 bg-card px-2 shadow-[0_1px_0_hsl(var(--border))]">
                                    Codigo Coleccion
                                  </TableHead>
                                  <TableHead className="sticky top-0 z-10 w-[112px] bg-card px-2 text-right shadow-[0_1px_0_hsl(var(--border))]">
                                    Acciones
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {editableAppRows.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-muted-foreground">
                                      Agrega titulos y URLs para procesar el lote app.
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  editableAppRows.map((row) => {
                                    const rowCopyValue = row.cleanTitle && row.collectionCode
                                      ? `${row.cleanTitle}\t${row.collectionCode}`
                                      : "";

                                    return (
                                      <TableRow
                                        key={`app-row-${row.index}`}
                                        className={row.hasError ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-muted/30"}
                                      >
                                        <TableCell className="w-[50px] px-2 py-4 align-middle">
                                          <div className="flex min-h-[92px] items-center">
                                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0055a5] text-xs font-semibold text-white">
                                              {row.index + 1}
                                            </span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="px-2 py-4">
                                          <div className="min-w-0 space-y-1.5">
                                            <p
                                              className="max-w-full truncate whitespace-nowrap text-[11px] italic text-[#64748b]"
                                              title={row.dirtyTitle || "Sin descripcion original"}
                                            >
                                              {row.dirtyTitle || "Sin descripcion original"}
                                            </p>
                                            <input
                                              type="text"
                                              value={row.cleanTitle}
                                              onChange={(event) =>
                                                updateEditableAppRow(
                                                  row.index,
                                                  "cleanTitle",
                                                  event.target.value,
                                                )
                                              }
                                              placeholder="Sin titulo limpio"
                                              className="h-11 w-full min-w-0 rounded-xl border border-transparent bg-transparent px-2 text-[15px] font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-blue-500 focus:bg-white"
                                            />
                                          </div>
                                        </TableCell>
                                        <TableCell className="px-2 py-4">
                                          <div className="min-w-0 space-y-1.5">
                                            <span
                                              className="inline-flex max-w-full truncate whitespace-nowrap rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-[#64748b]"
                                              title={row.sourceUrl || "Sin URL original"}
                                            >
                                              {row.sourceUrl || "Sin URL original"}
                                            </span>
                                            <input
                                              type="text"
                                              value={row.collectionCode}
                                              onChange={(event) =>
                                                updateEditableAppRow(
                                                  row.index,
                                                  "collectionCode",
                                                  event.target.value,
                                                )
                                              }
                                              placeholder="Sin codigo"
                                              className="h-11 w-full min-w-0 rounded-xl border border-transparent bg-transparent px-2 font-mono text-[15px] font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-blue-500 focus:bg-white"
                                            />
                                          </div>
                                        </TableCell>
                                        <TableCell className="w-[72px] px-2 py-4 text-right align-middle">
                                          <div className="flex min-h-[92px] items-center justify-end">
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <button
                                                  onClick={() =>
                                                    copyValue(
                                                      rowCopyValue,
                                                      "Fila copiada",
                                                      `Se copio la fila ${row.index + 1}.`,
                                                    )
                                                  }
                                                  disabled={!rowCopyValue}
                                                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#EA7120] transition-colors hover:bg-[#FCE6D5] hover:text-[#EA7120] disabled:cursor-not-allowed disabled:opacity-40"
                                                  aria-label={`Copiar fila ${row.index + 1}`}
                                                >
                                                  <Copy size={14} />
                                                </button>
                                              </TooltipTrigger>
                                              <TooltipContent side="top">
                                                Copiar en el portapapeles
                                              </TooltipContent>
                                            </Tooltip>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                )}
                              </TableBody>
                            </table>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-muted-foreground">
                            El boton copia cada fila como `Titulo Limpio[TAB]10047` para pegar directo en planillas.
                          </p>
                          <button
                            onClick={handleBulkAppCopy}
                            disabled={!bulkAppCopyValue}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#EA7120] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#d96517] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isBulkAppCopySuccess ? <Check size={16} /> : <Copy size={16} />}
                            {isBulkAppCopySuccess ? "Copiado al portapapeles" : "Copiar Todo"}
                          </button>
                        </div>
                      </section>
                    )}
                  </div>
                </TabsContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Tabs>

        {activeTab === "cms-web" && webMode === "individual" && !singleBaseUrl && (
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
