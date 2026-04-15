import { useState } from "react";
import { Check, Copy, ChevronDown, ChevronUp, Trash2, UserRound, Pencil, Clock } from "lucide-react";
import Swal from "sweetalert2";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { copyPromptToClipboard, deletePrompt } from "../services/prompts.service";
import { EditPromptModal } from "./EditPromptModal";
import type { Prompt } from "../logic/prompts.types";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

const CATEGORY_LABELS: Record<Prompt["category"], string> = {
  "imagen-producto": "Imagen producto",
  "banner-campaña": "Banner campaña",
  "relleno-generativo": "Relleno generativo",
  "copy-marketing": "Copy marketing",
  "social-media": "Social media",
};

const TONE_LABELS: Record<Prompt["tone"], string> = {
  formal: "Formal",
  casual: "Casual",
  urgente: "Urgente",
  aspiracional: "Aspiracional",
};

const BRAND_COLORS: Record<Prompt["brand"], string> = {
  Jumbo: "bg-green-100 text-green-800 border-green-200",
  "Santa Isabel": "bg-orange-100 text-orange-800 border-orange-200",
  Spid: "bg-violet-100 text-violet-800 border-violet-200",
};

interface Props {
  prompt: Prompt;
  canDelete?: boolean;
  canEdit?: boolean;
  onDelete?: (id: string) => void;
  onUpdate?: () => void;
}

export function PromptCard({ prompt, canDelete = false, canEdit = false, onDelete, onUpdate }: Props) {
  const [expanded,   setExpanded]   = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [editOpen,   setEditOpen]   = useState(false);
  const isCustom = prompt.id.startsWith("custom-");

  async function handleCopy() {
    const ok = await copyPromptToClipboard(prompt.content);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleDelete() {
    const result = await Swal.fire({
      title: "¿Eliminar este prompt?",
      html: `<span style="color:#64748b;font-size:14px">
               <strong style="color:#0f172a">"${prompt.title}"</strong>
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
      deletePrompt(prompt.id);

      await Swal.fire({
        title: "¡Eliminado!",
        text: "El prompt fue eliminado correctamente.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: "swal-brand-popup",
          title: "swal-brand-title",
        },
      });

      onDelete?.(prompt.id);
    }
  }

  return (
    <Card className="card-interactive group flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground">{prompt.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{prompt.description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {canEdit && isCustom && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:bg-blue-50 hover:text-[#0341a5]"
                title="Editar prompt"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-500"
                title="Eliminar prompt"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
              BRAND_COLORS[prompt.brand]
            }`}
          >
            {prompt.brand}
          </span>
          <Badge variant="outline" className="text-[11px]">
            {CATEGORY_LABELS[prompt.category]}
          </Badge>
          <Badge variant="outline" className="text-[11px]">
            {TONE_LABELS[prompt.tone]}
          </Badge>
          {prompt.model && (
            <Badge variant="secondary" className="text-[11px]">
              {prompt.model}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-0">
        {/* Prompt content */}
        <div
          className={`relative rounded-xl bg-muted/50 p-3 font-mono text-xs leading-relaxed text-muted-foreground transition-all ${
            expanded ? "" : "max-h-[80px] overflow-hidden"
          }`}
        >
          {prompt.content}
          {!expanded && (
            <div className="absolute inset-x-0 bottom-0 h-8 rounded-b-xl bg-gradient-to-t from-muted/50 to-transparent" />
          )}
        </div>

        {/* Variables */}
        {prompt.variables && prompt.variables.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {prompt.variables.map((v) => (
              <span
                key={v}
                className="rounded-md bg-amber-50 px-1.5 py-0.5 font-mono text-[11px] text-amber-700 ring-1 ring-amber-200"
              >
                {`{{${v}}}`}
              </span>
            ))}
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {prompt.tags.map((tag) => (
            <span key={tag} className="text-[11px] text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>

        {/* Creator / last update */}
        {(prompt.createdBy || prompt.updatedBy) && (
          <div className="space-y-1">
            {prompt.createdBy && (
              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted">
                  <UserRound className="h-3 w-3 text-muted-foreground/60" />
                </div>
                <span className="text-[11px] text-muted-foreground/60">
                  Creado por{" "}
                  <span className="font-medium text-muted-foreground">{prompt.createdBy}</span>
                </span>
              </div>
            )}
            {prompt.updatedBy && prompt.updatedAt && (
              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted">
                  <Clock className="h-3 w-3 text-muted-foreground/60" />
                </div>
                <span className="text-[11px] text-muted-foreground/60">
                  Editado por{" "}
                  <span className="font-medium text-muted-foreground">{prompt.updatedBy}</span>
                  {" · "}
                  <span className="text-muted-foreground/50">{formatDate(prompt.updatedAt)}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Actions row */}
        <div className="flex items-center justify-between border-t border-border pt-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Ver menos
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Ver completo
              </>
            )}
          </button>

          <Button
            size="sm"
            variant={copied ? "outline" : "default"}
            className="h-7 gap-1.5 text-xs"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-500" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copiar
              </>
            )}
          </Button>
        </div>
      </CardContent>

      <EditPromptModal
        prompt={editOpen ? prompt : null}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onUpdated={() => { setEditOpen(false); onUpdate?.(); }}
      />
    </Card>
  );
}
