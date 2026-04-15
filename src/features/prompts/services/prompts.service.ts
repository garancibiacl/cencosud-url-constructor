import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { PROMPTS_CATALOG } from "../logic/prompts.data";
import type { Prompt, PromptFilters } from "../logic/prompts.types";

// ─── Row type from generated Supabase types ───────────────────────────────────

type PromptRow = Tables<"prompts">;

function rowToPrompt(row: PromptRow): Prompt {
  return {
    id:          row.id,
    title:       row.title,
    description: row.description,
    category:    row.category as Prompt["category"],
    brand:       row.brand    as Prompt["brand"],
    tone:        row.tone     as Prompt["tone"],
    tags:        row.tags,
    content:     row.content,
    variables:   row.variables ?? undefined,
    model:       row.model    ?? undefined,
    createdBy:   row.created_by   ?? undefined,
    createdAt:   row.created_at,
    updatedBy:   row.updated_by   ?? undefined,
    updatedAt:   row.updated_at   ?? undefined,
  };
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getCustomPrompts(): Promise<Prompt[]> {
  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) { console.error("getCustomPrompts:", error); return []; }
  return (data as PromptRow[]).map(rowToPrompt);
}

export async function getHiddenCatalogIds(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("hidden_catalog_prompts")
    .select("catalog_id");

  if (error) { console.error("getHiddenCatalogIds:", error); return new Set(); }
  return new Set((data ?? []).map((r: { catalog_id: string }) => r.catalog_id));
}

/**
 * Returns static catalog (minus hidden) + all custom prompts from Supabase.
 */
export async function getAllPrompts(): Promise<Prompt[]> {
  const [custom, hiddenIds] = await Promise.all([
    getCustomPrompts(),
    getHiddenCatalogIds(),
  ]);

  const catalog = PROMPTS_CATALOG.filter((p) => !hiddenIds.has(p.id));
  return [...catalog, ...custom];
}

/**
 * Filters an already-fetched list of prompts. Synchronous — no DB call.
 */
export function applyFilters(prompts: Prompt[], filters: PromptFilters): Prompt[] {
  const search = filters.search.toLowerCase().trim();

  return prompts.filter((p) => {
    if (filters.category !== "todas" && p.category !== filters.category) return false;
    if (filters.brand    !== "todas" && p.brand    !== filters.brand)    return false;
    if (filters.tone     !== "todos" && p.tone     !== filters.tone)     return false;

    if (search) {
      const hay = [p.title, p.description, p.content, ...p.tags].join(" ").toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function saveCustomPrompt(
  data: Omit<Prompt, "id" | "createdAt" | "updatedBy" | "updatedAt">,
  userId: string,
): Promise<Prompt | null> {
  const id = `custom-${Date.now()}`;

  const { data: row, error } = await supabase
    .from("prompts")
    .insert({
      id,
      title:         data.title,
      description:   data.description ?? "",
      category:      data.category,
      brand:         data.brand,
      tone:          data.tone,
      tags:          data.tags,
      content:       data.content,
      variables:     data.variables ?? null,
      model:         data.model     ?? null,
      created_by:    data.createdBy ?? null,
      created_by_id: userId,
    })
    .select()
    .single();

  if (error) { console.error("saveCustomPrompt:", error); return null; }
  return rowToPrompt(row as PromptRow);
}

export async function updateCustomPrompt(
  id: string,
  changes: Partial<Omit<Prompt, "id" | "createdBy" | "createdAt">>,
  updatedBy: string,
  userId: string,
): Promise<boolean> {
  if (!id.startsWith("custom-")) return false;

  const { error } = await supabase
    .from("prompts")
    .update({
      ...(changes.title       !== undefined && { title:       changes.title }),
      ...(changes.description !== undefined && { description: changes.description }),
      ...(changes.category    !== undefined && { category:    changes.category }),
      ...(changes.brand       !== undefined && { brand:       changes.brand }),
      ...(changes.tone        !== undefined && { tone:        changes.tone }),
      ...(changes.content     !== undefined && { content:     changes.content }),
      ...(changes.model       !== undefined && { model:       changes.model ?? null }),
      ...(changes.variables   !== undefined && { variables:   changes.variables ?? null }),
      ...(changes.tags        !== undefined && { tags:        changes.tags }),
      updated_by:    updatedBy,
      updated_by_id: userId,
      updated_at:    new Date().toISOString(),
    })
    .eq("id", id);

  if (error) { console.error("updateCustomPrompt:", error); return false; }
  return true;
}

export async function deletePrompt(id: string, userId: string): Promise<boolean> {
  if (id.startsWith("custom-")) {
    const { error } = await supabase.from("prompts").delete().eq("id", id);
    if (error) { console.error("deletePrompt:", error); return false; }
  } else {
    const { error } = await supabase
      .from("hidden_catalog_prompts")
      .upsert({ catalog_id: id, hidden_by: userId });
    if (error) { console.error("hidePrompt:", error); return false; }
  }
  return true;
}

// ─── Clipboard (unchanged) ───────────────────────────────────────────────────

export async function copyPromptToClipboard(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch {
    return false;
  }
}

export function resolvePromptVariables(
  content: string,
  values: Record<string, string>,
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key: string) => values[key] ?? match);
}
