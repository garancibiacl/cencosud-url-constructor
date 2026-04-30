-- Políticas de Storage para el bucket 'ai-images' (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated users can upload ai-images'
  ) THEN
    CREATE POLICY "Authenticated users can upload ai-images"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'ai-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public read ai-images'
  ) THEN
    CREATE POLICY "Public read ai-images"
      ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'ai-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Users can delete own ai-images'
  ) THEN
    CREATE POLICY "Users can delete own ai-images"
      ON storage.objects FOR DELETE TO authenticated
      USING (
        bucket_id = 'ai-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END
$$;