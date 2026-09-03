-- ============================================================
-- AUTHERA PET — HARDENING FASE 1 (não destrutivo)
-- ============================================================

-- 1. ROLES ---------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('tutor','veterinarian','admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. COLUNAS NOVAS (sem remover legado) ----------------------
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.veterinarios ADD COLUMN IF NOT EXISTS status_profissional text NOT NULL DEFAULT 'pending';

-- 3. FUNÇÕES DE AUTORIZAÇÃO ----------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.meu_tutor_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.tutores WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.meu_vet_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.veterinarios WHERE user_id = auth.uid() AND ativo = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.e_meu_pet(p_pet_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pets p
    JOIN public.tutores t ON t.id = p.tutor_id
    WHERE p.id = p_pet_id AND t.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.vet_tem_acesso(p_pet_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pet_veterinarians pv
    JOIN public.veterinarios v ON v.id = pv.veterinarian_id
    WHERE pv.pet_id = p_pet_id AND pv.status = 'active' AND v.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.pode_ver_clinico(p_pet_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.e_meu_pet(p_pet_id) OR public.vet_tem_acesso(p_pet_id) OR public.is_admin();
$$;

-- 4. LIMPEZA DAS POLICIES INSEGURAS --------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'storage' AND tablename = 'objects'
             AND policyname IN ('Anyone can update pet photos','Anyone can upload pet photos',
                 'Public delete exames','Public read exames','Public read pet photos',
                 'Public update exames','Public upload exames')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- 5. RLS + PRIVILÉGIOS ---------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['activation_tokens','admins','app_metrics','atendimentos_veterinarios',
    'exames','integration_settings','integration_sync_logs','medicamentos','pagamentos','pet_eventos',
    'pet_localizacoes','pet_resumos_ia','pet_veterinarians','pets','registros_clinicos','tags',
    'tutores','user_roles','vacinas','veterinarios']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE ON public.tutores TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.veterinarios TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.pets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_veterinarians TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vacinas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medicamentos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exames TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_eventos TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.pet_localizacoes TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.pet_resumos_ia TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.atendimentos_veterinarios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registros_clinicos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagamentos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_settings TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.integration_sync_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activation_tokens TO authenticated;

-- 6. POLICIES ------------------------------------------------
-- user_roles
CREATE POLICY "ur_select_own_or_admin" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "ur_admin_all" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- tutores
CREATE POLICY "tutores_select" ON public.tutores FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "tutores_insert" ON public.tutores FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "tutores_update" ON public.tutores FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- veterinarios
CREATE POLICY "vets_select" ON public.veterinarios FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.pet_veterinarians pv
      JOIN public.pets p ON p.id = pv.pet_id
      WHERE pv.veterinarian_id = veterinarios.id AND p.tutor_id = public.meu_tutor_id()
    )
  );
CREATE POLICY "vets_insert_self" ON public.veterinarios FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "vets_update" ON public.veterinarios FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- pets
CREATE POLICY "pets_select" ON public.pets FOR SELECT TO authenticated
  USING (tutor_id = public.meu_tutor_id() OR public.vet_tem_acesso(id) OR public.is_admin());
CREATE POLICY "pets_insert" ON public.pets FOR INSERT TO authenticated
  WITH CHECK (tutor_id = public.meu_tutor_id() OR public.is_admin());
CREATE POLICY "pets_update" ON public.pets FOR UPDATE TO authenticated
  USING (tutor_id = public.meu_tutor_id() OR public.is_admin())
  WITH CHECK (tutor_id = public.meu_tutor_id() OR public.is_admin());

-- pet_veterinarians
CREATE POLICY "pv_select" ON public.pet_veterinarians FOR SELECT TO authenticated
  USING (public.e_meu_pet(pet_id) OR veterinarian_id = public.meu_vet_id() OR public.is_admin());
CREATE POLICY "pv_insert" ON public.pet_veterinarians FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.e_meu_pet(pet_id)
    OR (veterinarian_id = public.meu_vet_id() AND status = 'pending')
  );
CREATE POLICY "pv_update_tutor_admin" ON public.pet_veterinarians FOR UPDATE TO authenticated
  USING (public.e_meu_pet(pet_id) OR public.is_admin())
  WITH CHECK (public.e_meu_pet(pet_id) OR public.is_admin());
CREATE POLICY "pv_delete" ON public.pet_veterinarians FOR DELETE TO authenticated
  USING (public.e_meu_pet(pet_id) OR public.is_admin());

-- dados clínicos
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['vacinas','medicamentos','exames','pet_eventos','pet_resumos_ia',
    'pet_localizacoes','atendimentos_veterinarios','registros_clinicos']
  LOOP
    EXECUTE format($f$
      CREATE POLICY %1$I ON public.%2$I FOR SELECT TO authenticated
        USING (public.pode_ver_clinico(pet_id));
    $f$, t || '_select', t);
    EXECUTE format($f$
      CREATE POLICY %1$I ON public.%2$I FOR INSERT TO authenticated
        WITH CHECK (public.pode_ver_clinico(pet_id));
    $f$, t || '_insert', t);
    EXECUTE format($f$
      CREATE POLICY %1$I ON public.%2$I FOR DELETE TO authenticated
        USING (public.pode_ver_clinico(pet_id));
    $f$, t || '_delete', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['vacinas','medicamentos','exames','pet_eventos',
    'atendimentos_veterinarios','registros_clinicos']
  LOOP
    EXECUTE format($f$
      CREATE POLICY %1$I ON public.%2$I FOR UPDATE TO authenticated
        USING (public.pode_ver_clinico(pet_id)) WITH CHECK (public.pode_ver_clinico(pet_id));
    $f$, t || '_update', t);
  END LOOP;
END $$;

-- tags
CREATE POLICY "tags_select" ON public.tags FOR SELECT TO authenticated
  USING (public.is_admin() OR (pet_id IS NOT NULL AND public.e_meu_pet(pet_id)));
CREATE POLICY "tags_admin_write" ON public.tags FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- pagamentos
CREATE POLICY "pag_select" ON public.pagamentos FOR SELECT TO authenticated
  USING (public.is_admin() OR (pet_id IS NOT NULL AND public.e_meu_pet(pet_id)));
CREATE POLICY "pag_admin_write" ON public.pagamentos FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- somente admin
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['admins','activation_tokens','app_metrics','integration_settings','integration_sync_logs']
  LOOP
    EXECUTE format($f$
      CREATE POLICY %1$I ON public.%2$I FOR ALL TO authenticated
        USING (public.is_admin()) WITH CHECK (public.is_admin());
    $f$, t || '_admin_all', t);
  END LOOP;
END $$;

-- 7. STORAGE POLICIES ----------------------------------------
-- caminho dos arquivos: <pet_id>/<arquivo>
CREATE POLICY "pet_photos_public_read" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'pet-photos');
CREATE POLICY "pet_photos_owner_write" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'pet-photos' AND (public.e_meu_pet((storage.foldername(name))[1]) OR public.is_admin())
  );
