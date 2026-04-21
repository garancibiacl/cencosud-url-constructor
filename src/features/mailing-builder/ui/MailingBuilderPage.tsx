import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle, CheckCircle2, CodeXml, Copy, Download, Eye, FileDown, GripVertical,
  History, Image as ImageIcon, ImagePlus, Loader2, Mail, Monitor, MoreHorizontal,
  MousePointerClick, PenSquare, Plus, RectangleHorizontal, RotateCcw, Save,
  Settings2, Smartphone, Type, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { RowCanvas, AddRowButton } from "./layout/RowCanvas";
import { AssetPickerDialog } from "./AssetPickerDialog";
import { NewTemplateModal } from "./NewTemplateModal";
import type { ScratchMode } from "./NewTemplateModal";
import type { FileRecord } from "@/features/file-bank/logic/file-bank.types";
import type { MailingBlock } from "../logic/schema/block.types";
import type { ColumnPreset } from "../logic/schema/row.types";

const CATEGORY_LABELS = {
  content: "Contenido",
  media: "Media",
  layout: "Layout",
} as const;

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
  onAddRow: (preset: ColumnPreset) => void;
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
// MailingBuilderPage — componente principal
// ---------------------------------------------------------------------------

export default function MailingBuilderPage() {
  const { user } = useAuth();
  const {
    document,
    selectedBlockId,
    selectedColId,
    activeMailingId,
    selectBlock,
    selectRow,
    addRow,
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
  } = useMailingBuilderStore();

  const { toast } = useToast();
  const { mailings, versions, loading, saving, refreshMailings, loadVersions, saveDraft, saveVersion, scheduleAutosave, cancelAutosave } = useMailings();
  const [versionNote, setVersionNote] = useState("");
  const [previewMode, setPreviewMode] = useState<"canvas" | "split" | "html">("canvas");
  const [devicePreview, setDevicePreview] = useState<"desktop" | "mobile">("desktop");
  const [lastAutosaveAt, setLastAutosaveAt] = useState<string | null>(null);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [showGlobalInspector, setShowGlobalInspector] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  const inspectorRef = useRef<HTMLDivElement | null>(null);
  const globalInspectorButtonRef = useRef<HTMLButtonElement | null>(null);
  const dragRef = useRef<Parameters<typeof RowCanvas>[0]["dragRef"]["current"]>(null);

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

  const handleDownloadHtml = () => {
    const html = renderMailingHtml(document);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${document.name.trim().toLowerCase().replace(/\s+/g, "-") || "mailing"}.html`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "HTML descargado", description: "Se descargó una versión email-safe del mailing." });
  };

  const handleSaveAsPdf = () => {
    window.print();
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
    const result = await saveDraft({ mailingId: activeMailingId, userId: user.id, document });
    if (!result.savedId) { toast({ title: "No se pudo guardar", description: "Revisa tu sesión e inténtalo nuevamente.", variant: "destructive" }); return; }
    setActiveMailingId(result.savedId);
    setLastAutosaveAt(new Date().toISOString());
    toast({ title: "Borrador guardado", description: "El mailing quedó almacenado en backend." });
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
    if (!version || !activeMailingId) return;
    replaceDocument(version.snapshot, activeMailingId);
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

  const canPickImageAsset = selectedBlock?.type === "hero" || selectedBlock?.type === "image";
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

  const handleSelectAsset = (file: FileRecord) => {
    if (!selectedBlock) return;
    if (selectedBlock.type === "hero") {
      updateBlock({ ...selectedBlock, props: { ...selectedBlock.props, imageUrl: file.file_url } });
      return;
    }
    if (selectedBlock.type === "image") {
      updateBlock({ ...selectedBlock, props: { ...selectedBlock.props, src: file.file_url, alt: selectedBlock.props.alt || file.title } } as MailingBlock);
    }
  };

  useEffect(() => {
    if (!isInspectorOpen) return;
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (inspectorRef.current?.contains(target)) return;
      if (globalInspectorButtonRef.current?.contains(target)) return;
      if (target.closest('[data-mailing-block="true"]')) return;
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
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-card px-8 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Mailing Builder</h1>
              <div className="mt-1 flex items-center gap-1.5">
                <SaveIcon className={`h-3 w-3 shrink-0 ${saveIconClass}`} />
                <span className="text-xs text-muted-foreground">{saveLabel}</span>
                {activeMailingId && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground/60">
                      {document.rows.length} {document.rows.length === 1 ? "fila" : "filas"} · {totalBlocks} bloques
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleNewDraft}>
              <Plus className="mr-2 h-4 w-4" />Nuevo
            </Button>
            <Button variant="outline" onClick={() => void handleCopyHtml()}>
              <Copy className="mr-2 h-4 w-4" />Copiar HTML
            </Button>
            <Button onClick={handleDownloadHtml}>
              <Download className="mr-2 h-4 w-4" />Descargar HTML
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => void handleSaveVersion()} disabled={!user || saving}>
                  <History className="mr-2 h-4 w-4" />Historial de versiones
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPreviewMode("html")}>
                  <CodeXml className="mr-2 h-4 w-4" />Modo de desarrollador
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void handleSaveDraft()} disabled={!user || saving}>
                  <Save className="mr-2 h-4 w-4" />Guardar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSaveAsPdf}>
                  <FileDown className="mr-2 h-4 w-4" />Guardar como pdf
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ── Cuerpo de 3 columnas ────────────────────────────────────────────── */}
      <div
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

            {/* Tab Secciones */}
            <TabsContent value="secciones" className="m-0 min-h-0 flex-1">
              <ScrollArea className="h-full">
                <div className="space-y-3 p-4">
                  {mailingTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => handleApplyTemplate(template.id)}
                      className="w-full rounded-md border border-border px-3 py-2 text-left transition hover:border-primary/40 hover:bg-primary/5"
                    >
                      <p className="text-sm font-medium text-foreground">{template.label}</p>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
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
                            <p className="text-muted-foreground">{version.note || "Sin nota"}</p>
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
        <section className="min-h-0 bg-secondary/35 px-8 py-6">
          <div className="mx-auto flex h-full max-w-[820px] flex-col rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">

            {/* Barra superior del canvas */}
            <div className="border-b border-border px-6 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{document.name || "Sin nombre"}</p>
                  <p className="text-xs text-muted-foreground">
                    {devicePreview === "mobile" ? "375px · móvil" : `${document.settings.width}px · escritorio`} · email-safe HTML
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Toggle desktop / mobile */}
                  <div className="flex items-center rounded-md border border-border bg-secondary/40 p-0.5">
                    <button
                      type="button"
                      onClick={() => setDevicePreview("desktop")}
                      className={`flex items-center justify-center rounded px-2 py-1 transition-colors ${
                        devicePreview === "desktop"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Vista escritorio"
                    >
                      <Monitor className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDevicePreview("mobile")}
                      className={`flex items-center justify-center rounded px-2 py-1 transition-colors ${
                        devicePreview === "mobile"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Vista móvil"
                    >
                      <Smartphone className="h-4 w-4" />
                    </button>
                  </div>

                  <Button
                    ref={globalInspectorButtonRef}
                    type="button"
                    variant={showGlobalInspector && !selectedBlock ? "default" : "outline"}
                    size="icon"
                    onClick={handleOpenGlobalInspector}
                    title="Configuración global"
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                  <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as typeof previewMode)}>
                    <TabsList>
                      <TabsTrigger value="canvas"><PenSquare className="mr-2 h-4 w-4" />Canvas</TabsTrigger>
                      <TabsTrigger value="split"><Eye className="mr-2 h-4 w-4" />Vista previa</TabsTrigger>
                      <TabsTrigger value="html"><CodeXml className="mr-2 h-4 w-4" />HTML</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </div>

            <ScrollArea className="h-full">
              <div
                className="p-6"
                style={{
                  backgroundColor: "hsl(var(--muted) / 0.4)",
                  backgroundImage: "radial-gradient(circle, hsl(var(--border) / 0.9) 1px, transparent 1px)",
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
                            onAddRow={(preset) => addRow(preset)}
                          />
                        ) : (
                          <div className="space-y-2">
                            {document.rows.map((row, rowIndex) => (
                              <RowCanvas
                                key={row.id}
                                row={row}
                                rowIndex={rowIndex}
                                totalRows={document.rows.length}
                                selectedBlockId={selectedBlockId}
                                selectedColId={selectedColId}
                                dragRef={dragRef}
                                onSelectBlock={handleSelectBlockInCanvas}
                                onSelectRow={selectRow}
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
                              />
                            ))}
                          </div>
                        )}

                        {/* Botón añadir fila (solo cuando hay filas) */}
                        {document.rows.length > 0 && (
                          <div className="mt-3">
                            <AddRowButton onAdd={(preset) => addRow(preset)} />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* Vista previa — solo iframe renderizado */}
                  {previewMode === "split" ? (
                    <div className={`mx-auto transition-all duration-300 ${
                      devicePreview === "mobile"
                        ? "w-[407px] rounded-[2rem] border-2 border-border bg-background p-2"
                        : "w-full"
                    }`}>
                      {devicePreview === "mobile" && (
                        <div className="mb-2 flex justify-center pt-1">
                          <div className="h-1 w-12 rounded-full bg-border" />
                        </div>
                      )}
                      <iframe
                        title="Vista previa"
                        className="h-[600px] w-full rounded-md border-0 bg-white"
                        style={{ maxWidth: devicePreview === "mobile" ? "375px" : "100%" }}
                        srcDoc={htmlPreview}
                      />
                    </div>
                  ) : null}

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
            </ScrollArea>
          </div>
        </section>

        {/* ── Panel derecho — inspector ────────────────────────────────────── */}
        <aside
          ref={inspectorRef}
          className={`flex flex-col overflow-hidden border-l border-border bg-card transition-all duration-300 ${
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
                      {/* Banco de archivos (imagen/hero) */}
                      {canPickImageAsset && (
                        <button
                          type="button"
                          onClick={() => setAssetPickerOpen(true)}
                          className="flex w-full items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-left text-xs font-medium text-foreground/70 transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                        >
                          <ImagePlus className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                          Elegir desde Banco de Archivos
                        </button>
                      )}

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
      </div>

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

      <AssetPickerDialog open={assetPickerOpen} onOpenChange={setAssetPickerOpen} onSelect={handleSelectAsset} />
    </div>
  );
}
