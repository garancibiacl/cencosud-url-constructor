import { useState, useEffect, useCallback } from "react";
import { getAllPrompts } from "../services/prompts.service";
import type { Prompt } from "../logic/prompts.types";

interface UsePromptsReturn {
  prompts:          Prompt[];
  loading:          boolean;
  /** Recarga completa desde Supabase. silent=true no muestra spinner. */
  refresh:          (silent?: boolean) => void;
  /** Quita un prompt de la lista local al instante (sin esperar al servidor). */
  removeOptimistic: (id: string) => void;
}

export function usePrompts(): UsePromptsReturn {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const data = await getAllPrompts();
    setPrompts(data);
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const removeOptimistic = useCallback((id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { prompts, loading, refresh: load, removeOptimistic };
}
