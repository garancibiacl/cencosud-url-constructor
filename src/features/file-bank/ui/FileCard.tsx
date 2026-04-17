import { useState } from "react";
import { Copy, Download, Eye, Trash2, FileText, Check, Link2, Archive, ImageIcon, Video, Music, File } from "lucide-react";
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

function getExt(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function TypeIcon({ mime, filename }: { mime: string; filename: string }) {
  const ext = getExt(filename);
  const base = "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md";

  // PowerPoint — rojo oficial #C43E1C
  if (mime.includes("presentationml") || mime.includes("powerpoint") || ext === "pptx" || ext === "ppt")
    return (
      <div className={`${base} bg-[#C43E1C]`}>
        <span className="text-[15px] font-black italic leading-none text-white">P</span>
      </div>
    );

  // Word — azul oficial #185ABD
  if (mime.includes("wordprocessingml") || mime === "application/msword" || ext === "docx" || ext === "doc")
    return (
      <div className={`${base} bg-[#185ABD]`}>
        <span className="text-[15px] font-black italic leading-none text-white">W</span>
      </div>
    );

  // Excel — verde oficial #107C41
  if (mime.includes("spreadsheetml") || mime === "application/vnd.ms-excel" || ext === "xlsx" || ext === "xls")
    return (
      <div className={`${base} bg-[#107C41]`}>
        <span className="text-[15px] font-black italic leading-none text-white">X</span>
      </div>
    );

  // PDF
  if (mime === "application/pdf" || ext === "pdf")
    return (
      <div className={`${base} bg-rose-600`}>
        <FileText className="h-5 w-5 text-white" />
      </div>
    );

  // ZIP / RAR / archivos comprimidos — amarillo estándar
  if (["zip", "rar", "7z", "gz", "tar"].includes(ext) || mime.includes("zip") || mime.includes("rar") || mime.includes("7z") || mime.includes("tar") || mime.includes("gzip"))
    return (
      <div className={`${base} bg-amber-400`}>
        <Archive className="h-5 w-5 text-white" />
      </div>
    );

  // Imagen
  if (mime.startsWith("image/"))
    return (
      <div className={`${base} bg-purple-600`}>
        <ImageIcon className="h-5 w-5 text-white" />
      </div>
    );

  // Video
  if (mime.startsWith("video/"))
    return (
      <div className={`${base} bg-pink-600`}>
        <Video className="h-5 w-5 text-white" />
      </div>
    );

  // Audio
  if (mime.startsWith("audio/"))
    return (
      <div className={`${base} bg-amber-600`}>
        <Music className="h-5 w-5 text-white" />
      </div>
    );

  return (
    <div className={`${base} bg-slate-500`}>
      <File className="h-5 w-5 text-white" />
    </div>
  );
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
  return "border-l-slate-400";
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
      className={`group relative flex flex-col gap-3 rounded-2xl border border-slate-200 border-l-[3px] ${borderColor(file.file_type, file.title)} bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}
    >
      {/* Trash — visible al hover */}
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

      {/* Icono + meta */}
      <div className="flex items-start gap-3">
        <TypeIcon mime={file.file_type} filename={file.title} />

        <div className="min-w-0 flex-1 pr-6">
          <span className="mb-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {shortLabel(file.file_type, file.title)}
          </span>

          <h3 className="truncate text-sm font-semibold leading-snug text-slate-800">
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

      {/* Descripción */}
      {file.description && (
        <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{file.description}</p>
      )}

      {/* Acciones */}
      <div className="mt-auto flex flex-col gap-2 pt-1">
        {/* Fila superior: Descargar + Ver (si aplica) */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            asChild
            className="flex-1 border-slate-200 text-slate-500 transition-colors duration-150 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600"
          >
            <a href={file.file_url} download>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Descargar
            </a>
          </Button>

          {isPdf && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPreview(file)}
              className="flex-1 border-slate-200 text-slate-500 transition-colors duration-150 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600"
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Ver
            </Button>
          )}

          {/* Copiar link en la misma fila solo cuando no hay botón Ver */}
          {!isPdf && (
            <Button
              size="sm"
              onClick={copyLink}
              className={`shrink-0 transition-all duration-150 ${
                copied
                  ? "border-0 bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
                  : "border-0 bg-[linear-gradient(135deg,#0341a5_0%,#0568d6_100%)] text-white shadow-[0_4px_16px_rgba(3,65,165,0.35)] hover:brightness-110 hover:shadow-[0_6px_20px_rgba(3,65,165,0.55)]"
              }`}
            >
              {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Link2 className="mr-1.5 h-3.5 w-3.5" />}
              {copied ? "Copiado" : "Copiar link"}
            </Button>
          )}
        </div>

        {/* Copiar link en fila propia cuando hay 3 botones (PDF) */}
        {isPdf && (
          <Button
            size="sm"
            onClick={copyLink}
            className={`w-full transition-all duration-150 ${
              copied
                ? "border-0 bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
                : "border-0 bg-[linear-gradient(135deg,#0341a5_0%,#0568d6_100%)] text-white shadow-[0_4px_16px_rgba(3,65,165,0.35)] hover:brightness-110 hover:shadow-[0_6px_20px_rgba(3,65,165,0.55)]"
            }`}
          >
            {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Link2 className="mr-1.5 h-3.5 w-3.5" />}
            {copied ? "Copiado" : "Copiar link"}
          </Button>
        )}
      </div>
    </div>
  );
}
