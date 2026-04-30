import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toJpeg } from "html-to-image";
import { useCanvasDrop } from "./layout/useCanvasDrop";
import { RowDropIndicator } from "./layout/RowDropIndicator";
import {
  AlertCircle, ArrowLeft, CheckCircle2, CodeXml, Copy, Download, Eye, FileCode2, FileDown,
  FileImage, GripVertical,
  History, Image as ImageIcon, Inbox, Loader2, Mail, Monitor, MoreHorizontal,
  MousePointerClick, PenSquare, Plus, RectangleHorizontal, RotateCcw, Save,
  Send, Settings2, Smartphone, Trash2, Type, UserRound, X,
} from "lucide-react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { blockRegistry } from "../logic/registry/blockRegistry";
import { analyzeMailingHtml } from "../logic/exporters/analyzeMailingHtml";
import { renderMailingHtml, resolveTrackedLink } from "../logic/exporters/renderMailingHtml";
import { createDefaultMailing } from "../logic/builders/createDefaultMailing";
import { useMailings } from "../hooks/useMailings";
import { useMailingBuilderStore } from "../hooks/useMailingBuilderStore";
import { useDebounce } from "../hooks/useDebounce";
import { mailingTemplates } from "../logic/templates/mailingTemplates";
import { SectionLayoutPicker } from "./sidebar/SectionLayoutPicker";
import { RowCanvas, AddRowButton } from "./layout/RowCanvas";
import { ImageLibraryModal } from "./ImageLibraryModal";
import { imageLibraryBridge } from "./imageLibraryBridge";
import { NewTemplateModal } from "./NewTemplateModal";
const DevModePanel = React.lazy(() =>
  import("./DevModePanel").then((m) => ({ default: m.DevModePanel })),
);
import type { ScratchMode } from "./NewTemplateModal";
import type { BrandId } from "../logic/brands/brand.types";
import { brandThemes } from "../logic/brands/brandThemes";

const CATEGORY_LABELS = {
  content: "Contenido",
  media: "Media",
  layout: "Layout",
} as const;

// ---------------------------------------------------------------------------
// formatRelativeTime — returns "Hace X horas/minutos/días" for recent dates
// or "22 abr 2026 · 9:13 p.m." using es-CL locale for older ones
// ---------------------------------------------------------------------------
function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "Hace un momento";
  if (diffMins < 60) return `Hace ${diffMins} ${diffMins === 1 ? "minuto" : "minutos"}`;
  if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
  if (diffDays < 7) return `Hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;

  const datePart = date.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
  const timePart = date.toLocaleTimeString("es-CL", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${datePart} · ${timePart}`;
}

// ---------------------------------------------------------------------------
// BlockMiniThumb — visual sketch de cada tipo de bloque
// ---------------------------------------------------------------------------

function BlockMiniThumb({ type }: { type: string }) {
  if (type === "hero") return (
    <div className="h-14 overflow-hidden rounded-md bg-secondary/60 p-2">
      <div className="space-y-1">
        <div className="h-6 w-full rounded-sm bg-muted-foreground/20" />
        <div className="h-1.5 w-3/4 rounded bg-muted-foreground/25" />
        <div className="h-1.5 w-1/2 rounded bg-muted-foreground/18" />
        <div className="h-2.5 w-1/3 rounded bg-primary/30" />
      </div>
    </div>
  );
  if (type === "text") return (
    <div className="h-14 overflow-hidden rounded-md bg-secondary/60 p-2 pt-3">
      <div className="space-y-1">
        <div className="h-1.5 w-full rounded bg-muted-foreground/25" />
        <div className="h-1.5 w-[90%] rounded bg-muted-foreground/20" />
        <div className="h-1.5 w-[82%] rounded bg-muted-foreground/20" />
        <div className="h-1.5 w-3/4 rounded bg-muted-foreground/15" />
      </div>
    </div>
  );
  if (type === "image") return (
    <div className="h-14 overflow-hidden rounded-md bg-secondary/60">
      <div className="flex h-full items-center justify-center">
        <ImageIcon className="h-5 w-5 text-muted-foreground/25" />
      </div>
    </div>
  );
  if (type === "button") return (
    <div className="h-14 overflow-hidden rounded-md bg-secondary/60">
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-2/3 rounded-full bg-primary/25" />
      </div>
    </div>
  );
  if (type === "spacer") return (
    <div className="h-14 overflow-hidden rounded-md bg-secondary/60">
      <div className="flex h-full flex-col items-center justify-center gap-1">
        <div className="h-px w-4/5 border-t border-dashed border-muted-foreground/30" />
        <span className="text-[8px] font-medium uppercase tracking-wider text-muted-foreground/35">espaciado</span>
        <div className="h-px w-4/5 border-t border-dashed border-muted-foreground/30" />
      </div>
    </div>
  );
  if (type === "product-dd") return (
    <div className="h-14 overflow-hidden rounded-md bg-black">
      <img src="/thumbnails/product-dd.png" alt="Producto más descuento doble" className="h-full w-full object-cover object-top" draggable={false} />
    </div>
  );
  return <div className="h-14 rounded-md bg-secondary/60" />;
}


// ---------------------------------------------------------------------------
// CanvasEmptyState — estado inicial del canvas vacío
// ---------------------------------------------------------------------------

