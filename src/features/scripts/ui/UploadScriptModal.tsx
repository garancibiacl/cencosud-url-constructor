import { useRef, useState } from "react";
import { Upload, Plus } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "@/hooks/useAuth";
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
import { saveUploadedScript } from "../services/scripts.service";
import type { ScriptApp } from "../logic/scripts.types";

// ─── Restricciones ────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_KB = 100;
const ALLOWED_EXTENSION = ".jsx";

const APPS: { value: ScriptApp; label: string }[] = [
  { value: "Illustrator", label: "Illustrator" },
  { value: "Photoshop",   label: "Photoshop" },
  { value: "InDesign",    label: "InDesign" },
];

// ─── Estado inicial ───────────────────────────────────────────────────────────

interface FormState {
  title:       string;
  description: string;
  app:         ScriptApp | "";
  tags:        string;
  prompt:      string;
}

const EMPTY: FormState = {
  title:       "",
  description: "",
  app:         "",
  tags:        "",
  prompt:      "",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open:       boolean;
  onClose:    () => void;
  onUploaded: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function UploadScriptModal({ open, onClose, onUploaded }: Props) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const uploaderName = (() => {
    const meta  = user?.user_metadata ?? {};
    const first = (meta.first_name as string | undefined) ?? "";
    const last  = (meta.last_name  as string | undefined) ?? "";
    return first || last ? `${first} ${last}`.trim() : (user?.email ?? "Desconocido");
  })();
  const [form,      setForm]      = useState<FormState>(EMPTY);
  const [fileCode,  setFileCode]  = useState<string | null>(null);
  const [fileName,  setFileName]  = useState<string>("");
  const [fileError, setFileError] = useState<string>("");
  const [errors,    setErrors]    = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving,    setSaving]    = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError("");
    setFileCode(null);
    setFileName("");

    const file = e.target.files?.[0];
    if (!file) return;

    // Restricción: solo .jsx
    if (!file.name.toLowerCase().endsWith(ALLOWED_EXTENSION)) {
      setFileError(`Solo se permiten archivos ${ALLOWED_EXTENSION}`);
      e.target.value = "";
      return;
    }

    // Restricción: tamaño máximo
    if (file.size > MAX_FILE_SIZE_KB * 1024) {
      setFileError(`El archivo no puede superar ${MAX_FILE_SIZE_KB} KB`);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text.trim()) {
        setFileError("El archivo está vacío");
        return;
      }
      setFileCode(text);
      setFileName(file.name);
      // Pre-popula el título si está vacío
      if (!form.title) {
        const baseName = file.name.replace(/\.jsx$/i, "").replace(/[-_]/g, " ");
        setForm((prev) => ({ ...prev, title: baseName }));
      }
    };
    reader.readAsText(file, "utf-8");
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.title.trim())  next.title = "Requerido";
    if (!form.app)           next.app   = "Requerido";
    setErrors(next);
    if (!fileCode) { setFileError("Selecciona un archivo .jsx"); return false; }
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setSaving(true);

    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const title = form.title.trim();

    const result = await saveUploadedScript(
      {
        id:          `upload-${Date.now()}`,
        title,
        description: form.description.trim(),
        app:         form.app as ScriptApp,
        tags,
        prompt:      form.prompt.trim(),
        filename:    fileName,
        code:        fileCode!,
        uploadedBy:  uploaderName,
      },
      user?.id ?? "",
    );

    setSaving(false);
    if (!result) return;

    handleClose();
    onUploaded();

    Swal.fire({
      title: "¡Script cargado!",
      html: `<span style="color:#64748b;font-size:14px">
               <strong style="color:#0f172a">"${title}"</strong>
               fue agregado a la biblioteca de scripts.
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
    setFileCode(null);
    setFileName("");
    setFileError("");
    setErrors({});
    if (fileRef.current) fileRef.current.value = "";
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-orange-500" />
            Cargar script .jsx
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">

          {/* Archivo */}
          <Field label="Archivo .jsx" required error={fileError || undefined}>
            <label
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 transition-colors
                ${fileCode
                  ? "border-orange-300 bg-orange-50"
                  : "border-border bg-muted/30 hover:border-orange-200 hover:bg-orange-50/50"
                }`}
            >
              <Upload className={`h-6 w-6 ${fileCode ? "text-orange-500" : "text-muted-foreground"}`} />
              {fileCode ? (
                <span className="text-sm font-medium text-orange-700">{fileName}</span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Haz clic para seleccionar — solo <strong>.jsx</strong>, máx. {MAX_FILE_SIZE_KB} KB
                </span>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".jsx"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </Field>

          {/* Título */}
          <Field label="Título" error={errors.title} required>
            <Input
              placeholder="Ej: Renombrar capas por color"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>

          {/* Descripción */}
          <Field label="Descripción">
            <Input
              placeholder="¿Qué hace este script?"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>

          {/* App */}
          <Field label="Aplicación" error={errors.app} required>
            <Select
              value={form.app}
              onValueChange={(v) => set("app", v as ScriptApp)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {APPS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Tags */}
          <Field label="Tags (separados por coma)">
            <Input
              placeholder="Ej: capas, colores, automatización"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
            />
          </Field>

          {/* Prompt */}
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
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {saving ? "Guardando…" : "Agregar script"}
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
  label:    string;
  error?:   string;
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
