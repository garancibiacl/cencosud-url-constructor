import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { updateUploadedScript } from "../services/scripts.service";
import type { IllustratorScript, ScriptApp } from "../logic/scripts.types";

// ─── Opciones ─────────────────────────────────────────────────────────────────

const APPS: { value: ScriptApp; label: string }[] = [
  { value: "Illustrator", label: "Illustrator" },
  { value: "Photoshop",   label: "Photoshop" },
  { value: "InDesign",    label: "InDesign" },
];

// ─── Form ─────────────────────────────────────────────────────────────────────

interface FormState {
  title:       string;
  description: string;
  app:         ScriptApp | "";
  tags:        string;
  prompt:      string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  script:    IllustratorScript | null;
  open:      boolean;
  onClose:   () => void;
  onUpdated: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function EditScriptModal({ script, open, onClose, onUpdated }: Props) {
  const { user } = useAuth();
  const [form,   setForm]   = useState<FormState>({ title: "", description: "", app: "", tags: "", prompt: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);

  const editorName = (() => {
    const meta  = user?.user_metadata ?? {};
    const first = (meta.first_name as string | undefined) ?? "";
    const last  = (meta.last_name  as string | undefined) ?? "";
    return first || last ? `${first} ${last}`.trim() : (user?.email ?? "Desconocido");
  })();

  useEffect(() => {
    if (script) {
      setForm({
        title:       script.title,
        description: script.description ?? "",
        app:         script.app,
        tags:        script.tags.join(", "),
        prompt:      script.prompt ?? "",
      });
      setErrors({});
    }
  }, [script]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.title.trim()) next.title = "Requerido";
    if (!form.app)          next.app   = "Requerido";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!script || !validate()) return;

    setSaving(true);

    const title = form.title.trim();
    const ok = await updateUploadedScript(
      script.id,
      {
        title,
        description: form.description.trim(),
        app:         form.app as ScriptApp,
        tags:        form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        prompt:      form.prompt.trim(),
      },
      editorName,
      user?.id ?? "",
    );

    setSaving(false);
    if (!ok) return;

    onUpdated();
    onClose();

    Swal.fire({
      title: "¡Script actualizado!",
      html: `<span style="color:#64748b;font-size:14px">
               <strong style="color:#0f172a">"${title}"</strong>
               fue guardado correctamente.
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-[#0341a5]" />
            Editar script
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">

          <Field label="Título" error={errors.title} required>
            <Input
              placeholder="Ej: Renombrar capas por color"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>

          <Field label="Descripción">
            <Input
              placeholder="¿Qué hace este script?"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>

          <Field label="Aplicación" error={errors.app} required>
            <Select value={form.app} onValueChange={(v) => set("app", v as ScriptApp)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {APPS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Tags (separados por coma)">
            <Input
              placeholder="Ej: capas, colores, automatización"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
            />
          </Field>

          <Field label="Prompt de IA utilizado">
            <Textarea
              placeholder="Pega aquí el prompt que usaste para generar el script (opcional)"
              value={form.prompt}
              onChange={(e) => set("prompt", e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="brand" onClick={handleSubmit} disabled={saving} className="gap-1.5">
            <Pencil className="h-4 w-4" />
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, error, required, children }: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
