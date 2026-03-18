import { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload, Monitor, Smartphone, Zap, Download, ImageIcon, X, Info,
  AlertTriangle, Loader2, CheckCircle2, Crosshair, FileDown, Package,
  History, RotateCcw, Trash2, Layers, Eye, ChevronLeft, ShieldCheck, Type,
} from "lucide-react";
import JSZip from "jszip";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CENCOSUD_PRESETS, type ImagePreset } from "@/lib/image-presets";
import { processImage, downloadBlob, type ProcessedImage } from "@/lib/image-processor";
import {
  getHistory, addHistoryEntry, clearHistory,
  type HistoryEntry,
} from "@/lib/optimizer-history";

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

    toast({ title: "Descarga iniciada", description: `${doneItems.length * 2} archivos en el ZIP. Historial actualizado.` });
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

  const focalPointForPreview = editingItem?.focalPoint || { x: 50, y: 50 };
  const objectPosition = `${focalPointForPreview.x}% ${focalPointForPreview.y}%`;
  const previewImage = editingItem?.dataUrl || null;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-border bg-card px-8 py-6">
        <div className="flex items-center gap-3 mb-1">
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
                  {Object.entries(CENCOSUD_PRESETS).map(([key, preset]) => (
                    <SelectItem key={key} value={key}>{preset.label}</SelectItem>
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
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs font-medium">
                  <Monitor size={13} />
                  Desktop: {selectedPreset.desktop.width}×{selectedPreset.desktop.height}px
                </Badge>
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs font-medium">
                  <Smartphone size={13} />
                  Mobile: {selectedPreset.mobile.width}×{selectedPreset.mobile.height}px
                </Badge>
                <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs font-medium">
                  <Info size={13} />
                  Peso máx: {selectedPreset.maxWeightKb} KB
                </Badge>
                {selectedPreset.outputFormat && (
                  <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs font-medium">
                    Formato: .{selectedPreset.outputFormat}
                  </Badge>
                )}
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

        {/* ── Dropzone + Queue + Preview ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  {queue.length > 0 ? "o clic para seleccionar" : "Múltiples archivos · JPG, PNG, WebP"}
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

          {/* Col 2: Focal point editor OR Desktop preview */}
          <Card className="lg:col-span-1">
            <CardContent className="p-5">
              {editingItem && editingItem.dataUrl ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Crosshair size={14} className="text-primary" />
                      <span className="text-sm font-semibold text-foreground">Punto Focal</span>
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 px-2" onClick={() => setEditingId(null)}>
                      <ChevronLeft size={10} /> Volver a preview
                    </Button>
                  </div>

                  <div
                    ref={imageContainerRef}
                    className="relative select-none touch-none cursor-crosshair rounded-xl border border-border overflow-hidden"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                  >
                    <img
                      src={editingItem.dataUrl}
                      alt="Focal editor"
                      className="w-full h-auto max-h-[300px] object-contain bg-muted/30 pointer-events-none"
                      draggable={false}
                    />
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `${editingItem.focalPoint.x}%`,
                        top: `${editingItem.focalPoint.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div className="w-10 h-10 rounded-full border-2 border-destructive/70 bg-destructive/15 shadow-[0_0_12px_rgba(239,68,68,0.35)] transition-all duration-75" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-destructive shadow-sm" />
                      </div>
                      <div className="absolute top-1/2 left-0 w-full h-px bg-destructive/40" />
                      <div className="absolute left-1/2 top-0 h-full w-px bg-destructive/40" />
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground mt-2 text-center truncate">
                    {editingItem.fileName} — Focal: {Math.round(editingItem.focalPoint.x)}%, {Math.round(editingItem.focalPoint.y)}%
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <Monitor size={16} className="text-primary" />
                    <span className="text-sm font-semibold text-foreground">Vista Previa Desktop</span>
                  </div>
                  <div
                    className="relative rounded-xl border border-border bg-muted/30 overflow-hidden"
                    style={{
                      aspectRatio: selectedPreset
                        ? selectedPreset.desktop.ratio.replace("/", " / ")
                        : "16 / 9",
                    }}
                  >
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Preview desktop"
                        className="absolute inset-0 w-full h-full object-cover transition-[object-position] duration-150 ease-out"
                        style={{ objectPosition }}
                      />
                    ) : queue.length > 0 && queue[0]?.dataUrl ? (
                      <img
                        src={queue[0].dataUrl}
                        alt="Preview desktop"
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ objectPosition: `${queue[0].focalPoint.x}% ${queue[0].focalPoint.y}%` }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                        <Monitor size={28} className="mb-2 opacity-40" />
                        <span className="text-xs">Sin imagen</span>
                      </div>
                    )}
                    {/* Safe zone overlay - Desktop */}
                    {showSafeZones && selectedPreset?.safeZone && (
                      <div
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{
                          border: `${(selectedPreset.safeZone.desktop / selectedPreset.desktop.width) * 100}% dashed`,
                          borderColor: "hsla(24, 83%, 52%, 0.55)",
                        }}
                      >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-accent/80 text-accent-foreground text-[8px] font-bold px-1.5 py-0.5 rounded-b">
                          {selectedPreset.safeZone.desktop}px
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedPreset && (
                    <p className="text-[11px] text-muted-foreground mt-2 text-center">
                      {selectedPreset.desktop.width}×{selectedPreset.desktop.height}px · Ratio {selectedPreset.desktop.ratio}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Col 3: Mobile preview */}
          <Card className="lg:col-span-1">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone size={16} className="text-primary" />
                <span className="text-sm font-semibold text-foreground">Vista Previa Mobile</span>
              </div>
              <div
                className="relative rounded-xl border border-border bg-muted/30 overflow-hidden mx-auto"
                style={{
                  aspectRatio: selectedPreset
                    ? selectedPreset.mobile.ratio.replace("/", " / ")
                    : "9 / 16",
                  maxHeight: "320px",
                }}
              >
                {(() => {
                  const src = previewImage || (queue.length > 0 ? queue[0]?.dataUrl : null);
                  const fp = editingItem?.focalPoint || (queue.length > 0 ? queue[0]?.focalPoint : null);
                  if (src) {
                    return (
                      <img
                        src={src}
                        alt="Preview mobile"
                        className="absolute inset-0 w-full h-full object-cover transition-[object-position] duration-150 ease-out"
                        style={{ objectPosition: fp ? `${fp.x}% ${fp.y}%` : "50% 50%" }}
                      />
                    );
                  }
                  return (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                      <Smartphone size={28} className="mb-2 opacity-40" />
                      <span className="text-xs">Sin imagen</span>
                    </div>
                  );
                })()}
              </div>
              {selectedPreset && (
                <p className="text-[11px] text-muted-foreground mt-2 text-center">
                  {selectedPreset.mobile.width}×{selectedPreset.mobile.height}px · Ratio {selectedPreset.mobile.ratio}
                </p>
              )}
              {/* Quick focal point editing buttons for queue */}
              {queue.length > 0 && !editingId && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {queue.slice(0, 6).map((item, i) => (
                    <button
                      key={item.id}
                      onClick={() => setEditingId(item.id)}
                      className="group relative w-9 h-9 rounded-md border border-border overflow-hidden hover:ring-2 hover:ring-primary/40 transition-all"
                      title={`Editar focal: ${item.fileName}`}
                    >
                      {item.dataUrl ? (
                        <img src={item.dataUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-[9px] text-muted-foreground">{i + 1}</div>
                      )}
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 flex items-center justify-center transition-all">
                        <Eye size={10} className="text-background opacity-0 group-hover:opacity-100" />
                      </div>
                    </button>
                  ))}
                  {queue.length > 6 && (
                    <span className="text-[10px] text-muted-foreground self-center ml-1">+{queue.length - 6} más</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
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
                        {img.device === "desktop" ? <Monitor size={11} className="text-primary" /> : <Smartphone size={11} className="text-primary" />}
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
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Monitor size={10} /> {entry.desktopSizeKb}KB
                          <span className="mx-0.5">·</span>
                          <Smartphone size={10} /> {entry.mobileSizeKb}KB
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
