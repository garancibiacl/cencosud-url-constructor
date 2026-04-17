import { AlertTriangle, ExternalLink, FileText, Image as ImageIcon, Film, Presentation, Archive } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatBytes } from "../logic/slug";
import { MAX_FILE_SIZE_BYTES } from "../logic/file-bank.types";

interface Props {
  open: boolean;
  onClose: () => void;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

interface Tool {
  name: string;
  url: string;
  description: string;
}

function getRecommendations(fileType: string): { icon: typeof FileText; label: string; tips: string[]; tools: Tool[] } {
  if (fileType.includes("pdf")) {
    return {
      icon: FileText,
      label: "PDF",
      tips: [
        "Reduce la resolución de imágenes embebidas a 150 DPI",
        "Elimina páginas innecesarias",
        "Usa compresión 'optimizado para web'",
      ],
      tools: [
        { name: "Smallpdf", url: "https://smallpdf.com/es/comprimir-pdf", description: "Compresión rápida online" },
        { name: "iLovePDF", url: "https://www.ilovepdf.com/es/comprimir_pdf", description: "Hasta 80% menos peso" },
      ],
    };
  }
  if (fileType.includes("presentation") || fileType.includes("powerpoint")) {
    return {
      icon: Presentation,
      label: "Presentación",
      tips: [
        "Comprimir multimedia: Archivo → Información → Comprimir medios → Calidad estándar",
        "Reducir resolución de imágenes: 96 ppp para pantalla",
        "Si tiene videos pesados, súbelos a YouTube/Vimeo y enlázalos",
        "Guardar como PDF si no necesita animaciones",
      ],
      tools: [
        { name: "PowerPoint nativo", url: "https://support.microsoft.com/es-es/office/reducir-el-tama%C3%B1o-de-archivo-de-las-im%C3%A1genes-8db7211c-d958-457c-babd-194109eb9535", description: "Comprimir desde la app" },
        { name: "WeCompress", url: "https://www.wecompress.com/es/", description: "PPT, PDF, imágenes online" },
      ],
    };
  }
  if (fileType.includes("video") || fileType.includes("mp4")) {
    return {
      icon: Film,
      label: "Video",
      tips: [
        "Reduce resolución a 720p (HD) en vez de 4K",
        "Usa códec H.264 con preset 'Fast 720p30'",
        "Bitrate recomendado: 2-4 Mbps para web",
      ],
      tools: [
        { name: "HandBrake", url: "https://handbrake.fr/", description: "Gratis, desktop, muy potente" },
        { name: "FreeConvert", url: "https://www.freeconvert.com/es/video-compressor", description: "Compresión online" },
      ],
    };
  }
  if (fileType.includes("image")) {
    return {
      icon: ImageIcon,
      label: "Imagen",
      tips: [
        "Convierte PNG a JPG si no necesita transparencia",
        "Reduce dimensiones a máximo 1920px de ancho",
        "Calidad JPG 80% es indistinguible al ojo",
      ],
      tools: [
        { name: "TinyPNG", url: "https://tinypng.com/", description: "Compresión inteligente PNG/JPG" },
        { name: "Squoosh", url: "https://squoosh.app/", description: "Editor de Google, control total" },
      ],
    };
  }
  return {
    icon: Archive,
    label: "Archivo",
    tips: [
      "Comprime en ZIP con máxima compresión",
      "Divide en partes si es muy grande",
      "Considera usar WeTransfer/Google Drive para archivos > 50 MB",
    ],
    tools: [
      { name: "WeTransfer", url: "https://wetransfer.com/", description: "Hasta 2 GB gratis sin cuenta" },
      { name: "Google Drive", url: "https://drive.google.com/", description: "15 GB gratis, link compartible" },
    ],
  };
}

export function CompressionTipsModal({ open, onClose, fileName, fileSize, fileType = "" }: Props) {
  const rec = getRecommendations(fileType);
  const Icon = rec.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Archivo demasiado pesado</DialogTitle>
              <DialogDescription>
                El límite es {formatBytes(MAX_FILE_SIZE_BYTES)}. Tu archivo pesa{" "}
                {fileSize ? formatBytes(fileSize) : "más del límite"}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {fileName && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <span className="font-medium text-foreground">{fileName}</span>
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">
                Cómo reducir el peso ({rec.label})
              </h4>
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {rec.tips.map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">
              Herramientas recomendadas
            </h4>
            <div className="grid gap-2">
              {rec.tools.map((tool) => (
                <a
                  key={tool.url}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">{tool.name}</div>
                    <div className="text-xs text-muted-foreground">{tool.description}</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Tip:</strong> Una vez comprimido, vuelve a
            arrastrar el archivo aquí. El link se genera al instante y se sirve desde CDN para
            descarga inmediata sin necesidad de iniciar sesión.
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Entendido</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
