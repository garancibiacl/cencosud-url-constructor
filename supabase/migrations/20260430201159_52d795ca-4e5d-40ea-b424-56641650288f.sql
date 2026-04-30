-- AI Product Catalog — SKU cache + generation tracking

CREATE TABLE public.product_catalog (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku           TEXT        NOT NULL,
  brand         TEXT        NOT NULL CHECK (brand IN ('jumbo', 'sisa')),
  name          TEXT        NOT NULL,
  category      TEXT,
  subcategory   TEXT,
  price         NUMERIC(12,2),
  original_price NUMERIC(12,2),
  discount      NUMERIC(5,2),
  image_url     TEXT,
  description   TEXT,
  attributes    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  raw_payload   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT product_catalog_sku_brand_unique UNIQUE (sku, brand)
);

CREATE INDEX idx_product_catalog_sku_brand ON public.product_catalog (sku, brand);
CREATE INDEX idx_product_catalog_fetched_at ON public.product_catalog (fetched_at DESC);

ALTER TABLE public.product_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read product_catalog"
  ON public.product_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert product_catalog"
  ON public.product_catalog FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update product_catalog"
  ON public.product_catalog FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.ai_generation_jobs (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        NOT NULL,
  campaign_id   TEXT,
  sku           TEXT,
  brand         TEXT        CHECK (brand IN ('jumbo', 'sisa')),
  block_type    TEXT        NOT NULL CHECK (block_type IN ('hero', 'product', 'banner', 'text')),
  style         TEXT        NOT NULL DEFAULT 'auto' CHECK (style IN ('auto', 'lifestyle', 'promo')),
  quality       TEXT        NOT NULL DEFAULT 'fast' CHECK (quality IN ('fast', 'hd')),
  status        TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'done', 'failed')),
  prompt        TEXT,
  error_message TEXT,
  fal_request_id TEXT,
  duration_ms   INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);

CREATE INDEX idx_ai_generation_jobs_user_created ON public.ai_generation_jobs (user_id, created_at DESC);
CREATE INDEX idx_ai_generation_jobs_campaign ON public.ai_generation_jobs (campaign_id, created_at DESC);

ALTER TABLE public.ai_generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai_generation_jobs"
  ON public.ai_generation_jobs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own ai_generation_jobs"
  ON public.ai_generation_jobs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own ai_generation_jobs"
  ON public.ai_generation_jobs FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE public.ai_images (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id        UUID        NOT NULL REFERENCES public.ai_generation_jobs(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL,
  storage_path  TEXT        NOT NULL,
  public_url    TEXT        NOT NULL,
  width         INTEGER,
  height        INTEGER,
  file_size_bytes INTEGER,
  prompt        TEXT,
  seed          BIGINT,
  model         TEXT,
  variant_index INTEGER     NOT NULL DEFAULT 0,
  is_selected   BOOLEAN     NOT NULL DEFAULT false,
  metadata      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_images_job_id ON public.ai_images (job_id, variant_index ASC);
CREATE INDEX idx_ai_images_user_id_created ON public.ai_images (user_id, created_at DESC);

ALTER TABLE public.ai_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai_images"
  ON public.ai_images FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own ai_images"
  ON public.ai_images FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own ai_images"
  ON public.ai_images FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.ai_rate_limit_ok(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) < p_limit
  FROM public.ai_generation_jobs
  WHERE user_id = p_user_id
    AND created_at >= now() - INTERVAL '1 hour';
$$;

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('ai-images', 'ai-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
  ON CONFLICT (id) DO NOTHING;
END;
$$;

CREATE POLICY "Authenticated users can upload ai-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ai-images');
CREATE POLICY "Public read ai-images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'ai-images');
CREATE POLICY "Users can delete own ai-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ai-images' AND (storage.foldername(name))[1] = auth.uid()::text);