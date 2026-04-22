import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Pencil, Plus, X } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { useAuth } from "@/hooks/useAuth";
import { updateCustomPrompt } from "../services/prompts.service";
import type { Prompt, PromptCategory, PromptBrand, PromptTone } from "../logic/prompts.types";

// ─── Categorías ───────────────────────────────────────────────────────────────

const CUSTOM_CATEGORIES_KEY = "prompts_custom_categories";

const DEFAULT_CATEGORIES: { value: string; label: string }[] = [
  { value: "imagen-producto",    label: "Imagen producto" },
  { value: "banner-campaña",     label: "Banner campaña" },
  { value: "relleno-generativo", label: "Relleno generativo" },
  { value: "copy-marketing",     label: "Copy marketing" },
  { value: "social-media",       label: "Social media" },
  { value: "video",              label: "Video" },
];

function loadCustomCategories(): { value: string; label: string }[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    return raw ? (JSON.parse(raw) as { value: string; label: string }[]) : [];
  } catch {
    return [];
  }
}

function persistCustomCategories(cats: { value: string; label: string }[]) {
  localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(cats));
}

// ─── CategoryCombobox ─────────────────────────────────────────────────────────

interface CategoryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  customCats: { value: string; label: string }[];
  onAddCustom: (cat: { value: string; label: string }) => void;
  onRemoveCustom: (value: string) => void;
  isAdmin: boolean;
}

