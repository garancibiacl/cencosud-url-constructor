import { useState } from "react";
import { Check, Copy, Download, ChevronDown, ChevronUp, Pencil, Trash2, UserRound, Clock } from "lucide-react";
import Swal from "sweetalert2";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { copyScriptCode, downloadScript, deleteUploadedScript } from "../services/scripts.service";
import { EditScriptModal } from "./EditScriptModal";
import type { IllustratorScript } from "../logic/scripts.types";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

interface Props {
  script:    IllustratorScript;
  canDelete?: boolean;
  canEdit?:   boolean;
  onDelete?:  () => void;
  onUpdate?:  () => void;
}

export function ScriptCard({ script, canDelete = false, canEdit = false, onDelete, onUpdate }: Props) {
  const [codeOpen,   setCodeOpen]   = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [editOpen,   setEditOpen]   = useState(false);

  const isUploaded = script.id.startsWith("upload-");

  async function handleCopy() {
    const ok = await copyScriptCode(script.code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleDelete() {
    const result = await Swal.fire({
      title: "¿Eliminar este script?",
      html: `<span style="color:#64748b;font-size:14px">
               <strong style="color:#0f172a">"${script.title}"</strong>
               se eliminará permanentemente.<br/>Esta acción no se puede deshacer.
             </span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup:         "swal-brand-popup",
        title:         "swal-brand-title",
        confirmButton: "swal-brand-confirm",
        cancelButton:  "swal-brand-cancel",
        icon:          "swal-brand-icon",
      },
    });

    if (result.isConfirmed) {
      const ok = await deleteUploadedScript(script.id);
      if (!ok) return;

      onDelete?.();

      Swal.fire({
        title: "¡Eliminado!",
        text: "El script fue eliminado correctamente.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: "swal-brand-popup",
          title: "swal-brand-title",
        },
      });
    }
  }

  return (
    <>
    <Card className="card-interactive group flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {/* App badge */}
              <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700 ring-1 ring-orange-200">
                {script.app}
              </span>
              <span className="text-[11px] text-muted-foreground">.jsx</span>
            </div>
            <p className="mt-1.5 font-semibold text-foreground">{script.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{script.description}</p>
          </div>

          {/* Acciones hover */}
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {canEdit && isUploaded && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:bg-blue-50 hover:text-[#0341a5]"
                title="Editar script"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDelete && isUploaded && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-500"
                title="Eliminar script"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="mt-2 flex flex-wrap gap-1">
          {script.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[11px]">
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-0">

        {/* Prompt usado */}
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3">
          <button
            onClick={() => setPromptOpen(!promptOpen)}
            className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <span>Prompt usado con la IA</span>
            {promptOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {promptOpen && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {script.prompt}
            </p>
          )}
        </div>

        {/* Código JSX */}
        <div className="overflow-hidden rounded-xl border border-border bg-slate-950">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="font-mono text-[11px] text-slate-400">{script.filename}</span>
            <button
              onClick={() => setCodeOpen(!codeOpen)}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
            >
              {codeOpen ? (
                <><ChevronUp className="h-3 w-3" />Ocultar</>
              ) : (
                <><ChevronDown className="h-3 w-3" />Ver código</>
              )}
            </button>
          </div>
          {codeOpen && (
            <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre">
              {script.code}
            </pre>
          )}
        </div>

        {/* Subido por / Editado por */}
        {(script.uploadedBy || script.updatedBy) && (
          <div className="space-y-1">
            {script.uploadedBy && script.uploadedAt && (
              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted">
                  <UserRound className="h-3 w-3 text-muted-foreground/60" />
                </div>
                <span className="text-[11px] text-muted-foreground/60">
                  Subido por{" "}
                  <span className="font-medium text-muted-foreground">{script.uploadedBy}</span>
                  {" · "}
                  <span className="text-muted-foreground/50">{formatDate(script.uploadedAt)}</span>
                </span>
              </div>
            )}
            {script.updatedBy && script.updatedAt && (
              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted">
                  <Clock className="h-3 w-3 text-muted-foreground/60" />
                </div>
                <span className="text-[11px] text-muted-foreground/60">
                  Editado por{" "}
                  <span className="font-medium text-muted-foreground">{script.updatedBy}</span>
                  {" · "}
                  <span className="text-muted-foreground/50">{formatDate(script.updatedAt)}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center gap-2 border-t border-border pt-2">
          <Button
            size="sm"
            onClick={() => downloadScript(script)}
            className="h-8 flex-1 gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Descargar .jsx
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-8 gap-1.5 text-xs"
          >
            {copied ? (
              <><Check className="h-3.5 w-3.5 text-green-500" />Copiado</>
            ) : (
              <><Copy className="h-3.5 w-3.5" />Copiar código</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>

    <EditScriptModal
      script={editOpen ? script : null}
      open={editOpen}
      onClose={() => setEditOpen(false)}
      onUpdated={() => { setEditOpen(false); onUpdate?.(); }}
    />
    </>
  );
}
