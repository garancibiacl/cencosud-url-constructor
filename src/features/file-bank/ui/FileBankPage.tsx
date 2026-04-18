import { useMemo, useState } from "react";
import { Search, Loader2, Files, HardDrive } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useFiles } from "../hooks/useFiles";
import { UploadDropzone } from "./UploadDropzone";
import { FileCard } from "./FileCard";
import { FilePreviewModal } from "./FilePreviewModal";
import { formatBytes } from "../logic/slug";
import type { FileRecord } from "../logic/file-bank.types";

export default function FileBankPage() {
  const { files, loading, error, upload, remove } = useFiles();
  const [query, setQuery] = useState("");
  const [previewing, setPreviewing] = useState<FileRecord | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return files;
    return files.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        (f.uploaded_by_email ?? "").toLowerCase().includes(q)
    );
  }, [files, query]);

  const totalSize = useMemo(
    () => files.reduce((acc, f) => acc + f.file_size, 0),
    [files]
  );

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-y-auto bg-slate-50/50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-4 py-5 sm:px-8 sm:py-7 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
              Banco de Archivos
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Sube presentaciones, PDFs y documentos. Genera un link compartible y descargable.
            </p>
          </div>

          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex items-center gap-3"
            >
              <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
                <Files className="h-3.5 w-3.5" />
                {files.length} {files.length === 1 ? "archivo" : "archivos"}
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                <HardDrive className="h-3.5 w-3.5" />
                {formatBytes(totalSize)}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="grid flex-1 gap-4 p-3 sm:gap-6 sm:p-6 lg:grid-cols-[380px_1fr]">
        {/* Sidebar with dropzone */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <UploadDropzone onUpload={upload} />
        </div>

        {/* File list */}
        <div className="flex flex-col gap-4 min-w-0">
          {/* Search bar */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por título, descripción o autor..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 pl-10 text-sm border-slate-200 bg-white shadow-sm focus-visible:ring-blue-500 focus-visible:border-blue-400 rounded-xl"
            />
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center text-slate-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="text-sm">Cargando archivos...</span>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-400 gap-2"
            >
              <Files className="h-8 w-8 text-slate-300" />
              {files.length === 0
                ? "Aún no hay archivos. Sube el primero."
                : "Sin resultados para tu búsqueda."}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
              {filtered.map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className="h-full"
                >
                  <FileCard file={f} onPreview={setPreviewing} onDelete={remove} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <FilePreviewModal file={previewing} onClose={() => setPreviewing(null)} />
    </div>
  );
}
