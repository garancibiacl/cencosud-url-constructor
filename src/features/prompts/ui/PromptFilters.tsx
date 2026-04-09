import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { PromptFilters, PromptCategory, PromptBrand, PromptTone } from "../logic/prompts.types";

const CATEGORIES: { value: PromptCategory | "todas"; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "imagen-producto", label: "Imagen producto" },
  { value: "banner-campaña", label: "Banner campaña" },
  { value: "relleno-generativo", label: "Relleno generativo" },
  { value: "copy-marketing", label: "Copy marketing" },
  { value: "social-media", label: "Social media" },
];

const BRANDS: { value: PromptBrand | "todas"; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "Jumbo", label: "Jumbo" },
  { value: "Santa Isabel", label: "Santa Isabel" },
  { value: "Spid", label: "Spid" },
];

const TONES: { value: PromptTone | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "urgente", label: "Urgente" },
  { value: "aspiracional", label: "Aspiracional" },
];

interface Props {
  filters: PromptFilters;
  onChange: (filters: PromptFilters) => void;
  totalResults: number;
}

function FilterChip<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            value === opt.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function PromptFilters({ filters, onChange, totalResults }: Props) {
  const hasActiveFilters =
    filters.search !== "" ||
    filters.category !== "todas" ||
    filters.brand !== "todas" ||
    filters.tone !== "todos";

  function reset() {
    onChange({ search: "", category: "todas", brand: "todas", tone: "todos" });
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar prompts..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-9 pr-9"
        />
        {filters.search && (
          <button
            onClick={() => onChange({ ...filters, search: "" })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Chips */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Categoría</p>
        <FilterChip
          options={CATEGORIES}
          value={filters.category}
          onChange={(v) => onChange({ ...filters, category: v })}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Marca</p>
        <FilterChip
          options={BRANDS}
          value={filters.brand}
          onChange={(v) => onChange({ ...filters, brand: v })}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tono</p>
        <FilterChip
          options={TONES}
          value={filters.tone}
          onChange={(v) => onChange({ ...filters, tone: v })}
        />
      </div>

      {/* Result count + reset */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-muted-foreground">
          {totalResults} {totalResults === 1 ? "resultado" : "resultados"}
        </span>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={reset} className="h-7 gap-1.5 text-xs">
            <X className="h-3 w-3" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
