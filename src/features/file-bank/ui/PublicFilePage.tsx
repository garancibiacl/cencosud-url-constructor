import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Loader2,
  Download,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  HardDrive,
  User,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getFileBySlug } from "../services/file-bank.service";
import { formatBytes } from "../logic/slug";
import { mimeToLabel } from "../logic/mime";
import type { FileRecord } from "../logic/file-bank.types";

/**
 * Public preview page — accessible without login.
 * Branded with Aguapp corporate blue, sidebar logo, and modernized UX.
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

  // Brand background — same deep blue as the sidebar
  const brandBg =
    "bg-[radial-gradient(ellipse_at_top,_#0a4fb8_0%,_#0341a5_45%,_#01307a_100%)]";

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${brandBg} text-white/90`}>
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando archivo…
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center gap-4 ${brandBg} p-8 text-center`}>
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
          <FileText className="h-10 w-10 text-white/80" />
        </div>
        <p className="max-w-sm text-base font-medium text-white/90">
          {error ?? "Archivo no disponible."}
        </p>
        <a
          href="https://aguapp.vercel.app"
          className="rounded-full bg-white/15 px-5 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
        >
          Ir a Aguapp
        </a>
      </div>
    );
  }

  // Detect type from stored MIME, but fall back to extension when MIME is
  // generic/wrong (e.g. legacy uploads where iOS reported "application/zip" for .mp4).
  const ext = file.title.toLowerCase().split(".").pop() ?? "";
  const storedType = (file.file_type || "").toLowerCase();
  const isGenericStored =
    !storedType ||
    storedType === "application/octet-stream" ||
    storedType === "application/zip" ||
    storedType === "application/x-zip-compressed";

  const videoExts = ["mp4", "m4v", "mov", "webm", "mkv", "avi"];
  const audioExts = ["mp3", "wav", "ogg", "m4a", "aac"];
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"];

  const isPdf = storedType === "application/pdf" || ext === "pdf";
  const isImage = storedType.startsWith("image/") || (isGenericStored && imageExts.includes(ext));
  const isVideo = storedType.startsWith("video/") || (isGenericStored && videoExts.includes(ext));
  const isAudio = storedType.startsWith("audio/") || (isGenericStored && audioExts.includes(ext));
  const displayType = isVideo
    ? `Video (.${ext || "mp4"})`
    : isAudio
      ? `Audio (.${ext || "mp3"})`
      : isImage
        ? `Imagen (.${ext || "jpg"})`
        : mimeToLabel(storedType, file.title);

  return (
    <div className={`flex min-h-screen flex-col ${brandBg}`}>
      {/* Brand header */}
      <header className="border-b border-white/10 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a
            href="https://aguapp.vercel.app"
            className="flex items-center gap-2 transition hover:opacity-90"
            aria-label="Aguapp"
          >
            <img src="/logo.png" alt="Aguapp" className="h-10 w-auto" />
          </a>
          <div className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/85 backdrop-blur-sm sm:flex">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Automatiza · Optimiza · Acelera</span>
          </div>
        </div>
      </header>

      {/* Hero / file title card */}
      <section className="px-4 pb-2 pt-6 sm:px-6 sm:pt-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mx-auto flex w-full max-w-6xl flex-col gap-5 rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur-md sm:flex-row sm:items-start sm:justify-between sm:p-7"
        >
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/30 to-white/5 ring-1 ring-white/30">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full bg-cyan-400/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-100 ring-1 ring-cyan-300/40">
                {displayType}
              </span>
              <h1 className="mt-2 break-words text-xl font-bold leading-tight text-white sm:text-2xl">
                {file.title}
              </h1>
              {file.description && (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">
                  {file.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5" />
                  {formatBytes(file.file_size)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(file.created_at).toLocaleDateString("es-CL", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                {file.uploaded_by_email && (
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {file.uploaded_by_email}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              onClick={copyLink}
              className="border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
            >
              {copied ? (
                <Check className="mr-1.5 h-4 w-4" />
              ) : (
                <Copy className="mr-1.5 h-4 w-4" />
              )}
              {copied ? "Copiado" : "Copiar link"}
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-cyan-400 text-[#01307a] shadow-lg shadow-cyan-500/30 hover:bg-cyan-300"
            >
              <a href={file.file_url} download={file.title}>
                <Download className="mr-1.5 h-4 w-4" /> Descargar
              </a>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Preview area */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="flex flex-1 overflow-hidden rounded-3xl border border-white/15 bg-white/95 shadow-2xl shadow-black/30"
        >
          {isPdf && (
            <iframe
              src={file.file_url}
              title={file.title}
              className="h-full min-h-[70vh] w-full"
            />
          )}
          {isImage && (
            <div className="flex w-full items-center justify-center bg-slate-50 p-4 sm:p-6">
              <img
                src={file.file_url}
                alt={file.title}
                className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-md"
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
                className="max-h-[80vh] w-full rounded-xl"
              >
                Tu navegador no soporta video HTML5.
              </video>
            </div>
          )}
          {isAudio && (
            <div className="flex w-full items-center justify-center bg-slate-50 p-10">
              <audio src={file.file_url} controls preload="metadata" className="w-full max-w-xl">
                Tu navegador no soporta audio HTML5.
              </audio>
            </div>
          )}
          {!isPdf && !isImage && !isVideo && !isAudio && (
            <div className="flex w-full flex-col sm:flex-row min-h-[70vh]">
              {/* Panel izquierdo — branding */}
              <div className="flex flex-col justify-between gap-8 bg-[radial-gradient(ellipse_at_bottom_left,_#0a4fb8_0%,_#0341a5_50%,_#01307a_100%)] p-10 sm:w-[45%] sm:p-14">
                <img src="/logo.png" alt="Aguapp" className="h-9 w-auto self-start opacity-90" />

                <div className="flex flex-col gap-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">
                    Aguapp · Banco de Archivos
                  </p>
                  <h2 className="text-4xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl">
                    Somos<br />
                    <span className="text-cyan-300">100% Agua.</span>
                  </h2>
                  <p className="max-w-xs text-base font-medium leading-relaxed text-white/75">
                    Una central de originales<br className="hidden sm:block" /> partner 360°.
                  </p>
                  <div className="h-px w-12 bg-cyan-400/50" />
                  <p className="max-w-xs text-sm leading-relaxed text-white/55">
                    Compartimos archivos de forma segura, directa y sin fricciones para los distintos equipos de Agua.
                  </p>
                </div>

                <p className="text-xs text-white/35">aguapp.vercel.app</p>
              </div>

              {/* Panel derecho — descarga */}
              <div className="flex flex-1 flex-col items-center justify-center gap-7 bg-white p-10 text-center sm:p-14">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0341a5]/10 to-[#01307a]/20 ring-1 ring-[#0341a5]/15">
                  <FileText className="h-10 w-10 text-[#0341a5]" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    {displayType}
                  </p>
                  <p className="text-xl font-bold leading-snug text-slate-900">{file.title}</p>
                  <p className="text-sm text-slate-500">{formatBytes(file.file_size)}</p>
                </div>

                <div className="flex w-full max-w-xs flex-col gap-3">
                  <Button asChild size="lg" className="w-full bg-[#0341a5] text-white shadow-md shadow-[#0341a5]/30 hover:bg-[#01307a]">
                    <a href={file.file_url} download={file.title}>
                      <Download className="mr-2 h-4 w-4" /> Descargar archivo
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50">
                    <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" /> Abrir en el navegador
                    </a>
                  </Button>
                </div>

                <p className="max-w-xs text-xs leading-relaxed text-slate-400">
                  La vista previa no está disponible para este formato. Descarga el archivo para abrirlo con la aplicación correspondiente.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/70 sm:px-6">
        <a href="https://aguapp.vercel.app" className="font-semibold text-white hover:underline">
          Aguapp
        </a>{" "}
        · Banco de Archivos · Compartido de forma segura
      </footer>
    </div>
  );
}
