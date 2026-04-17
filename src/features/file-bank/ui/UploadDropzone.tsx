import { useCallback, useRef, useState } from "react";
import { Upload, FileUp, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { validateFile } from "../services/file-bank.service";
import { formatBytes } from "../logic/slug";
import { MAX_FILE_SIZE_BYTES } from "../logic/file-bank.types";
import { CompressionTipsModal } from "./CompressionTipsModal";
import type { UploadOptions } from "../services/file-bank.service";

interface Props {
  onUpload: (opts: UploadOptions) => Promise<unknown>;
}

export function UploadDropzone({ onUpload }: Props) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

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
      await onUpload({ file, title, description });
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
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-foreground">Subir nuevo archivo</h2>

      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        animate={{ scale: dragOver ? 1.01 : 1 }}
        className={`relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:bg-muted/50"
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pickFile(f);
          }}
        />
        {!file ? (
          <>
            <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Arrastra un archivo aquí o haz clic para seleccionar
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF, PPT, DOC, XLS, imágenes o ZIP — máximo 50 MB
            </p>
          </>
        ) : (
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <FileUp className="h-8 w-8 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                reset();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </motion.div>

      {file && (
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="fb-title">Título</Label>
            <Input
              id="fb-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="Nombre visible del archivo"
            />
          </div>
          <div>
            <Label htmlFor="fb-desc">Descripción (opcional)</Label>
            <Textarea
              id="fb-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Breve contexto del archivo"
            />
          </div>
          <Button onClick={submit} disabled={uploading} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...
              </>
            ) : (
              "Subir archivo"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
