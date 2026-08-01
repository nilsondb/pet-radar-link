-- ROLLBACK of migration 20260801132119: restore the previous (functional) access model

-- 1) Grants back to the Data API roles
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', r.tablename);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', r.tablename);
  END LOOP;
END $$;

-- 2) Policies exactly as before
CREATE POLICY "Anyone can read activation tokens" ON public.activation_tokens FOR SELECT USING (true);
CREATE POLICY "Anyone can create activation tokens" ON public.activation_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update activation tokens" ON public.activation_tokens FOR UPDATE USING (true);

CREATE POLICY "Anyone can view admins" ON public.admins FOR SELECT USING (true);
CREATE POLICY "Anyone can insert admins" ON public.admins FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update admins" ON public.admins FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete admins" ON public.admins FOR DELETE USING (true);

CREATE POLICY "Anyone can view app_metrics" ON public.app_metrics FOR SELECT USING (true);
CREATE POLICY "Anyone can insert app_metrics" ON public.app_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update app_metrics" ON public.app_metrics FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete app_metrics" ON public.app_metrics FOR DELETE USING (true);

CREATE POLICY "Anyone can view exames" ON public.exames FOR SELECT USING (true);
CREATE POLICY "Anyone can create exames" ON public.exames FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update exames" ON public.exames FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete exames" ON public.exames FOR DELETE USING (true);

CREATE POLICY "Anyone can view integration_settings" ON public.integration_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert integration_settings" ON public.integration_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update integration_settings" ON public.integration_settings FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete integration_settings" ON public.integration_settings FOR DELETE USING (true);

CREATE POLICY "Anyone can view integration_sync_logs" ON public.integration_sync_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert integration_sync_logs" ON public.integration_sync_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete integration_sync_logs" ON public.integration_sync_logs FOR DELETE USING (true);

CREATE POLICY "Anyone can view medicamentos" ON public.medicamentos FOR SELECT USING (true);
CREATE POLICY "Anyone can create medicamentos" ON public.medicamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update medicamentos" ON public.medicamentos FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete medicamentos" ON public.medicamentos FOR DELETE USING (true);

CREATE POLICY "Anyone can view pagamentos" ON public.pagamentos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pagamentos" ON public.pagamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update pagamentos" ON public.pagamentos FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete pagamentos" ON public.pagamentos FOR DELETE USING (true);

CREATE POLICY "Anyone can view pet_eventos" ON public.pet_eventos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pet_eventos" ON public.pet_eventos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update pet_eventos" ON public.pet_eventos FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete pet_eventos" ON public.pet_eventos FOR DELETE USING (true);

CREATE POLICY "Anyone can view pet_localizacoes" ON public.pet_localizacoes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pet_localizacoes" ON public.pet_localizacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete pet_localizacoes" ON public.pet_localizacoes FOR DELETE USING (true);

CREATE POLICY "Anyone can view pet_resumos_ia" ON public.pet_resumos_ia FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pet_resumos_ia" ON public.pet_resumos_ia FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update pet_resumos_ia" ON public.pet_resumos_ia FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete pet_resumos_ia" ON public.pet_resumos_ia FOR DELETE USING (true);

CREATE POLICY "Anyone can view pets" ON public.pets FOR SELECT USING (true);
CREATE POLICY "Anyone can create a pet" ON public.pets FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update pets" ON public.pets FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete pets" ON public.pets FOR DELETE USING (true);

CREATE POLICY "Anyone can view vacinas" ON public.vacinas FOR SELECT USING (true);
CREATE POLICY "Anyone can create vacinas" ON public.vacinas FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update vacinas" ON public.vacinas FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete vacinas" ON public.vacinas FOR DELETE USING (true);

-- 3) Storage policies for the pet buckets
CREATE POLICY "Public read pet photos" ON storage.objects FOR SELECT USING (bucket_id = 'pet-photos');
CREATE POLICY "Anyone can upload pet photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pet-photos');
CREATE POLICY "Anyone can update pet photos" ON storage.objects FOR UPDATE USING (bucket_id = 'pet-photos');
CREATE POLICY "Public read exames" ON storage.objects FOR SELECT USING (bucket_id = 'pet-exames');
CREATE POLICY "Public upload exames" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pet-exames');
CREATE POLICY "Public update exames" ON storage.objects FOR UPDATE USING (bucket_id = 'pet-exames');
CREATE POLICY "Public delete exames" ON storage.objects FOR DELETE USING (bucket_id = 'pet-exames');

-- 4) Function execute privileges
GRANT EXECUTE ON FUNCTION public.admin_login(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_create(text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_password(uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recalc_app_metrics() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.trg_recalc_app_metrics() TO anon, authenticated, service_role;
