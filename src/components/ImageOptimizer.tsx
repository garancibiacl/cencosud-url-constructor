import { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload, Monitor, Smartphone, Zap, Download, ImageIcon, X, Info,
  AlertTriangle, Loader2, CheckCircle2, Crosshair, FileDown, Package,
  History, RotateCcw, Trash2, Layers, Eye, ChevronLeft, ShieldCheck, Type,
  Wand2, Settings, KeyRound, EyeOff,
} from "lucide-react";
import JSZip from "jszip";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CENCOSUD_PRESETS, getPresetVariants, type ImagePreset, type PresetVariant } from "@/lib/image-presets";
import { processImage, downloadBlob, type ProcessedImage } from "@/lib/image-processor";
import {
  getHistory, addHistoryEntry, clearHistory,
  type HistoryEntry,
} from "@/lib/optimizer-history";
import { generateOutpaint, getOpenAIKey, saveOpenAIKey, getOutpaintingNeed } from "@/lib/openai-outpainting";

/* ── Types ── */
interface QueueItem {
  id: string;
  file: File;
  dataUrl: string;
  fileName: string;
  sizeKb: number;
  focalPoint: { x: number; y: number };
  status: "pending" | "processing" | "done" | "error";
  results: ProcessedImage[];
}

/* ── Brand badges ── */
const BRAND_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Paris: { bg: "bg-[hsl(210,100%,95%)]", text: "text-[hsl(210,100%,32%)]", border: "border-[hsl(210,100%,80%)]" },
  Jumbo: { bg: "bg-[hsl(145,60%,93%)]", text: "text-[hsl(145,60%,25%)]", border: "border-[hsl(145,60%,75%)]" },
  "Santa Isabel": { bg: "bg-[hsl(0,70%,95%)]", text: "text-[hsl(0,70%,35%)]", border: "border-[hsl(0,70%,80%)]" },
};

const HIDDEN_PRESET_KEYS = new Set([
  "PARIS_HOME",
  "JUMBO_OFERTA",
  "SANTA_ISABEL_GRILLA",
]);

