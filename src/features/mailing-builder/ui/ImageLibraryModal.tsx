import { useCallback, useMemo, useRef, useState } from "react";
import {
  AlertCircle, Check, ChevronDown, Image as ImageIcon,
  LayoutGrid, Link, List, Loader2, RefreshCw, Search, Upload, X,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFiles } from "@/features/file-bank/hooks/useFiles";
import type { FileRecord } from "@/features/file-bank/logic/file-bank.types";
import { useMailingBuilderStore } from "../hooks/useMailingBuilderStore";
import type { MailingBlock } from "../logic/schema/block.types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PAGE_SIZE = 24;

function applyImageToBlock(block: MailingBlock, field: string, url: string): MailingBlock {
  if (field === "src" && block.type === "image") {
    return { ...block, props: { ...block.props, src: url } };
  }
  if (field === "imageUrl" && (block.type === "hero" || block.type === "product" || block.type === "product-dd")) {
    return { ...block, props: { ...block.props, imageUrl: url } };
  }
  if (field === "logoUrl" && block.type === "product-dd") {
    return { ...block, props: { ...block.props, logoUrl: url } };
  }
  if (field === "backgroundImage") {
    return { ...block, layout: { ...block.layout, backgroundImage: url } };
  }
  return block;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ---------------------------------------------------------------------------
// FallbackImg — muestra el thumbnail y hace fallback a la URL original
// si Supabase Storage Transforms no está habilitado en el plan actual.
// ---------------------------------------------------------------------------

function FallbackImg({
  src,
  thumbSrc,
  alt,
  className,
}: {
  src: string;
  thumbSrc: string;
  alt: string;
  className?: string;
}) {
  const [usedSrc, setUsedSrc] = useState(thumbSrc);
  return (
    <img
      src={usedSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        // Si el thumbnail CDN falla (plan sin transforms), usa la URL original
        if (usedSrc !== src) setUsedSrc(src);
      }}
    />
  );
}

function getThumbnailUrl(fileUrl: string, width = 240, quality = 75): string {
  if (!fileUrl.includes("/storage/v1/object/public/")) return fileUrl;
  const transformed = fileUrl.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/",
  );
  return `${transformed}?width=${width}&quality=${quality}&resize=cover`;
}

// ---------------------------------------------------------------------------
// ImageGrid
// ---------------------------------------------------------------------------

