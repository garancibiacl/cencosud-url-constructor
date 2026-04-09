import { PROMPTS_CATALOG } from "../logic/prompts.data";
import type { Prompt, PromptFilters } from "../logic/prompts.types";

/**
 * Devuelve todos los prompts del catálogo.
 */
export function getAllPrompts(): Prompt[] {
  return PROMPTS_CATALOG;
}

/**
 * Filtra prompts aplicando búsqueda de texto + filtros de categoría/marca/tono.
 * Todos los criterios son aditivos (AND).
 */
export function filterPrompts(filters: PromptFilters): Prompt[] {
  const search = filters.search.toLowerCase().trim();

  return PROMPTS_CATALOG.filter((prompt) => {
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
