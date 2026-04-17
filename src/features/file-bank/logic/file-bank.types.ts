export interface FileRecord {
  id: string;
  title: string;
  slug: string;
  description: string;
  storage_path: string;
  file_url: string;
  file_size: number;
  file_type: string;
  user_id: string;
  uploaded_by_email: string | null;
  created_at: string;
  updated_at: string;
}

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
export const RESUMABLE_THRESHOLD_BYTES = 6 * 1024 * 1024; // archivos > 6 MB usan TUS

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/zip",
];
