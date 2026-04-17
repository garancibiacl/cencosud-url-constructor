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