function CategoryCombobox({
  value,
  onChange,
  customCats,
  onAddCustom,
  onRemoveCustom,
  isAdmin,
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const allCategories = [...DEFAULT_CATEGORIES, ...customCats];
  const selectedLabel = allCategories.find((c) => c.value === value)?.label ?? value;

  function handleAddCustom() {
    const label = search.trim();
    if (!label) return;
    const slug = label.toLowerCase().replace(/\s+/g, "-");
    if (!allCategories.some((c) => c.value === slug)) {
      onAddCustom({ value: slug, label });
    }
    onChange(slug);
    setSearch("");
    setOpen(false);
  }

  const searchLower = search.toLowerCase();
  const exactMatch = allCategories.some((c) => c.label.toLowerCase() === searchLower);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-left text-sm ring-offset-background transition-colors hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {value ? selectedLabel : "Seleccionar"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar o escribir..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              <button
                type="button"
                onClick={handleAddCustom}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Plus size={14} />
                Usar "{search}" como categoría
              </button>
            </CommandEmpty>
            <CommandGroup>
              {allCategories.map((cat) => (
                <CommandItem
                  key={cat.value}
                  value={cat.label}
                  onSelect={() => {
                    onChange(cat.value);
                    setSearch("");
                    setOpen(false);
                  }}
                  className="group flex items-center justify-between"
                >
                  <span className="flex items-center">
                    <Check
                      className={`mr-2 h-4 w-4 shrink-0 ${value === cat.value ? "opacity-100" : "opacity-0"}`}
                    />
                    {cat.label}
                  </span>
                  {isAdmin && customCats.some((c) => c.value === cat.value) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveCustom(cat.value);
                        if (value === cat.value) onChange("");
                      }}
                      className="ml-2 flex h-4 w-4 items-center justify-center rounded bg-destructive opacity-0 transition-opacity group-hover:opacity-100 hover:brightness-90"
                      title="Eliminar categoría"
                    >
                      <X size={11} className="text-white" />
                    </button>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            {search.trim() && !exactMatch && (
              <CommandGroup heading="Personalizado">
                <CommandItem
                  value={`custom-${search}`}
                  onSelect={handleAddCustom}
                  className="cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Usar "{search}"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Opciones fijas ───────────────────────────────────────────────────────────

const BRANDS: { value: PromptBrand; label: string }[] = [
  { value: "Jumbo",        label: "Jumbo" },
  { value: "Santa Isabel", label: "Santa Isabel" },
  { value: "Spid",         label: "Spid" },
];

const TONES: { value: PromptTone; label: string }[] = [
  { value: "formal",       label: "Formal" },
  { value: "casual",       label: "Casual" },
  { value: "urgente",      label: "Urgente" },
  { value: "aspiracional", label: "Aspiracional" },
];

// ─── Form ─────────────────────────────────────────────────────────────────────

interface FormState {
  title:       string;
  description: string;
  category:    PromptCategory | "";
  brand:       PromptBrand | "";
  tone:        PromptTone | "";
  content:     string;
  model:       string;
}

function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(2, -2)))];
}

interface Props {
  prompt: Prompt | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditPromptModal({ prompt, open, onClose, onUpdated }: Props) {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const [customCats, setCustomCats] = useState<{ value: string; label: string }[]>(loadCustomCategories);

  const editorName = (() => {
    const meta  = user?.user_metadata ?? {};
    const first = (meta.first_name as string | undefined) ?? "";
    const last  = (meta.last_name  as string | undefined) ?? "";
    return first || last ? `${first} ${last}`.trim() : (user?.email ?? "Desconocido");
  })();

  const [form, setForm] = useState<FormState>({
    title: "", description: "", category: "", brand: "", tone: "", content: "", model: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (prompt) {
      setForm({
        title:       prompt.title,
        description: prompt.description ?? "",
        category:    prompt.category,
        brand:       prompt.brand,
        tone:        prompt.tone,
        content:     prompt.content,
        model:       prompt.model ?? "",
      });
      setErrors({});
    }
  }, [prompt]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleAddCustomCat(cat: { value: string; label: string }) {
    const updated = [...customCats, cat];
    setCustomCats(updated);
    persistCustomCategories(updated);
  }

  function handleRemoveCustomCat(value: string) {
    const updated = customCats.filter((c) => c.value !== value);
    setCustomCats(updated);
    persistCustomCategories(updated);
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.title.trim())   next.title    = "Requerido";
    if (!form.category)       next.category = "Requerido";
    if (!form.brand)          next.brand    = "Requerido";
    if (!form.tone)           next.tone     = "Requerido";
    if (!form.content.trim()) next.content  = "Requerido";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!prompt || !validate()) return;

    const variables = extractVariables(form.content);

    const ok = await updateCustomPrompt(
      prompt.id,
      {
        title:       form.title.trim(),
        description: form.description.trim(),
        category:    form.category as PromptCategory,
        brand:       form.brand as PromptBrand,
        tone:        form.tone as PromptTone,
        content:     form.content.trim(),
        model:       form.model.trim() || undefined,
        variables:   variables.length > 0 ? variables : undefined,
        tags:        prompt.tags,
      },
      editorName,
      user?.id ?? "",
    );

    if (!ok) return;
    onUpdated();
    onClose();
  }

  const detectedVars = extractVariables(form.content);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-[#0341a5]" />
            Editar prompt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <Field label="Título" error={errors.title} required>
            <Input
              placeholder="Ej: Banner oferta Jumbo"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>

          <Field label="Descripción">
            <Input
              placeholder="Para qué sirve este prompt"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Categoría" error={errors.category} required>
              <CategoryCombobox
                value={form.category}
                onChange={(v) => set("category", v as PromptCategory)}
                customCats={customCats}
                onAddCustom={handleAddCustomCat}
                onRemoveCustom={handleRemoveCustomCat}
                isAdmin={isAdmin}
              />
            </Field>

            <Field label="Marca" error={errors.brand} required>
              <Select value={form.brand} onValueChange={(v) => set("brand", v as PromptBrand)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {BRANDS.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Tono" error={errors.tone} required>
              <Select value={form.tone} onValueChange={(v) => set("tone", v as PromptTone)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Modelo recomendado">
            <Input
              placeholder="Ej: DALL-E 3, GPT-4o..."
              value={form.model}
              onChange={(e) => set("model", e.target.value)}
            />
          </Field>

          <Field label="Contenido del prompt" error={errors.content} required>
            <Textarea
              placeholder="Escribe el prompt. Usa {{nombre_variable}} para partes editables."
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              rows={5}
              className="resize-none font-mono text-sm"
            />
          </Field>

          {detectedVars.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground">Variables detectadas:</span>
              {detectedVars.map((v) => (
                <span key={v} className="rounded-md bg-amber-50 px-1.5 py-0.5 font-mono text-[11px] text-amber-700 ring-1 ring-amber-200">
                  {`{{${v}}}`}
                </span>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="brand" onClick={handleSubmit} className="gap-1.5">
            <Pencil className="h-4 w-4" />
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
