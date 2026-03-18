import { useState, useCallback, useRef } from "react";
import { Upload, Monitor, Smartphone, Zap, Download, ImageIcon, X, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CENCOSUD_PRESETS, type ImagePreset } from "@/lib/image-presets";

const ImageOptimizer = () => {
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedPreset: ImagePreset | null = selectedPresetKey
    ? CENCOSUD_PRESETS[selectedPresetKey]
    : null;

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setUploadedImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const clearImage = () => {
    setUploadedImage(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const hasImage = !!uploadedImage;

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
            <Select value={selectedPresetKey} onValueChange={setSelectedPresetKey}>
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

        {/* Dropzone + Previews */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dropzone */}
          <Card className="lg:col-span-1">
            <CardContent className="p-5">
              <label className="text-sm font-semibold text-foreground mb-3 block">
                Imagen Maestra
              </label>

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
                  <p className="text-sm font-medium text-foreground mb-1">
                    Arrastra tu imagen aquí
                  </p>
                  <p className="text-xs text-muted-foreground">
                    o haz clic para seleccionar
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    JPG, PNG, WebP
                  </p>
                </div>
              ) : (
                <div className="relative rounded-xl border border-border overflow-hidden">
                  <img
                    src={uploadedImage}
                    alt="Imagen subida"
                    className="w-full h-auto max-h-[300px] object-contain bg-muted/30"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/80 text-background hover:bg-foreground transition-colors"
                  >
                    <X size={14} />
                  </button>
                  <div className="px-3 py-2 bg-muted/50 border-t border-border">
                    <p className="text-xs text-muted-foreground truncate">{fileName}</p>
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
                    className="absolute inset-0 w-full h-full object-cover object-center"
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
                  {selectedPreset.desktop.width}×{selectedPreset.desktop.height}px · Ratio{" "}
                  {selectedPreset.desktop.ratio}
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
                    className="absolute inset-0 w-full h-full object-cover object-center"
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
                  {selectedPreset.mobile.width}×{selectedPreset.mobile.height}px · Ratio{" "}
                  {selectedPreset.mobile.ratio}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={!hasImage || !selectedPresetKey}
            className="gap-2 bg-[hsl(210,100%,32%)] hover:bg-[hsl(210,100%,28%)] text-white"
          >
            <Zap size={16} />
            Procesar Imágenes
          </Button>
          <Button
            disabled={!hasImage || !selectedPresetKey}
            variant="outline"
            className="gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
          >
            <Download size={16} />
            Descargar Todo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageOptimizer;
