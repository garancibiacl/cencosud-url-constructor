import { useCallback, useEffect, useMemo, useRef, useState, type ClipboardEvent as ReactClipboardEvent } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useOptionFrequency } from "@/hooks/useOptionFrequency";
import { useAuth } from "@/hooks/useAuth";
import { format, isValid, parse } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronsUpDown,
  Copy,
  FileText,
  Globe,
  Layers3,
  Plus,
  RotateCcw,
  Rows3,
  Smartphone,
  X,
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
import { Button } from "@/components/ui/button";
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
  extractAppCleanTitle,
  extractBrandDetail,
  extractCleanTitle,
  extractCollectionCode,
  formatEditableCleanTitleInput,
  parseBulkAppSpreadsheetPaste,
  parseBulkWebSpreadsheetPaste,
  parseSingleWebSpreadsheetPaste,
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

const BLOCKED_WORDS = new Set([
  "puta","puto","puta","putas","putos","mierda","mierdas","concha","conchas",
  "culiao","culiado","culiada","culiao","weón","weon","hueon","hueón",
  "ctm","stm","chucha","chuchas","maricon","maricón","maricones",
  "imbecil","imbécil","idiota","idiomas","estupido","estúpido",
  "pico","pene","penes","culo","culos","teta","tetas",
]);

const VOWELS = new Set(["a","e","i","o","u","á","é","í","ó","ú","ü"]);

function hasEnoughVowels(word: string): boolean {
  const lower = word.toLowerCase();
  const letters = lower.replace(/[^a-záéíóúü]/g, "");
  if (letters.length <= 3) return true; // acronyms like "DSP", "KV" are OK
  const vowelCount = [...letters].filter((c) => VOWELS.has(c)).length;
  return vowelCount / letters.length >= 0.15;
}

function validateCustomOption(label: string): string | null {
  const trimmed = label.trim();
  if (trimmed.length < 3) return "Mínimo 3 caracteres.";
  if (trimmed.length > 60) return "Máximo 60 caracteres.";
  if (!/[a-záéíóúüA-ZÁÉÍÓÚÜ]/.test(trimmed)) return "Debe contener al menos una letra.";
  const words = trimmed.split(/\s+/);
  for (const word of words) {
    const lower = word.toLowerCase();
    if (BLOCKED_WORDS.has(lower)) return `La palabra "${word}" no está permitida.`;
    if (!hasEnoughVowels(word)) return `"${word}" no parece una palabra válida.`;
  }
  return null;
}

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
    { value: "santo-black", label: "Santo Black" },
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
  onAddCustom?: (value: string, label: string) => void;
  customValues?: Set<string>;
  onRemoveCustom?: (value: string) => void;
}

