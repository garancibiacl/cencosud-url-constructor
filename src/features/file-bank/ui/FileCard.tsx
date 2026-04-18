import { useState } from "react";
import { Download, Eye, Trash2, FileText, Check, Link2, Archive, ImageIcon, Video, Music, File } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { buildShareUrl } from "../services/file-bank.service";
import { formatBytes } from "../logic/slug";
import { mimeToLabel } from "../logic/mime";
import type { FileRecord } from "../logic/file-bank.types";

interface Props {
  file: FileRecord;
  onPreview: (file: FileRecord) => void;
  onDelete: (file: FileRecord) => Promise<void>;
}

function getExt(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function TypeIcon({ mime, filename }: { mime: string; filename: string }) {
  const ext = getExt(filename);
  const base = "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm";

  if (mime.includes("presentationml") || mime.includes("powerpoint") || ext === "pptx" || ext === "ppt")
    return <div className={`${base} bg-[#C43E1C]`}><span className="text-[14px] font-black italic text-white">P</span></div>;

  if (mime.includes("wordprocessingml") || mime === "application/msword" || ext === "docx" || ext === "doc")
    return <div className={`${base} bg-[#185ABD]`}><span className="text-[14px] font-black italic text-white">W</span></div>;

  if (mime.includes("spreadsheetml") || mime === "application/vnd.ms-excel" || ext === "xlsx" || ext === "xls")
    return <div className={`${base} bg-[#107C41]`}><span className="text-[14px] font-black italic text-white">X</span></div>;

  if (mime === "application/pdf" || ext === "pdf")
    return <div className={`${base} bg-rose-600`}><FileText className="h-5 w-5 text-white" /></div>;

  if (["zip", "rar", "7z", "gz", "tar"].includes(ext) || mime.includes("zip") || mime.includes("rar") || mime.includes("gzip"))
    return <div className={`${base} bg-amber-400`}><Archive className="h-5 w-5 text-white" /></div>;

  if (mime.startsWith("image/"))
    return <div className={`${base} bg-purple-600`}><ImageIcon className="h-5 w-5 text-white" /></div>;

  if (mime.startsWith("video/"))
    return <div className={`${base} bg-pink-600`}><Video className="h-5 w-5 text-white" /></div>;

  if (mime.startsWith("audio/"))
    return <div className={`${base} bg-amber-600`}><Music className="h-5 w-5 text-white" /></div>;

  return <div className={`${base} bg-slate-500`}><File className="h-5 w-5 text-white" /></div>;
}

function borderColor(mime: string, filename: string) {
  const ext = getExt(filename);
  if (mime.includes("presentationml") || mime.includes("powerpoint") || ext === "pptx" || ext === "ppt") return "border-l-[#C43E1C]";
  if (mime.includes("wordprocessingml") || mime === "application/msword" || ext === "docx" || ext === "doc") return "border-l-[#185ABD]";
  if (mime.includes("spreadsheetml") || mime === "application/vnd.ms-excel" || ext === "xlsx" || ext === "xls") return "border-l-[#107C41]";
  if (mime === "application/pdf" || ext === "pdf") return "border-l-rose-600";
  if (["zip", "rar", "7z", "gz", "tar"].includes(ext)) return "border-l-amber-400";
  if (mime.startsWith("image/")) return "border-l-purple-600";
  if (mime.startsWith("video/")) return "border-l-pink-600";
  if (mime.startsWith("audio/")) return "border-l-amber-600";
  return "border-l-slate-300";
}

function shortLabel(mime: string, filename: string): string {
  const full = mimeToLabel(mime, filename);
  const match = full.match(/^([A-Za-z]+)/);
  return match ? match[1] : full;
}

export function FileCard({ file, onPreview, onDelete }: Props) {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canDelete = user?.id === file.user_id || role === "admin";
  const isPdf = file.file_type === "application/pdf";

  const copyLink = async () => {
    await navigator.clipboard.writeText(buildShareUrl(file.slug));
    setCopied(true);
    toast({ title: "Link público copiado", description: "Sin login requerido." });
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar "${file.title}"?`)) return;
    try {
      setDeleting(true);
      await onDelete(file);
      toast({ title: "Archivo eliminado" });
    } catch (e) {
      toast({ title: "Error al eliminar", description: e instanceof Error ? e.message : "Error", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <TooltipProvider delayDuration={400}>
      <div
        className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 border-l-4 ${borderColor(file.file_type, file.title)} bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
      >
        {/* Eliminar — visible en hover */}
        {canDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleDelete}
                disabled={deleting}
                aria-label="Eliminar archivo"
                className="absolute right-2.5 top-2.5 z-10 rounded-lg p-1.5 text-slate-300 opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">Eliminar</TooltipContent>
          </Tooltip>
        )}

        {/* Contenido */}
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-start gap-3">
            <TypeIcon mime={file.file_type} filename={file.title} />
            <div className="min-w-0 flex-1 pr-5">
              <span className="mb-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {shortLabel(file.file_type, file.title)}
              </span>
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800">
                {file.title}
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">
                {formatBytes(file.file_size)} · {new Date(file.created_at).toLocaleDateString("es-CL")}
              </p>
              {file.uploaded_by_email && (
                <p className="mt-0.5 truncate text-[11px] text-slate-400">{file.uploaded_by_email}</p>
              )}
            </div>
          </div>

          {file.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{file.description}</p>
          )}
        </div>

        {/* Barra de acciones — footer fijo */}
        <div className="flex border-t border-slate-100">

          {/* Descargar */}
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={file.file_url}
                download
                aria-label="Descargar"
                className="flex flex-1 items-center justify-center py-3.5 text-slate-400 transition-colors duration-150 hover:bg-orange-50 hover:text-orange-500"
              >
                <Download className="h-4 w-4" />
              </a>
            </TooltipTrigger>
            <TooltipContent>Descargar</TooltipContent>
          </Tooltip>

          <div className="w-px bg-slate-100" />

          {/* Copiar link */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={copyLink}
                aria-label="Copiar link público"
                className={`flex flex-1 items-center justify-center py-3.5 transition-colors duration-150 ${
                  copied
                    ? "bg-emerald-50 text-emerald-500"
                    : "text-slate-400 hover:bg-blue-50 hover:text-blue-500"
                }`}
              >
                {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{copied ? "¡Copiado!" : "Copiar link"}</TooltipContent>
          </Tooltip>

          {/* Ver preview — solo PDF */}
          {isPdf && (
            <>
              <div className="w-px bg-slate-100" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onPreview(file)}
                    aria-label="Ver preview"
                    className="flex flex-1 items-center justify-center py-3.5 text-slate-400 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-700"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Ver</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
