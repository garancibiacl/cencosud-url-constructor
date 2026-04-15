import { useState, useMemo } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { applyFilters } from "../services/prompts.service";
import { usePrompts } from "../hooks/usePrompts";
import { PromptFilters } from "./PromptFilters";
import { PromptCard } from "./PromptCard";
import { CreatePromptModal } from "./CreatePromptModal";
import type { PromptFilters as PromptFiltersType } from "../logic/prompts.types";

// ── Roles con permiso para eliminar prompts ──────────────────
// Para habilitar más roles en el futuro, agrégalos aquí:
// const CAN_DELETE_ROLES = ["admin", "director", "disenador"] as const;
const CAN_DELETE_ROLES = ["admin"] as const;
type DeletableRole = (typeof CAN_DELETE_ROLES)[number];

const DEFAULT_FILTERS: PromptFiltersType = {
  search:   "",
  category: "todas",
  brand:    "todas",
  tone:     "todos",
};

export default function PromptsPage() {
  const { role } = useAuth();
  const { prompts, loading, refresh, removeOptimistic } = usePrompts();
  const [filters,    setFilters]    = usePersistedState<PromptFiltersType>("prompts:filters", DEFAULT_FILTERS);
  const [modalOpen,  setModalOpen]  = useState(false);

  const canDelete = CAN_DELETE_ROLES.includes(role as DeletableRole);

  const results = useMemo(
    () => applyFilters(prompts, filters),
    [prompts, filters],
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

          <Button variant="brand" onClick={() => setModalOpen(true)} className="h-10 rounded-xl px-4 gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Nuevo prompt
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 gap-0 overflow-hidden">
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-border p-6 lg:block">
          <PromptFilters
            filters={filters}
            onChange={setFilters}
            totalResults={results.length}
          />
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              <Sparkles className="h-8 w-8 animate-pulse opacity-30" />
              <p className="text-sm">Cargando prompts…</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              <Sparkles className="h-10 w-10 opacity-20" />
              <p className="text-sm">No se encontraron prompts con esos filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {results.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  canDelete={canDelete}
                  canEdit={true}
                  onDelete={(id) => { removeOptimistic(id); void refresh(true); }}
                  onUpdate={() => void refresh(true)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <CreatePromptModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={refresh}
      />
    </div>
  );
}
