import { useState } from "react";
import { Copy, Download, Eye, Trash2, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { buildShareUrl } from "../services/file-bank.service";
import { formatBytes } from "../logic/slug";
import type { FileRecord } from "../logic/file-bank.types";

interface Props {
  file: FileRecord;
  onPreview: (file: FileRecord) => void;
  onDelete: (file: FileRecord) => Promise<void>;
}

export function FileCard({ file, onPreview, onDelete }: Props) {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canDelete = user?.id === file.user_id || role === "admin";
  const isPdf = file.file_type === "application/pdf";

  const copyLink = async () => {
    // Página pública de preview: muestra video/imagen/PDF y botón de descarga manual
    await navigator.clipboard.writeText(buildShareUrl(file.slug));
    setCopied(true);
    toast({
      title: "Link público copiado",
      description: "Abre una página con preview y botón de descarga. Sin login.",
    });
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar "${file.title}"?`)) return;
    try {
      setDeleting(true);
      await onDelete(file);
      toast({ title: "Archivo eliminado" });
    } catch (e) {
      toast({
        title: "Error al eliminar",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">{file.title}</h3>
          <p className="text-xs text-muted-foreground">
            {formatBytes(file.file_size)} · {new Date(file.created_at).toLocaleDateString("es-CL")}
          </p>
          {file.uploaded_by_email && (
            <p className="truncate text-[11px] text-muted-foreground/80">{file.uploaded_by_email}</p>
          )}
        </div>
      </div>

      {file.description && (
        <p className="line-clamp-2 text-xs text-muted-foreground">{file.description}</p>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={copyLink} className="flex-1">
          {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Link"}
        </Button>
        <Button size="sm" variant="outline" asChild className="flex-1">
          <a href={file.file_url} download>
            <Download className="mr-1 h-3.5 w-3.5" />
            Bajar
          </a>
        </Button>
        {isPdf && (
          <Button size="sm" variant="outline" onClick={() => onPreview(file)} className="flex-1">
            <Eye className="mr-1 h-3.5 w-3.5" />
            Ver
          </Button>
        )}
        {canDelete && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={deleting}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
