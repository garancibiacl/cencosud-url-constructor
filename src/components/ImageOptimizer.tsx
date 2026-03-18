import { useState, useCallback, useRef } from "react";
import {
  Upload, Monitor, Smartphone, Zap, Download, ImageIcon, X, Info,
  AlertTriangle, Loader2, CheckCircle2, Crosshair, FileDown, Package,
} from "lucide-react";
import JSZip from "jszip";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CENCOSUD_PRESETS, type ImagePreset } from "@/lib/image-presets";
import { processImage, downloadBlob, type ProcessedImage } from "@/lib/image-processor";

const ImageOptimizer = () => {
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileSizeKb, setFileSizeKb] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [focalPoint, setFocalPoint] = useState({ x: 50, y: 50 });
  const [isDraggingFocal, setIsDraggingFocal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [results, setResults] = useState<ProcessedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const selectedPreset: ImagePreset | null = selectedPresetKey
    ? CENCOSUD_PRESETS[selectedPresetKey]
    : null;

  const isOverweight = selectedPreset ? fileSizeKb > selectedPreset.maxWeightKb : false;
  const objectPosition = `${focalPoint.x}% ${focalPoint.y}%`;
  const hasImage = !!uploadedImage;
  const isProcessed = results.length > 0;
  const canProcess = hasImage && !!selectedPresetKey && !isProcessing;

  const resetResults = () => {
    results.forEach((r) => URL.revokeObjectURL(r.dataUrl));
    setResults([]);
    setProcessProgress(0);
  };

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name);
    setFileSizeKb(Math.round(file.size / 1024));
    setFocalPoint({ x: 50, y: 50 });
    resetResults();
    const reader = new FileReader();
    reader.onload = (e) => setUploadedImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const clearImage = () => {
    setUploadedImage(null);
    setFileName("");
    setFileSizeKb(0);
    resetResults();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Focal point ---
  const updateFocalFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const el = imageContainerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
      setFocalPoint({ x, y });
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDraggingFocal(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updateFocalFromEvent(e.clientX, e.clientY);
    },
    [updateFocalFromEvent],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingFocal) return;
      updateFocalFromEvent(e.clientX, e.clientY);
    },
    [isDraggingFocal, updateFocalFromEvent],
  );

  const handlePointerUp = useCallback(() => {
    setIsDraggingFocal(false);
  }, []);

  // --- Real processing ---
  const handleProcess = useCallback(async () => {
    if (!uploadedImage || !selectedPreset || !selectedPresetKey) return;
    setIsProcessing(true);
    setProcessProgress(0);
    resetResults();

    try {
      const processed = await processImage(
        uploadedImage,
        selectedPreset,
        focalPoint.x,
        focalPoint.y,
        (pct) => setProcessProgress(pct),
      );
      setResults(processed);

      const brandName = selectedPreset.label.split(" - ")[0] || selectedPreset.label;
      toast({
        title: "¡Imágenes optimizadas con éxito!",
        description: `Banners listos para ${brandName}`,
        className: "border-[hsl(88,72%,43%)] bg-[hsl(88,72%,95%)] text-[hsl(88,72%,20%)]",
      });
    } catch {
      toast({
        title: "Error al procesar",
        description: "No se pudo procesar la imagen. Intenta con otra.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedImage, selectedPreset, selectedPresetKey, focalPoint, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Downloads ---
  const handleDownloadSingle = (img: ProcessedImage) => {
    downloadBlob(img.blob, img.fileName);
  };

  const handleDownloadAll = async () => {
    if (results.length === 0) return;
    const zip = new JSZip();
    results.forEach((r) => zip.file(r.fileName, r.blob));
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const presetSlug = (selectedPreset?.label || "export")
      .toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    downloadBlob(zipBlob, `${presetSlug}-banners.zip`);
  };

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
            <Select value={selectedPresetKey} onValueChange={(v) => { setSelectedPresetKey(v); resetResults(); }}>
              <SelectTrigger className="w-full max-w-md h-11 text-sm">
                <SelectValue placeholder="Selecciona un formato de Cencosud..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CENCOSUD_PRESETS).map(([key, preset]) => (
                  <SelectItem key={key} value={key}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weight alert */}
        {hasImage && selectedPreset && isOverweight && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 animate-fade-in">
            <AlertTriangle size={18} className="text-destructive shrink-0" />
            <p className="text-sm text-destructive">
              La imagen pesa <strong>{fileSizeKb} KB</strong> y supera el límite de{" "}
              <strong>{selectedPreset.maxWeightKb} KB</strong>. Será optimizada al procesar.
            </p>
          </div>
        )}

        {hasImage && selectedPreset && !isOverweight && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 animate-fade-in">
            <CheckCircle2 size={18} className="text-primary shrink-0" />
            <p className="text-sm text-primary">
              Peso actual: <strong>{fileSizeKb} KB</strong> — dentro del límite de{" "}
              <strong>{selectedPreset.maxWeightKb} KB</strong>.
            </p>
          </div>
        )}

        {/* Dropzone + Previews */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dropzone / Focal Point */}
          <Card className="lg:col-span-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-foreground">Imagen Maestra</label>
                {hasImage && (
                  <Badge variant="secondary" className="gap-1 text-[10px] px-2 py-0.5">
                    <Crosshair size={10} />
                    Arrastra el punto focal
                  </Badge>
                )}
              </div>

              {!hasImage ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer min-h-[220px] ${
                    isDragging
                      ? "border-primary bg-primary/5 scale-[1.01]"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                    <Upload size={24} className="text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">Arrastra tu imagen aquí</p>
                  <p className="text-xs text-muted-foreground">o haz clic para seleccionar</p>
                  <p className="text-[11px] text-muted-foreground mt-2">JPG, PNG, WebP</p>
                </div>
              ) : (
                <div className="relative rounded-xl border border-border overflow-hidden">
                  <div
                    ref={imageContainerRef}
                    className="relative select-none touch-none cursor-crosshair"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                  >
                    <img
                      src={uploadedImage}
                      alt="Imagen subida"
                      className="w-full h-auto max-h-[300px] object-contain bg-muted/30 pointer-events-none"
                      draggable={false}
                    />
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `${focalPoint.x}%`,
                        top: `${focalPoint.y}%`,
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

                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/80 text-background hover:bg-foreground transition-colors"
                  >
                    <X size={14} />
                  </button>

                  <div className="px-3 py-2 bg-muted/50 border-t border-border flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate flex-1">{fileName}</p>
                    <span className={`text-xs font-medium ml-2 ${isOverweight ? "text-destructive" : "text-muted-foreground"}`}>
                      {fileSizeKb} KB
                    </span>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </CardContent>
          </Card>

          {/* Desktop Preview */}
          <Card className="lg:col-span-1">
            <CardContent className="p-5">
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
                {hasImage ? (
                  <img
                    src={uploadedImage}
                    alt="Preview desktop"
                    className="absolute inset-0 w-full h-full object-cover transition-[object-position] duration-150 ease-out"
                    style={{ objectPosition }}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <Monitor size={28} className="mb-2 opacity-40" />
                    <span className="text-xs">Sin imagen</span>
                  </div>
                )}
              </div>
              {selectedPreset && (
                <p className="text-[11px] text-muted-foreground mt-2 text-center">
                  {selectedPreset.desktop.width}×{selectedPreset.desktop.height}px · Ratio {selectedPreset.desktop.ratio}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Mobile Preview */}
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
                {hasImage ? (
                  <img
                    src={uploadedImage}
                    alt="Preview mobile"
                    className="absolute inset-0 w-full h-full object-cover transition-[object-position] duration-150 ease-out"
                    style={{ objectPosition }}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <Smartphone size={28} className="mb-2 opacity-40" />
                    <span className="text-xs">Sin imagen</span>
                  </div>
                )}
              </div>
              {selectedPreset && (
                <p className="text-[11px] text-muted-foreground mt-2 text-center">
                  {selectedPreset.mobile.width}×{selectedPreset.mobile.height}px · Ratio {selectedPreset.mobile.ratio}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Processing progress */}
        {(isProcessing || isProcessed) && (
          <Card className="animate-fade-in">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="text-primary animate-spin" />
                    <span className="text-sm font-medium text-foreground">Optimizando imágenes…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} className="text-primary" />
                    <span className="text-sm font-medium text-foreground">¡Imágenes procesadas con éxito!</span>
                  </>
                )}
              </div>
              <Progress value={Math.min(processProgress, 100)} className="h-2" />
              <p className="text-[11px] text-muted-foreground mt-2">
                {isProcessing
                  ? `Progreso: ${Math.min(Math.round(processProgress), 100)}%`
                  : "Desktop y Mobile listos para descarga"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results Gallery */}
        {isProcessed && (
          <Card className="animate-fade-in">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Package size={16} className="text-primary" />
                Resultados — Listos para descarga
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((img) => (
                  <div
                    key={img.device}
                    className="rounded-xl border border-border overflow-hidden bg-muted/20"
                  >
                    <div
                      className="relative bg-muted/30"
                      style={{
                        aspectRatio: img.device === "desktop"
                          ? selectedPreset?.desktop.ratio.replace("/", " / ")
                          : selectedPreset?.mobile.ratio.replace("/", " / "),
                        maxHeight: "200px",
                      }}
                    >
                      <img
                        src={img.dataUrl}
                        alt={`${img.device} result`}
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    </div>

                    <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {img.device === "desktop" ? (
                            <Monitor size={13} className="text-primary shrink-0" />
                          ) : (
                            <Smartphone size={13} className="text-primary shrink-0" />
                          )}
                          <span className="text-xs font-semibold text-foreground capitalize">
                            {img.device}
                          </span>
                          <Badge
                            variant={
                              selectedPreset && img.sizeKb <= selectedPreset.maxWeightKb
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-[10px] px-1.5 py-0"
                          >
                            {img.sizeKb} KB
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{img.fileName}</p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 shrink-0 ml-2"
                        onClick={() => handleDownloadSingle(img)}
                      >
                        <FileDown size={14} />
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
          <Button disabled={!canProcess} onClick={handleProcess} className="gap-2">
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            {isProcessing ? "Procesando…" : "Procesar Imágenes"}
          </Button>
          <Button
            disabled={!isProcessed}
            variant="outline"
            className="gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
            onClick={handleDownloadAll}
          >
            <Download size={16} />
            Descargar Todo (.zip)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageOptimizer;