function ImageGrid({
  files,
  total,
  loading,
  error,
  selectedId,
  viewMode,
  onSelect,
  onLoadMore,
  onRetry,
}: {
  files: FileRecord[];
  total: number;
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  viewMode: "grid" | "list";
  onSelect: (file: FileRecord) => void;
  onLoadMore: () => void;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando archivos…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-destructive/30 bg-destructive/5 text-center">
        <AlertCircle className="h-8 w-8 text-destructive/50" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Error al cargar archivos</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-secondary"
        >
          <RefreshCw className="h-3 w-3" />
          Reintentar
        </button>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-secondary/20 text-center">
        <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
        <div>
          <p className="text-sm font-medium text-foreground">No hay imágenes disponibles</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Sube imágenes en la pestaña "Subir" o en Banco de Archivos.
          </p>
        </div>
      </div>
    );
  }

  const hasMore = files.length < total;

  if (viewMode === "list") {
    return (
      <div className="space-y-2">
        <div className="overflow-hidden rounded-lg border border-border divide-y divide-border">
          {files.map((file) => {
            const selected = file.id === selectedId;
            return (
              <button
                key={file.id}
                type="button"
                onClick={() => onSelect(file)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-secondary/50 ${
                  selected ? "bg-primary/5 ring-1 ring-inset ring-primary/30" : ""
                }`}
              >
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
                  <FallbackImg
                    src={file.file_url}
                    thumbSrc={getThumbnailUrl(file.file_url, 80, 70)}
                    alt={file.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{file.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {file.description || formatBytes(file.file_size)}
                  </p>
                </div>
                {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
        {hasMore && <LoadMoreButton onClick={onLoadMore} shown={files.length} total={total} />}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {files.map((file) => {
          const selected = file.id === selectedId;
          return (
            <button
              key={file.id}
              type="button"
              onClick={() => onSelect(file)}
              className={`group relative overflow-hidden rounded-lg border-2 bg-secondary transition ${
                selected
                  ? "border-primary shadow-md"
                  : "border-transparent hover:border-border hover:shadow-sm"
              }`}
            >
              <div className="aspect-square overflow-hidden bg-secondary/60">
                <FallbackImg
                  src={file.file_url}
                  thumbSrc={getThumbnailUrl(file.file_url)}
                  alt={file.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="p-1.5">
                <p className="line-clamp-1 text-[11px] font-medium text-foreground">{file.title}</p>
              </div>
              {selected && (
                <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary shadow">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {hasMore && <LoadMoreButton onClick={onLoadMore} shown={files.length} total={total} />}
    </div>
  );
}

function LoadMoreButton({
  onClick,
  shown,
  total,
}: {
  onClick: () => void;
  shown: number;
  total: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2 text-xs font-medium text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground"
    >
      <ChevronDown className="h-3.5 w-3.5" />
      Cargar más — mostrando {shown} de {total}
    </button>
  );
}

// ---------------------------------------------------------------------------
// UploadTab — recibe upload como prop (evita doble suscripción)
// ---------------------------------------------------------------------------

function UploadTab({
  onUpload,
  onUploaded,
}: {
  onUpload: (opts: { file: File; title: string }) => Promise<FileRecord>;
  onUploaded: (file: FileRecord) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const pickFile = useCallback(
    (f: File) => {
      if (!f.type.startsWith("image/")) {
        setUploadError("Solo se permiten archivos de imagen (PNG, JPG, WebP).");
        return;
      }
      setFile(f);
      setUploadError(null);
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
    },
    [title],
  );

  const submit = useCallback(async () => {
    if (!file || !title.trim()) return;
    setUploadError(null);
    try {
      setUploading(true);
      const created = await onUpload({ file, title });
      onUploaded(created);
      setFile(null);
      setTitle("");
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Error al subir la imagen. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  }, [file, title, onUpload, onUploaded]);

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) pickFile(f);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition ${
          dragOver
            ? "border-primary/60 bg-primary/5"
            : "border-border bg-secondary/20 hover:border-primary/40 hover:bg-secondary/40"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pickFile(f);
            e.target.value = "";
          }}
        />
        {file ? (
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground/40" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {dragOver ? "Suelta la imagen aquí" : "Arrastra o haz clic para seleccionar"}
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WebP</p>
            </div>
          </>
        )}
      </div>

      {/* Error de validación o upload */}
      {uploadError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
          <p className="text-xs text-destructive">{uploadError}</p>
        </div>
      )}

      {file && (
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-xs font-medium text-foreground/70">Título</span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre del archivo"
              className="h-8 text-sm"
            />
          </div>
          <button
            type="button"
            disabled={uploading || !title.trim()}
            onClick={submit}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Subiendo…</>
            ) : (
              <><Upload className="h-4 w-4" /> Subir imagen</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ImageLibraryModal
// ---------------------------------------------------------------------------

export function ImageLibraryModal() {
  const imageLibrary = useMailingBuilderStore((s) => s.imageLibrary);
  const closeImageLibrary = useMailingBuilderStore((s) => s.closeImageLibrary);
  const updateBlock = useMailingBuilderStore((s) => s.updateBlock);
  const document = useMailingBuilderStore((s) => s.document);

  // enabled=imageLibrary.open → solo fetch cuando el modal está abierto,
  // respetando el cache TTL entre aperturas.
  const { files, loading, error, refresh, upload } = useFiles(imageLibrary.open);

  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const imageFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return files.filter((f) => {
      if (!f.file_type.startsWith("image/")) return false;
      if (!q) return true;
      return [f.title, f.description, f.uploaded_by_email ?? ""].some((v) =>
        v.toLowerCase().includes(q),
      );
    });
  }, [files, query]);

  const visibleFiles = useMemo(
    () => imageFiles.slice(0, visibleCount),
    [imageFiles, visibleCount],
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeImageLibrary();
        setSelectedId(null);
        setQuery("");
        setUrlInput("");
        setVisibleCount(PAGE_SIZE);
      }
    },
    [closeImageLibrary],
  );

  const handleQueryChange = useCallback((q: string) => {
    setQuery(q);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const applySelection = useCallback(
    (url: string) => {
      const { targetBlockId, targetField } = imageLibrary;
      if (!targetBlockId || !targetField) return;

      let found: MailingBlock | null = null;
      outer: for (const row of document.rows) {
        for (const col of row.columns) {
          const b = col.blocks.find((b) => b.id === targetBlockId);
          if (b) { found = b; break outer; }
        }
      }
      if (!found) return;

      updateBlock(applyImageToBlock(found, targetField, url));
      closeImageLibrary();
      setSelectedId(null);
    },
    [imageLibrary, document, updateBlock, closeImageLibrary],
  );

  const handleSelectFile = useCallback(
    (file: FileRecord) => {
      setSelectedId(file.id);
      applySelection(file.file_url);
    },
    [applySelection],
  );

  const handleUploaded = useCallback(
    (file: FileRecord) => {
      refresh();
      applySelection(file.file_url);
    },
    [refresh, applySelection],
  );

  const handleUrlConfirm = useCallback(() => {
    const url = urlInput.trim();
    if (!url) return;
    applySelection(url);
    setUrlInput("");
  }, [urlInput, applySelection]);

  return (
    <Dialog open={imageLibrary.open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl gap-0 p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-semibold">Biblioteca de imágenes</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="library" className="flex flex-col">
          <div className="border-b border-border px-5">
            <TabsList className="h-9 gap-1 rounded-none bg-transparent p-0">
              <TabsTrigger
                value="library"
                className="h-9 rounded-none border-b-2 border-transparent px-3 text-xs font-medium data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground"
              >
                Mis archivos
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                className="h-9 rounded-none border-b-2 border-transparent px-3 text-xs font-medium data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground"
              >
                Subir imagen
              </TabsTrigger>
              <TabsTrigger
                value="url"
                className="h-9 rounded-none border-b-2 border-transparent px-3 text-xs font-medium data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground"
              >
                URL directa
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Mis archivos */}
          <TabsContent value="library" className="mt-0 space-y-4 p-5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Buscar por nombre o descripción…"
                  className="h-8 pl-9 text-sm"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => handleQueryChange("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="flex h-8 overflow-hidden rounded-md border border-border">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  title="Vista cuadrícula"
                  className={`flex w-8 items-center justify-center transition ${
                    viewMode === "grid"
                      ? "bg-foreground text-background"
                      : "bg-card text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  title="Vista lista"
                  className={`flex w-8 items-center justify-center transition ${
                    viewMode === "list"
                      ? "bg-foreground text-background"
                      : "bg-card text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
              {!loading && !error && (
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {imageFiles.length} imagen{imageFiles.length !== 1 ? "es" : ""}
                </span>
              )}
            </div>
            <ScrollArea className="h-[380px] pr-2">
              <ImageGrid
                files={visibleFiles}
                total={imageFiles.length}
                loading={loading}
                error={error}
                selectedId={selectedId}
                viewMode={viewMode}
                onSelect={handleSelectFile}
                onLoadMore={() => setVisibleCount((n) => n + PAGE_SIZE)}
                onRetry={refresh}
              />
            </ScrollArea>
          </TabsContent>

          {/* Subir */}
          <TabsContent value="upload" className="mt-0 p-5">
            <UploadTab onUpload={upload} onUploaded={handleUploaded} />
          </TabsContent>

          {/* URL directa */}
          <TabsContent value="url" className="mt-0 p-5">
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Pega una URL externa (CDN, servidor de imágenes, etc.)
              </p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Link className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleUrlConfirm(); }}
                    placeholder="https://cdn.ejemplo.com/imagen.jpg"
                    className="h-9 pl-9 font-mono text-xs"
                  />
                </div>
                <button
                  type="button"
                  disabled={!urlInput.trim()}
                  onClick={handleUrlConfirm}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Usar imagen
                </button>
              </div>
              {urlInput.trim() && (
                <div className="overflow-hidden rounded-lg border border-border bg-secondary/30 p-2">
                  <img
                    src={urlInput}
                    alt="preview"
                    className="mx-auto max-h-48 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
