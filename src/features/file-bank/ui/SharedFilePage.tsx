import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, Download, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFileBySlug } from "../services/file-bank.service";
import { formatBytes } from "../logic/slug";
import { mimeToLabel } from "../logic/mime";
import type { FileRecord } from "../logic/file-bank.types";

export default function SharedFilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [file, setFile] = useState<FileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    getFileBySlug(slug)
      .then((f) => {
        if (!f) setError("Archivo no encontrado.");
        else setFile(f);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando...
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-muted-foreground">{error ?? "Archivo no disponible."}</p>
        <Button asChild variant="outline">
          <Link to="/banco-archivos"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Link>
        </Button>
      </div>
    );
  }

  const ext = file.title.toLowerCase().split(".").pop() ?? "";
  const storedType = (file.file_type || "").toLowerCase();
  const officeExts = ["pptx", "ppt", "xlsx", "xls", "docx", "doc"];
  const isPdf = storedType === "application/pdf" || ext === "pdf";
  const isOffice =
    officeExts.includes(ext) ||
    storedType.includes("officedocument") ||
    storedType.includes("ms-powerpoint") ||
    storedType.includes("ms-excel") ||
    storedType.includes("ms-word");
  const officeViewerUrl = isOffice
    ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.file_url)}`
    : null;

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
      <div className="border-b border-border bg-card px-8 py-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-foreground">{file.title}</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground/70">{mimeToLabel(file.file_type, file.title)}</span>
            {" · "}{formatBytes(file.file_size)} · {new Date(file.created_at).toLocaleDateString("es-CL")}
            {file.uploaded_by_email ? ` · ${file.uploaded_by_email}` : ""}
          </p>
          {file.description && (
            <p className="mt-2 max-w-2xl text-sm text-foreground/80">{file.description}</p>
          )}
        </div>
        <Button asChild>
          <a href={file.file_url} download>
            <Download className="mr-2 h-4 w-4" /> Descargar
          </a>
        </Button>
      </div>

      <div className="flex flex-1 p-6">
        {isPdf && (
          <iframe
            src={file.file_url}
            title={file.title}
            className="flex-1 w-full rounded-xl border border-border bg-card"
          />
        )}
        {isOffice && (
          <iframe
            src={officeViewerUrl!}
            title={file.title}
            className="flex-1 w-full rounded-xl border border-border bg-card"
            allowFullScreen
          />
        )}
        {!isPdf && !isOffice && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border text-center text-muted-foreground">
            <FileText className="h-12 w-12" />
            <p className="text-sm">La vista previa no está disponible para este tipo de archivo.</p>
            <Button asChild>
              <a href={file.file_url} download>
                <Download className="mr-2 h-4 w-4" /> Descargar archivo
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
