import { SCRIPTS_CATALOG } from "../logic/scripts.data";
import type { IllustratorScript } from "../logic/scripts.types";

export function getAllScripts(): IllustratorScript[] {
  return SCRIPTS_CATALOG;
}

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
