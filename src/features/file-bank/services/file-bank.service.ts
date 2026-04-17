import * as tus from "tus-js-client";
import { supabase } from "@/integrations/supabase/client";
import { uniqueSlug } from "../logic/slug";
import { resolveMimeType, getExtension } from "../logic/mime";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  RESUMABLE_THRESHOLD_BYTES,
  type FileRecord,
} from "../logic/file-bank.types";

const BUCKET = "presentations";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export interface UploadProgress {
  bytesUploaded: number;
  bytesTotal: number;
  percent: number;
  /** bytes per second */
  speed: number;
}

export interface UploadOptions {
  file: File;
  title: string;
  description?: string;
  onProgress?: (p: UploadProgress) => void;
}

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) return "El archivo supera los 5 GB.";
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Tipo de archivo no permitido (${file.type || "desconocido"}).`;
  }
  return null;
}

/** Resumable upload via TUS protocol — auto-retries on network drops. */
async function resumableUpload(params: {
  file: File;
  path: string;
  contentType: string;
  onProgress?: (p: UploadProgress) => void;
}): Promise<void> {
  const { file, path, contentType, onProgress } = params;
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Sesión expirada. Vuelve a iniciar sesión.");
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

  const startedAt = Date.now();

  return new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 1000, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${token}`,
        apikey: anonKey,
        "x-upsert": "false",
      },
      // Per Supabase docs: must be false so TUS finalises the object on PATCH
      uploadDataDuringCreation: false,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: BUCKET,
        objectName: path,
        contentType,
        cacheControl: "3600",
      },
      chunkSize: 6 * 1024 * 1024, // 6 MB chunks (required by Supabase TUS)
      onError: (err) => reject(new Error(err.message || "Error en la subida")),
      onProgress: (bytesUploaded, bytesTotal) => {
        if (!onProgress) return;
        const elapsed = (Date.now() - startedAt) / 1000;
        const speed = elapsed > 0 ? bytesUploaded / elapsed : 0;
        onProgress({
          bytesUploaded,
          bytesTotal,
          percent: (bytesUploaded / bytesTotal) * 100,
          speed,
        });
      },
      onSuccess: () => resolve(),
    });

    upload.findPreviousUploads().then((prev) => {
      if (prev.length > 0) upload.resumeFromPreviousUpload(prev[0]);
      upload.start();
    });
  });
}

/** Standard upload for small files (< 6 MB). */
async function standardUpload(params: {
  file: File;
  path: string;
  contentType: string;
  onProgress?: (p: UploadProgress) => void;
}): Promise<void> {
  const { file, path, contentType, onProgress } = params;
  // Fake start/end progress events since the JS client doesn't expose progress
  onProgress?.({ bytesUploaded: 0, bytesTotal: file.size, percent: 0, speed: 0 });
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType,
    upsert: false,
  });
  if (error) throw new Error(`Error al subir: ${error.message}`);
  onProgress?.({
    bytesUploaded: file.size,
    bytesTotal: file.size,
    percent: 100,
    speed: file.size,
  });
}

export async function uploadFile({
  file,
  title,
  description = "",
  onProgress,
}: UploadOptions): Promise<FileRecord> {
  const validationError = validateFile(file);
  if (validationError) throw new Error(validationError);

  const { data: userResp, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userResp.user) throw new Error("Debes iniciar sesión para subir archivos.");
  const user = userResp.user;

  const slug = uniqueSlug(title);
  const ext = getExtension(file.name) || "bin";
  const path = `${user.id}/${slug}.${ext}`;
  const contentType = resolveMimeType(file);

  if (file.size > RESUMABLE_THRESHOLD_BYTES) {
    await resumableUpload({ file, path, contentType, onProgress });
  } else {
    await standardUpload({ file, path, contentType, onProgress });
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data: row, error: insertErr } = await supabase
    .from("files")
    .insert({
      title: title.trim(),
      slug,
      description: description.trim(),
      storage_path: path,
      file_url: pub.publicUrl,
      file_size: file.size,
      file_type: contentType,
      user_id: user.id,
      uploaded_by_email: user.email ?? null,
    })
    .select()
    .single();

  if (insertErr) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error(`Error guardando metadata: ${insertErr.message}`);
  }

  return row as FileRecord;
}

export async function listFiles(): Promise<FileRecord[]> {
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as FileRecord[];
}

export async function getFileBySlug(slug: string): Promise<FileRecord | null> {
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as FileRecord) ?? null;
}

export async function deleteFile(file: FileRecord): Promise<void> {
  const { error: storageErr } = await supabase.storage.from(BUCKET).remove([file.storage_path]);
  if (storageErr) throw new Error(`Error eliminando archivo: ${storageErr.message}`);
  const { error } = await supabase.from("files").delete().eq("id", file.id);
  if (error) throw new Error(error.message);
}

export const PUBLIC_APP_BASE_URL = "https://aguapp.vercel.app";

/** Public preview page URL (no login required). */
export function buildShareUrl(slug: string): string {
  return `${PUBLIC_APP_BASE_URL}/p/${slug}`;
}