function BrandBadge({ brand }: { brand: string }) {
  const colors = BRAND_COLORS[brand] || { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${colors.bg} ${colors.text} ${colors.border}`}>
      {brand}
    </span>
  );
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("es-CL", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

let nextId = 0;
function makeId() {
  return `q-${Date.now()}-${nextId++}`;
}

function clampFocal(value: number) {
  return Math.max(0, Math.min(100, value));
}

function GuideOverlay({
  marginPx,
  reservePx = 0,
  widthPx,
  mode = "frame",
  label,
}: {
  marginPx: number;
  reservePx?: number;
  widthPx: number;
  mode?: "frame" | "lateral";
  label: string;
}) {
  const marginPct = (marginPx / widthPx) * 100;
  const reservePct = reservePx > 0 ? ((marginPx + reservePx) / widthPx) * 100 : null;

  if (mode === "lateral") {
    return (
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute inset-y-0 border-l-2 border-dashed border-[hsla(24,83%,52%,0.7)]" style={{ left: `${marginPct}%` }} />
        <div className="absolute inset-y-0 border-r-2 border-dashed border-[hsla(24,83%,52%,0.7)]" style={{ right: `${marginPct}%` }} />
        {reservePct !== null && (
          <>
            <div className="absolute inset-y-0 border-l border-dashed border-[hsla(10,78%,55%,0.7)]" style={{ left: `${reservePct}%` }} />
            <div className="absolute inset-y-0 border-r border-dashed border-[hsla(10,78%,55%,0.7)]" style={{ right: `${reservePct}%` }} />
          </>
        )}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b bg-accent/80 px-1.5 py-0.5 text-[8px] font-bold text-accent-foreground">
          {label}
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        border: `${marginPct}% dashed`,
        borderColor: "hsla(24, 83%, 52%, 0.6)",
      }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b bg-accent/80 px-1.5 py-0.5 text-[8px] font-bold text-accent-foreground">
        {label}
      </div>
    </div>
  );
}

function getVariantIcon(variantId: ProcessedImage["device"] | PresetVariant["id"]) {
  return variantId === "desktop" ? Monitor : Smartphone;
}

function getDimensionBadgeClass(category?: string) {
  if (category === "SISA App") {
    return "border-[hsl(0,70%,80%)] bg-[hsl(0,70%,95%)] text-[hsl(0,70%,35%)]";
  }

  return "";
}

/* ══════════════════════════════════════════════════════════════ */
const ImageOptimizer = () => {
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingFocal, setIsDraggingFocal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showSafeZones, setShowSafeZones] = useState(false);
  // ── AI Generative Fill ───────────────────────────────────────
  const [openAIKey, setOpenAIKeyState] = useState(() => getOpenAIKey());
  const [openAIKeyInput, setOpenAIKeyInput] = useState(() => getOpenAIKey());
  const [showAIKeyValue, setShowAIKeyValue] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [isOutpainting, setIsOutpainting] = useState(false);
  const [outpaintStatus, setOutpaintStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const selectedPreset: ImagePreset | null = selectedPresetKey
    ? CENCOSUD_PRESETS[selectedPresetKey]
    : null;

  const editingItem = editingId ? queue.find((q) => q.id === editingId) : null;
  const allDone = queue.length > 0 && queue.every((q) => q.status === "done");
  const allResults = queue.flatMap((q) => q.results);
  const canProcess = queue.length > 0 && !!selectedPresetKey && !isProcessing;

  useEffect(() => { setHistory(getHistory()); }, []);
  const refreshHistory = () => setHistory(getHistory());
  useEffect(() => {
    if (!selectedPreset) return;
    setShowSafeZones(Boolean(selectedPreset.safeZoneDefaultVisible));
  }, [selectedPreset]);

  /* ── File handling (multi) ── */
  const addFiles = useCallback((files: FileList | File[]) => {
    const newItems: QueueItem[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const id = makeId();
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setQueue((prev) => prev.map((q) =>
          q.id === id ? { ...q, dataUrl } : q
        ));
      };
      reader.readAsDataURL(file);
      newItems.push({
        id,
        file,
        dataUrl: "",
        fileName: file.name,
        sizeKb: Math.round(file.size / 1024),
        focalPoint: { x: 50, y: 50 },
        status: "pending",
        results: [],
      });
    });
    setQueue((prev) => [...prev, ...newItems]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const removeFromQueue = (id: string) => {
    setQueue((prev) => {
      const item = prev.find((q) => q.id === id);
      item?.results.forEach((r) => URL.revokeObjectURL(r.dataUrl));
      return prev.filter((q) => q.id !== id);
    });
    if (editingId === id) setEditingId(null);
  };

  const clearQueue = () => {
    queue.forEach((q) => q.results.forEach((r) => URL.revokeObjectURL(r.dataUrl)));
    setQueue([]);
    setEditingId(null);
  };

  /* ── Focal point editing ── */
  const updateFocalFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const el = imageContainerRef.current;
      if (!el || !editingId) return;
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
      setQueue((prev) => prev.map((q) =>
        q.id === editingId ? { ...q, focalPoint: { x, y } } : q
      ));
    },
    [editingId],
  );

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingFocal(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateFocalFromEvent(e.clientX, e.clientY);
  }, [updateFocalFromEvent]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingFocal) return;
    updateFocalFromEvent(e.clientX, e.clientY);
  }, [isDraggingFocal, updateFocalFromEvent]);

  const handlePointerUp = useCallback(() => setIsDraggingFocal(false), []);

  /* ── Batch processing ── */
  const handleProcessAll = useCallback(async () => {
    if (!selectedPreset || !selectedPresetKey) return;
    const pending = queue.filter((q) => q.dataUrl && q.status !== "done");
    if (pending.length === 0) return;

    setIsProcessing(true);
    setBatchProgress({ current: 0, total: pending.length });

    for (let i = 0; i < pending.length; i++) {
      const item = pending[i];
      setBatchProgress({ current: i + 1, total: pending.length });

      setQueue((prev) => prev.map((q) =>
        q.id === item.id ? { ...q, status: "processing" } : q
      ));

      try {
        const results = await processImage(
          item.dataUrl,
          selectedPreset,
          item.focalPoint.x,
          item.focalPoint.y,
        );
        setQueue((prev) => prev.map((q) =>
          q.id === item.id ? { ...q, status: "done", results } : q
        ));
      } catch {
        setQueue((prev) => prev.map((q) =>
          q.id === item.id ? { ...q, status: "error" } : q
        ));
      }
    }

    setIsProcessing(false);
    const brandName = selectedPreset.label.split(" - ")[0] || selectedPreset.label;
    toast({
      title: `¡${pending.length} imagen${pending.length > 1 ? "es" : ""} optimizada${pending.length > 1 ? "s" : ""} para ${brandName}!`,
      description: "Todas listas para descarga.",
      className: "border-[hsl(88,72%,43%)] bg-[hsl(88,72%,95%)] text-[hsl(88,72%,20%)]",
    });
  }, [queue, selectedPreset, selectedPresetKey, toast]);

  /* ── Downloads ── */
  const handleDownloadSingle = (img: ProcessedImage) => downloadBlob(img.blob, img.fileName);

  const handleDownloadAll = async () => {
    const doneItems = queue.filter((q) => q.status === "done" && q.results.length > 0);
    if (doneItems.length === 0 || !selectedPreset) return;

    const zip = new JSZip();
    for (const item of doneItems) {
      for (const r of item.results) {
        zip.file(r.fileName, r.blob);
      }
      // Save each to history
      await addHistoryEntry(
        item.dataUrl,
        item.results,
        selectedPresetKey,
        selectedPreset.label,
        item.focalPoint,
        item.fileName,
      );
    }
    refreshHistory();

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const presetSlug = selectedPreset.label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const dateSuffix = new Date().toISOString().slice(0, 10);
    downloadBlob(zipBlob, `${presetSlug}-batch-${dateSuffix}.zip`);

    const zipCount = doneItems.reduce((total, item) => total + item.results.length, 0);
    toast({ title: "Descarga iniciada", description: `${zipCount} archivos en el ZIP. Historial actualizado.` });
  };

  /* ── History ── */
  const handleReEdit = (entry: HistoryEntry) => {
    const id = makeId();
    setQueue((prev) => [...prev, {
      id, file: null as unknown as File, dataUrl: entry.masterThumb,
      fileName: entry.fileName, sizeKb: 0,
      focalPoint: entry.focalPoint, status: "pending", results: [],
    }]);
    setSelectedPresetKey(entry.presetKey);
    setEditingId(id);
    toast({ title: "Imagen cargada para re-edición", description: `${entry.presetLabel} — Punto focal restaurado.` });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearHistory = () => {
    clearHistory();
    refreshHistory();
    toast({ title: "Historial limpiado", description: "Se eliminaron todos los registros." });
  };

  /* ── Computed ── */
  const globalProgress = batchProgress.total > 0
    ? Math.round((batchProgress.current / batchProgress.total) * 100)
    : 0;
  const focalTuning = selectedPreset?.focalPointTuning;
  const focalXStep = focalTuning?.xStep ?? 1;
  const focalYStep = focalTuning?.yStep ?? 1;
  const presetVariants = selectedPreset ? getPresetVariants(selectedPreset) : [];
  const groupedPresets = Object.entries(CENCOSUD_PRESETS)
    .filter(([key]) => !HIDDEN_PRESET_KEYS.has(key))
    .reduce<Record<string, Array<[string, ImagePreset]>>>((acc, entry) => {
    const category = entry[1].category ?? "Web y Retail";
    acc[category] ??= [];
    acc[category].push(entry);
    return acc;
  }, {});

  const nudgeFocalPoint = useCallback((axis: "x" | "y", delta: number) => {
    if (!editingId) return;
    setQueue((prev) => prev.map((q) => {
      if (q.id !== editingId) return q;
      return {
        ...q,
        focalPoint: {
          ...q.focalPoint,
          [axis]: clampFocal(q.focalPoint[axis] + delta),
        },
      };
    }));
  }, [editingId]);

  /* ── AI Generative Fill ── */
  const handleSaveOpenAIKey = useCallback(() => {
    saveOpenAIKey(openAIKeyInput);
    setOpenAIKeyState(openAIKeyInput.trim());
    toast({ title: "API Key guardada", description: "Tu clave de OpenAI fue almacenada en este navegador." });
  }, [openAIKeyInput, toast]);

  const handleOutpaint = useCallback(async () => {
    const activeItem = editingItem || (queue.length > 0 ? queue[0] : null);
    if (!activeItem?.dataUrl || !selectedPreset) return;

    if (!openAIKey) {
      setShowAISettings(true);
      toast({ title: "Se necesita API Key", description: "Abre la configuración IA e ingresa tu clave de OpenAI." });
      return;
    }

    const variants = getPresetVariants(selectedPreset);
    const targetVariant = variants.find((v) => v.id !== "mobile") ?? variants[0];

    setIsOutpainting(true);
    setOutpaintStatus("Iniciando Relleno Generativo…");

    try {
      const result = await generateOutpaint({
        imageSrc: activeItem.dataUrl,
        presetWidth: targetVariant.dimension.width,
        presetHeight: targetVariant.dimension.height,
        apiKey: openAIKey,
        onProgress: setOutpaintStatus,
      });

      const targetId = activeItem.id;
      setQueue((prev) => prev.map((q) =>
        q.id === targetId
          ? { ...q, dataUrl: result.dataUrl, status: "pending", results: [] }
          : q,
      ));

      toast({
        title: "¡Relleno Generativo completado!",
        description: "La imagen fue expandida con IA. Ajusta el punto focal y procesa.",
        className: "border-violet-300 bg-violet-50 text-violet-900",
      });
    } catch (err) {
      toast({
        title: "Error en Relleno IA",
        description: err instanceof Error ? err.message : "Error desconocido.",
        variant: "destructive",
      });
    } finally {
      setIsOutpainting(false);
      setOutpaintStatus("");
    }
  }, [editingItem, queue, selectedPreset, openAIKey, toast]);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-border bg-card px-8 py-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <ImageIcon size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Optimizador de Imágenes Inteligente
              </h1>
              <p className="text-sm text-muted-foreground">
                Adapta banners maestros a formatos Mobile y Desktop de Cencosud
              </p>
            </div>
          </div>
          <Button
            variant={showAISettings ? "default" : "outline"}
            size="sm"
            className="gap-2 shrink-0"
            onClick={() => setShowAISettings((v) => !v)}
          >
            <Settings size={14} />
            Configuración IA
            {openAIKey && (
              <span className="ml-1 h-2 w-2 rounded-full bg-green-500 inline-block" title="API Key configurada" />
            )}
          </Button>
        </div>

        {/* AI Settings Panel */}
        {showAISettings && (
          <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound size={15} className="text-violet-600" />
              <span className="text-sm font-semibold text-violet-900">OpenAI API Key</span>
              <Badge variant="outline" className="text-[10px] border-violet-300 text-violet-700">Relleno Generativo</Badge>
            </div>
            <p className="text-[11px] text-violet-700 mb-3">
              Tu clave se guarda únicamente en este navegador (localStorage) y nunca se envía a ningún servidor nuestro.
              Obtén una en <span className="font-mono font-semibold">platform.openai.com</span>.
            </p>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Input
                  type={showAIKeyValue ? "text" : "password"}
                  placeholder="sk-..."
                  value={openAIKeyInput}
                  onChange={(e) => setOpenAIKeyInput(e.target.value)}
                  className="pr-10 font-mono text-sm bg-white border-violet-300 focus-visible:ring-violet-400"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveOpenAIKey(); }}
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAIKeyValue((v) => !v)}
                >
                  {showAIKeyValue ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <Button size="sm" onClick={handleSaveOpenAIKey} className="bg-violet-600 hover:bg-violet-700 text-white">
                Guardar
              </Button>
              {openAIKey && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    saveOpenAIKey("");
                    setOpenAIKeyState("");
                    setOpenAIKeyInput("");
                    toast({ title: "API Key eliminada" });
                  }}
                >
                  Eliminar
                </Button>
              )}
            </div>
            {openAIKey && (
              <p className="mt-2 text-[11px] text-green-700 flex items-center gap-1">
                <CheckCircle2 size={11} />
                API Key configurada correctamente.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 p-8 space-y-6">
        {/* Preset Selector */}
        <Card>
          <CardContent className="p-5">
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Formato de destino
            </label>
            <div className="flex flex-wrap gap-3 items-end">
              <Select value={selectedPresetKey} onValueChange={setSelectedPresetKey}>
                <SelectTrigger className="w-full max-w-md h-11 text-sm">
                  <SelectValue placeholder="Selecciona un formato de Cencosud..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedPresets).map(([category, presets], index) => (
                    <div key={category}>
                      {index > 0 && <SelectSeparator />}
                      <SelectGroup>
                        <SelectLabel>{category}</SelectLabel>
                        {presets.map(([key, preset]) => (
                          <SelectItem key={key} value={key}>
                            {preset.label}
                            {preset.densityLabel ? ` (${preset.densityLabel})` : ""}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </div>
                  ))}
                </SelectContent>
              </Select>
              {queue.length > 0 && selectedPresetKey && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5 text-xs"
                  onClick={() => toast({
                    title: "Preset aplicado a todas",
                    description: `${queue.length} imagen${queue.length > 1 ? "es" : ""} usarán ${selectedPreset?.label}`,
                  })}
                >
                  <Layers size={14} />
                  Aplicar a Todas ({queue.length})
                </Button>
              )}
            </div>

            {selectedPreset && (
              <div className="mt-4 flex flex-wrap gap-2">
                {presetVariants.map((variant) => {
                  const Icon = getVariantIcon(variant.id);
                  return (
                    <Badge
                      key={variant.id}
                      variant="secondary"
                      className={`gap-1.5 px-3 py-1.5 text-xs font-medium ${getDimensionBadgeClass(selectedPreset.category)}`}
                    >
                      <Icon size={13} />
                      {variant.label}: {variant.dimension.width}×{variant.dimension.height}px
                    </Badge>
                  );
                })}
                <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs font-medium">
                  <Info size={13} />
                  Peso máx: {selectedPreset.maxWeightKb} KB
                </Badge>
                {selectedPreset.densityLabel && (
                  <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs font-medium">
                    {selectedPreset.densityLabel}
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs font-medium">
                  Formato: .jpg
                  {selectedPreset.outputDpi ? ` · ${selectedPreset.outputDpi} dpi` : ""}
                </Badge>
              </div>
            )}

            {/* Safe zone toggle + text limits */}
            {selectedPreset?.safeZone && (
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="safe-zones"
                    checked={showSafeZones}
                    onCheckedChange={setShowSafeZones}
                  />
                  <label htmlFor="safe-zones" className="text-xs font-medium text-foreground cursor-pointer flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-primary" />
                    Ver Márgenes de Seguridad
                  </label>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Desktop: {selectedPreset.safeZone.desktop}px · Mobile: {selectedPreset.safeZone.mobile}px
                </span>
                {selectedPreset.reserveMargin && (
                  <span className="text-[10px] text-muted-foreground">
                    Reserva interna: {selectedPreset.reserveMargin.desktop}px desktop · {selectedPreset.reserveMargin.mobile}px mobile
                  </span>
                )}
              </div>
            )}

            {selectedPreset?.technicalNote && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
                {selectedPreset.technicalNote}
              </div>
            )}

            {selectedPreset?.textLimits && (
              <div className="mt-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5 flex items-center gap-4">
                <Type size={14} className="text-primary shrink-0" />
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  <span>Título: máx. <strong className="text-foreground">{selectedPreset.textLimits.titleMax}</strong> caracteres</span>
                  <span>Párrafo: máx. <strong className="text-foreground">{selectedPreset.textLimits.paragraphMax}</strong> caracteres</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Dropzone + Queue ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Col 1: Dropzone + Queue list */}
          <Card className="lg:col-span-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-foreground">
                  Imágenes {queue.length > 0 && `(${queue.length})`}
                </label>
                {queue.length > 1 && (
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] text-muted-foreground hover:text-destructive gap-1 px-2" onClick={clearQueue}>
                    <Trash2 size={10} /> Limpiar cola
                  </Button>
                )}
              </div>

              {/* Dropzone — always visible */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all cursor-pointer ${
                  queue.length > 0 ? "min-h-[100px]" : "min-h-[180px]"
                } ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <Upload size={queue.length > 0 ? 18 : 24} className="text-primary mb-2" />
                <p className="text-xs font-medium text-foreground">
                  {queue.length > 0 ? "Agregar más imágenes" : "Arrastra tus imágenes aquí"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {queue.length > 0 ? "o clic para seleccionar" : "Múltiples archivos · JPG y PNG"}
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />

              {/* Queue list */}
              {queue.length > 0 && (
                <div className="mt-3 space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {queue.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 rounded-lg border p-1.5 transition-all cursor-pointer ${
                        editingId === item.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:border-primary/30 bg-card"
                      }`}
                      onClick={() => setEditingId(item.id)}
                    >
                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-muted/30 shrink-0">
                        {item.dataUrl && (
                          <img src={item.dataUrl} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-foreground truncate">{item.fileName}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">{item.sizeKb} KB</span>
                          {item.status === "done" && (
                            <CheckCircle2 size={10} className="text-primary" />
                          )}
                          {item.status === "processing" && (
                            <Loader2 size={10} className="text-primary animate-spin" />
                          )}
                          {item.status === "error" && (
                            <AlertTriangle size={10} className="text-destructive" />
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); removeFromQueue(item.id); }}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Col 2-4: Focal Point Editor + Previews */}
          <div className="lg:col-span-3 space-y-6">
            {/* Focal Point Editor — always visible when an image is selected */}
            {(() => {
              const activeItem = editingItem || (queue.length > 0 ? queue[0] : null);
              const activeDataUrl = activeItem?.dataUrl || null;
              const activeFocal = activeItem?.focalPoint || { x: 50, y: 50 };
              const activeObjPos = `${activeFocal.x}% ${activeFocal.y}%`;

              // Auto-select first item if none editing
              if (!editingId && queue.length > 0 && queue[0]?.dataUrl) {
                // We'll handle via useEffect, for now show first item
              }

              return (
                <>
                  {activeDataUrl && (
                    <Card>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Crosshair size={14} className="text-primary" />
                            <span className="text-sm font-semibold text-foreground">
                              Imagen Maestra — Punto Focal
                            </span>
                            <Badge variant="outline" className="text-[10px] px-2 py-0 font-mono">
                              {Math.round(activeFocal.x)}%, {Math.round(activeFocal.y)}%
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                            {activeItem?.fileName}
                          </p>
                        </div>

                        <div
                          ref={imageContainerRef}
                          className="relative select-none touch-none cursor-crosshair rounded-xl border-2 border-border overflow-hidden bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/30"
                          tabIndex={0}
                          onPointerDown={(e) => {
                            // Auto-select first item if none editing
                            if (!editingId && queue.length > 0) {
                              setEditingId(queue[0].id);
                            }
                            handlePointerDown(e);
                          }}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          onKeyDown={(e) => {
                            if (!activeItem) return;
                            if (e.key === "ArrowLeft") {
                              e.preventDefault();
                              nudgeFocalPoint("x", -focalXStep);
                            }
                            if (e.key === "ArrowRight") {
                              e.preventDefault();
                              nudgeFocalPoint("x", focalXStep);
                            }
                            if (e.key === "ArrowUp") {
                              e.preventDefault();
                              nudgeFocalPoint("y", -focalYStep);
                            }
                            if (e.key === "ArrowDown") {
                              e.preventDefault();
                              nudgeFocalPoint("y", focalYStep);
                            }
                          }}
                        >
                          <img
                            src={activeDataUrl}
                            alt="Imagen maestra"
                            className="w-full h-auto max-h-[350px] object-contain pointer-events-none"
                            draggable={false}
                          />
                          {/* Focal point indicator */}
                          <div
                            className="absolute pointer-events-none z-20"
                            style={{
                              left: `${activeFocal.x}%`,
                              top: `${activeFocal.y}%`,
                              transform: "translate(-50%, -50%)",
                            }}
                          >
                            {/* Outer ring */}
                            <div className="w-12 h-12 rounded-full border-[2.5px] border-destructive/80 bg-destructive/10 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-75" />
                            {/* Center dot */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-3 h-3 rounded-full bg-destructive shadow-md ring-2 ring-background/50" />
                            </div>
                            {/* Crosshair lines */}
                            <div className="absolute top-1/2 -left-4 w-[calc(100%+32px)] h-px bg-destructive/50" />
                            <div className="absolute left-1/2 -top-4 h-[calc(100%+32px)] w-px bg-destructive/50" />
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-[10px] text-muted-foreground">
                            Haz clic o arrastra el punto rojo para centrar el contenido importante
                          </p>
                          {activeItem && (
                            <div className="flex items-center gap-1.5">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[10px]"
                                onClick={() => nudgeFocalPoint("y", -focalYStep)}
                              >
                                Y -{focalYStep}%
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[10px]"
                                onClick={() => nudgeFocalPoint("y", focalYStep)}
                              >
                                Y +{focalYStep}%
                              </Button>
                            </div>
                          )}
                        </div>

                        {focalTuning?.helperText && (
                          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                            {focalTuning.helperText}
                            <span className="ml-1 font-medium">
                              Usa flechas del teclado o los ajustes finos de Y para mayor precisión.
                            </span>
                          </div>
                        )}

                        {/* ── Generative Fill Section ── */}
                        {selectedPreset && activeItem?.dataUrl && (() => {
                          // Detect whether outpainting would add value
                          const img = document.querySelector(`img[alt="Imagen maestra"]`) as HTMLImageElement | null;
                          const variants = getPresetVariants(selectedPreset);
                          const target = variants.find((v) => v.id !== "mobile") ?? variants[0];
                          const need = img
                            ? getOutpaintingNeed(img.naturalWidth || 1, img.naturalHeight || 1, target.dimension.width, target.dimension.height)
                            : 1;
                          const showHint = need > 0.05;
                          return (
                            <div className="mt-4 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 p-3">
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <Wand2 size={14} className="text-violet-600 shrink-0" />
                                    <span className="text-xs font-semibold text-violet-900">Relleno Generativo IA</span>
                                    <Badge variant="outline" className="text-[9px] border-violet-300 text-violet-600 px-1.5 py-0">DALL-E 2</Badge>
                                  </div>
                                  {showHint ? (
                                    <p className="text-[11px] text-violet-700">
                                      La imagen no cubre el formato completo. La IA extenderá el fondo para llenar los espacios vacíos.
                                    </p>
                                  ) : (
                                    <p className="text-[11px] text-violet-500">
                                      La imagen ya coincide bastante con el aspecto del preset.
                                    </p>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  disabled={isOutpainting || !selectedPresetKey}
                                  onClick={handleOutpaint}
                                  className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 shrink-0"
                                >
                                  {isOutpainting
                                    ? <><Loader2 size={13} className="animate-spin" /> Procesando…</>
                                    : <><Wand2 size={13} /> Aplicar Relleno IA</>}
                                </Button>
                              </div>
                              {isOutpainting && outpaintStatus && (
                                <p className="mt-2 text-[11px] text-violet-700 flex items-center gap-1.5">
                                  <Loader2 size={10} className="animate-spin" />
                                  {outpaintStatus}
                                </p>
                              )}
                              {!openAIKey && (
                                <p className="mt-2 text-[11px] text-amber-700 flex items-center gap-1.5">
                                  <AlertTriangle size={11} />
                                  Sin API Key configurada.{" "}
                                  <button
                                    type="button"
                                    className="underline font-medium"
                                    onClick={() => setShowAISettings(true)}
                                  >
                                    Configurar ahora
                                  </button>
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}

                  <div className={`grid grid-cols-1 ${presetVariants.length > 1 ? "md:grid-cols-2" : ""} gap-6`}>
                    {presetVariants.map((variant) => {
                      const Icon = getVariantIcon(variant.id);
                      const safeZoneValue = variant.id === "mobile"
                        ? selectedPreset?.safeZone?.mobile
                        : selectedPreset?.safeZone?.desktop;
                      const reserveMarginValue = variant.id === "mobile"
                        ? selectedPreset?.reserveMargin?.mobile
                        : selectedPreset?.reserveMargin?.desktop;

                      return (
                        <Card key={variant.id}>
                          <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <Icon size={16} className="text-primary" />
                              <span className="text-sm font-semibold text-foreground">Vista Previa {variant.label}</span>
                            </div>
                            <div
                              className="relative rounded-xl border border-border bg-muted/30 overflow-hidden mx-auto"
                              style={{
                                aspectRatio: variant.dimension.ratio.replace("/", " / "),
                                maxHeight: "320px",
                              }}
                            >
                              {activeDataUrl ? (
                                <img
                                  src={activeDataUrl}
                                  alt={`Preview ${variant.label}`}
                                  className="absolute inset-0 w-full h-full object-cover transition-[object-position] duration-150 ease-out"
                                  style={{ objectPosition: activeObjPos }}
                                />
                              ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                                  <Icon size={28} className="mb-2 opacity-40" />
                                  <span className="text-xs">Sin imagen</span>
                                </div>
                              )}
                              {showSafeZones && safeZoneValue && selectedPreset && (
                                <GuideOverlay
                                  marginPx={safeZoneValue}
                                  reservePx={reserveMarginValue}
                                  widthPx={variant.dimension.width}
                                  mode={selectedPreset.safeZoneMode}
                                  label={`${safeZoneValue}px safe zone${reserveMarginValue ? ` · +${reserveMarginValue}px reserva` : ""}`}
                                />
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-2 text-center">
                              {variant.dimension.width}×{variant.dimension.height}px · Ratio {variant.dimension.ratio}
                            </p>
                            {selectedPreset?.focalPointTuning && variant.id === "desktop" && (
                              <p className="text-[10px] text-amber-700 mt-1 text-center">
                                Vista crítica: el recorte vertical cambia rápido en este formato.
                              </p>
                            )}
                            {selectedPreset?.focalPointTuning && variant.id === "app" && (
                              <p className="text-[10px] text-amber-700 mt-1 text-center">
                                Ajuste fino recomendado para preservar nitidez y composición en App.
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              );
            })()}

            {/* Empty state when no images */}
            {queue.length === 0 && (
              <Card>
                <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                  <Crosshair size={32} className="text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">Sube una imagen para ver el editor de Punto Focal</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Las previsualizaciones de cada variante se sincronizarán en tiempo real</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Batch processing progress */}
        {(isProcessing || allDone) && (
          <Card className="animate-fade-in">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="text-primary animate-spin" />
                    <span className="text-sm font-medium text-foreground">
                      Procesando {batchProgress.current} de {batchProgress.total}…
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} className="text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      ¡{queue.length} imagen{queue.length > 1 ? "es" : ""} procesada{queue.length > 1 ? "s" : ""} con éxito!
                    </span>
                  </>
                )}
              </div>
              <Progress value={isProcessing ? globalProgress : 100} className="h-2" />
              <p className="text-[11px] text-muted-foreground mt-2">
                {isProcessing
                  ? `Progreso global: ${globalProgress}%`
                  : `${allResults.length} archivos listos para descarga`}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results Gallery */}
        {allDone && allResults.length > 0 && (
          <Card className="animate-fade-in">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Package size={16} className="text-primary" />
                Resultados — {allResults.length} archivos listos
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {allResults.map((img, idx) => (
                  <div key={`${img.fileName}-${idx}`} className="rounded-xl border border-border overflow-hidden bg-muted/20">
                    <div className="relative bg-muted/30 h-24">
                      <img src={img.dataUrl} alt={img.fileName} className="absolute inset-0 w-full h-full object-contain" />
                    </div>
                    <div className="px-3 py-2 border-t border-border">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {(() => {
                          const Icon = getVariantIcon(img.device);
                          return <Icon size={11} className="text-primary" />;
                        })()}
                        <span className="text-[10px] font-semibold text-foreground capitalize">{img.device}</span>
                        <Badge
                          variant={selectedPreset && img.sizeKb <= selectedPreset.maxWeightKb ? "secondary" : "destructive"}
                          className="text-[9px] px-1 py-0"
                        >
                          {img.sizeKb} KB
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mb-1.5">{img.fileName}</p>
                      <Button size="sm" variant="outline" className="w-full h-7 gap-1 text-[10px]" onClick={() => handleDownloadSingle(img)}>
                        <FileDown size={11} />
                        Descargar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button disabled={!canProcess} onClick={handleProcessAll} className="gap-2">
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            {isProcessing
              ? `Procesando ${batchProgress.current}/${batchProgress.total}…`
              : `Procesar ${queue.length > 1 ? `Todo (${queue.length})` : "Imagen"}`}
          </Button>
          <Button
            disabled={!allDone || allResults.length === 0}
            variant="outline"
            className="gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
            onClick={handleDownloadAll}
          >
            <Download size={16} />
            Descargar Todo (.zip)
          </Button>
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <>
            <Separator />
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <History size={16} className="text-primary" />
                    Banners Recientes
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">{history.length}</Badge>
                  </h3>
                  <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-muted-foreground hover:text-destructive" onClick={handleClearHistory}>
                    <Trash2 size={13} />
                    Limpiar historial
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {history.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-border overflow-hidden bg-card hover:shadow-md transition-shadow">
                      <div className="flex gap-px bg-muted/30">
                        {entry.desktopThumb && (
                          <div className="flex-1 h-16 overflow-hidden">
                            <img src={entry.desktopThumb} alt="Desktop" className="w-full h-full object-cover" />
                          </div>
                        )}
                        {entry.mobileThumb && (
                          <div className="w-16 h-16 overflow-hidden shrink-0">
                            <img src={entry.mobileThumb} alt="Mobile" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-2.5 space-y-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <BrandBadge brand={entry.brandName} />
                          <span className="text-[10px] text-muted-foreground">{formatDate(entry.timestamp)}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate" title={entry.fileName}>{entry.fileName}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {entry.desktopSizeKb > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Monitor size={10} /> {entry.desktopSizeKb}KB
                            </span>
                          )}
                          {entry.mobileSizeKb > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Smartphone size={10} /> {entry.mobileSizeKb}KB
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1.5 pt-1">
                          <Button size="sm" variant="outline" className="flex-1 h-7 text-[11px] gap-1" onClick={() => handleReEdit(entry)}>
                            <RotateCcw size={11} />
                            Re-editar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageOptimizer;