const ComboField = ({
  label,
  value,
  onChange,
  placeholder,
  options,
  customValueFormatter,
  onAddCustom,
  customValues,
  onRemoveCustom,
}: ComboFieldProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const selectedLabel = options.find((option) => option.value === value)?.label;

  const handleCustomValue = () => {
    const label = search.trim();
    const error = validateCustomOption(label);
    if (error) {
      setInputError(error);
      return;
    }
    const nextValue = customValueFormatter
      ? customValueFormatter(search)
      : label.replace(/\s+/g, "-").toLowerCase();
    if (!nextValue) return;
    setInputError(null);
    onAddCustom?.(nextValue, label);
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
              onValueChange={(v) => { setSearch(v); setInputError(null); }}
            />
            {inputError && (
              <p className="border-b border-border px-3 py-2 text-xs text-destructive">
                {inputError}
              </p>
            )}
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
                    className="group flex items-center justify-between"
                  >
                    <span className="flex items-center">
                      <Check className={`mr-2 h-4 w-4 shrink-0 ${value === option.value ? "opacity-100" : "opacity-0"}`} />
                      {option.label}
                    </span>
                    {onRemoveCustom && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveCustom(option.value); }}
                        className="ml-2 rounded p-0.5 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        title="Eliminar de la lista"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              {search.trim() && !options.some((option) => option.label.toLowerCase() === search.toLowerCase()) && (
                <CommandGroup heading="Personalizado">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CommandItem value={`custom-${search}`} onSelect={handleCustomValue} className="cursor-pointer">
                        <Plus className="mr-2 h-4 w-4" />
                        Usar "{search}"
                      </CommandItem>
                    </TooltipTrigger>
                    <TooltipContent side="right">Agregar a la lista</TooltipContent>
                  </Tooltip>
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
  const currentMonthKey = currentWeek?.monthKey ?? "";
  const monthGroups = useMemo(() => {
    const groups = new Map<string, { heading: string; monthKey: string; options: WeekOption[] }>();

    for (const option of options) {
      const group = groups.get(option.monthKey);
      if (group) {
        group.options.push(option);
      } else {
        groups.set(option.monthKey, {
          heading: option.monthLabel,
          monthKey: option.monthKey,
          options: [option],
        });
      }
    }

    return Array.from(groups.values()).sort((left, right) => {
      const getBucket = (monthKey: string) => {
        if (monthKey === currentMonthKey) {
          return 0;
        }

        if (monthKey > currentMonthKey) {
          return 1;
        }

        return 2;
      };

      const leftBucket = getBucket(left.monthKey);
      const rightBucket = getBucket(right.monthKey);

      if (leftBucket !== rightBucket) {
        return leftBucket - rightBucket;
      }

      if (leftBucket === 2) {
        return right.monthKey.localeCompare(left.monthKey);
      }

      return left.monthKey.localeCompare(right.monthKey);
    });
  }, [currentMonthKey, options]);

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
                  <div key={group.monthKey} className="pb-1">
                    <div className="sticky top-0 z-10 bg-popover/95 px-3 pt-3 pb-1 backdrop-blur supports-[backdrop-filter]:bg-popover/80">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                          {group.heading}
                        </span>
                        {group.monthKey === currentWeek?.monthKey && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            Mes actual
                          </span>
                        )}
                      </div>
                    </div>
                    <CommandGroup>
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
                  </div>
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
  onPaste?: (event: ReactClipboardEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  placeholder?: string;
}