function CanvasEmptyState({
  onApplyTemplate,
  onAddRow,
}: {
  onApplyTemplate: (id: string) => void;
  onAddRow: (layoutId: string) => void;
}) {
  const quickStarts = [
    { id: "promo-hero", label: "Hero + CTA", desc: "Hero, texto y botón" },
    { id: "catalogo-2col", label: "2 Columnas", desc: "Catálogo lado a lado" },
    { id: "editorial", label: "Editorial", desc: "Imagen y texto narrativo" },
    { id: "catalogo-corto", label: "Catálogo", desc: "Hero + imagen + remate" },
  ];

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-8 py-12 text-center">
      {/* Ghost wireframe */}
      <div className="pointer-events-none w-52 select-none space-y-2.5 opacity-[0.07]">
        <div className="h-24 w-full rounded-xl bg-foreground" />
        <div className="mx-auto h-3 w-3/4 rounded-lg bg-foreground" />
        <div className="mx-auto h-2.5 w-1/2 rounded-lg bg-foreground" />
        <div className="mx-auto h-7 w-1/3 rounded-lg bg-foreground" />
        <div className="flex gap-2">
          <div className="h-16 flex-1 rounded-lg bg-foreground" />
          <div className="h-16 flex-1 rounded-lg bg-foreground" />
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-foreground">El canvas está vacío</h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          Elige una estructura para empezar o arrastra bloques desde el panel izquierdo.
        </p>
      </div>

      {/* Quick starts */}
      <div className="flex flex-wrap justify-center gap-2">
        {quickStarts.map((qs) => (
          <button
            key={qs.id}
            type="button"
            onClick={() => onApplyTemplate(qs.id)}
            className="flex flex-col items-start rounded-lg border border-border bg-card px-4 py-2.5 text-left shadow-sm transition hover:border-primary/50 hover:bg-primary/5 hover:shadow-md active:scale-[0.97]"
          >
            <span className="text-sm font-medium text-foreground">{qs.label}</span>
            <span className="text-xs text-muted-foreground">{qs.desc}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-muted-foreground/60">o elige el layout de fila manualmente</p>
        <AddRowButton onAdd={onAddRow} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BrandWelcomeScreen — pantalla de bienvenida inicial
// ---------------------------------------------------------------------------

function BrandWelcomeScreen({
  onSelectBrand,
  onNewTemplate,
  onSkip,
}: {
  onSelectBrand: (brandId: BrandId) => void;
  onNewTemplate: () => void;
  onSkip: () => void;
}) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-8 py-16"
      style={{
        backgroundColor: "#F0F0F0",
        backgroundImage: "radial-gradient(circle, #d4d4d4 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <div className="flex w-full max-w-2xl flex-col items-center gap-8">

        {/* Header text */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 shadow-sm backdrop-blur-sm">
            <Mail className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Mailing Builder
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            ¿Con qué marca quieres trabajar?
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Elige una marca para aplicar su identidad o crea una nueva plantilla desde cero.
          </p>
        </div>

        {/* Brand cards grid */}
        <div className="grid w-full grid-cols-3 gap-4">
          {Object.values(brandThemes).map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => onSelectBrand(theme.id as BrandId)}
              className="group relative flex cursor-pointer flex-col gap-4 rounded-2xl border border-border bg-card px-5 py-6 text-left shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              style={{ borderLeftWidth: "4px", borderLeftColor: theme.primaryColor }}
            >
              {/* Brand logo */}
              {theme.logoUrl ? (
                <img
                  src={theme.logoUrl}
                  alt={theme.name}
                  className="h-16 w-16 rounded-full object-cover shadow-sm transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <div
                  className="h-16 w-16 rounded-full shadow-sm"
                  style={{ backgroundColor: theme.primaryColor }}
                />
              )}
              {/* Brand name */}
              <div className="flex flex-col gap-1">
                <span className="text-lg font-bold leading-none text-foreground">{theme.name}</span>
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50 transition-colors duration-150 group-hover:text-muted-foreground/80">
                  Seleccionar
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="flex w-full items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm text-muted-foreground/60">o</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Nueva plantilla + Comenzar sin marca */}
        <div className="flex flex-col items-center gap-3">
          <Button variant="outline" size="default" onClick={onNewTemplate} className="px-6">
            <Plus className="mr-2 h-4 w-4" />
            Nueva plantilla
          </Button>
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-muted-foreground/60 underline-offset-4 transition-colors hover:text-muted-foreground hover:underline"
          >
            Comenzar sin marca
          </button>
        </div>

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PreviewTestModal — modal "Vista previa y prueba"
// State is fully controlled by parent so it persists across open/close cycles
// and the shared iframe never remounts when switching tabs.
// ---------------------------------------------------------------------------

type PreviewTab = "preview" | "inbox" | "send";

interface PreviewModalState {
  tab: PreviewTab;
  previewAs: "recipient" | "event";
  contactSearch: string;
  addJsonData: boolean;
  jsonPayload: string;
  testEmail: string;
}

function usePreviewModalState(): [PreviewModalState, React.Dispatch<React.SetStateAction<PreviewModalState>>] {
  return useState<PreviewModalState>({
    tab: "preview",
    previewAs: "recipient",
    contactSearch: "",
    addJsonData: false,
    jsonPayload: "",
    testEmail: "",
  });
}

function PreviewTestModal({
  open,
  onClose,
  htmlPreview,
  senderEmail,
  subject,
  preheader,
  state,
  onStateChange,
}: {
  open: boolean;
  onClose: () => void;
  htmlPreview: string;
  senderEmail: string;
  subject: string;
  preheader: string;
  state: PreviewModalState;
  onStateChange: React.Dispatch<React.SetStateAction<PreviewModalState>>;
}) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const set = useCallback(
    <K extends keyof PreviewModalState>(key: K, value: PreviewModalState[K]) =>
      onStateChange((prev) => ({ ...prev, [key]: value })),
    [onStateChange],
  );

  const handleSendTest = async () => {
    if (!state.testEmail.trim()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    toast({ title: "Email de prueba enviado", description: `Se envió una prueba a ${state.testEmail}.` });
    set("testEmail", "");
  };

  const TAB_DEFS: { id: PreviewTab; icon: React.ElementType; label: string }[] = [
    { id: "preview", icon: UserRound, label: "Vista previa" },
    { id: "inbox",   icon: Inbox,     label: "Ver en bandeja de entrada" },
    { id: "send",    icon: Send,      label: "Enviar email de prueba" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0"
        style={{ maxWidth: "900px", width: "92vw" }}
      >
        {/* ── Header: title + underline tabs ── */}
        <DialogHeader className="shrink-0 border-b border-border px-7 pt-6 pb-0">
          <DialogTitle className="mb-4 text-lg font-bold text-foreground">Vista previa y prueba</DialogTitle>
          <div className="flex gap-0">
            {TAB_DEFS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => set("tab", id)}
                className={`flex items-center gap-2 border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
                  state.tab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* ── Body: split layout ── */}
        {/* Left panel (iframe) is always mounted — never remounts on tab switch */}
        <div className="flex min-h-0 flex-1 gap-0 overflow-hidden">

          {/* ── Left: email preview — always rendered ── */}
          <div className="flex min-h-0 flex-1 overflow-y-auto p-7 pr-4">
            <div className="flex w-full flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm">
              {/* Metadata header */}
              <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
                <div className="space-y-1 text-sm">
                  {[
                    { label: "De:", value: senderEmail },
                    { label: "Asunto:", value: subject },
                    { label: "Vista previa:", value: preheader },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-2">
                      <span className="w-24 shrink-0 font-medium text-muted-foreground">{label}</span>
                      <span className={value ? "text-foreground" : "text-muted-foreground/40"}>{value || "—"}</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  title="Copiar HTML"
                  onClick={() => { void navigator.clipboard.writeText(htmlPreview); toast({ title: "HTML copiado al portapapeles" }); }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/50 transition hover:bg-secondary/60 hover:text-foreground"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* iframe — single instance, never unmounts */}
              <div className="relative overflow-hidden bg-white" style={{ height: "380px" }}>
                <iframe
                  title="Email preview"
                  srcDoc={htmlPreview}
                  className="block border-0"
                  style={{ width: "600px", height: "475px", transform: "scale(0.8)", transformOrigin: "top left", pointerEvents: "none" }}
                />
              </div>
            </div>
          </div>

          {/* ── Right: tab panels — CSS-toggled, never unmounted ── */}
          <div className="relative w-[280px] shrink-0 overflow-y-auto border-l border-border/60 p-6">

            {/* Panel: Vista previa */}
            <div style={{ display: state.tab === "preview" ? "flex" : "none" }} className="flex-col gap-5">
              <p className="text-[15px] font-semibold leading-snug text-foreground">
                ¿Como quién te gustaría previsualizar este email?
              </p>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="radio"
                    checked={state.previewAs === "recipient"}
                    onChange={() => set("previewAs", "recipient")}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">Vista previa como destinatario</span>
                </label>

                <div
                  style={{ display: state.previewAs === "recipient" ? "flex" : "none" }}
                  className="ml-6 flex-col gap-3"
                >
                  <p className="text-xs font-medium text-foreground/70">Seleccionar un contacto</p>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                    <Input
                      value={state.contactSearch}
                      onChange={(e) => set("contactSearch", e.target.value)}
                      placeholder="Buscar por email"
                      className="h-8 pl-8 text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-foreground/70">Datos JSON transaccionales</span>
                    <Switch checked={state.addJsonData} onCheckedChange={(v) => set("addJsonData", v)} />
                  </div>
                  {state.addJsonData && (
                    <Textarea
                      rows={4}
                      value={state.jsonPayload}
                      onChange={(e) => set("jsonPayload", e.target.value)}
                      placeholder={'{\n  "nombre": "Juan"\n}'}
                      className="resize-none font-mono text-xs"
                    />
                  )}
                </div>

                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="radio"
                    checked={state.previewAs === "event"}
                    onChange={() => set("previewAs", "event")}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">Vista previa del evento</span>
                </label>
              </div>
            </div>

            {/* Panel: Ver en bandeja */}
            <div style={{ display: state.tab === "inbox" ? "flex" : "none" }} className="flex-col gap-4">
              <p className="text-[15px] font-semibold leading-snug text-foreground">Vista en bandeja de entrada</p>
              <p className="text-sm text-muted-foreground">
                Así se verá el asunto y el preheader en el cliente de correo del destinatario.
              </p>
              <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {(senderEmail || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">{senderEmail || "remitente@marca.cl"}</p>
                    <p className="text-[10px] text-muted-foreground/60">Ahora</p>
                  </div>
                </div>
                <p className="text-sm font-semibold leading-tight text-foreground">{subject || "(Sin asunto)"}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground/70">{preheader || "(Sin vista previa)"}</p>
              </div>
              <p className="text-[11px] text-muted-foreground/55">
                Simulación aproximada — el renderizado real varía según el cliente de correo.
              </p>
            </div>

            {/* Panel: Enviar prueba */}
            <div style={{ display: state.tab === "send" ? "flex" : "none" }} className="flex-col gap-5">
              <div>
                <p className="text-[15px] font-semibold leading-snug text-foreground">
                  ¿Con quién quieres probar tu email?
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Envía el email al destinatario que elijas para verificar el resultado final.
                </p>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-1 text-xs font-medium text-foreground/70">
                  Destinatario <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  value={state.testEmail}
                  onChange={(e) => set("testEmail", e.target.value)}
                  placeholder="email@ejemplo.cl"
                  className="h-9 text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter") void handleSendTest(); }}
                />
              </div>
              <Button
                className="w-full rounded-full bg-foreground text-sm font-semibold text-background hover:bg-foreground/90"
                disabled={sending || !state.testEmail.trim()}
                onClick={() => void handleSendTest()}
              >
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Enviar prueba
              </Button>
              <p className="text-center text-[11px] text-muted-foreground/55">
                Se enviará desde <span className="font-medium">{senderEmail || "tu remitente configurado"}</span>
              </p>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// CampaignSettingsScreen — pantalla de configuración de campaña post-edición
// ---------------------------------------------------------------------------

function CampaignSettingsScreen({
  document,
  htmlPreview,
  saving,
  onBack,
  onSave,
  onChangeSetting,
  onChangeName,
}: {
  document: import("../logic/schema/mailing.types").MailingDocument;
  htmlPreview: string;
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
  onChangeSetting: (key: string, value: string) => void;
  onChangeName: (name: string) => void;
}) {
  const subject = document.settings.subject ?? "";
  const preheader = document.settings.preheader ?? "";
  const senderEmail = document.settings.senderEmail ?? "";
  const senderName = document.settings.senderName ?? "";

  const preheaderLen = preheader.length;
  const preheaderOver = preheaderLen > 35;

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewModalState, setPreviewModalState] = usePreviewModalState();
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(document.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const startEditName = () => {
    setDraftName(document.name);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.select(), 0);
  };
  const confirmName = () => {
    const trimmed = draftName.trim();
    if (trimmed) onChangeName(trimmed);
    setEditingName(false);
  };
  const cancelName = () => {
    setDraftName(document.name);
    setEditingName(false);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ── Header estilo Brevo ──────────────────────────────────────────────── */}
      <div className="flex h-[56px] shrink-0 items-center justify-between border-b border-border bg-card px-6">

        {/* Left: back + editable name + status */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {editingName ? (
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-0.5">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") confirmName(); if (e.key === "Escape") cancelName(); }}
                  className="h-8 w-56 rounded-lg border border-border bg-transparent px-3 text-[15px] font-bold text-foreground outline-none ring-2 ring-primary/30 focus:ring-primary/60"
                  autoFocus
                />
                <span className="flex items-center gap-1 pl-0.5 text-[11px] text-muted-foreground/55">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                  Inactiva
                </span>
              </div>
              <button
                type="button"
                onClick={confirmName}
                className="mb-4 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/20"
                title="Confirmar"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 8l4 4 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={cancelName}
                className="mb-4 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground"
                title="Cancelar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold leading-none text-foreground">{document.name}</span>
                <button
                  type="button"
                  onClick={startEditName}
                  className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/50 transition hover:text-primary"
                  title="Editar nombre"
                >
                  <PenSquare className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/55">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                Inactiva
              </span>
            </div>
          )}
        </div>

        {/* Right: preview button + save dropdown */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-full px-4 text-sm font-medium"
            onClick={() => setShowPreviewModal(true)}
          >
            <Eye className="h-4 w-4" />
            Vista previa y prueba
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                disabled={saving || !subject.trim()}
                className="h-9 gap-2 rounded-full bg-foreground px-4 text-sm font-semibold text-background hover:bg-foreground/90"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 opacity-70" fill="currentColor">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onSave}>
                <Save className="mr-2 h-4 w-4" />Guardar borrador
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Body: preview left + form right */}
      <div className="flex min-h-0 flex-1 gap-0 overflow-hidden">

        {/* Left: template preview */}
        <div
          className="flex flex-1 flex-col items-center justify-start overflow-y-auto px-10 py-8"
          style={{
            backgroundColor: "#F0F0F0",
            backgroundImage: "radial-gradient(circle, #d4d4d4 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Vista previa de la plantilla
          </p>
          <div
            className="overflow-hidden rounded-xl shadow-xl"
            style={{ width: "480px", boxShadow: "0 4px 24px rgba(0,0,0,0.14)" }}
          >
            <iframe
              title="Vista previa plantilla"
              srcDoc={htmlPreview}
              className="block border-0 bg-white"
              style={{ width: "600px", height: "600px", transform: "scale(0.8)", transformOrigin: "top left", pointerEvents: "none" }}
            />
          </div>
        </div>

        {/* Right: form */}
        <aside className="flex w-[400px] shrink-0 flex-col gap-0 overflow-y-auto border-l border-border bg-card">
          <div className="space-y-6 p-7">

            {/* Sender */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/55">Remitente</span>
                <div className="h-px flex-1 bg-border/60" />
              </div>
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-xs font-medium text-foreground/70">
                    Email de remitente
                    <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => onChangeSetting("senderEmail", e.target.value)}
                    placeholder="hola@marca.cl"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground/70">Nombre de remitente</label>
                  <Input
                    value={senderName}
                    onChange={(e) => onChangeSetting("senderName", e.target.value)}
                    placeholder="Cencosud"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Subject & preheader */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/55">Contenido del sobre</span>
                <div className="h-px flex-1 bg-border/60" />
              </div>
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-xs font-medium text-foreground/70">
                    Asunto
                    <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={subject}
                    onChange={(e) => onChangeSetting("subject", e.target.value)}
                    placeholder="¡Ofertas exclusivas para ti!"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground/70">Texto de vista previa</label>
                    <span className={`text-[10px] tabular-nums ${preheaderOver ? "font-semibold text-destructive" : "text-muted-foreground/55"}`}>
                      {preheaderLen}/35
                    </span>
                  </div>
                  <Textarea
                    rows={3}
                    value={preheader}
                    onChange={(e) => onChangeSetting("preheader", e.target.value)}
                    placeholder="Descuentos de hasta 50% en toda la tienda..."
                    className={`resize-none text-sm ${preheaderOver ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
                  />
                  {preheaderOver && (
                    <p className="text-[11px] text-destructive">
                      Supera los 35 caracteres recomendados — puede verse cortado en algunos clientes de correo.
                    </p>
                  )}
                  {!preheaderOver && (
                    <p className="text-[11px] text-muted-foreground/55">
                      Mantenlo por debajo de los 35 caracteres para asegurarte de que no se vea cortado.
                    </p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </aside>
      </div>

      <PreviewTestModal
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        htmlPreview={htmlPreview}
        senderEmail={senderEmail}
        subject={subject}
        preheader={preheader}
        state={previewModalState}
        onStateChange={setPreviewModalState}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// MailingBuilderPage — componente principal
// ---------------------------------------------------------------------------

function buildDraftNote(user: { email?: string; user_metadata?: Record<string, string> } | null, templateName: string): string {
  const meta = user?.user_metadata ?? {};
  const firstName = (meta.first_name ?? "").trim();
  const lastName  = (meta.last_name  ?? "").trim();
  const userName  = firstName || lastName ? `${firstName} ${lastName}`.trim() : "";
  const email     = user?.email ?? "";
  return `${userName}|${email}|${templateName}`;
}

function parseDraftNote(note: string): { author: string; email: string; template: string } {
  // New format: "Nombre|email|Plantilla"
  const parts = note.split("|");
  if (parts.length >= 3) return { author: parts[0], email: parts[1], template: parts.slice(2).join("|") };
  // Legacy format: "Nombre — Plantilla"
  const [author, ...rest] = note.split(" — ");
  return { author, email: "", template: rest.join(" — ") };
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
  const timePart = date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${datePart} · ${timePart}`;
}

export default function MailingBuilderPage() {
  const { user } = useAuth();
  const {
    document,
    selectedBlockId,
    selectedColId,
    selectedRowId,
    selectedLevel,
    activeMailingId,
    selectBlock,
    selectRow,
    selectCol,
    addRow,
    addRowFromLayout,
    insertRowFromLayoutAt,
    insertBlockAsNewRowAt,
    moveBlockToNewRowAt,
    insertPresetBlockAsRowAt,
    mutateRowLayout,
    removeRow,
    moveRow,
    duplicateRow,
    setRowPreset,
    insertBlock,
    insertBlockAtColumn,
    removeBlock,
    duplicateBlock,
    moveBlockWithinColumn,
    moveBlockToColumn,
    updateBlock,
    updateDocumentName,
    updateSettings,
    updateLinkTracking,
    replaceDocument,
    setActiveMailingId,
    showWelcome,
    showCampaignSettings,
    setShowWelcome,
    setShowCampaignSettings,
  } = useMailingBuilderStore();

  const openImageLibrary = useMailingBuilderStore((s) => s.openImageLibrary);

  // Wire bridge so Inspector/View components (which can't import the store directly
  // due to circular deps via blockRegistry) can still trigger the image library.
  React.useEffect(() => {
    imageLibraryBridge.register(openImageLibrary);
  }, [openImageLibrary]);

  const { toast } = useToast();
  const { mailings, versions, loading, saving, refreshMailings, loadVersions, saveDraft, saveVersion, scheduleAutosave, cancelAutosave } = useMailings();
  const [versionNote, setVersionNote] = useState("");
  const [previewMode, setPreviewMode] = useState<"canvas" | "split" | "html">("canvas");
  const [devicePreview, setDevicePreview] = useState<"desktop" | "mobile">("desktop");
  const [lastAutosaveAt, setLastAutosaveAt] = useState<string | null>(null);
  const [showGlobalInspector, setShowGlobalInspector] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [showDevModeWarning, setShowDevModeWarning] = useState(false);
  const [showDevMode, setShowDevMode] = useState(false);

  const inspectorRef = useRef<HTMLDivElement | null>(null);
  const globalInspectorButtonRef = useRef<HTMLButtonElement | null>(null);
  const dragRef = useRef<Parameters<typeof RowCanvas>[0]["dragRef"]["current"]>(null);
  const rowsContainerRef = useRef<HTMLDivElement | null>(null);

  // ── Section insert + row reorder via canvas drag & drop ─────────────────────
  const { dropIndex, rowDragRef, canvasDropHandlers } = useCanvasDrop({
    containerRef: rowsContainerRef,
    rowCount: document.rows.length,
    onInsertSection: useCallback(
      (layoutId: string, atIndex: number) => insertRowFromLayoutAt(layoutId, atIndex),
      [insertRowFromLayoutAt],
    ),
    onReorderRow: useCallback(
      (from: number, to: number) => moveRow(from, to),
      [moveRow],
    ),
    onInsertBlockAsRow: useCallback(
      (blockData: string, atIndex: number) => {
        if (blockData.startsWith("preset:")) {
          const presetId = blockData.slice(7);
          insertPresetBlockAsRowAt(presetId, atIndex);
        } else if (blockData.startsWith("new:")) {
          // Bloque nuevo desde sidebar
          const type = blockData.slice(4) as Parameters<typeof insertBlockAsNewRowAt>[0];
          insertBlockAsNewRowAt(type, atIndex);
        } else {
          // Bloque existente reordenado entre filas
          moveBlockToNewRowAt(blockData, atIndex);
        }
      },
      [insertBlockAsNewRowAt, moveBlockToNewRowAt, insertPresetBlockAsRowAt],
    ),
  });

  // ── Estado del guardado ──────────────────────────────────────────────────

  const saveLabel = saving
    ? "Guardando…"
    : lastAutosaveAt
      ? `Guardado ${new Date(lastAutosaveAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}`
      : "Sin guardar";

  const saveIcon = saving ? Loader2 : lastAutosaveAt ? CheckCircle2 : AlertCircle;
  const saveIconClass = saving
    ? "animate-spin text-amber-500"
    : lastAutosaveAt
      ? "text-emerald-500"
      : "text-amber-500";

  // ── Derivados del documento ──────────────────────────────────────────────

  const selectedBlock = useMemo(() => {
    if (!selectedBlockId) return null;
    for (const row of document.rows) {
      for (const col of row.columns) {
        const found = col.blocks.find((b) => b.id === selectedBlockId);
        if (found) return found;
      }
    }
    return null;
  }, [document.rows, selectedBlockId]);

  const totalBlocks = useMemo(
    () => document.rows.reduce((sum, row) => sum + row.columns.reduce((s, col) => s + col.blocks.length, 0), 0),
    [document.rows],
  );

  const SelectedInspector = selectedBlock ? blockRegistry[selectedBlock.type].Inspector : null;

  const debouncedDocument = useDebounce(document, 400);
  const htmlPreview = useMemo(() => renderMailingHtml(debouncedDocument), [debouncedDocument]);
  const compatibility = useMemo(() => analyzeMailingHtml(htmlPreview), [htmlPreview]);

  const trackedLinks = useMemo(() => (
    document.rows.flatMap((row) =>
      row.columns.flatMap((col) =>
        col.blocks.flatMap((block) => {
          if (block.type === "hero" && block.props.href) return [{ id: block.id, label: block.props.ctaLabel || "CTA", url: resolveTrackedLink(block.props.href, document) }];
          if (block.type === "button" && block.props.href) return [{ id: block.id, label: block.props.label, url: resolveTrackedLink(block.props.href, document) }];
          if (block.type === "image" && block.props.href) return [{ id: block.id, label: block.props.alt || "Imagen", url: resolveTrackedLink(block.props.href, document) }];
          return [];
        }),
      ),
    )
  ), [document]);

  // ── Efectos ───────────────────────────────────────────────────────────────

  useEffect(() => { void refreshMailings(); }, [refreshMailings]);
  useEffect(() => { void loadVersions(activeMailingId); }, [activeMailingId, loadVersions]);

  useEffect(() => {
    if (!user) return;
    scheduleAutosave({
      mailingId: activeMailingId,
      userId: user.id,
      document,
      delay: 1500,
      onSaved: (savedId) => {
        if (savedId && savedId !== activeMailingId) setActiveMailingId(savedId);
        setLastAutosaveAt(new Date().toISOString());
      },
    });
    return () => cancelAutosave();
  }, [activeMailingId, cancelAutosave, document, scheduleAutosave, setActiveMailingId, user]);

  // ── Handlers de exportación ───────────────────────────────────────────────

  const handleCopyHtml = async () => {
    const html = renderMailingHtml(document);
    await navigator.clipboard.writeText(html);
    toast({ title: "HTML copiado", description: "El mailing quedó listo para pegar o enviar a desarrollo." });
  };

  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadingJpg, setDownloadingJpg]       = useState(false);
  const [jpgDone, setJpgDone]                     = useState(false);
  const fileName = document.name.trim().toLowerCase().replace(/\s+/g, "-") || "mailing";

  const handleDownloadHtml = () => {
    const html = renderMailingHtml(document);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href     = url;
    link.download = `${fileName}.html`;
    link.click();
    URL.revokeObjectURL(url);
    setShowDownloadModal(false);
    toast({ title: "HTML descargado", description: "Se descargó una versión email-safe del mailing." });
  };

  const handleDownloadJpg = async () => {
    setDownloadingJpg(true);
    const docWidth    = document.settings.width;
    const scopeClass  = "__mailing_export__";
    const container   = window.document.createElement("div");

    try {
      const html = renderMailingHtml(document);

      // Extraer estilos del <head> y contenido + fondo del <body>
      const headContent = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? "";
      const emailStyles = [...headContent.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
        .map((m) => m[1]).join("\n");
      const bodyTag     = html.match(/<body([^>]*)>/i)?.[1] ?? "";
      const bodyBg      = bodyTag.match(/background-color:\s*([^;"]+)/i)?.[1]?.trim() ?? "#ffffff";
      const bodyContent = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? "";

      // Reset CSS con scope: neutraliza preflight de Tailwind (border-collapse,
      // box-sizing, max-width en img) que distorsionan la tabla del email.
      const resetCss = [
        `.${scopeClass} *, .${scopeClass} *::before, .${scopeClass} *::after { box-sizing: content-box !important; }`,
        `.${scopeClass} table { border-collapse: separate !important; border-spacing: 0 !important; }`,
        `.${scopeClass} img { display: inline !important; max-width: none !important; }`,
      ].join(" ");

      container.className  = scopeClass;
      // opacity:0 oculta el contenedor sin afectar su posición ni layout.
      // html-to-image copia los computed styles; si el nodo tiene
      // position:fixed + left negativo en su cssText, el contenido queda
      // fuera del viewport del SVG foreignObject → imagen en blanco.
      // Con top:0 left:0 no hay offset problemático; opacity:1 en la opción
      // `style` lo hace visible solo en el canvas clonado.
      container.style.cssText = [
        "position:fixed", "top:0", "left:0",
        `width:${docWidth}px`, `background-color:${bodyBg}`,
        "opacity:0", "z-index:-1", "pointer-events:none",
      ].join(";");
      // innerHTML incluye: reset Tailwind + estilos propios del email + contenido del body
      container.innerHTML = `<style>${resetCss}</style><style>${emailStyles}</style>${bodyContent}`;
      window.document.body.appendChild(container);

      // Primer ciclo de layout
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => setTimeout(r, 400));

      // Proxy de imágenes → data URLs antes de capturar.
      // Usamos imgEl.src (URL absoluta resuelta por el browser) en lugar de
      // getAttribute("src") que puede devolver rutas relativas (/imagen.webp)
      // que el proxy server-side no puede resolver.
      const origin = window.location.origin;
      const imgs   = Array.from(container.querySelectorAll<HTMLImageElement>("img"));
      await Promise.allSettled(imgs.map(async (imgEl) => {
        const src = imgEl.src; // siempre absoluta: "http://host/path" o "data:..."
        if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;
        try {
          // Imágenes del mismo origen (assets locales): fetch directo sin proxy
          const fetchUrl = src.startsWith(origin)
            ? src
            : `/api/proxy-img?url=${encodeURIComponent(src.replace(/^http:\/\//i, "https://"))}`;
          const res = await fetch(fetchUrl, { cache: "force-cache" });
          if (!res.ok) return;
          const blob = await res.blob();
          imgEl.src = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload  = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch { /* conservar src original */ }
      }));

      // Segundo ciclo de layout con imágenes ya cargadas (alto correcto)
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => setTimeout(r, 150));

      const contentHeight = container.scrollHeight;

      const dataUrl = await toJpeg(container, {
        quality:         0.95,
        backgroundColor: bodyBg || "#ffffff",
        width:           docWidth,
        height:          contentHeight,
        pixelRatio:      1,
        skipFonts:       true,
        imagePlaceholder: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        // El nodo raíz tiene opacity:0 para ocultarse en la página.
        // Aquí lo restauramos en el clon para que sea visible en el SVG/canvas.
        style: { opacity: "1" },
      });

      const link = window.document.createElement("a");
      link.href     = dataUrl;
      link.download = `${fileName}.jpg`;
      link.click();
      return { width: docWidth, height: contentHeight };
    } catch (err) {
      console.error("[JPG export]", err);
      throw err;
    } finally {
      if (container.parentNode) window.document.body.removeChild(container);
      setDownloadingJpg(false);
    }
  };

  const handleJpgExportWithSwal = async () => {
    setShowDownloadModal(false);

    void Swal.fire({
      title: "Generando imagen…",
      html: `<p style="color:#64748b;font-size:13px;margin:0">Procesando imágenes y preparando la descarga</p>`,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      customClass: { popup: "swal-brand-popup", title: "swal-brand-title" },
      didOpen: () => Swal.showLoading(),
    });

    try {
      const { width, height } = await handleDownloadJpg();
      await Swal.fire({
        title: "¡JPG descargado!",
        html: `<p style="color:#64748b;font-size:13px;margin-top:6px">
                 ${width} × ${height}px &nbsp;·&nbsp;
                 <strong style="color:#0f172a">${fileName}.jpg</strong>
               </p>`,
        icon: "success",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        customClass: {
          popup:            "swal-brand-popup",
          title:            "swal-brand-title",
          icon:             "swal-brand-icon",
          timerProgressBar: "swal-brand-progress",
        },
      });
    } catch {
      const result = await Swal.fire({
        title: "Error al generar JPG",
        html: `<p style="color:#64748b;font-size:13px;margin-top:6px">
                 No se pudo exportar la imagen. Inténtalo nuevamente.
               </p>`,
        icon: "error",
        confirmButtonText: "Reintentar",
        showCancelButton: true,
        cancelButtonText: "Cerrar",
        reverseButtons: true,
        customClass: {
          popup:         "swal-brand-popup",
          title:         "swal-brand-title",
          confirmButton: "swal-brand-confirm-violet",
          cancelButton:  "swal-brand-cancel",
        },
      });
      if (result.isConfirmed) setShowDownloadModal(true);
    }
  };

  const handleSaveAsPdf = () => {
    const printCss = `<style>
      @media print {
        @page { margin: 10mm; size: A4 portrait; }
        body { margin: 0 !important; padding: 0 !important; }
      }
    </style>`;
    const emailHtml = renderMailingHtml(document).replace("</head>", `${printCss}</head>`);

    const win = window.open("", "_blank", "width=720,height=900");
    if (!win) {
      void Swal.fire({
        title: "Ventana emergente bloqueada",
        text: "Permite las ventanas emergentes para este sitio e inténtalo nuevamente.",
        icon: "warning",
        confirmButtonText: "Entendido",
      });
      return;
    }
    win.document.write(emailHtml);
    win.document.close();
    // Esperar a que imágenes y estilos carguen antes de imprimir
    win.addEventListener("load", () => {
      setTimeout(() => {
        win.focus();
        win.print();
        win.addEventListener("afterprint", () => win.close());
      }, 400);
    });
  };

  // ── Handlers de documento ────────────────────────────────────────────────

  const handleNewDraft = () => setShowNewModal(true);

  const handleScratch = (mode: ScratchMode) => {
    if (mode === "dragdrop") {
      replaceDocument(createDefaultMailing(), null);
      setVersionNote("");
    } else {
      toast({
        title: "Próximamente",
        description: `El ${mode === "simple" ? "editor sencillo" : "editor HTML"} estará disponible próximamente.`,
      });
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = mailingTemplates.find((t) => t.id === templateId);
    if (!template) {
      // IDs mock sin template real → crear en blanco
      replaceDocument(createDefaultMailing(), null);
      setVersionNote("");
      return;
    }
    replaceDocument(template.build(), null);
    setVersionNote("");
    toast({ title: "Template aplicado", description: `${template.label} quedó cargado en el canvas.` });
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    void Swal.fire({
      title: "Guardando borrador…",
      html: `<p style="color:#64748b;font-size:13px;margin:0">Almacenando el mailing en el servidor</p>`,
      allowOutsideClick: false, allowEscapeKey: false, showConfirmButton: false,
      customClass: { popup: "swal-brand-popup", title: "swal-brand-title" },
      didOpen: () => Swal.showLoading(),
    });
    const result = await saveDraft({ mailingId: activeMailingId, userId: user.id, document });
    if (!result.savedId) {
      await Swal.fire({
        title: "No se pudo guardar",
        html: `<p style="color:#64748b;font-size:13px;margin-top:6px">Revisa tu sesión e inténtalo nuevamente.</p>`,
        icon: "error", confirmButtonText: "Cerrar",
        customClass: { popup: "swal-brand-popup", title: "swal-brand-title", confirmButton: "swal-brand-cancel" },
      });
      return;
    }
    setActiveMailingId(result.savedId);
    setLastAutosaveAt(new Date().toISOString());
    void saveVersion({ mailingId: result.savedId, userId: user.id, document, note: buildDraftNote(user, document.name) });
    await Swal.fire({
      title: "Borrador guardado",
      html: `<p style="color:#64748b;font-size:13px;margin-top:6px">El mailing quedó almacenado correctamente.</p>`,
      icon: "success", timer: 2500, timerProgressBar: true, showConfirmButton: false,
      customClass: { popup: "swal-brand-popup", title: "swal-brand-title", icon: "swal-brand-icon", timerProgressBar: "swal-brand-progress" },
    });
  };

  const handleSaveAndExit = async () => {
    if (user) {
      const result = await saveDraft({ mailingId: activeMailingId, userId: user.id, document });
      if (result.savedId) {
        setActiveMailingId(result.savedId);
        setLastAutosaveAt(new Date().toISOString());
        void saveVersion({ mailingId: result.savedId, userId: user.id, document, note: buildDraftNote(user, document.name) });
      }
    }
    setShowCampaignSettings(true);
  };

  const handleSaveVersion = async () => {
    if (!user) return;
    const mailingId = activeMailingId ?? await saveDraft({ userId: user.id, document }).then((r) => r.savedId);
    if (!mailingId) { toast({ title: "No se pudo versionar", description: "Primero necesitamos guardar el mailing.", variant: "destructive" }); return; }
    setActiveMailingId(mailingId);
    const result = await saveVersion({ mailingId, userId: user.id, document, note: versionNote });
    if (!result.versionNumber) { toast({ title: "No se pudo crear la versión", description: "Inténtalo nuevamente.", variant: "destructive" }); return; }
    setVersionNote("");
    toast({ title: `Versión v${result.versionNumber} creada`, description: "El snapshot quedó guardado en el historial." });
  };

  const handleLoadMailing = async (mailingId: string) => {
    const selected = mailings.find((m) => m.id === mailingId);
    if (!selected) return;
    replaceDocument(selected.document, selected.id);
    await loadVersions(selected.id);
    toast({ title: "Mailing cargado", description: "Se cargó el borrador seleccionado." });
  };

  const handleRestoreVersion = (versionId: string) => {
    const version = versions.find((v) => v.id === versionId);
    if (!version || !activeMailingId || !user) return;
    replaceDocument(version.snapshot, activeMailingId);
    void saveDraft({ mailingId: activeMailingId, userId: user.id, document: version.snapshot }).then((result) => {
      if (result.savedId) {
        void saveVersion({ mailingId: result.savedId, userId: user.id, document: version.snapshot, note: `Restaurado desde v${version.versionNumber}` });
      }
    });
    toast({ title: `Versión v${version.versionNumber} restaurada`, description: "El canvas volvió al snapshot seleccionado." });
  };

  // ── Callbacks estables para el canvas ────────────────────────────────────

  const handleSelectBlockInCanvas = useCallback(
    (blockId: string, rowId: string, colId: string) => {
      setShowGlobalInspector(false);
      selectBlock(blockId, rowId, colId);
    },
    [selectBlock],
  );

  // ── Inspector ─────────────────────────────────────────────────────────────

  const isInspectorOpen = showGlobalInspector || !!selectedBlock;

  const handleOpenGlobalInspector = () => { selectBlock(null); setShowGlobalInspector(true); };
  const handleCloseInspector = () => { selectBlock(null); setShowGlobalInspector(false); };

  const blockMeta = selectedBlock ? {
    hero:   { icon: ImageIcon,           label: "Hero",         detail: "imagen, título, CTA" },
    text:   { icon: Type,                label: "Texto",        detail: "HTML, tipografía" },
    image:  { icon: ImageIcon,           label: "Imagen",       detail: "src, alt, link" },
    button: { icon: MousePointerClick,   label: "Botón",        detail: "label, href, alineación" },
    spacer: { icon: RectangleHorizontal, label: "Espaciador",   detail: "altura" },
  }[selectedBlock.type] : null;

  useEffect(() => {
    if (!isInspectorOpen) return;
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (inspectorRef.current?.contains(target)) return;
      if (globalInspectorButtonRef.current?.contains(target)) return;
      if (target.closest('[data-mailing-block="true"]')) return;
      if (target.closest('[role="dialog"]') || target.closest('[data-radix-dialog-overlay]')) return;
      handleCloseInspector();
    };
    window.document.addEventListener("mousedown", handler);
    return () => window.document.removeEventListener("mousedown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInspectorOpen]);

  // ── Grupos de bloques ─────────────────────────────────────────────────────

  const groupedBlocks = Object.values(blockRegistry).reduce<Record<string, typeof blockRegistry[keyof typeof blockRegistry][]>>(
    (acc, def) => { acc[def.category] ??= []; acc[def.category].push(def); return acc; },
    {},
  );

  const SaveIcon = saveIcon;

  // ─────────────────────────────────────────────────────────────────────────
  // Brand CSS vars — injected at root so all children inherit via cascade
  // ─────────────────────────────────────────────────────────────────────────

  const activeBrandColor = document.settings.brand
    ? brandThemes[document.settings.brand]?.primaryColor
    : undefined;

  const brandCssVars = {
    "--mb-brand":         activeBrandColor ?? "hsl(var(--primary))",
    "--mb-brand-10":      activeBrandColor ? `${activeBrandColor}1a` : "hsl(var(--primary) / 0.10)",
    "--mb-brand-30":      activeBrandColor ? `${activeBrandColor}4d` : "hsl(var(--primary) / 0.30)",
    "--mb-brand-50":      activeBrandColor ? `${activeBrandColor}80` : "hsl(var(--primary) / 0.50)",
    "--brand-primary":    activeBrandColor ?? "hsl(var(--primary))",
  } as React.CSSProperties;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background" style={brandCssVars}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-card">
        <div className="grid h-14 grid-cols-[200px_1fr_auto] items-center gap-4 px-5">

          {/* Left: title + save status */}
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground leading-none">Mailing Cencosud</span>
            <div className="flex items-center gap-1.5">
              <SaveIcon className={`h-3 w-3 shrink-0 ${saveIconClass}`} />
              <span className="text-[11px] text-muted-foreground">{saveLabel}</span>
            </div>
          </div>

          {/* Center: editable campaign name */}
          <div className="flex flex-col items-center">
            <input
              type="text"
              value={document.name}
              onChange={(e) => updateDocumentName(e.target.value)}
              placeholder="Nombre de la campaña"
              className="w-full max-w-xs rounded-md bg-transparent px-2 py-0.5 text-center text-[15px] font-semibold text-foreground outline-none placeholder:text-muted-foreground/40 transition-colors hover:bg-secondary/50 focus:bg-secondary/50"
            />
            {document.settings.brand && (
              <span className="text-[11px] leading-none text-muted-foreground/50">
                Editando plantilla {brandThemes[document.settings.brand]?.name}
              </span>
            )}
          </div>

          {/* Right: brand selector + actions */}
          <div className="flex items-center gap-2">

            {/* Brand segmented control */}
            <div className="flex items-center gap-0.5 rounded-lg border border-border bg-secondary/40 p-0.5">
              {Object.values(brandThemes).map((theme) => {
                const isActive = document.settings.brand === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => updateSettings("brand", isActive ? undefined : theme.id as BrandId)}
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200"
                    style={isActive ? {
                      backgroundColor: theme.primaryColor,
                      color: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                    } : {
                      color: "hsl(var(--muted-foreground))",
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full transition-colors"
                      style={{ backgroundColor: isActive ? "rgba(255,255,255,0.7)" : theme.primaryColor }}
                    />
                    {theme.name}
                  </button>
                );
              })}
            </div>

            <div className="h-5 w-px bg-border" />

            <Button variant="ghost" size="sm" onClick={handleNewDraft} className="h-8 px-3 text-xs">
              <Plus className="mr-1.5 h-3.5 w-3.5" />Nuevo
            </Button>
            <Button variant="outline" size="sm" onClick={() => void handleCopyHtml()} className="h-8 px-3 text-xs">
              <Copy className="mr-1.5 h-3.5 w-3.5" />Copiar HTML
            </Button>
            <Button size="sm" onClick={() => setShowDownloadModal(true)} className="h-8 px-3 text-xs">
              <Download className="mr-1.5 h-3.5 w-3.5" />Descargar
            </Button>

            <Button
              size="sm"
              onClick={() => void handleSaveAndExit()}
              disabled={saving}
              className="h-8 rounded-full bg-foreground px-4 text-xs font-semibold text-background hover:bg-foreground/90"
            >
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Guardar y salir
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  onClick={() => {
                    setShowVersionHistoryModal(true);
                    if (activeMailingId) {
                      void loadVersions(activeMailingId).then((loaded) => {
                        const mostRecent = loaded.length > 0
                          ? [...loaded].sort((a, b) => b.versionNumber - a.versionNumber)[0]
                          : null;
                        setSelectedVersionId(mostRecent?.id ?? null);
                      });
                    }
                  }}
                  disabled={loading || !activeMailingId}
                >
                  <History className="mr-2 h-4 w-4" />Historial de versiones
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const skip = localStorage.getItem("mailing-builder:devmode-skip-warning") === "1";
                    if (skip) { setShowDevMode(true); } else { setShowDevModeWarning(true); }
                  }}
                >
                  <CodeXml className="mr-2 h-4 w-4" />Modo de desarrollador
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void handleSaveDraft()} disabled={!user || saving}>
                  <Save className="mr-2 h-4 w-4" />Guardar borrador
                </DropdownMenuItem>
                {/* PDF export — hidden, pending integration */}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    void Swal.fire({
                      title: "¿Descartar plantilla?",
                      text: "Los cambios no guardados se perderán y volverás a la selección de marca.",
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonText: "Sí, descartar",
                      cancelButtonText: "Cancelar",
                      confirmButtonColor: "#ef4444",
                      cancelButtonColor: "#6b7280",
                      reverseButtons: true,
                      focusCancel: true,
                    }).then((result) => {
                      if (result.isConfirmed) {
                        replaceDocument(createDefaultMailing(), null);
                      }
                    });
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />Descartar plantilla
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ── Welcome screen ─────────────────────────────────────────────────── */}
      {showWelcome && !showCampaignSettings && (
        <BrandWelcomeScreen
          onSelectBrand={(brandId) => {
            updateSettings("brand", brandId);
            setShowWelcome(false);
          }}
          onNewTemplate={() => {
            setShowNewModal(true);
            setShowWelcome(false);
          }}
          onSkip={() => setShowWelcome(false)}
        />
      )}

      {/* ── Campaign settings screen ────────────────────────────────────────── */}
      {showCampaignSettings && (
        <CampaignSettingsScreen
          document={document}
          htmlPreview={htmlPreview}
          saving={saving}
          onBack={() => setShowCampaignSettings(false)}
          onSave={async () => {
            await handleSaveDraft();
          }}
          onChangeSetting={(key, value) => (updateSettings as (k: string, v: string) => void)(key, value)}
          onChangeName={(name) => updateDocumentName(name)}
        />
      )}

      {/* ── Cuerpo de 3 columnas ────────────────────────────────────────────── */}
      {!showWelcome && !showCampaignSettings && <div
        className="grid min-h-0 flex-1 gap-0 transition-all duration-300"
        style={{ gridTemplateColumns: isInspectorOpen ? "272px minmax(0,1fr) 340px" : "272px minmax(0,1fr) 0px" }}
      >

        {/* ── Panel izquierdo ─────────────────────────────────────────────── */}
        <aside className="flex h-full flex-col border-r border-border bg-card">
          <Tabs defaultValue="bloques" className="flex h-full min-h-0 flex-col">
            <TabsList className="h-10 w-full shrink-0 rounded-none border-b border-border bg-card p-0">
              <TabsTrigger
                value="bloques"
                className="h-full flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                Bloques
              </TabsTrigger>
              <TabsTrigger
                value="secciones"
                className="h-full flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                Secciones
              </TabsTrigger>
              <TabsTrigger
                value="guardado"
                className="h-full flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                Guardado
              </TabsTrigger>
            </TabsList>

            {/* Tab Bloques */}
            <TabsContent value="bloques" className="m-0 min-h-0 flex-1">
              <ScrollArea className="h-full">
                <div className="space-y-4 p-4">
                  {Object.entries(groupedBlocks).map(([category, items]) => (
                    <section key={category} className="space-y-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                        {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {items.map((definition) => (
                          <button
                            key={definition.type}
                            type="button"
                            draggable
                            onDragStart={(e) => {
                              dragRef.current = null;
                              e.dataTransfer.setData("text/plain", `new:${definition.type}`);
                              e.dataTransfer.setData("application/mailing-block", `new:${definition.type}`);
                              e.dataTransfer.effectAllowed = "all";
                            }}
                            onClick={() => { insertBlock(definition.type); setShowGlobalInspector(false); }}
                            className="group relative flex cursor-grab flex-col gap-1.5 rounded-lg border border-border bg-card p-2 text-left transition hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm active:cursor-grabbing active:scale-[0.97]"
                            title={`Arrastra o haz clic para insertar ${definition.label}`}
                          >
                            <GripVertical className="absolute right-1.5 top-1.5 h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground/60" />
                            <BlockMiniThumb type={definition.type} />
                            <span className="text-xs font-medium leading-tight text-foreground">{definition.label}</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Tab Secciones — visual layout picker */}
            {/* Plain overflow div instead of ScrollArea: Radix injects display:table on its
                viewport inner child, which breaks flex width containment in the sidebar. */}
            <TabsContent value="secciones" className="m-0 min-h-0 flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto overflow-x-hidden">
                <SectionLayoutPicker />
              </div>
            </TabsContent>

            {/* Tab Guardado */}
            <TabsContent value="guardado" className="m-0 min-h-0 flex-1">
              <ScrollArea className="h-full">
                <div className="space-y-4 p-4">
                  <Input value={versionNote} onChange={(e) => setVersionNote(e.target.value)} placeholder="Nota para la versión" />
                  <div className="grid gap-1.5">
                    {loading ? <p className="text-xs text-muted-foreground">Cargando…</p> : null}
                    {mailings.slice(0, 6).map((mailing) => (
                      <button
                        key={mailing.id}
                        type="button"
                        onClick={() => void handleLoadMailing(mailing.id)}
                        className={`rounded-md border px-3 py-2 text-left transition ${
                          activeMailingId === mailing.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <p className="text-sm font-medium text-foreground">{mailing.name}</p>
                        <p className="text-xs text-muted-foreground">
                          v{mailing.currentVersion} · {new Date(mailing.updatedAt).toLocaleDateString("es-CL")}
                        </p>
                      </button>
                    ))}
                  </div>

                  {versions.length > 0 && (
                    <div className="space-y-2 rounded-md border border-border p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Historial</p>
                      {versions.map((version) => (
                        <div key={version.id} className="flex items-start justify-between gap-2 text-xs">
                          <div>
                            <p className="font-medium text-foreground">v{version.versionNumber}</p>
                            {version.note ? (() => {
                              const { author, email, template } = parseDraftNote(version.note);
                              return (
                                <>
                                  {author   && <p className="text-foreground/80">{author}</p>}
                                  {email    && <p className="text-muted-foreground truncate">{email}</p>}
                                  {template && <p className="text-muted-foreground/70 truncate italic">{template}</p>}
                                </>
                              );
                            })() : <p className="text-muted-foreground">Sin nota</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{new Date(version.createdAt).toLocaleDateString("es-CL")}</span>
                            <Button size="icon" variant="ghost" onClick={() => handleRestoreVersion(version.id)}>
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>

        {/* ── Canvas central ──────────────────────────────────────────────── */}
        <section
          className={`relative min-h-0 transition-colors duration-150 ${dropIndex !== null ? "bg-violet-50/60 dark:bg-violet-950/20" : ""}`}
          style={activeBrandColor && dropIndex === null ? {
            backgroundColor: `${activeBrandColor}0a`,
            transition: "background-color 250ms ease",
          } : { backgroundColor: "hsl(var(--secondary) / 0.35)" }}
          {...canvasDropHandlers}
        >
          <div className="h-full overflow-y-auto" style={{ scrollBehavior: "smooth" }}>
          <div className="px-8 py-6">
          <div
            className="mx-auto flex max-w-[820px] flex-col rounded-lg bg-card transition-colors duration-250"
            style={{
              boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.07), 0 16px 40px rgba(0,0,0,0.06)",
            }}
          >

            {/* ── Split header: marca (izq, rojo) → curva blob → tabs (der, blanco) ── */}
            <div className="relative flex flex-shrink-0" style={{ height: "52px" }}>

              {/* ── IZQUIERDA: zona de marca — fondo rojo/brand ─────────── */}
              {/* Capa blob: maneja forma y color — contenida en 52px */}
              <div
                className="relative z-20 flex-shrink-0"
                style={{
                  backgroundColor: activeBrandColor ?? "#df060f",
                  borderRadius: "0.5rem 0.1rem 3.5rem 0px",
                  marginRight: "-0.1rem",
                  transition: "background-color 0.2s ease",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                }}
              >
                {/* Capa de contenido: centra exactamente dentro de los 52px visibles */}
                <div
                  className="flex items-center gap-2.5 pl-4 pr-5"
                  style={{ height: "52px" }}
                >
                  {/* Identidad de marca */}
                  <div className="flex select-none flex-col justify-center leading-none">
                    <span className="text-[13px] font-black uppercase tracking-widest text-white">
                      {document.settings.brand
                        ? brandThemes[document.settings.brand]?.name
                        : "Sin marca"}
                    </span>
                    <span
                      className="mt-[3px] text-[8px] uppercase tracking-[0.16em]"
                      style={{ color: "rgba(255,255,255,0.50)" }}
                    >
                      {document.settings.brand ? "Mailing activo" : "Selecciona una marca"}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── DERECHA: zona blanca — settings + tabs pill ─────────── */}
              <div
                className="relative z-10 flex flex-1 items-center justify-end gap-2 pr-4"
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "0 0.5rem 0 0",
                  paddingLeft: "0.5rem",
                }}
              >
                {/* Botón inspector global */}
                <button
                  ref={globalInspectorButtonRef}
                  type="button"
                  onClick={handleOpenGlobalInspector}
                  title="Configuración global"
                  className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                  style={{
                    backgroundColor: showGlobalInspector && !selectedBlock ? "#f1f5f9" : "transparent",
                    color: "#64748b",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Settings2 className="h-3.5 w-3.5" />
                </button>

                {/* Device toggle — estilo oscuro con activo violeta */}
                <div
                  className="flex items-center gap-0.5 rounded-full p-0.5"
                  style={{ backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}
                >
                  {([
                    { value: "desktop", Icon: Monitor,    title: "Vista escritorio" },
                    { value: "mobile",  Icon: Smartphone, title: "Vista móvil" },
                  ] as { value: "desktop" | "mobile"; Icon: React.ElementType; title: string }[]).map(({ value, Icon, title }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDevicePreview(value)}
                      title={title}
                      className="flex items-center justify-center rounded-full p-1.5 transition-all duration-150"
                      style={devicePreview === value
                        ? { backgroundColor: "#ffffff", color: "#818cf8", boxShadow: "rgba(129,140,248,0.3) 0px 0px 0px 1px inset" }
                        : { color: "#94a3b8" }
                      }
                    >
                      <Icon className="h-[13px] w-[13px]" />
                    </button>
                  ))}
                </div>

                {/* Tabs pill — Canvas / Vista previa / HTML */}
                <div
                  className="flex items-center gap-0.5 rounded-full p-0.5"
                  style={{ backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}
                >
                  {(
                    [
                      { value: "canvas", Icon: PenSquare, label: "Canvas" },
                      { value: "split",  Icon: Eye,       label: "Vista previa" },
                      { value: "html",   Icon: CodeXml,   label: "HTML" },
                    ] as { value: "canvas" | "split" | "html"; Icon: React.ElementType; label: string }[]
                  ).map(({ value, Icon, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPreviewMode(value)}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-all"
                      style={previewMode === value ? {
                        backgroundColor: "#fff",
                        color: activeBrandColor ?? "#1e293b",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                      } : {
                        color: "#64748b",
                        backgroundColor: "transparent",
                      }}
                    >
                      <Icon className="h-3 w-3 shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="h-full overflow-y-auto" style={{ scrollBehavior: "smooth" }}>
              <div
                className="p-6"
                style={{
                  backgroundColor: "#F0F0F0",
                  backgroundImage: "radial-gradient(circle, #d4d4d4 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              >
                <div className="grid-cols-1">

                  {/* Canvas de edición */}
                  {previewMode === "canvas" ? (
                    <div
                      className={`mx-auto min-h-full w-full rounded-xl border border-border/60 bg-card p-3 shadow-sm transition-all duration-300 ${
                        devicePreview === "mobile" ? "rounded-[2rem] border-2" : ""
                      }`}
                      style={{ maxWidth: devicePreview === "mobile" ? "407px" : `${document.settings.width + 32}px` }}
                    >
                      {devicePreview === "mobile" && (
                        <div className="mb-2 flex justify-center">
                          <div className="h-1 w-12 rounded-full bg-border" />
                        </div>
                      )}
                      <div className="mx-auto" style={{ width: devicePreview === "mobile" ? "375px" : `${document.settings.width}px`, maxWidth: "100%" }}>

                        {/* Empty state o filas */}
                        {document.rows.length === 0 ? (
                          <CanvasEmptyState
                            onApplyTemplate={handleApplyTemplate}
                            onAddRow={(layoutId) => addRowFromLayout(layoutId)}
                          />
                        ) : (
                          <div className="space-y-2" ref={rowsContainerRef}>
                            {document.rows.map((row, rowIndex) => (
                              <React.Fragment key={row.id}>
                                {dropIndex === rowIndex && <RowDropIndicator />}
                                <div data-row-drop>
                                  <RowCanvas
                                    row={row}
                                    rowIndex={rowIndex}
                                    totalRows={document.rows.length}
                                    selectedBlockId={selectedBlockId}
                                    selectedColId={selectedColId}
                                    selectedRowId={selectedRowId}
                                    selectedLevel={selectedLevel}
                                    devicePreview={devicePreview}
                                    dragRef={dragRef}
                                    rowDragRef={rowDragRef}
                                    onSelectBlock={handleSelectBlockInCanvas}
                                    onSelectRow={selectRow}
                                    onSelectCol={selectCol}
                                    onUpdateBlock={updateBlock}
                                    onRemoveBlock={removeBlock}
                                    onDuplicateBlock={duplicateBlock}
                                    onMoveBlockWithinColumn={moveBlockWithinColumn}
                                    onMoveBlockToColumn={moveBlockToColumn}
                                    onMoveRow={moveRow}
                                    onDuplicateRow={duplicateRow}
                                    onRemoveRow={removeRow}
                                    onSetRowPreset={setRowPreset}
                                    onInsertBlock={insertBlockAtColumn}
                                    onMutateRowLayout={mutateRowLayout}
                                  />
                                </div>
                              </React.Fragment>
                            ))}
                            {dropIndex === document.rows.length && <RowDropIndicator />}
                          </div>
                        )}

                        {/* Botón añadir fila (solo cuando hay filas) */}
                        {document.rows.length > 0 && (
                          <div className="mt-3">
                            <AddRowButton onAdd={(layoutId) => addRowFromLayout(layoutId)} />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* Vista previa — iframe escalado según devicePreview */}
                  {previewMode === "split" ? (() => {
                    const docWidth   = document.settings.width ?? 600;
                    const mobileW    = 375;
                    const isMobile   = devicePreview === "mobile";
                    const scale      = isMobile ? mobileW / docWidth : 1;
                    const iframeH    = 900;
                    const clipH      = Math.round(iframeH * scale);
                    return (
                      <div className={`mx-auto transition-all duration-300 ${
                        isMobile
                          ? "w-[407px] rounded-[2rem] border-2 border-border bg-background p-2"
                          : "w-full"
                      }`}>
                        {isMobile && (
                          <div className="mb-2 flex justify-center pt-1">
                            <div className="h-1 w-12 rounded-full bg-border" />
                          </div>
                        )}
                        {/* Clip container — recorta al alto escalado para evitar espacio vacío */}
                        <div
                          className="relative overflow-hidden rounded-md bg-white"
                          style={isMobile ? { width: `${mobileW}px`, height: `${clipH}px`, margin: "0 auto" } : {}}
                        >
                          <iframe
                            title="Vista previa"
                            className="border-0 bg-white"
                            style={{
                              width:  `${docWidth}px`,
                              height: `${iframeH}px`,
                              transform: isMobile ? `scale(${scale})` : undefined,
                              transformOrigin: "top left",
                              display: "block",
                              ...(!isMobile ? { width: "100%", maxWidth: "100%" } : {}),
                            }}
                            srcDoc={htmlPreview}
                          />
                        </div>
                      </div>
                    );
                  })() : null}

                  {/* HTML + compatibilidad */}
                  {previewMode === "html" ? (
                    <div className="space-y-4">
                      <div className="rounded-md border border-border bg-background p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">Compatibilidad email</p>
                          <span className="text-xs text-muted-foreground">Score {compatibility.score}/100</span>
                        </div>
                        <div className="space-y-2">
                          {compatibility.issues.length
                            ? compatibility.issues.map((issue) => (
                              <div key={issue.id} className="rounded-md border border-border px-3 py-2 text-xs">
                                <p className="font-medium text-foreground">{issue.severity === "warning" ? "Warning" : "Info"}</p>
                                <p className="text-muted-foreground">{issue.message}</p>
                              </div>
                            ))
                            : <p className="text-xs text-muted-foreground">No se detectaron alertas básicas de compatibilidad.</p>}
                        </div>
                        {trackedLinks.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="text-sm font-semibold text-foreground">Link Manager / UTMs</p>
                            {trackedLinks.map((link) => (
                              <div key={link.id} className="rounded-md border border-border px-3 py-2 text-xs">
                                <p className="font-medium text-foreground">{link.label}</p>
                                <p className="break-all text-muted-foreground">{link.url}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <pre className="mt-4 max-h-56 overflow-auto rounded-md border border-border bg-secondary/35 p-3 text-[11px] leading-5 text-foreground whitespace-pre-wrap">
                          {htmlPreview}
                        </pre>
                      </div>
                    </div>
                  ) : null}

                </div>
              </div>
            </div>
          </div>
          </div>
          </div>
        </section>

        {/* ── Panel derecho — inspector ────────────────────────────────────── */}
        <aside
          ref={inspectorRef}
          className={`flex h-full flex-col overflow-hidden border-l border-border bg-card ${
            isInspectorOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {isInspectorOpen && (
            <>
              {/* Header del inspector */}
              <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  {selectedBlock && blockMeta ? (
                    <>
                      <blockMeta.icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">{blockMeta.label}</span>
                    </>
                  ) : (
                    <>
                      <Settings2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Configuración</span>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCloseInspector}
                  className="rounded-md p-1 text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Contenido scrollable */}
              <ScrollArea className="flex-1">
                <div className="space-y-6 px-5 py-5">

                  {/* Inspector de bloque seleccionado */}
                  {selectedBlock ? (
                    <>
                      {/* Inspector específico del bloque */}
                      {SelectedInspector && (
                        <SelectedInspector block={selectedBlock as never} onChange={updateBlock} />
                      )}
                    </>
                  ) : (
                    /* Inspector global */
                    <div className="space-y-5">

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/55">Documento</span>
                          <div className="h-px flex-1 bg-border/60" />
                        </div>
                        <div className="space-y-2">
                          <Input value={document.name} onChange={(e) => updateDocumentName(e.target.value)} placeholder="Nombre del mailing" className="h-8 text-sm" />
                          <Input value={document.settings.subject ?? ""} onChange={(e) => updateSettings("subject", e.target.value)} placeholder="Subject del email" className="h-8 text-sm" />
                          <Textarea rows={2} value={document.settings.preheader ?? ""} onChange={(e) => updateSettings("preheader", e.target.value)} placeholder="Preheader (texto preview)" className="resize-none text-sm" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/55">Diseño global</span>
                          <div className="h-px flex-1 bg-border/60" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <span className="text-xs text-foreground/60">Ancho (px)</span>
                            <Input type="number" value={document.settings.width} onChange={(e) => updateSettings("width", Number(e.target.value) || 600)} className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs text-foreground/60">Fuente</span>
                            <Input value={document.settings.fontFamily} onChange={(e) => updateSettings("fontFamily", e.target.value)} placeholder="Arial…" className="h-8 text-sm" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/55">Tracking UTM</span>
                          <div className="h-px flex-1 bg-border/60" />
                        </div>
                        <label className="flex items-center justify-between gap-3">
                          <span className="text-xs text-foreground/70">Activar tracking</span>
                          <input
                            type="checkbox"
                            checked={document.settings.linkTracking.enabled}
                            onChange={(e) => updateLinkTracking("enabled", e.target.checked)}
                            className="h-4 w-4 rounded border-border accent-primary"
                          />
                        </label>
                        {document.settings.linkTracking.enabled && (
                          <div className="space-y-2">
                            <Input value={document.settings.linkTracking.utmSource} onChange={(e) => updateLinkTracking("utmSource", e.target.value)} placeholder="utm_source" className="h-7 text-xs" />
                            <Input value={document.settings.linkTracking.utmMedium} onChange={(e) => updateLinkTracking("utmMedium", e.target.value)} placeholder="utm_medium" className="h-7 text-xs" />
                            <Input value={document.settings.linkTracking.utmCampaign} onChange={(e) => updateLinkTracking("utmCampaign", e.target.value)} placeholder="utm_campaign" className="h-7 text-xs" />
                            <Input value={document.settings.linkTracking.promoName ?? ""} onChange={(e) => updateLinkTracking("promoName", e.target.value)} placeholder="nombre_promo" className="h-7 text-xs" />
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </aside>
      </div>}

      {/* ── Modal: nuevo mailing ────────────────────────────────────────────── */}
      <NewTemplateModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onScratch={handleScratch}
        onUseTemplate={handleApplyTemplate}
        onUseSaved={(id) => { void handleLoadMailing(id); }}
        savedMailings={mailings.map((m) => ({
          id: m.id,
          name: m.name,
          updatedAt: m.updatedAt,
          currentVersion: m.currentVersion,
        }))}
        loadingSaved={loading}
      />

      <ImageLibraryModal />

      {/* ── Modal: historial de versiones ───────────────────────────────────── */}
      <Dialog
        open={showVersionHistoryModal}
        onOpenChange={(v) => {
          setShowVersionHistoryModal(v);
        }}
      >
        <DialogContent className="gap-0 p-0 overflow-hidden max-w-4xl w-full h-[600px] flex flex-col">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
                <History className="h-4 w-4 text-violet-600" />
              </div>
              <DialogTitle className="text-sm font-semibold leading-none">Historial de versiones</DialogTitle>
            </div>
          </DialogHeader>

          {/* ── Body: preview + list ── */}
          <div className="flex flex-1 min-h-0">

            {/* Left panel — scaled iframe preview */}
            <div className="flex-1 relative overflow-hidden bg-muted/30 border-r border-border/50">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-violet-500" />
                </div>
              ) : versions.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <History className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No hay versiones guardadas aún</p>
                </div>
              ) : (() => {
                const previewVersion = versions.find((v) => v.id === selectedVersionId) ?? null;
                const previewHtml = previewVersion ? renderMailingHtml(previewVersion.snapshot) : "";
                const PREVIEW_WIDTH = 600;
                // Container width ≈ (max-w-4xl - w-72) ≈ ~584px; use a fixed scale
                const SCALE = 0.45;
                const containerH = Math.round((PREVIEW_WIDTH * SCALE) * (4 / 3));
                return previewVersion ? (
                  <div
                    className="absolute inset-0 flex items-start justify-center pt-6"
                  >
                    <div
                      className="relative overflow-hidden rounded-xl border border-border/60 shadow-sm bg-white"
                      style={{ width: Math.round(PREVIEW_WIDTH * SCALE), height: containerH }}
                    >
                      <div
                        style={{
                          width: PREVIEW_WIDTH,
                          height: Math.round(containerH / SCALE),
                          transformOrigin: "top left",
                          transform: `scale(${SCALE})`,
                          pointerEvents: "none",
                        }}
                      >
                        <iframe
                          srcDoc={previewHtml}
                          title={`Vista previa v${previewVersion.versionNumber}`}
                          scrolling="no"
                          style={{
                            width: PREVIEW_WIDTH,
                            height: Math.round(containerH / SCALE),
                            border: "none",
                            display: "block",
                            pointerEvents: "none",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Right panel — version list + restore button */}
            <div className="w-72 shrink-0 flex flex-col">
              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                  </div>
                ) : versions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground px-6 text-center">
                    <History className="h-7 w-7 opacity-30" />
                    <p className="text-xs">No hay versiones guardadas aún</p>
                  </div>
                ) : (() => {
                  const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
                  const latestNumber = sorted[0]?.versionNumber ?? -1;
                  return sorted.map((v, idx) => {
                    const isSelected = v.id === selectedVersionId;
                    const isCurrent = v.versionNumber === latestNumber;
                    return (
                      <div key={v.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedVersionId(v.id)}
                          className={`w-full text-left px-4 py-3.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                            isSelected
                              ? "bg-violet-50 border-l-2 border-violet-500"
                              : "border-l-2 border-transparent hover:bg-muted/60"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-foreground">
                              v{v.versionNumber}
                            </span>
                            {isCurrent && (
                              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 leading-none">
                                Versión actual
                              </span>
                            )}
                          </div>
                          {v.note ? (() => {
                            const { author, email, template } = parseDraftNote(v.note);
                            return (
                              <>
                                {author && <p className="text-xs font-medium text-foreground/90 truncate">{author}</p>}
                                {email   && <p className="text-[11px] text-muted-foreground truncate">{email}</p>}
                                {template && <p className="text-[11px] text-muted-foreground/70 truncate italic">{template}</p>}
                              </>
                            );
                          })() : <span className="text-xs text-muted-foreground">Sin nota</span>}
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {formatDateTime(v.createdAt)}
                          </p>
                        </button>
                        {idx < sorted.length - 1 && (
                          <div className="mx-4 border-b border-border/50" />
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Sticky footer — Restaurar button */}
              <div className="shrink-0 border-t border-border/50 px-4 py-3.5">
                {(() => {
                  const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
                  const latestNumber = sorted[0]?.versionNumber ?? -1;
                  const selectedVersion = versions.find((v) => v.id === selectedVersionId);
                  const isCurrentVersion = selectedVersion?.versionNumber === latestNumber;
                  return (
                    <Button
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium"
                      disabled={!selectedVersionId || isCurrentVersion || versions.length === 0}
                      onClick={() => {
                        if (selectedVersionId) {
                          handleRestoreVersion(selectedVersionId);
                          setShowVersionHistoryModal(false);
                        }
                      }}
                    >
                      <RotateCcw className="mr-2 h-3.5 w-3.5" />
                      Restaurar
                    </Button>
                  );
                })()}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal: descargar ─────────────────────────────────────────────────── */}
      <Dialog
        open={showDownloadModal}
        onOpenChange={(v) => {
          if (downloadingJpg) return;
          setShowDownloadModal(v);
          if (!v) setJpgDone(false);
        }}
      >
        <DialogContent className="gap-0 p-0 overflow-hidden max-w-md">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Download className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold leading-none">Exportar mailing</DialogTitle>
                <p className="mt-1 text-[12px] text-muted-foreground">Elige el formato de descarga</p>
              </div>
            </div>
          </DialogHeader>

          {/* ── Thumbnail preview ── */}
          <div className="px-6 pt-5 pb-3">
            {/* iframe container: 220px wide, ~300px tall. The iframe is rendered at
                600px and scaled down via CSS transform so layout is accurate. */}
            <div
              className="relative mx-auto overflow-hidden rounded-xl border border-border/60 bg-muted/30 shadow-sm"
              style={{ width: 220, height: 300 }}
            >
              <div style={{ width: 600, height: 300 / (220 / 600), transformOrigin: "top left", transform: `scale(${220 / 600})`, pointerEvents: "none" }}>
                <iframe
                  srcDoc={htmlPreview}
                  title="Vista previa del mailing"
                  scrolling="no"
                  style={{
                    width: 600,
                    height: 300 / (220 / 600),
                    border: "none",
                    display: "block",
                    pointerEvents: "none",
                  }}
                />
              </div>

              {/* Overlay while generating */}
              {downloadingJpg && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-background/70 backdrop-blur-[2px]">
                  <Loader2 className="h-7 w-7 animate-spin text-violet-500" />
                  <span className="text-[11px] font-medium text-foreground/70">Generando imagen…</span>
                </div>
              )}

              {/* Done overlay */}
              {jpgDone && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-emerald-500/10 backdrop-blur-[2px]">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                  <span className="text-[11px] font-medium text-emerald-600">¡Descargado!</span>
                </div>
              )}
            </div>

            {/* Metadata line below thumbnail */}
            <p className="mt-2 text-center text-[11px] text-muted-foreground truncate">
              {`${document.settings.width}px · JPG · ${document.name || "mailing"}`}
            </p>
          </div>

          <div className="px-4 pb-3 space-y-2.5">
            {/* HTML */}
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="group w-full flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm active:scale-[0.99]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/60 transition-colors group-hover:border-primary/30 group-hover:bg-primary/10">
                <FileCode2 className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-foreground">Archivo HTML</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">Recomendado</span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">Email-safe listo para SFMC / Brevo</p>
              </div>
              <Download className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
            </button>

            {/* JPG */}
            <button
              type="button"
              disabled={downloadingJpg || jpgDone}
              onClick={() => { void handleJpgExportWithSwal(); }}
              className={[
                "group w-full flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all",
                jpgDone
                  ? "border-emerald-400/50 bg-emerald-500/5 cursor-default"
                  : "border-border bg-card hover:border-violet-400/40 hover:bg-violet-500/5 hover:shadow-sm active:scale-[0.99] disabled:cursor-wait disabled:opacity-60",
              ].join(" ")}
            >
              <div
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors",
                  jpgDone
                    ? "border-emerald-400/30 bg-emerald-500/10"
                    : "border-border bg-secondary/60 group-hover:border-violet-400/30 group-hover:bg-violet-500/10",
                ].join(" ")}
              >
                {jpgDone
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  : downloadingJpg
                    ? <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                    : <FileImage className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-violet-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={["text-[13px] font-semibold", jpgDone ? "text-emerald-600" : "text-foreground"].join(" ")}>
                    {jpgDone ? "¡Listo!" : downloadingJpg ? "Generando…" : "Descargar JPG"}
                  </span>
                  {!jpgDone && !downloadingJpg && (
                    <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-600">JPG</span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">Captura visual para revisión y aprobación</p>
              </div>
              {!downloadingJpg && !jpgDone && (
                <Download className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-violet-500" />
              )}
            </button>
          </div>

          <div className="px-4 pb-4">
            <button
              type="button"
              onClick={() => { setShowDownloadModal(false); setJpgDone(false); }}
              disabled={downloadingJpg}
              className="w-full rounded-lg border border-border py-2 text-xs text-muted-foreground transition hover:bg-secondary/60 disabled:opacity-40"
            >
              Cancelar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal: advertencia modo desarrollador ───────────────────────────── */}
      <Dialog open={showDevModeWarning} onOpenChange={setShowDevModeWarning}>
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: "#2d1f0e" }}>
                <CodeXml className="h-4 w-4" style={{ color: "#F97316" }} />
              </div>
              <DialogTitle className="text-sm font-semibold leading-snug">
                Estás accediendo al modo desarrollador
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="px-6 py-5">
            <p id="devmode-warning-desc" className="text-sm text-muted-foreground leading-relaxed">
              El modo desarrollador es un editor de código JSON que te da más control sobre tus plantillas en comparación con el editor habitual Drag &amp; Drop. Puedes añadir personalización de código personalizado y mucho más.
            </p>
          </div>
          <div className="flex flex-col gap-3 border-t border-border/50 px-6 pb-6 pt-4">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                id="devmode-skip-warning"
                className="h-4 w-4 rounded border-border accent-primary"
                onChange={(e) => {
                  if (e.target.checked) {
                    localStorage.setItem("mailing-builder:devmode-skip-warning", "1");
                  } else {
                    localStorage.removeItem("mailing-builder:devmode-skip-warning");
                  }
                }}
              />
              <span className="text-sm text-foreground/70">No volver a mostrar</span>
            </label>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDevModeWarning(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 font-semibold"
                style={{ backgroundColor: "#111827", color: "white" }}
                onClick={() => {
                  setShowDevModeWarning(false);
                  setShowDevMode(true);
                }}
              >
                Abrir modo desarrollador
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dev mode panel (full screen overlay) ────────────────────────────── */}
      {showDevMode && (
        <React.Suspense fallback={null}>
          <DevModePanel
            document={document}
            activeMailingId={activeMailingId}
            onClose={() => setShowDevMode(false)}
            onApply={(doc, mailingId) => replaceDocument(doc, mailingId)}
          />
        </React.Suspense>
      )}
    </div>
  );
}
