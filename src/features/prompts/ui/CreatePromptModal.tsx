import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Swal from "sweetalert2";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveCustomPrompt } from "../services/prompts.service";
import type { PromptCategory, PromptBrand, PromptTone } from "../logic/prompts.types";

// ─── Opciones ─────────────────────────────────────────────────────────────────

const CATEGORIES: { value: PromptCategory; label: string }[] = [
  { value: "imagen-producto", label: "Imagen producto" },
  { value: "banner-campaña", label: "Banner campaña" },
  { value: "relleno-generativo", label: "Relleno generativo" },
  { value: "copy-marketing", label: "Copy marketing" },
  { value: "social-media", label: "Social media" },
];

const BRANDS: { value: PromptBrand; label: string }[] = [
  { value: "Jumbo", label: "Jumbo" },
  { value: "Santa Isabel", label: "Santa Isabel" },
  { value: "Spid", label: "Spid" },
];

const TONES: { value: PromptTone; label: string }[] = [
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "urgente", label: "Urgente" },
  { value: "aspiracional", label: "Aspiracional" },
];

// ─── Estado inicial del form ──────────────────────────────────────────────────

interface FormState {
  title: string;
  description: string;
  category: PromptCategory | "";
  brand: PromptBrand | "";
  tone: PromptTone | "";
  content: string;
  model: string;
}

const EMPTY: FormState = {
  title: "",
  description: "",
  category: "",
  brand: "",
  tone: "",
  content: "",
  model: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Detecta {{variables}} en el texto del prompt */
function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(2, -2)))];
}

// ─── Componente ───────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreatePromptModal({ open, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const creatorName = (() => {
    const meta = user?.user_metadata ?? {};
    const first = (meta.first_name as string | undefined) ?? "";
    const last  = (meta.last_name  as string | undefined) ?? "";
    return first || last ? `${first} ${last}`.trim() : (user?.email ?? "Desconocido");
  })();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.title.trim()) next.title = "Requerido";
    if (!form.category) next.category = "Requerido";
    if (!form.brand) next.brand = "Requerido";
    if (!form.tone) next.tone = "Requerido";
    if (!form.content.trim()) next.content = "Requerido";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const variables = extractVariables(form.content);

    saveCustomPrompt({
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category as PromptCategory,
      brand: form.brand as PromptBrand,
      tone: form.tone as PromptTone,
      content: form.content.trim(),
      tags: [],
      model: form.model.trim() || undefined,
      variables: variables.length > 0 ? variables : undefined,
      createdBy: creatorName,
    });

    setForm(EMPTY);
    setErrors({});
    onCreated();
    onClose();

    Swal.fire({
      title: "¡Prompt creado!",
      html: `<span style="color:#64748b;font-size:14px">
               <strong style="color:#0f172a">"${form.title.trim()}"</strong>
               fue agregado a tu biblioteca.
             </span>`,
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
      customClass: {
        popup: "swal-brand-popup",
        title: "swal-brand-title",
        icon:  "swal-brand-icon",
      },
    });
  }

  function handleClose() {
    setForm(EMPTY);
    setErrors({});
    onClose();
  }

  const detectedVars = extractVariables(form.content);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Nuevo prompt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Título */}
          <Field label="Título" error={errors.title} required>
            <Input
              placeholder="Ej: Banner oferta Jumbo"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>

          {/* Descripción */}
          <Field label="Descripción">
            <Input
              placeholder="Para qué sirve este prompt"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>

          {/* Categoría / Marca / Tono — fila */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Categoría" error={errors.category} required>
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v as PromptCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Marca" error={errors.brand} required>
              <Select
                value={form.brand}
                onValueChange={(v) => set("brand", v as PromptBrand)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {BRANDS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Tono" error={errors.tone} required>
              <Select
                value={form.tone}
                onValueChange={(v) => set("tone", v as PromptTone)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Modelo (opcional) */}
          <Field label="Modelo recomendado">
            <Input
              placeholder="Ej: DALL-E 3, GPT-4o..."
              value={form.model}
              onChange={(e) => set("model", e.target.value)}
            />
          </Field>

          {/* Contenido */}
          <Field label="Contenido del prompt" error={errors.content} required>
            <Textarea
              placeholder="Escribe el prompt. Usa {{nombre_variable}} para marcar partes editables."
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              rows={5}
              className="resize-none font-mono text-sm"
            />
          </Field>

          {/* Variables detectadas */}
          {detectedVars.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground">Variables detectadas:</span>
              {detectedVars.map((v) => (
                <span
                  key={v}
                  className="rounded-md bg-amber-50 px-1.5 py-0.5 font-mono text-[11px] text-amber-700 ring-1 ring-amber-200"
                >
                  {`{{${v}}}`}
                </span>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Crear prompt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
