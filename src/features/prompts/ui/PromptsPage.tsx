import { useState, useMemo } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { filterPrompts } from "../services/prompts.service";
import { PromptFilters } from "./PromptFilters";
import { PromptCard } from "./PromptCard";
import { CreatePromptModal } from "./CreatePromptModal";
import type { PromptFilters as PromptFiltersType } from "../logic/prompts.types";

const DEFAULT_FILTERS: PromptFiltersType = {
  search: "",
  category: "todas",
  brand: "todas",
  tone: "todos",
};

export default function PromptsPage() {
  const [filters, setFilters] = useState<PromptFiltersType>(DEFAULT_FILTERS);
  const [modalOpen, setModalOpen] = useState(false);
  // Incrementar fuerza re-cálculo del useMemo cuando se crea un prompt
  const [refreshKey, setRefreshKey] = useState(0);

  const results = useMemo(
    () => filterPrompts(filters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, refreshKey]
  );

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-border bg-card px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <Sparkles className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Biblioteca de Prompts
            </h1>
            <p className="text-sm text-muted-foreground">
              Prompts listos para usar en generación de imágenes, banners y copy de campañas.
            </p>
          </div>

          <Button onClick={() => setModalOpen(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Nuevo prompt
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Sidebar de filtros */}
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-border p-6 lg:block">
          <PromptFilters
            filters={filters}
            onChange={setFilters}
            totalResults={results.length}
          />
        </aside>

        {/* Grid de prompts */}
        <main className="flex-1 overflow-y-auto p-6">
          {results.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              <Sparkles className="h-10 w-10 opacity-20" />
              <p className="text-sm">No se encontraron prompts con esos filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {results.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal de creación */}
      <CreatePromptModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
