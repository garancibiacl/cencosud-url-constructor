import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { SCRIPTS_CATALOG } from "../logic/scripts.data";
import type { IllustratorScript } from "../logic/scripts.types";

// ─── Row type ─────────────────────────────────────────────────────────────────

type ScriptRow = Tables<"scripts">;

function rowToScript(row: ScriptRow): IllustratorScript {
  return {
    id:           row.id,
    title:        row.title,
    description:  row.description,
    app:          row.app as IllustratorScript["app"],
    tags:         row.tags,
    prompt:       row.prompt,
    code:         row.code,
    filename:     row.filename,
    uploadedBy:   row.uploaded_by   ?? undefined,
    uploadedAt:   row.uploaded_at,
    updatedBy:    row.updated_by    ?? undefined,
    updatedAt:    row.updated_at    ?? undefined,
  };
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Scripts estáticos del catálogo (bundled en el código). */
export function getCatalogScripts(): IllustratorScript[] {
  return SCRIPTS_CATALOG;
}

/** Scripts subidos por usuarios guardados en Supabase. */
export async function getUploadedScripts(): Promise<IllustratorScript[]> {
  const { data, error } = await supabase
    .from("scripts")
    .select("*")
    .order("uploaded_at", { ascending: false });

  if (error) { console.error("getUploadedScripts:", error); return []; }
  return (data as ScriptRow[]).map(rowToScript);
}

/** Catálogo estático + scripts subidos por el equipo. */
export async function getAllScripts(): Promise<IllustratorScript[]> {
  const [catalog, uploaded] = await Promise.all([
    Promise.resolve(getCatalogScripts()),
    getUploadedScripts(),
  ]);
  return [...catalog, ...uploaded];
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function saveUploadedScript(
  data: Omit<IllustratorScript, "uploadedAt" | "updatedBy" | "updatedAt">,
  userId: string,
): Promise<IllustratorScript | null> {
  const id = `upload-${Date.now()}`;

  const { data: row, error } = await supabase
    .from("scripts")
    .insert({
      id,
      title:          data.title,
      description:    data.description ?? "",
      app:            data.app,
      tags:           data.tags,
      prompt:         data.prompt ?? "",
      code:           data.code,
      filename:       data.filename,
      uploaded_by:    data.uploadedBy ?? null,
      uploaded_by_id: userId,
    })
    .select()
    .single();

  if (error) { console.error("saveUploadedScript:", error); return null; }
  return rowToScript(row as ScriptRow);
}

export async function updateUploadedScript(
  id: string,
  changes: Pick<IllustratorScript, "title" | "description" | "app" | "tags" | "prompt">,
  updatedBy: string,
  userId: string,
): Promise<boolean> {
  if (!id.startsWith("upload-")) return false;

  const { error } = await supabase
    .from("scripts")
    .update({
      title:         changes.title,
      description:   changes.description,
      app:           changes.app,
      tags:          changes.tags,
      prompt:        changes.prompt,
      updated_by:    updatedBy,
      updated_by_id: userId,
      updated_at:    new Date().toISOString(),
    })
    .eq("id", id);

  if (error) { console.error("updateUploadedScript:", error); return false; }
  return true;
}

export async function deleteUploadedScript(id: string): Promise<boolean> {
  if (!id.startsWith("upload-")) return false;

  const { error } = await supabase.from("scripts").delete().eq("id", id);
  if (error) { console.error("deleteUploadedScript:", error); return false; }
  return true;
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

/** Descarga el código como archivo .jsx ejecutable en Illustrator */
export function downloadScript(script: IllustratorScript): void {
  const blob = new Blob([script.code], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = script.filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Copia el código al clipboard */
export async function copyScriptCode(code: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(code);
    return true;
  } catch {
    return false;
  }
}
