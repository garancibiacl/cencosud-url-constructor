import { useState, useEffect, useCallback } from "react";
import { getAllPrompts } from "../services/prompts.service";
import type { Prompt } from "../logic/prompts.types";

interface UsePromptsReturn {
  prompts:  Prompt[];
  loading:  boolean;
  refresh:  () => void;
}

export function usePrompts(): UsePromptsReturn {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAllPrompts();
    setPrompts(data);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  return { prompts, loading, refresh: load };
}