CREATE POLICY "pet_photos_owner_update" ON storage.objects FOR UPDATE
  TO authenticated USING (
    bucket_id = 'pet-photos' AND (public.e_meu_pet((storage.foldername(name))[1]) OR public.is_admin())
  );
CREATE POLICY "pet_photos_owner_delete" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'pet-photos' AND (public.e_meu_pet((storage.foldername(name))[1]) OR public.is_admin())
  );

CREATE POLICY "pet_exames_read" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'pet-exames' AND public.pode_ver_clinico((storage.foldername(name))[1])
  );
CREATE POLICY "pet_exames_write" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'pet-exames' AND public.pode_ver_clinico((storage.foldername(name))[1])
  );
CREATE POLICY "pet_exames_update" ON storage.objects FOR UPDATE
  TO authenticated USING (
    bucket_id = 'pet-exames' AND public.pode_ver_clinico((storage.foldername(name))[1])
  );
CREATE POLICY "pet_exames_delete" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'pet-exames' AND public.pode_ver_clinico((storage.foldername(name))[1])
  );

-- 8. RPCs PÚBLICAS (NFC) -------------------------------------
CREATE OR REPLACE FUNCTION public.pet_publico(p_id text)
RETURNS TABLE(
  id text, nome_pet text, foto_url text, raca text, cor text, especie text, sexo text,
  status_perdido boolean, nome_dono text, telefone text,
  ultima_latitude numeric, ultima_longitude numeric, ultimo_horario timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.nome_pet, p.foto_url, p.raca, p.cor, p.especie, p.sexo,
         p.status_perdido, p.nome_dono, p.telefone,
         p.ultima_latitude, p.ultima_longitude, p.ultimo_horario
  FROM public.pets p
  WHERE p.id = p_id AND p.status_ativado = true AND p.ativo = true;
$$;

CREATE OR REPLACE FUNCTION public.registrar_leitura_publica(
  p_id text, p_lat numeric, p_lng numeric, p_endereco text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_pet public.pets;
BEGIN
  SELECT * INTO v_pet FROM public.pets WHERE id = p_id AND status_ativado = true;
  IF v_pet.id IS NULL THEN RETURN false; END IF;
  IF v_pet.ultimo_horario IS NOT NULL AND v_pet.ultimo_horario > now() - interval '5 minutes' THEN
    RETURN false;
  END IF;
  UPDATE public.pets SET
    ultimo_local = COALESCE(p_endereco, 'https://maps.google.com/?q=' || p_lat || ',' || p_lng),
    ultimo_horario = now(),
    ultima_localizacao = COALESCE(p_endereco, 'https://maps.google.com/?q=' || p_lat || ',' || p_lng),
    ultima_leitura = now(), ultima_latitude = p_lat, ultima_longitude = p_lng
  WHERE id = p_id;
  INSERT INTO public.pet_localizacoes (pet_id, latitude, longitude, endereco)
  VALUES (p_id, p_lat, p_lng, COALESCE(p_endereco, 'https://maps.google.com/?q=' || p_lat || ',' || p_lng));
  INSERT INTO public.pet_eventos (pet_id, tipo_evento, titulo, descricao, created_by_role)
  VALUES (p_id, 'localizacao', '📍 Pet localizado', 'Leitura pública da tag', 'anon');
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.pet_status_ativacao(p_id text)
RETURNS TABLE(existe boolean, ativado boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT true, COALESCE(p.status_ativado, false) FROM public.pets p WHERE p.id = p_id;
$$;

-- 9. RPCs DE MIGRAÇÃO / ATIVAÇÃO -----------------------------
-- Tutor ativa a tag (prova de posse = token) e o pet passa a ser dele
CREATE OR REPLACE FUNCTION public.ativar_pet_com_token(
  p_id text, p_token text, p_nome_pet text, p_nome_dono text, p_telefone text,
  p_endereco text DEFAULT NULL, p_data_nascimento date DEFAULT NULL,
  p_peso numeric DEFAULT NULL, p_foto_url text DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_tutor uuid; v_pet public.pets; v_token text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Autenticação obrigatória'; END IF;
  SELECT * INTO v_pet FROM public.pets WHERE id = p_id;
  IF v_pet.id IS NOT NULL AND v_pet.status_ativado THEN
    RAISE EXCEPTION 'Tag já ativada';
  END IF;
  v_token := COALESCE(v_pet.token, (SELECT token FROM public.activation_tokens WHERE id = p_id));
  IF v_token IS NULL OR v_token <> p_token THEN RAISE EXCEPTION 'Token inválido'; END IF;

  SELECT id INTO v_tutor FROM public.tutores WHERE user_id = v_uid LIMIT 1;
  IF v_tutor IS NULL THEN
    INSERT INTO public.tutores (nome, telefone, endereco, user_id, ativo)
    VALUES (p_nome_dono, p_telefone, p_endereco, v_uid, true) RETURNING id INTO v_tutor;
  END IF;

  IF v_pet.id IS NULL THEN
    INSERT INTO public.pets (id, token, nome_pet, nome_dono, telefone, endereco, data_nascimento,
      peso, foto_url, status_ativado, tutor_id, tag_id, ultimo_acesso)
    VALUES (p_id, p_token, p_nome_pet, p_nome_dono, p_telefone, p_endereco, p_data_nascimento,
      p_peso, p_foto_url, true, v_tutor, p_id, now());
  ELSE
    UPDATE public.pets SET nome_pet = p_nome_pet, nome_dono = p_nome_dono, telefone = p_telefone,
      endereco = p_endereco, data_nascimento = p_data_nascimento, peso = p_peso,
      foto_url = COALESCE(p_foto_url, foto_url), status_ativado = true, tutor_id = v_tutor,
      tag_id = COALESCE(tag_id, p_id), ultimo_acesso = now()
    WHERE id = p_id;
  END IF;

  UPDATE public.activation_tokens SET used = true WHERE id = p_id;
  UPDATE public.tags SET pet_id = p_id, status = 'ativa', activated_at = now() WHERE uid_publico = p_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'tutor') ON CONFLICT DO NOTHING;
  RETURN v_tutor::text;
END $$;

-- Tutor legado assume seus pets usando o token da tag
CREATE OR REPLACE FUNCTION public.reivindicar_pet(p_id text, p_token text)
RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_pet public.pets; v_tutor uuid; v_token text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Autenticação obrigatória'; END IF;
  SELECT * INTO v_pet FROM public.pets WHERE id = p_id;
  IF v_pet.id IS NULL THEN RAISE EXCEPTION 'Pet não encontrado'; END IF;
  v_token := COALESCE(v_pet.token, (SELECT token FROM public.activation_tokens WHERE id = p_id));
  IF v_token IS NULL OR v_token <> p_token THEN RAISE EXCEPTION 'Token inválido'; END IF;

  SELECT id INTO v_tutor FROM public.tutores WHERE user_id = v_uid LIMIT 1;

  IF v_pet.tutor_id IS NOT NULL THEN
    -- vincula o tutor existente do pet à conta, se ainda não houver dono autenticado
    IF EXISTS (SELECT 1 FROM public.tutores WHERE id = v_pet.tutor_id AND user_id IS NULL) THEN
      IF v_tutor IS NULL THEN
        UPDATE public.tutores SET user_id = v_uid WHERE id = v_pet.tutor_id;
      ELSE
        UPDATE public.pets SET tutor_id = v_tutor WHERE id = p_id;
      END IF;
    ELSIF NOT EXISTS (SELECT 1 FROM public.tutores WHERE id = v_pet.tutor_id AND user_id = v_uid) THEN
      RAISE EXCEPTION 'Este pet já pertence a outra conta';
    END IF;
  ELSE
    IF v_tutor IS NULL THEN
      INSERT INTO public.tutores (nome, telefone, endereco, user_id, ativo)
      VALUES (COALESCE(v_pet.nome_dono,'Tutor'), COALESCE(v_pet.telefone,''), v_pet.endereco, v_uid, true)
      RETURNING id INTO v_tutor;
    END IF;
    UPDATE public.pets SET tutor_id = v_tutor WHERE id = p_id;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'tutor') ON CONFLICT DO NOTHING;
  RETURN true;
END $$;

-- Veterinário cria/vincula o próprio perfil profissional após signUp
CREATE OR REPLACE FUNCTION public.criar_perfil_veterinario(
  p_nome text, p_email text, p_telefone text DEFAULT NULL, p_crmv text DEFAULT NULL,
  p_uf_crmv text DEFAULT NULL, p_clinica text DEFAULT NULL, p_especialidade text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Autenticação obrigatória'; END IF;
  SELECT id INTO v_id FROM public.veterinarios WHERE user_id = v_uid LIMIT 1;
  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM public.veterinarios WHERE lower(email) = lower(p_email) AND user_id IS NULL LIMIT 1;
  END IF;
  IF v_id IS NULL THEN
    INSERT INTO public.veterinarios (user_id, nome, email, telefone, crmv, uf_crmv, clinica,
      especialidade, ativo, status_profissional)
    VALUES (v_uid, p_nome, lower(p_email), p_telefone, p_crmv, p_uf_crmv, p_clinica,
      p_especialidade, true, 'pending')
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.veterinarios SET user_id = v_uid, nome = p_nome, telefone = COALESCE(p_telefone, telefone),
      crmv = COALESCE(p_crmv, crmv), uf_crmv = COALESCE(p_uf_crmv, uf_crmv),
      clinica = COALESCE(p_clinica, clinica), especialidade = COALESCE(p_especialidade, especialidade)
    WHERE id = v_id;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'veterinarian') ON CONFLICT DO NOTHING;
  RETURN v_id;
END $$;

-- Admin legado vincula sua conta provando a senha antiga (SHA-256 legado)
CREATE OR REPLACE FUNCTION public.reivindicar_admin(p_email text, p_senha text)
RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid; v_hash text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Autenticação obrigatória'; END IF;
  SELECT id, senha_hash INTO v_id, v_hash FROM public.admins
   WHERE lower(email) = lower(p_email) AND ativo = true LIMIT 1;
  IF v_id IS NULL THEN RAISE EXCEPTION 'Administrador não encontrado'; END IF;
  IF v_hash IS NULL OR v_hash <> encode(digest(p_senha, 'sha256'), 'hex') THEN
    RAISE EXCEPTION 'Credenciais legadas inválidas';
  END IF;
  UPDATE public.admins SET user_id = v_uid WHERE id = v_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'admin') ON CONFLICT DO NOTHING;
  RETURN true;
END $$;

-- 10. PRIVILÉGIOS DE EXECUÇÃO --------------------------------
REVOKE ALL ON FUNCTION public.admin_login(text, text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_create(text, text, text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_set_password(uuid, text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.recalc_app_metrics() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
REVOKE ALL ON FUNCTION public.meu_tutor_id() FROM anon;
REVOKE ALL ON FUNCTION public.meu_vet_id() FROM anon;
REVOKE ALL ON FUNCTION public.e_meu_pet(text) FROM anon;
REVOKE ALL ON FUNCTION public.vet_tem_acesso(text) FROM anon;
REVOKE ALL ON FUNCTION public.pode_ver_clinico(text) FROM anon;

GRANT EXECUTE ON FUNCTION public.pet_publico(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_leitura_publica(text, numeric, numeric, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pet_status_ativacao(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ativar_pet_com_token(text, text, text, text, text, text, date, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reivindicar_pet(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.criar_perfil_veterinario(text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reivindicar_admin(text, text) TO authenticated;
