import { useMemo, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFiles } from "../hooks/useFiles";
import { UploadDropzone } from "./UploadDropzone";
import { FileCard } from "./FileCard";
import { FilePreviewModal } from "./FilePreviewModal";
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

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
      <div className="border-b border-border bg-card px-8 py-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Banco de Archivos</h1>
        <p className="text-sm text-muted-foreground">
          Sube presentaciones, PDFs y documentos. Genera un link compartible y descargable.
        </p>
      </div>

      <div className="grid flex-1 gap-6 p-6 lg:grid-cols-[380px_1fr]">
        <div className="lg:sticky lg:top-6 lg:self-start">
          <UploadDropzone onUpload={upload} />
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, descripción o autor..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando archivos...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              {files.length === 0 ? "Aún no hay archivos. Sube el primero." : "Sin resultados."}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((f) => (
                <FileCard key={f.id} file={f} onPreview={setPreviewing} onDelete={remove} />
              ))}
            </div>
          )}
        </div>
      </div>

      <FilePreviewModal file={previewing} onClose={() => setPreviewing(null)} />
    </div>
  );
}
