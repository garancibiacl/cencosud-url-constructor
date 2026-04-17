import { useState } from "react";
import { Copy, Download, Eye, Trash2, FileText, Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

function typeStyle(mime: string) {
  if (mime === "application/pdf")
    return { bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-200", border: "border-l-rose-500" };
  if (mime.includes("presentationml") || mime.includes("powerpoint"))
    return { bg: "bg-orange-50", text: "text-orange-600", ring: "ring-orange-200", border: "border-l-orange-500" };
  if (mime.includes("wordprocessingml") || mime === "application/msword")
    return { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-200", border: "border-l-blue-500" };
  if (mime.includes("spreadsheetml") || mime === "application/vnd.ms-excel")
    return { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-200", border: "border-l-emerald-500" };
  if (mime.startsWith("image/"))
    return { bg: "bg-purple-50", text: "text-purple-600", ring: "ring-purple-200", border: "border-l-purple-500" };
  if (mime.startsWith("video/"))
    return { bg: "bg-pink-50", text: "text-pink-600", ring: "ring-pink-200", border: "border-l-pink-500" };
  if (mime.startsWith("audio/"))
    return { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-200", border: "border-l-amber-500" };
  return { bg: "bg-slate-50", text: "text-slate-500", ring: "ring-slate-200", border: "border-l-slate-400" };
}

function shortLabel(mime: string, filename: string): string {
  const full = mimeToLabel(mime, filename);
  // Extract just the first word / short name before parentheses
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
  const style = typeStyle(file.file_type);

  const copyLink = async () => {
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
    <div
      className={`group relative flex flex-col gap-3 rounded-2xl border border-slate-200 border-l-[3px] ${style.border} bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}
    >
      {/* Trash button — appears on hover */}
      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Eliminar archivo"
          className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Icon + meta */}
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.bg} ${style.text} ring-1 ${style.ring}`}
        >
          <FileText className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1 pr-6">
          {/* Type badge */}
          <span
            className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.bg} ${style.text}`}
          >
            {shortLabel(file.file_type, file.title)}
          </span>

          <h3 className="truncate text-sm font-semibold text-slate-800 leading-snug">
            {file.title}
          </h3>

          <p className="text-xs text-slate-400 mt-0.5">
            {formatBytes(file.file_size)} ·{" "}
            {new Date(file.created_at).toLocaleDateString("es-CL")}
          </p>

          {file.uploaded_by_email && (
            <p className="truncate text-[11px] text-slate-400 mt-0.5">
              {file.uploaded_by_email}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {file.description && (
        <p className="line-clamp-2 text-xs text-slate-500 leading-relaxed">
          {file.description}
        </p>
      )}

      {/* Actions */}
      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {/* Primary CTA — Copy link */}
        <Button
          size="sm"
          onClick={copyLink}
          className={`flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-sm transition-all duration-150 ${
            copied
              ? "from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              : "hover:from-orange-600 hover:to-orange-700"
          }`}
        >
          {copied ? (
            <>
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Copiado
            </>
          ) : (
            <>
              <Link2 className="mr-1.5 h-3.5 w-3.5" />
              Copiar link
            </>
          )}
        </Button>

        {/* Secondary CTA — Download */}
        <Button size="sm" variant="outline" asChild className="flex-1 border-slate-200 text-slate-500 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600 transition-colors duration-150">
          <a href={file.file_url} download>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Descargar
          </a>
        </Button>

        {/* Preview (PDF only) */}
        {isPdf && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPreview(file)}
            className="flex-1 border-slate-200 text-slate-500 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600 transition-colors duration-150"
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Ver
          </Button>
        )}
      </div>
    </div>
  );
}
