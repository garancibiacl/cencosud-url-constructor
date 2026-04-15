import { PROMPTS_CATALOG } from "../logic/prompts.data";
import type { Prompt, PromptFilters } from "../logic/prompts.types";

const STORAGE_KEY        = "aguapp_custom_prompts";
const HIDDEN_KEY         = "aguapp_hidden_prompts";

// ─── Persistencia de prompts custom (localStorage) ───────────────────────────

export function getCustomPrompts(): Prompt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Prompt[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomPrompt(
  data: Omit<Prompt, "id" | "createdAt">,
): Prompt {
  const prompt: Prompt = {
    ...data,
    id: `custom-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const existing = getCustomPrompts();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, prompt]));
  return prompt;
}

// ─── Prompts ocultos (catálogo estático eliminado por admin) ─────────────────

function getHiddenIds(): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/**
 * Actualiza un prompt custom existente.
 * Solo funciona con prompts cuyo id empieza por "custom-".
 */
export function updateCustomPrompt(
  id: string,
  changes: Partial<Omit<Prompt, "id" | "createdBy" | "createdAt">>,
  updatedBy: string,
): boolean {
  if (!id.startsWith("custom-")) return false;
  const existing = getCustomPrompts();
  const idx = existing.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  existing[idx] = { ...existing[idx], ...changes, updatedBy, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return true;
}

/**
 * Elimina un prompt:
 * - Si es custom-* lo borra de localStorage.
 * - Si es del catálogo estático, lo agrega a la lista de IDs ocultos.
 */
export function deletePrompt(id: string): boolean {
  if (id.startsWith("custom-")) {
    const existing = getCustomPrompts();
    const filtered = existing.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } else {
    const hidden = getHiddenIds();
    if (!hidden.includes(id)) {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hidden, id]));
    }
  }
  return true;
}

// ─── Lectura ──────────────────────────────────────────────────────────────────

/**
 * Devuelve catálogo estático + prompts creados por el usuario.
 */
export function getAllPrompts(): Prompt[] {
  return [...PROMPTS_CATALOG, ...getCustomPrompts()];
}

/**
 * Filtra prompts aplicando búsqueda de texto + filtros de categoría/marca/tono.
 * Todos los criterios son aditivos (AND).
 */
export function filterPrompts(filters: PromptFilters): Prompt[] {
  const search    = filters.search.toLowerCase().trim();
  const hiddenIds = new Set(getHiddenIds());

  return getAllPrompts().filter((prompt) => {
    if (hiddenIds.has(prompt.id)) return false;
    if (filters.category !== "todas" && prompt.category !== filters.category) return false;
    if (filters.brand !== "todas" && prompt.brand !== filters.brand) return false;
    if (filters.tone !== "todos" && prompt.tone !== filters.tone) return false;

    if (search) {
      const haystack = [
        prompt.title,
        prompt.description,
        prompt.content,
        ...prompt.tags,
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

/**
 * Reemplaza {{variables}} en el contenido del prompt con los valores provistos.
 * Las variables sin valor se dejan tal como están.
 */
export function resolvePromptVariables(
  content: string,
  values: Record<string, string>
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return values[key] ?? match;
  });
}

/**
 * Copia el contenido de un prompt al clipboard.
 * Retorna true si fue exitoso.
 */
export async function copyPromptToClipboard(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch {
    return false;
  }
}
