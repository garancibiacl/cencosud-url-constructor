import { useCallback, useEffect, useState } from "react";
import { deleteFile, listFiles, uploadFile, type UploadOptions } from "../services/file-bank.service";
import type { FileRecord } from "../logic/file-bank.types";

// ---------------------------------------------------------------------------
// Cache a nivel módulo — persiste entre renders y reaperturas de modal.
// Se invalida ante cualquier mutación (upload / delete) o refresh forzado.
// ---------------------------------------------------------------------------

interface FilesCache {
  data: FileRecord[];
  ts: number;
}

const CACHE_TTL = 60_000;
let _cache: FilesCache | null = null;

function isCacheValid(): boolean {
  return _cache !== null && Date.now() - _cache.ts < CACHE_TTL;
}

function invalidateCache(): void {
  _cache = null;
}

// ---------------------------------------------------------------------------
// enabled: false → no dispara fetch hasta que se active (útil para modales).
// Cuando enabled cambia a true, carga respetando el TTL del cache.
// ---------------------------------------------------------------------------

export function useFiles(enabled = true) {
  // Si el cache ya tiene datos los pre-cargamos para evitar flash de contenido
  const [files, setFiles] = useState<FileRecord[]>(_cache?.data ?? []);
  // loading = true solo si vamos a buscar datos inmediatamente
  const [loading, setLoading] = useState(enabled && !isCacheValid());
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async (force: boolean) => {
    if (!force && isCacheValid()) {
      setFiles(_cache!.data);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await listFiles();
      _cache = { data, ts: Date.now() };
      setFiles(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar archivos");
    } finally {
      setLoading(false);
    }
  }, []);

  // Solo dispara cuando enabled es true; al cambiar de false → true carga datos
  useEffect(() => {
    if (!enabled) return;
    loadFiles(false);
  }, [enabled, loadFiles]);

  const refresh = useCallback(() => loadFiles(true), [loadFiles]);

  const upload = useCallback(async (opts: UploadOptions) => {
    const created = await uploadFile(opts);
    invalidateCache();
    setFiles((prev) => [created, ...prev]);
    return created;
  }, []);

  const remove = useCallback(async (file: FileRecord) => {
    await deleteFile(file);
    invalidateCache();
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
  }, []);

  return { files, loading, error, refresh, upload, remove };
}