const NumberedTextarea = ({
  label,
  value,
  onChange,
  onPaste,
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
          onPaste={onPaste}
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
  sortedOptions: Record<GlobalParamKey, { value: string; label: string }[]>;
  onOptionSelect: (field: string, value: string) => void;
  onAddCustom: (field: string, value: string, label: string) => void;
  customValueSets: Record<string, Set<string>>;
  onRemoveCustom?: (field: string, value: string) => void;
}

const BulkEditableRow = ({
  row,
  defaultContext,
  onCopy,
  onResolvedChange,
  weekOptions,
  currentWeekValue,
  isoWeekYear,
  sortedOptions,
  onOptionSelect,
  onAddCustom,
  customValueSets,
  onRemoveCustom,
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
                          onChange={(value) => { updateLocalParam(field.key, value); onOptionSelect(field.key, value); }}
                          options={sortedOptions[field.key]}
                          onAddCustom={(value, label) => onAddCustom(field.key, value, label)}
                          customValues={customValueSets[field.key]}
                          onRemoveCustom={onRemoveCustom ? (value) => onRemoveCustom(field.key, value) : undefined}
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
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const { recordSelection, getSortedOptions } = useOptionFrequency("url-builder:option-frequency");
  const [customOptions, setCustomOptions] = usePersistedState<Record<string, { value: string; label: string }[]>>(
    "url-builder:custom-options",
    {},
  );
  const [hiddenOptions, setHiddenOptions] = usePersistedState<Record<string, string[]>>(
    "url-builder:hidden-options",
    {},
  );

  const addCustomOption = useCallback(
    (field: string, value: string, label: string) => {
      setCustomOptions((prev) => {
        const existing = prev[field] ?? [];
        if (existing.some((o) => o.value === value)) return prev;
        toast({ title: `"${label}" agregado a la lista`, description: `Disponible en el campo ${field} para futuras selecciones.` });
        return { ...prev, [field]: [...existing, { value, label }] };
      });
    },
    [setCustomOptions],
  );

  const removeCustomOption = useCallback(
    (field: string, value: string) => {
      const isCustom = (customOptions[field] ?? []).some((o) => o.value === value);
      const removedLabel = isCustom
        ? (customOptions[field] ?? []).find((o) => o.value === value)?.label ?? value
        : dropdownOptions[field as GlobalParamKey]?.find((o) => o.value === value)?.label ?? value;

      if (isCustom) {
        setCustomOptions((prev) => ({
          ...prev,
          [field]: (prev[field] ?? []).filter((o) => o.value !== value),
        }));
      } else {
        setHiddenOptions((prev) => ({
          ...prev,
          [field]: [...new Set([...(prev[field] ?? []), value])],
        }));
      }
      toast({ title: `"${removedLabel}" eliminado de la lista` });
    },
    [customOptions, setCustomOptions, setHiddenOptions],
  );

  const customValueSets = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(customOptions).map(([field, opts]) => [field, new Set(opts.map((o) => o.value))]),
      ) as Record<string, Set<string>>,
    [customOptions],
  );

  const mergedDropdownOptions = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(dropdownOptions).map(([key, opts]) => {
          const hidden = new Set(hiddenOptions[key] ?? []);
          return [key, [...opts.filter((o) => !hidden.has(o.value)), ...(customOptions[key] ?? [])]];
        }),
      ) as typeof dropdownOptions,
    [customOptions, hiddenOptions],
  );

  const sortedDropdownOptions = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(mergedDropdownOptions).map(([key, opts]) => [key, getSortedOptions(key, opts)]),
      ) as typeof dropdownOptions,
    [getSortedOptions, mergedDropdownOptions],
  );

  const [activeTab, setActiveTab] = usePersistedState("url-builder:activeTab", "cms-web");
  const [webMode, setWebMode] = usePersistedState("url-builder:webMode", "individual");
  const [appMode, setAppMode] = usePersistedState("url-builder:appMode", "individual");
  const [globalParams, setGlobalParams] = usePersistedState<Omit<URLParams, "descripcion">>("url-builder:globalParams", {
    ubicacion: "",
    componente: "",
    campana: "",
    semana: currentWeekValue,
    fecha: "",
  });
  const [singleBaseUrl, setSingleBaseUrl] = usePersistedState("url-builder:singleBaseUrl", "");
  const [singleDescription, setSingleDescription] = usePersistedState("url-builder:singleDescription", "");
  const [singleFinalUrlDraft, setSingleFinalUrlDraft] = useState("");
  const [isSingleFinalUrlEditing, setIsSingleFinalUrlEditing] = useState(false);
  const [singleAppDirtyTitle, setSingleAppDirtyTitle] = usePersistedState("url-builder:singleAppDirtyTitle", "");
  const [singleAppUrl, setSingleAppUrl] = usePersistedState("url-builder:singleAppUrl", "");
  const [singleAppCleanTitleDraft, setSingleAppCleanTitleDraft] = useState("");
  const [singleAppCollectionCodeDraft, setSingleAppCollectionCodeDraft] = useState("");
  const [isSingleAppTitleEditing, setIsSingleAppTitleEditing] = useState(false);
  const [isSingleAppCodeEditing, setIsSingleAppCodeEditing] = useState(false);
  const [hasManualSingleAppTitle, setHasManualSingleAppTitle] = useState(false);
  const [hasManualSingleAppCode, setHasManualSingleAppCode] = useState(false);
  const [bulkDescriptions, setBulkDescriptions] = usePersistedState("url-builder:bulkDescriptions", "");
  const [bulkBaseUrls, setBulkBaseUrls] = usePersistedState("url-builder:bulkBaseUrls", "");
  const [bulkAppTitles, setBulkAppTitles] = usePersistedState("url-builder:bulkAppTitles", "");
  const [bulkAppUrls, setBulkAppUrls] = usePersistedState("url-builder:bulkAppUrls", "");
  const [editableAppRows, setEditableAppRows] = useState<AppBatchRow[]>([]);
  const [appRowOverrides, setAppRowOverrides] = usePersistedState<Record<string, { cleanTitle?: string; collectionCode?: string }>>(
    "url-builder:app-row-overrides",
    {},
  );
  const [bulkResolvedLinks, setBulkResolvedLinks] = useState<Record<string, string>>({});
  const [isBulkWebCopySuccess, setIsBulkWebCopySuccess] = useState(false);
  const [isBulkAppCopySuccess, setIsBulkAppCopySuccess] = useState(false);
  const [showResultsBottomShadow, setShowResultsBottomShadow] = useState(false);
  const resultsScrollRef = useRef<HTMLDivElement>(null);
  const singleFinalUrlInputRef = useRef<HTMLTextAreaElement>(null);
  const singleAppTitleInputRef = useRef<HTMLInputElement>(null);
  const singleAppCodeInputRef = useRef<HTMLInputElement>(null);

  const singleSlug = cleanTextToSlug(singleDescription);
  const singleProductName = extractCleanTitle(singleDescription);
  const singleBrandDetail = extractBrandDetail(singleDescription);
  const singleAppCleanTitle = extractAppCleanTitle(singleAppDirtyTitle);
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

  const appRowOverridesRef = useRef(appRowOverrides);
  appRowOverridesRef.current = appRowOverrides;

  useEffect(() => {
    setEditableAppRows(
      appBatchRows.map((row) => {
        const key = `${row.dirtyTitle}|${row.sourceUrl}`;
        const override = appRowOverridesRef.current[key];
        if (!override) return row;
        return {
          ...row,
          ...(override.cleanTitle !== undefined ? { cleanTitle: override.cleanTitle } : {}),
          ...(override.collectionCode !== undefined ? { collectionCode: override.collectionCode } : {}),
        };
      }),
    );
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
  const editableAppRowsRef = useRef(editableAppRows);
  editableAppRowsRef.current = editableAppRows;

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
    const latestRows = buildBulkAppClipboardRows(editableAppRowsRef.current);
    const latestValue = latestRows.join("\n");
    if (!latestValue) return;

    const didCopy = await copyValue(
      latestValue,
      "Copiado al portapapeles",
      `${latestRows.length} filas limpias copiadas al portapapeles.`,
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

  const handleBulkWebStructuredPaste = (event: ReactClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = event.clipboardData.getData("text");
    const parsedContent = parseBulkWebSpreadsheetPaste(pastedText);

    if (!parsedContent) {
      return;
    }

    event.preventDefault();
    setBulkDescriptions(parsedContent.descriptionsText);
    setBulkBaseUrls(parsedContent.baseUrlsText);
  };

  const handleBulkAppStructuredPaste = (event: ReactClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = event.clipboardData.getData("text");
    const parsedContent = parseBulkAppSpreadsheetPaste(pastedText);

    if (!parsedContent) {
      return;
    }

    event.preventDefault();
    setBulkAppTitles(parsedContent.descriptionsText);
    setBulkAppUrls(parsedContent.baseUrlsText);
  };

  const handleSingleWebStructuredPaste = (
    event: ReactClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const pastedText = event.clipboardData.getData("text");
    const parsedContent = parseSingleWebSpreadsheetPaste(pastedText);

    if (!parsedContent) {
      return;
    }

    event.preventDefault();
    setSingleDescription(parsedContent.description);
    setSingleBaseUrl(parsedContent.baseUrl);
  };

  const handleSingleAppStructuredPaste = (
    event: ReactClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const pastedText = event.clipboardData.getData("text");
    const parsedContent = parseSingleWebSpreadsheetPaste(pastedText);

    if (!parsedContent) {
      return;
    }

    event.preventDefault();
    setSingleAppDirtyTitle(parsedContent.description);
    setSingleAppUrl(parsedContent.baseUrl);
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
    const row = editableAppRowsRef.current.find((r) => r.index === rowIndex);
    if (row) {
      const overrideKey = `${row.dirtyTitle}|${row.sourceUrl}`;
      setAppRowOverrides((prev) => ({
        ...prev,
        [overrideKey]: { ...prev[overrideKey], [key]: value },
      }));
    }
    setEditableAppRows((current) =>
      current.map((r) => (r.index === rowIndex ? { ...r, [key]: value } : r)),
    );
  };

  const commitEditableAppCleanTitle = (rowIndex: number, value: string) => {
    updateEditableAppRow(rowIndex, "cleanTitle", formatEditableCleanTitleInput(value));
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
  const singleUrlOnlyValue = displayedSingleFinalUrl.trim();
  const singleCollectionCode = extractCollectionCode(displayedSingleFinalUrl);
  const singleClipboardBlock = buildWebClipboardBlock({
    productName: singleProductName,
    brandDetail: singleBrandDetail,
    finalUrl: displayedSingleFinalUrl,
    collectionCode: singleCollectionCode,
  });
  const displayedSingleAppCleanTitle = hasManualSingleAppTitle
    ? singleAppCleanTitleDraft
    : (singleAppCleanTitleDraft || singleAppCleanTitle);
  const displayedSingleAppCollectionCode = hasManualSingleAppCode
    ? singleAppCollectionCodeDraft
    : (singleAppCollectionCodeDraft || singleAppCollectionCode);

  const globalContextSection = (
    <section className="rounded-[28px] border border-border bg-card px-6 py-4 shadow-card md:px-8">
      <div className="mb-4 flex items-center gap-2.5">
        <Layers3 className="h-4 w-4 text-primary" />
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
            Contexto Global
          </h2>
          <p className="text-xs text-muted-foreground">
            Alimenta la nomenclatura individual y el lote masivo.
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
                  onChange={(value) => { updateGlobalParam(field.key, value); recordSelection(field.key, value); }}
                  options={sortedDropdownOptions[field.key]}
                  onAddCustom={(value, label) => addCustomOption(field.key, value, label)}
                  customValues={customValueSets[field.key]}
                  onRemoveCustom={isAdmin ? (value) => removeCustomOption(field.key, value) : undefined}
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

            <Button
              variant="brand"
              onClick={clearAll}
              aria-label="Limpiar todos los campos"
              className="h-11 rounded-2xl px-5 gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Limpiar todo
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-3">
              {[
                { value: "cms-web", icon: Globe, label: "CMS Web", desc: "Constructor de URLs" },
                { value: "cms-app", icon: Smartphone, label: "CMS App", desc: "Limpieza de títulos" },
              ].map(({ value, icon: Icon, label, desc }) => {
                const active = activeTab === value;
                return (
                  <button
                    key={value}
                    onClick={() => setActiveTab(value)}
                    className={`group flex items-center gap-3.5 rounded-2xl border px-5 py-3 text-left transition-all duration-200 ${
                      active
                        ? "border-primary/30 bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20"
                        : "border-border bg-card shadow-sm hover:border-primary/30 hover:shadow-md"
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      active ? "bg-white/20" : "bg-muted group-hover:bg-primary/10"
                    }`}>
                      <Icon size={18} className={active ? "text-white" : "text-muted-foreground group-hover:text-primary"} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold leading-tight tracking-wide ${active ? "text-white" : "text-foreground"}`}>{label}</p>
                      <p className={`text-[11px] leading-tight ${active ? "text-white/70" : "text-muted-foreground"}`}>{desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "cms-web" ? (
              <motion.div key="cms-web" variants={contentVariants} initial="initial" animate="animate" exit="exit">
                <TabsContent value="cms-web" forceMount className="mt-4">
                  <div className="grid gap-6">
                    <section className="rounded-[28px] border border-border bg-card px-6 py-4 shadow-card md:px-8">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-0.5">
                          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
                            CMS WEB
                          </h3>
                          <p className="max-w-3xl text-xs leading-5 text-muted-foreground">
                            Centraliza el constructor web individual y masivo bajo un unico flujo.
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {[
                            { value: "individual", icon: FileText, label: "Individual", desc: "Un título a la vez" },
                            { value: "masivo", icon: Rows3, label: "Masivo", desc: "Procesar en lote" },
                          ].map(({ value, icon: Icon, label, desc }) => {
                            const active = webMode === value;
                            return (
                              <button
                                key={value}
                                onClick={() => setWebMode(value)}
                                className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition-all duration-200 ${
                                  active
                                    ? "border-primary bg-primary/8 shadow-sm"
                                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                                }`}
                              >
                                <div className={`rounded-xl p-1.5 transition-colors ${active ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                                  <Icon size={15} />
                                </div>
                                <div>
                                  <p className={`text-sm font-semibold leading-tight ${active ? "text-primary" : "text-foreground"}`}>{label}</p>
                                  <p className="text-[11px] leading-tight text-muted-foreground">{desc}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </section>

                    {globalContextSection}

                    {webMode === "individual" ? (
                      <>
                        <div className="space-y-4">
                          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.9fr)]">
                            <section className="rounded-[28px] border border-border bg-card p-6 shadow-card md:p-8">
                              <div className="space-y-6">
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

                                    <div className="relative">
                                      <textarea
                                        value={singleDescription}
                                        onChange={(event) => setSingleDescription(event.target.value)}
                                        onPaste={handleSingleWebStructuredPaste}
                                        placeholder='Pega un texto como: "Prensa/TV - TRUTRO ENTERO $2.790"'
                                        rows={4}
                                        className="min-h-[112px] w-full rounded-2xl border border-border bg-background px-4 py-3 pr-12 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15"
                                      />
                                      {singleDescription && (
                                        <button
                                          type="button"
                                          onClick={() => setSingleDescription("")}
                                          className="absolute right-3 top-3 inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                                          aria-label="Limpiar descripcion"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>

                                    <span className="w-fit rounded-full bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
                                      {singleSlug || "trutro-entero"}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                    URL Base
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={singleBaseUrl}
                                      onChange={(event) => setSingleBaseUrl(event.target.value)}
                                      onPaste={handleSingleWebStructuredPaste}
                                      placeholder="https://www.santaisabel.cl/santas-ofertas"
                                      className="h-12 w-full rounded-2xl border border-border bg-secondary px-4 pr-12 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15"
                                    />
                                    {singleBaseUrl && (
                                      <button
                                        type="button"
                                        onClick={() => setSingleBaseUrl("")}
                                        className="absolute inset-y-0 right-3 inline-flex h-12 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                                        aria-label="Limpiar URL base"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </section>

                            <section className="rounded-[28px] border border-primary/10 bg-primary p-6 text-primary-foreground shadow-elevated md:p-8">
                              <div className="mb-6 flex flex-col gap-1">
                                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/72">
                                  Link Final
                                </h3>
                                <p className="text-sm leading-6 text-primary-foreground/70">
                                  Preview inmediato con slug inteligente y concatenacion automatica.
                                </p>
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

                              <div className="mt-4 grid grid-cols-2 gap-2">
                                <button
                                  onClick={() =>
                                    copyValue(
                                      singleClipboardBlock,
                                      "Contenido copiado",
                                      "Se copiaron Nombre, Url y Codigo del link individual.",
                                    )
                                  }
                                  disabled={!singleClipboardBlock}
                                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-primary-foreground/16 bg-primary-foreground/10 px-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-foreground/16 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Copy size={15} />
                                  <span className="truncate">Copiar bloque</span>
                                </button>

                                <button
                                  onClick={() =>
                                    copyValue(
                                      singleUrlOnlyValue,
                                      "URL copiada",
                                      "Se copio solo la URL final del link individual.",
                                    )
                                  }
                                  disabled={!singleUrlOnlyValue}
                                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-3 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:brightness-95 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Copy size={15} />
                                  <span className="truncate">Copiar URL</span>
                                </button>
                              </div>
                            </section>
                          </div>

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
                                onPaste={handleBulkWebStructuredPaste}
                                rows={10}
                                placeholder={"Prensa/TV - TRUTRO ENTERO $2.790\nCiclos - TODAS LAS OFERTAS CICLO 1"}
                                className="min-h-[240px] rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15"
                              />
                            </div>

                            <NumberedTextarea
                              label="Lista de URLs Base"
                              value={bulkBaseUrls}
                              onChange={setBulkBaseUrls}
                              onPaste={handleBulkWebStructuredPaste}
                              rows={10}
                              placeholder={"/busca?fq=H%3A27791\n/santas-ofertas"}
                            />
                          </div>
                        </section>

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
                                        sortedOptions={sortedDropdownOptions}
                                        onOptionSelect={recordSelection}
                                        onAddCustom={addCustomOption}
                                        customValueSets={customValueSets}
                                        onRemoveCustom={isAdmin ? removeCustomOption : undefined}
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
                            <Button
                              variant="brand"
                              onClick={handleBulkWebCopy}
                              disabled={!bulkWebCopyValue}
                              className="h-11 rounded-2xl px-5 gap-2"
                            >
                              {isBulkWebCopySuccess ? <Check size={16} /> : <Copy size={16} />}
                              {isBulkWebCopySuccess ? "Copiado al portapapeles" : "Copiar Todo"}
                            </Button>
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

                        <div className="flex gap-2">
                          {[
                            { value: "individual", icon: FileText, label: "Individual", desc: "Un título a la vez" },
                            { value: "masivo", icon: Rows3, label: "Masivo", desc: "Procesar en lote" },
                          ].map(({ value, icon: Icon, label, desc }) => {
                            const active = appMode === value;
                            return (
                              <button
                                key={value}
                                onClick={() => setAppMode(value)}
                                className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition-all duration-200 ${
                                  active
                                    ? "border-primary bg-primary/8 shadow-sm"
                                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                                }`}
                              >
                                <div className={`rounded-xl p-1.5 transition-colors ${active ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                                  <Icon size={15} />
                                </div>
                                <div>
                                  <p className={`text-sm font-semibold leading-tight ${active ? "text-primary" : "text-foreground"}`}>{label}</p>
                                  <p className="text-[11px] leading-tight text-muted-foreground">{desc}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
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
                                onPaste={handleSingleAppStructuredPaste}
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
                                onPaste={handleSingleAppStructuredPaste}
                                placeholder="https://www.sitio.cl/busca?fq=H%3A10063"
                                className="h-12 rounded-2xl border border-border bg-secondary px-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15"
                              />
                            </div>
                          </div>
                        </section>

                        <section className="rounded-[28px] border border-primary/10 bg-primary p-6 shadow-elevated md:p-8">
                          <div className="flex flex-col space-y-4">
                            <div className="rounded-2xl bg-white/95 p-3 shadow-sm">
                              <div className="flex items-center gap-2">
                                <input
                                  ref={singleAppTitleInputRef}
                                  type="text"
                                  value={displayedSingleAppCleanTitle}
                                  placeholder="Nectar Watt's"
                                  onChange={(event) => {
                                    setSingleAppCleanTitleDraft(event.target.value);
                                    setHasManualSingleAppTitle(true);
                                  }}
                                  onPaste={(event) => {
                                    const pasted = event.clipboardData.getData("text");
                                    event.preventDefault();
                                    const titled = pasted
                                      .toLowerCase()
                                      .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
                                    setSingleAppCleanTitleDraft(titled);
                                    setHasManualSingleAppTitle(true);
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === "Escape") {
                                      event.preventDefault();
                                      setSingleAppCleanTitleDraft(singleAppCleanTitle);
                                      setHasManualSingleAppTitle(false);
                                    }
                                  }}
                                  className="h-11 min-w-0 flex-1 rounded-xl bg-transparent px-3 text-lg font-semibold text-primary outline-none placeholder:text-primary/40"
                                  aria-label="Titulo limpio editable"
                                />
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
                                      className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-primary/50 transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                                      aria-label="Copiar titulo limpio"
                                    >
                                      <Copy size={14} />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">Copiar en el portapapeles</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>

                            <div className="rounded-2xl bg-white/95 p-3 shadow-sm">
                              <div className="flex items-center gap-2">
                                <input
                                  ref={singleAppCodeInputRef}
                                  type="text"
                                  value={displayedSingleAppCollectionCode}
                                  placeholder="10047"
                                  onChange={(event) => {
                                    setSingleAppCollectionCodeDraft(event.target.value);
                                    setHasManualSingleAppCode(true);
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === "Escape") {
                                      event.preventDefault();
                                      setSingleAppCollectionCodeDraft(singleAppCollectionCode);
                                      setHasManualSingleAppCode(false);
                                    }
                                  }}
                                  className="h-11 min-w-0 flex-1 rounded-xl bg-transparent px-3 font-mono text-lg font-semibold text-primary outline-none placeholder:text-primary/40"
                                  aria-label="Codigo coleccion editable"
                                />
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
                                      className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-primary/50 transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                                      aria-label="Copiar codigo coleccion"
                                    >
                                      <Copy size={14} />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">Copiar en el portapapeles</TooltipContent>
                                </Tooltip>
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
                              className="inline-flex w-1/2 h-11 ml-auto items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 text-sm font-bold text-white shadow-lg shadow-orange-500/40 transition-all hover:from-orange-600 hover:to-orange-500 hover:shadow-xl hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                            >
                              <Copy size={16} />
                              Copiar todo
                            </button>
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
                            onPaste={handleBulkAppStructuredPaste}
                            rows={10}
                            placeholder={"Prensa/TV - Santa Yapa-PACK NECTAR WATT'S VARIEDADES 6X200CC 3X2\nCatalogo - PACK ARROZ TUCAPEL 1KG"}
                          />

                          <NumberedTextarea
                            label="URLs Base"
                            value={bulkAppUrls}
                            onChange={setBulkAppUrls}
                            onPaste={handleBulkAppStructuredPaste}
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
                                              onBlur={(event) =>
                                                updateEditableAppRow(row.index, "cleanTitle", event.target.value.trim())
                                              }
                                              onPaste={(event) => {
                                                const pastedText = event.clipboardData.getData("text");
                                                event.preventDefault();
                                                commitEditableAppCleanTitle(row.index, pastedText);
                                              }}
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

                        <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-border bg-muted/40 px-5 py-3">
                          <div className="flex items-center gap-3">
                            {bulkAppClipboardRows.length > 0 ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                <Check size={11} />
                                {bulkAppClipboardRows.length} {bulkAppClipboardRows.length === 1 ? "fila lista" : "filas listas"}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sin filas listas para copiar</span>
                            )}
                            {editableAppRows.length > 0 && bulkAppClipboardRows.length < editableAppRows.length && (
                              <span className="text-xs text-muted-foreground">
                                · {editableAppRows.length - bulkAppClipboardRows.length} incompletas
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setBulkAppTitles(""); setBulkAppUrls(""); setAppRowOverrides({}); }}
                              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
                            >
                              <RotateCcw size={12} />
                              Limpiar filas
                            </button>
                            <button
                              onClick={handleBulkAppCopy}
                              disabled={!bulkAppCopyValue}
                              className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#EA7120] px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#d96517] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {isBulkAppCopySuccess ? <Check size={14} /> : <Copy size={14} />}
                              {isBulkAppCopySuccess
                                ? "Copiado"
                                : bulkAppClipboardRows.length > 0
                                  ? `Copiar ${bulkAppClipboardRows.length} ${bulkAppClipboardRows.length === 1 ? "fila" : "filas"}`
                                  : "Copiar todo"}
                            </button>
                          </div>
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
