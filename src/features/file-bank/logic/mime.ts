/**
 * Infer a reliable MIME type from the file extension when the browser
 * doesn't provide one (or provides a wrong one — e.g. iOS Safari sometimes
 * reports "application/zip" for .mp4 from WhatsApp).
 */
const EXT_TO_MIME: Record<string, string> = {
  // video
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
  // audio
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  // image
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif",
  heic: "image/heic",
  // doc
  pdf: "application/pdf",
  txt: "text/plain",
  csv: "text/csv",
  json: "application/json",
  xml: "application/xml",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // archive
  zip: "application/zip",
  rar: "application/vnd.rar",
  "7z": "application/x-7z-compressed",
  tar: "application/x-tar",
  gz: "application/gzip",
};

const MIME_TO_LABEL: Record<string, string> = {
  // PowerPoint
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint (.pptx)",
  "application/vnd.ms-powerpoint": "PowerPoint (.ppt)",
  // Word
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word (.docx)",
  "application/msword": "Word (.doc)",
  // Excel
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel (.xlsx)",
  "application/vnd.ms-excel": "Excel (.xls)",
  // Google Workspace
  "application/vnd.google-apps.presentation": "Google Slides",
  "application/vnd.google-apps.document": "Google Docs",
  "application/vnd.google-apps.spreadsheet": "Google Sheets",
  // PDF e imágenes vectoriales
  "application/pdf": "PDF",
  "application/postscript": "PostScript (.ai / .eps)",
  // Archivos comprimidos
  "application/zip": "ZIP (.zip)",
  "application/x-zip-compressed": "ZIP (.zip)",
  "application/vnd.rar": "RAR (.rar)",
  "application/x-rar-compressed": "RAR (.rar)",
  "application/x-7z-compressed": "7-Zip (.7z)",
  "application/gzip": "GZip (.gz)",
  "application/x-tar": "Tar (.tar)",
  // Texto y datos
  "text/plain": "Texto (.txt)",
  "text/csv": "CSV (.csv)",
  "text/html": "HTML",
  "text/xml": "XML",
  "application/json": "JSON",
  "application/xml": "XML",
  // Fuentes
  "font/ttf": "Fuente TTF",
  "font/otf": "Fuente OTF",
  "font/woff": "Fuente WOFF",
  "font/woff2": "Fuente WOFF2",
  // Genérico
  "application/octet-stream": "Archivo",
};

const EXT_TO_LABEL: Record<string, string> = {
  pptx: "PowerPoint (.pptx)", ppt: "PowerPoint (.ppt)",
  docx: "Word (.docx)", doc: "Word (.doc)",
  xlsx: "Excel (.xlsx)", xls: "Excel (.xls)",
  pdf: "PDF",
  zip: "ZIP (.zip)", rar: "RAR (.rar)", "7z": "7-Zip (.7z)", gz: "GZip (.gz)", tar: "Tar (.tar)",
  csv: "CSV (.csv)", txt: "Texto (.txt)", json: "JSON", xml: "XML", html: "HTML",
  ai: "Illustrator (.ai)", eps: "EPS (.eps)", psd: "Photoshop (.psd)",
  indd: "InDesign (.indd)", sketch: "Sketch (.sketch)",
  ttf: "Fuente TTF", otf: "Fuente OTF", woff: "Fuente WOFF", woff2: "Fuente WOFF2",
  mp4: "Video MP4", mov: "Video MOV", webm: "Video WebM", avi: "Video AVI", mkv: "Video MKV",
  mp3: "Audio MP3", wav: "Audio WAV", aac: "Audio AAC", m4a: "Audio M4A",
  jpg: "Imagen JPEG", jpeg: "Imagen JPEG", png: "Imagen PNG", gif: "Imagen GIF",
  webp: "Imagen WebP", svg: "Imagen SVG", avif: "Imagen AVIF",
};

/** Devuelve una etiqueta legible para un tipo MIME + nombre de archivo. */
export function mimeToLabel(mime: string, filename: string): string {
  const normalized = (mime || "").toLowerCase();
  if (MIME_TO_LABEL[normalized]) return MIME_TO_LABEL[normalized];
  // Tipos nativos con prefijo reconocible
  if (normalized.startsWith("video/")) return `Video (.${getExtension(filename) || normalized.split("/")[1]})`;
  if (normalized.startsWith("audio/")) return `Audio (.${getExtension(filename) || normalized.split("/")[1]})`;
  if (normalized.startsWith("image/")) return `Imagen (.${getExtension(filename) || normalized.split("/")[1]})`;
  // Fallback por extensión
  const ext = getExtension(filename);
  if (EXT_TO_LABEL[ext]) return EXT_TO_LABEL[ext];
  return ext ? `Archivo (.${ext})` : "Archivo";
}

export function getExtension(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i + 1).toLowerCase() : "";
}

/**
 * Returns the most trustworthy MIME type for a file, preferring the
 * extension-based mapping when the browser-provided type looks unreliable.
 */
export function resolveMimeType(file: File): string {
  const ext = getExtension(file.name);
  const fromExt = EXT_TO_MIME[ext];
  const fromBrowser = file.type;

  // No browser type → use extension
  if (!fromBrowser) return fromExt || "application/octet-stream";

  // If browser says zip/octet-stream but extension says otherwise, trust extension
  const isGenericBrowserType =
    fromBrowser === "application/octet-stream" ||
    fromBrowser === "application/zip" ||
    fromBrowser === "application/x-zip-compressed";

  if (isGenericBrowserType && fromExt && fromExt !== fromBrowser) return fromExt;

  // If extension clearly indicates video/audio/image but browser disagrees, trust extension
  if (
    fromExt &&
    (fromExt.startsWith("video/") ||
      fromExt.startsWith("audio/") ||
      fromExt.startsWith("image/") ||
      fromExt === "application/pdf") &&
    !fromBrowser.startsWith(fromExt.split("/")[0] + "/")
  ) {
    return fromExt;
  }

  return fromBrowser;
}
