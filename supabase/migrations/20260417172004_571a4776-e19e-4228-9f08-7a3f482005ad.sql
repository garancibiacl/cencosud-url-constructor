
-- Bucket público para Banco de Archivos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'presentations',
  'presentations',
  true,
  52428800, -- 50 MB
  ARRAY[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/zip'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas storage.objects para el bucket 'presentations'
DROP POLICY IF EXISTS "presentations_public_read" ON storage.objects;
CREATE POLICY "presentations_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'presentations');

DROP POLICY IF EXISTS "presentations_auth_insert" ON storage.objects;
CREATE POLICY "presentations_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'presentations'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "presentations_owner_update" ON storage.objects;
CREATE POLICY "presentations_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'presentations'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);

DROP POLICY IF EXISTS "presentations_owner_delete" ON storage.objects;
CREATE POLICY "presentations_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'presentations'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Tabla files (metadata)
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  storage_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_by_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON public.files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_slug ON public.files(slug);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Lectura pública por slug (para el link compartible) y autenticada
DROP POLICY IF EXISTS "files_public_select" ON public.files;
CREATE POLICY "files_public_select"
ON public.files FOR SELECT
USING (true);

DROP POLICY IF EXISTS "files_auth_insert" ON public.files;
CREATE POLICY "files_auth_insert"
ON public.files FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "files_owner_update" ON public.files;
CREATE POLICY "files_owner_update"
ON public.files FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "files_owner_delete" ON public.files;
CREATE POLICY "files_owner_delete"
ON public.files FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_files_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_files_updated_at ON public.files;
CREATE TRIGGER trg_files_updated_at
BEFORE UPDATE ON public.files
FOR EACH ROW EXECUTE FUNCTION public.update_files_updated_at();
