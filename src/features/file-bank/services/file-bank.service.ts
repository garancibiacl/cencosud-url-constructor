import { supabase } from "@/integrations/supabase/client";
import { uniqueSlug } from "../logic/slug";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, type FileRecord } from "../logic/file-bank.types";

const BUCKET = "presentations";

export interface UploadOptions {
  file: File;
  title: string;
  description?: string;
  onProgress?: (pct: number) => void;
}

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) return "El archivo supera los 50 MB.";
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Tipo de archivo no permitido (${file.type || "desconocido"}).`;
  }
  return null;
}

export async function uploadFile({ file, title, description = "" }: UploadOptions): Promise<FileRecord> {
  const validationError = validateFile(file);
  if (validationError) throw new Error(validationError);

  const { data: userResp, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userResp.user) throw new Error("Debes iniciar sesión para subir archivos.");
  const user = userResp.user;

  const slug = uniqueSlug(title);
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${user.id}/${slug}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadErr) throw new Error(`Error al subir: ${uploadErr.message}`);

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
      file_type: file.type || "application/octet-stream",
      user_id: user.id,
      uploaded_by_email: user.email ?? null,
    })
    .select()
    .single();

  if (insertErr) {
    // rollback storage if metadata fails
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

export function buildShareUrl(slug: string): string {
  return `${window.location.origin}/banco-archivos/${slug}`;
}
