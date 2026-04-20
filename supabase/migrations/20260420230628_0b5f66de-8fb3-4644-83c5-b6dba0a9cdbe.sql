CREATE TABLE public.mailings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Nuevo Mailing',
  status TEXT NOT NULL DEFAULT 'draft',
  subject TEXT,
  preheader TEXT,
  current_version INTEGER NOT NULL DEFAULT 1,
  document JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mailings_status_check CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE TABLE public.mailing_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mailing_id UUID NOT NULL REFERENCES public.mailings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mailing_versions_unique_version UNIQUE (mailing_id, version_number)
);

ALTER TABLE public.mailings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mailing_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mailings"
ON public.mailings
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own mailings"
ON public.mailings
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own mailings"
ON public.mailings
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own mailings"
ON public.mailings
FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own mailing versions"
ON public.mailing_versions
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own mailing versions"
ON public.mailing_versions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.mailings m
    WHERE m.id = mailing_id
      AND (m.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Users can update own mailing versions"
ON public.mailing_versions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own mailing versions"
ON public.mailing_versions
FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_mailings_user_id_updated_at
ON public.mailings(user_id, updated_at DESC);

CREATE INDEX idx_mailing_versions_mailing_id_version_number
ON public.mailing_versions(mailing_id, version_number DESC);

CREATE OR REPLACE FUNCTION public.update_mailings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mailings_updated_at
BEFORE UPDATE ON public.mailings
FOR EACH ROW
EXECUTE FUNCTION public.update_mailings_updated_at();