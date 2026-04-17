import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Download, FileText, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getFileBySlug } from "../services/file-bank.service";
import { formatBytes } from "../logic/slug";
import type { FileRecord } from "../logic/file-bank.types";

/**
 * Public preview page — accessible without login.
 * Shows inline preview by file type and provides a manual download button.
 */
export default function PublicFilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [file, setFile] = useState<FileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    document.title = "Archivo · Aguapp";
    getFileBySlug(slug)
      .then((f) => {
        if (!f) setError("Archivo no encontrado o ya no disponible.");
        else {
          setFile(f);
          document.title = `${f.title} · Aguapp`;
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [slug]);

  const copyLink = async () => {
    if (typeof window === "undefined") return;
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast({ title: "Link copiado" });
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando...
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{error ?? "Archivo no disponible."}</p>
        <a href="https://aguapp.vercel.app" className="text-sm text-primary hover:underline">
          Ir a Aguapp
        </a>
      </div>
    );
  }

  const t = file.file_type || "";
  const isPdf = t === "application/pdf";
  const isImage = t.startsWith("image/");
  const isVideo = t.startsWith("video/");
  const isAudio = t.startsWith("audio/");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a
            href="https://aguapp.vercel.app"
            className="flex items-center gap-2 text-sm font-bold text-primary"
          >
            <span className="text-lg">💧</span>
            <span>Aguapp</span>
          </a>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Automatiza · Optimiza · Acelera
          </span>
        </div>
      </header>

      {/* Title bar */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-foreground sm:text-2xl">
              {file.title}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {formatBytes(file.file_size)} ·{" "}
              {new Date(file.created_at).toLocaleDateString("es-CL")}
              {file.uploaded_by_email ? ` · ${file.uploaded_by_email}` : ""}
            </p>
            {file.description && (
              <p className="mt-2 max-w-2xl text-sm text-foreground/80">{file.description}</p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={copyLink}>
              {copied ? (
                <Check className="mr-1.5 h-4 w-4" />
              ) : (
                <Copy className="mr-1.5 h-4 w-4" />
              )}
              {copied ? "Copiado" : "Copiar link"}
            </Button>
            <Button asChild size="sm">
              <a href={file.file_url} download={file.title}>
                <Download className="mr-1.5 h-4 w-4" /> Descargar
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Preview area */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col p-4 sm:p-6">
        <div className="flex flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {isPdf && (
            <iframe
              src={file.file_url}
              title={file.title}
              className="h-full min-h-[70vh] w-full"
            />
          )}
          {isImage && (
            <div className="flex w-full items-center justify-center p-4">
              <img
                src={file.file_url}
                alt={file.title}
                className="max-h-[80vh] max-w-full rounded-lg object-contain"
                loading="lazy"
              />
            </div>
          )}
          {isVideo && (
            <div className="flex w-full items-center justify-center bg-black p-2 sm:p-4">
              <video
                src={file.file_url}
                controls
                preload="metadata"
                className="max-h-[80vh] w-full rounded-lg"
              >
                Tu navegador no soporta video HTML5.
              </video>
            </div>
          )}
          {isAudio && (
            <div className="flex w-full items-center justify-center p-8">
              <audio src={file.file_url} controls preload="metadata" className="w-full max-w-xl">
                Tu navegador no soporta audio HTML5.
              </audio>
            </div>
          )}
          {!isPdf && !isImage && !isVideo && !isAudio && (
            <div className="flex w-full flex-col items-center justify-center gap-4 p-12 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">{file.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t || "Archivo"} · {formatBytes(file.file_size)}
                </p>
                <p className="mt-3 max-w-md text-sm text-muted-foreground">
                  La vista previa no está disponible para este tipo de archivo. Descárgalo para
                  abrirlo en tu equipo.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild>
                  <a href={file.file_url} download={file.title}>
                    <Download className="mr-2 h-4 w-4" /> Descargar archivo
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> Abrir directo
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-3 text-center text-xs text-muted-foreground sm:px-6">
        Compartido con Aguapp · Banco de Archivos
      </footer>
    </div>
  );
}
