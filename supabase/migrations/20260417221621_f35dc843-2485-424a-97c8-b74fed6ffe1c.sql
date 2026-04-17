CREATE TABLE IF NOT EXISTS public.access_logs (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  email        TEXT        NOT NULL,
  event_type   TEXT        NOT NULL,
  module_path  TEXT,
  module_label TEXT,
  created_at   TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_access_log_event_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type NOT IN ('login', 'module_visit') THEN
    RAISE EXCEPTION 'Invalid event_type: %. Must be login or module_visit', NEW.event_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER access_logs_validate_event_type
BEFORE INSERT OR UPDATE ON public.access_logs
FOR EACH ROW
EXECUTE FUNCTION public.validate_access_log_event_type();

CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON public.access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON public.access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_event_type ON public.access_logs(event_type);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_insert_own_logs"
  ON public.access_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_read_all_logs"
  ON public.access_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));