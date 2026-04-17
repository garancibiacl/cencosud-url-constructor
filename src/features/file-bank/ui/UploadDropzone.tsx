import { useCallback, useRef, useState } from "react";
import { Upload, FileUp, X, Loader2, CloudUpload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { validateFile } from "../services/file-bank.service";
import { formatBytes } from "../logic/slug";
import type { UploadOptions, UploadProgress } from "../services/file-bank.service";

interface Props {
  onUpload: (opts: UploadOptions) => Promise<unknown>;
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec <= 0) return "—";
  return `${formatBytes(bytesPerSec)}/s`;
}

function formatEta(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return "—";
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.ceil(seconds % 60);
  return `${m}m ${s}s`;
}

export function UploadDropzone({ onUpload }: Props) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  const pickFile = (f: File) => {
    const err = validateFile(f);
    if (err) {
      toast({ title: "Archivo no válido", description: err, variant: "destructive" });
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }, []);

  const reset = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = async () => {
    if (!file) return;
    if (!title.trim()) {
      toast({ title: "Falta el título", variant: "destructive" });
      return;
    }
    try {
      setUploading(true);
      setProgress({ bytesUploaded: 0, bytesTotal: file.size, percent: 0, speed: 0 });
      await onUpload({
        file,
        title,
        description,
        onProgress: (p) => setProgress(p),
      });
      toast({ title: "Archivo subido", description: title });
      reset();
    } catch (e) {
      toast({
        title: "Error al subir",
        description: e instanceof Error ? e.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  const eta =
    progress && progress.speed > 0
      ? (progress.bytesTotal - progress.bytesUploaded) / progress.speed
      : Infinity;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
      {/* Card header */}
      <div className="flex items-center gap-3 bg-gradient-to-br from-slate-900 to-blue-950 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
          <CloudUpload className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">Subir archivo</h2>
          <p className="text-[11px] text-slate-300/80">PDF, PPT, DOC, XLS, imagen, video o ZIP</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Drop zone */}
        <motion.div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          animate={{
            scale: dragOver ? 1.01 : 1,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={`relative flex min-h-[148px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors duration-150 ${
            dragOver
              ? "border-orange-400 bg-orange-50/50"
              : "border-blue-200 bg-blue-50/50 hover:border-blue-400 hover:bg-blue-50"
          }`}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pickFile(f);
            }}
          />

          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center text-center"
              >
                <div
                  className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-150 ${
                    dragOver ? "bg-orange-100" : "bg-blue-100"
                  }`}
                >
                  <Upload
                    className={`h-6 w-6 transition-colors duration-150 ${
                      dragOver ? "text-orange-500" : "text-blue-500"
                    }`}
                  />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  {dragOver ? "Suelta el archivo aquí" : "Arrastra o haz clic para seleccionar"}
                </p>
                <p className="mt-1 text-xs text-slate-400">hasta 5 GB</p>
                <p className="mt-0.5 text-[11px] text-slate-400/80">
                  Subida resumible — retoma si se corta internet
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="file"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="flex w-full items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <FileUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
                  </div>
                </div>
                {!uploading && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      reset();
                    }}
                    className="shrink-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Form fields — only visible when a file is selected */}
        <AnimatePresence>
          {file && (
            <motion.div
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 overflow-hidden"
            >
              <div>
                <Label htmlFor="fb-title" className="text-xs font-medium text-slate-600">
                  Título
                </Label>
                <Input
                  id="fb-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  placeholder="Nombre visible del archivo"
                  disabled={uploading}
                  className="mt-1 border-slate-200 bg-slate-50 text-sm focus-visible:ring-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="fb-desc" className="text-xs font-medium text-slate-600">
                  Descripción <span className="text-slate-400 font-normal">(opcional)</span>
                </Label>
                <Textarea
                  id="fb-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="Breve contexto del archivo"
                  disabled={uploading}
                  className="mt-1 border-slate-200 bg-slate-50 text-sm focus-visible:ring-blue-500 resize-none"
                />
              </div>

              {/* Progress */}
              {uploading && progress && (
                <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-blue-700">
                      {progress.percent.toFixed(1)}%
                    </span>
                    <span className="text-slate-500">
                      {formatBytes(progress.bytesUploaded)} / {formatBytes(progress.bytesTotal)}
                    </span>
                  </div>
                  <Progress
                    value={progress.percent}
                    className="h-2 bg-blue-100 [&>div]:bg-blue-500"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Velocidad: {formatSpeed(progress.speed)}</span>
                    <span>Restante: {formatEta(eta)}</span>
                  </div>
                </div>
              )}

              {/* Submit */}
              <Button
                onClick={submit}
                disabled={uploading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-sm hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo... {progress ? `${progress.percent.toFixed(0)}%` : ""}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Subir archivo
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
