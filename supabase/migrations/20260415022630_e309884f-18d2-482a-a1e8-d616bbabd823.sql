
CREATE TABLE public.scripts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  app TEXT NOT NULL DEFAULT 'Illustrator',
  tags TEXT[] NOT NULL DEFAULT '{}',
  prompt TEXT NOT NULL DEFAULT '',
  code TEXT NOT NULL,
  filename TEXT NOT NULL,
  uploaded_by TEXT NULL,
  uploaded_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by TEXT NULL,
  updated_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL
);

ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scripts_select" ON public.scripts FOR SELECT TO authenticated USING (true);
CREATE POLICY "scripts_insert" ON public.scripts FOR INSERT TO authenticated WITH CHECK (uploaded_by_id = auth.uid());
CREATE POLICY "scripts_update" ON public.scripts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "scripts_delete" ON public.scripts FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::app_role)
);
