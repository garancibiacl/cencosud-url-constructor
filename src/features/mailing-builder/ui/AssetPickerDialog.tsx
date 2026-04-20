import { useMemo, useState } from "react";
import { Image as ImageIcon, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFiles } from "@/features/file-bank/hooks/useFiles";
import type { FileRecord } from "@/features/file-bank/logic/file-bank.types";

interface AssetPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (file: FileRecord) => void;
}

const isImageFile = (file: FileRecord) => file.file_type.startsWith("image/");

export function AssetPickerDialog({ open, onOpenChange, onSelect }: AssetPickerDialogProps) {
  const { files, loading, error } = useFiles();
  const [query, setQuery] = useState("");

  const imageFiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return files
      .filter(isImageFile)
      .filter((file) => {
        if (!normalizedQuery) return true;
        return [file.title, file.description, file.uploaded_by_email ?? ""]
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      });
  }, [files, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Seleccionar imagen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por título, descripción o autor"
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[420px] pr-3">
            {loading ? <p className="text-sm text-muted-foreground">Cargando imágenes…</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {!loading && !error && imageFiles.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center rounded-md border border-dashed border-border bg-background text-center">
                <ImageIcon className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">No hay imágenes disponibles</p>
                <p className="text-xs text-muted-foreground">Sube imágenes en Banco de Archivos para reutilizarlas aquí.</p>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {imageFiles.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => {
                    onSelect(file);
                    onOpenChange(false);
                  }}
                  className="overflow-hidden rounded-md border border-border bg-background text-left transition hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-secondary">
                    <img src={file.file_url} alt={file.title} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="line-clamp-1 text-sm font-medium text-foreground">{file.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{file.description || "Sin descripción"}</p>
                    <div className="pt-1 text-center text-xs font-medium text-primary">Usar imagen</div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}