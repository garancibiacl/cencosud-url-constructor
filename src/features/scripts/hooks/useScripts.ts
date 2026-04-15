import { useState, useEffect, useCallback } from "react";
import { getAllScripts } from "../services/scripts.service";
import type { IllustratorScript } from "../logic/scripts.types";

interface UseScriptsReturn {
  scripts: IllustratorScript[];
  loading: boolean;
  refresh: () => void;
}

export function useScripts(): UseScriptsReturn {
  const [scripts, setScripts] = useState<IllustratorScript[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAllScripts();
    setScripts(data);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  return { scripts, loading, refresh: load };
}
