import { useCallback, useEffect, useState } from "react";
import { deleteFile, listFiles, uploadFile, type UploadOptions } from "../services/file-bank.service";
import type { FileRecord } from "../logic/file-bank.types";

export function useFiles() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listFiles();
      setFiles(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar archivos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upload = useCallback(
    async (opts: UploadOptions) => {
      const created = await uploadFile(opts);
      setFiles((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const remove = useCallback(async (file: FileRecord) => {
    await deleteFile(file);
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
  }, []);

  return { files, loading, error, refresh, upload, remove };
}
