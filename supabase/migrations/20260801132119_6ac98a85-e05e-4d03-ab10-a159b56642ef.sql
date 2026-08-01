-- 1) Drop every policy on public tables and revoke Data API access
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;

  FOR r IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', r.tablename);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', r.tablename);
  END LOOP;
END $$;

-- 2) Storage: remove public access policies on the pet buckets
DROP POLICY IF EXISTS "Public read pet photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload pet photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update pet photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read exames" ON storage.objects;
DROP POLICY IF EXISTS "Public upload exames" ON storage.objects;
DROP POLICY IF EXISTS "Public update exames" ON storage.objects;
DROP POLICY IF EXISTS "Public delete exames" ON storage.objects;

-- 3) SECURITY DEFINER functions must not be callable from the Data API
REVOKE ALL ON FUNCTION public.admin_login(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_create(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_set_password(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recalc_app_metrics() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_recalc_app_metrics() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_login(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_create(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_password(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.recalc_app_metrics() TO service_role;
