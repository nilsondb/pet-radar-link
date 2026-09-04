-- FASE 2: pacientes veterinários, pet sem tag, ciclo de vida da tag e central de usuários.
-- Incremental e não destrutiva: nenhuma tabela/coluna removida, RLS mantida, sem acesso anon.

-- 1) Solicitações de TAG (não existe estrutura equivalente hoje)
CREATE TABLE IF NOT EXISTS public.tag_solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id text NOT NULL REFERENCES public.pets(id),
  veterinarian_id uuid REFERENCES public.veterinarios(id),
  tutor_id uuid REFERENCES public.tutores(id),
  status text NOT NULL DEFAULT 'pendente',
  observacoes text,
  tag_uid text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.tag_solicitacoes TO authenticated;
GRANT ALL ON public.tag_solicitacoes TO service_role;

ALTER TABLE public.tag_solicitacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ts_select ON public.tag_solicitacoes;
CREATE POLICY ts_select ON public.tag_solicitacoes FOR SELECT TO authenticated
  USING (public.is_admin() OR public.e_meu_pet(pet_id) OR veterinarian_id = public.meu_vet_id());

DROP POLICY IF EXISTS ts_insert ON public.tag_solicitacoes;
CREATE POLICY ts_insert ON public.tag_solicitacoes FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.e_meu_pet(pet_id)
    OR (veterinarian_id = public.meu_vet_id() AND public.vet_tem_acesso(pet_id))
  );

DROP POLICY IF EXISTS ts_update ON public.tag_solicitacoes;
CREATE POLICY ts_update ON public.tag_solicitacoes FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.e_meu_pet(pet_id))
  WITH CHECK (public.is_admin() OR public.e_meu_pet(pet_id));

DROP TRIGGER IF EXISTS tag_solicitacoes_set_updated_at ON public.tag_solicitacoes;
CREATE TRIGGER tag_solicitacoes_set_updated_at BEFORE UPDATE ON public.tag_solicitacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Busca mínima de pet por TAG (a RLS de pets impede o veterinário de ver pets sem vínculo)
CREATE OR REPLACE FUNCTION public.vet_buscar_pet_por_tag(p_uid text)
RETURNS TABLE(
  pet_id text, nome_pet text, foto_url text, especie text, raca text, sexo text,
  tag_uid text, tutor_nome text, vinculo_status text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_vet uuid := public.meu_vet_id(); v_pet text; v_uid text := upper(btrim(p_uid));
BEGIN
  IF v_vet IS NULL OR NOT public.has_role(auth.uid(), 'veterinarian') THEN
    RAISE EXCEPTION 'Acesso restrito a veterinários com perfil ativo';
  END IF;

  SELECT t.pet_id INTO v_pet FROM public.tags t
   WHERE upper(t.uid_publico) = v_uid AND t.pet_id IS NOT NULL
   ORDER BY (t.status = 'ativa') DESC LIMIT 1;

  IF v_pet IS NULL THEN
    SELECT p.id INTO v_pet FROM public.pets p WHERE upper(p.id) = v_uid LIMIT 1;
  END IF;

  IF v_pet IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT p.id, p.nome_pet, p.foto_url, p.especie, p.raca, p.sexo,
         COALESCE((SELECT t.uid_publico FROM public.tags t
                    WHERE t.pet_id = p.id AND t.status = 'ativa' LIMIT 1), p.tag_id, p.id),
         COALESCE(split_part(btrim(COALESCE(tu.nome, p.nome_dono, '')), ' ', 1), '—'),
         (SELECT pv.status FROM public.pet_veterinarians pv
           WHERE pv.pet_id = p.id AND pv.veterinarian_id = v_vet LIMIT 1)
  FROM public.pets p
  LEFT JOIN public.tutores tu ON tu.id = p.tutor_id
  WHERE p.id = v_pet AND p.ativo = true;
END $$;

REVOKE ALL ON FUNCTION public.vet_buscar_pet_por_tag(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vet_buscar_pet_por_tag(text) TO authenticated;

-- 3) Cadastro de paciente sem TAG pelo veterinário (a RLS de pets/tutores só permite o próprio tutor)
CREATE OR REPLACE FUNCTION public.vet_criar_paciente(
  p_nome_pet text,
  p_especie text DEFAULT NULL,
  p_raca text DEFAULT NULL,
  p_sexo text DEFAULT NULL,
  p_data_nascimento date DEFAULT NULL,
  p_peso numeric DEFAULT NULL,
  p_tutor_nome text DEFAULT NULL,
  p_tutor_telefone text DEFAULT NULL,
  p_tutor_email text DEFAULT NULL,
  p_observacoes text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vet uuid := public.meu_vet_id();
  v_tel text := regexp_replace(COALESCE(p_tutor_telefone, ''), '\D', '', 'g');
  v_email text := lower(btrim(COALESCE(p_tutor_email, '')));
  v_tutor uuid;
  v_pet text;
BEGIN
  IF v_vet IS NULL OR NOT public.has_role(auth.uid(), 'veterinarian') THEN
    RAISE EXCEPTION 'Acesso restrito a veterinários com perfil ativo';
  END IF;
  IF NULLIF(btrim(COALESCE(p_nome_pet, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Nome do pet obrigatório';
  END IF;
  IF v_tel = '' AND v_email = '' THEN
    RAISE EXCEPTION 'Informe telefone ou e-mail do responsável';
  END IF;

  -- Reuso obrigatório do tutor (evita duplicidade por telefone/e-mail normalizados)
  SELECT id INTO v_tutor FROM public.tutores
   WHERE (v_tel <> '' AND regexp_replace(COALESCE(telefone,''), '\D', '', 'g') = v_tel)
      OR (v_email <> '' AND lower(btrim(COALESCE(email,''))) = v_email)
   ORDER BY (user_id IS NOT NULL) DESC, created_at ASC LIMIT 1;

  IF v_tutor IS NULL THEN
    INSERT INTO public.tutores (nome, telefone, email, ativo)
    VALUES (COALESCE(NULLIF(btrim(p_tutor_nome), ''), 'Responsável'), COALESCE(p_tutor_telefone, ''), NULLIF(v_email, ''), true)
    RETURNING id INTO v_tutor;
  END IF;

  -- Pet sem TAG: id interno próprio, tag_id NULL
  LOOP
    v_pet := 'AP' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.pets WHERE id = v_pet);
  END LOOP;

  INSERT INTO public.pets (
    id, nome_pet, especie, raca, sexo, data_nascimento, peso,
    nome_dono, telefone, tutor_id, tag_id, status_ativado, ativo
  ) VALUES (
    v_pet, btrim(p_nome_pet), NULLIF(btrim(COALESCE(p_especie,'')),''), NULLIF(btrim(COALESCE(p_raca,'')),''),
    NULLIF(btrim(COALESCE(p_sexo,'')),''), p_data_nascimento, p_peso,
    COALESCE(NULLIF(btrim(p_tutor_nome), ''), 'Responsável'), COALESCE(p_tutor_telefone, ''),
    v_tutor, NULL, false, true
  );

  INSERT INTO public.pet_veterinarians (pet_id, veterinarian_id, status, access_level, authorized_at)
  VALUES (v_pet, v_vet, 'active', 'health', now());

  INSERT INTO public.pet_eventos (pet_id, tipo_evento, titulo, descricao, created_by_user, created_by_role, veterinarian_id)
  VALUES (v_pet, 'status_pet', 'Paciente cadastrado pelo veterinário',
          COALESCE(p_observacoes, 'Cadastro clínico sem TAG. O tutor poderá assumir a conta depois.'),
          auth.uid(), 'veterinarian', v_vet);

  RETURN v_pet;
END $$;

REVOKE ALL ON FUNCTION public.vet_criar_paciente(text,text,text,text,date,numeric,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vet_criar_paciente(text,text,text,text,date,numeric,text,text,text,text) TO authenticated;

-- 4) Admin prepara/atribui TAG a um pet existente e gera o token de ativação (nunca exposto ao veterinário)
CREATE OR REPLACE FUNCTION public.admin_preparar_tag(p_uid text, p_pet_id text, p_solicitacao uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid text := upper(btrim(p_uid)); v_token text;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso restrito a administradores'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.pets WHERE id = p_pet_id) THEN
    RAISE EXCEPTION 'Pet não encontrado';
  END IF;
  IF EXISTS (SELECT 1 FROM public.tags WHERE upper(uid_publico) = v_uid AND status = 'ativa' AND pet_id <> p_pet_id) THEN
    RAISE EXCEPTION 'Esta TAG já está ativa para outro pet';
  END IF;

  v_token := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  INSERT INTO public.activation_tokens (id, token, used) VALUES (v_uid, v_token, false)
  ON CONFLICT (id) DO UPDATE SET token = EXCLUDED.token, used = false;

  IF EXISTS (SELECT 1 FROM public.tags WHERE upper(uid_publico) = v_uid) THEN
    UPDATE public.tags SET pet_id = p_pet_id, status = 'estoque', deactivated_at = NULL
     WHERE upper(uid_publico) = v_uid;
  ELSE
    INSERT INTO public.tags (uid_publico, pet_id, status) VALUES (v_uid, p_pet_id, 'estoque');
  END IF;

  IF p_solicitacao IS NOT NULL THEN
    UPDATE public.tag_solicitacoes SET status = 'preparada', tag_uid = v_uid WHERE id = p_solicitacao;
  END IF;

  RETURN v_token;
END $$;

REVOKE ALL ON FUNCTION public.admin_preparar_tag(text,text,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_preparar_tag(text,text,uuid) TO authenticated;

-- 5) Tutor ativa/substitui a TAG de um pet que JÁ existe (sem criar novo pet)
CREATE OR REPLACE FUNCTION public.ativar_tag_para_pet(p_uid text, p_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid text := upper(btrim(p_uid)); v_pet text; v_token text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação obrigatória'; END IF;

  SELECT pet_id INTO v_pet FROM public.tags WHERE upper(uid_publico) = v_uid LIMIT 1;
  IF v_pet IS NULL THEN RAISE EXCEPTION 'TAG não preparada para nenhum pet'; END IF;
  IF NOT public.e_meu_pet(v_pet) THEN RAISE EXCEPTION 'Esta TAG pertence a outro tutor'; END IF;

  SELECT token INTO v_token FROM public.activation_tokens WHERE id = v_uid;
  IF v_token IS NULL OR v_token <> btrim(p_token) THEN RAISE EXCEPTION 'Token inválido'; END IF;

  UPDATE public.tags SET status = 'substituida', deactivated_at = now()
   WHERE pet_id = v_pet AND status = 'ativa' AND upper(uid_publico) <> v_uid;

  UPDATE public.tags SET status = 'ativa', activated_at = now(), deactivated_at = NULL
   WHERE upper(uid_publico) = v_uid;

  UPDATE public.activation_tokens SET used = true WHERE id = v_uid;
  UPDATE public.pets SET tag_id = v_uid, status_ativado = true WHERE id = v_pet;
  UPDATE public.tag_solicitacoes SET status = 'atendida'
   WHERE pet_id = v_pet AND status IN ('pendente', 'preparada');

  INSERT INTO public.pet_eventos (pet_id, tipo_evento, titulo, descricao, created_by_user, created_by_role)
  VALUES (v_pet, 'status_pet', 'TAG ativada', 'TAG ' || v_uid || ' vinculada ao pet.', auth.uid(), 'tutor');

  RETURN v_pet;
END $$;

REVOKE ALL ON FUNCTION public.ativar_tag_para_pet(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ativar_tag_para_pet(text,text) TO authenticated;

-- 6) Leitura pública: resolver o pet a partir do UID da TAG (troca de TAG mantém o mesmo pet)
CREATE OR REPLACE FUNCTION public.resolver_tag_publica(p_uid text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.pet_id FROM public.tags t
   JOIN public.pets p ON p.id = t.pet_id
   WHERE upper(t.uid_publico) = upper(btrim(p_uid))
     AND t.status = 'ativa' AND p.ativo = true AND p.status_ativado = true
   LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolver_tag_publica(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolver_tag_publica(text) TO anon, authenticated;

-- 7) Central de usuários do admin (auth.users não é legível pelo cliente)
CREATE OR REPLACE FUNCTION public.admin_listar_usuarios()
RETURNS TABLE(
  chave text, user_id uuid, email text, nome text, papeis text[], status text,
  conta_vinculada boolean, criado_em timestamptz,
  tutor_id uuid, veterinario_id uuid, crmv text, uf_crmv text, clinica text,
  status_profissional text, admin_ativo boolean,
  pets_count integer, pacientes_count integer, tags_count integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso restrito a administradores'; END IF;

  RETURN QUERY
  WITH contas AS (
    SELECT u.id, lower(u.email) AS email, u.created_at, u.email_confirmed_at,
           COALESCE(u.raw_user_meta_data ->> 'nome', '') AS meta_nome
      FROM auth.users u
  ), papeis AS (
    SELECT ur.user_id, array_agg(DISTINCT ur.role::text ORDER BY ur.role::text) AS roles
      FROM public.user_roles ur GROUP BY ur.user_id
  )
  SELECT c.id::text, c.id,
         c.email,
         COALESCE(NULLIF(t.nome, ''), NULLIF(v.nome, ''), NULLIF(a.nome, ''), NULLIF(c.meta_nome, ''), c.email),
         COALESCE(p.roles, ARRAY[]::text[]),
         CASE WHEN c.email_confirmed_at IS NULL THEN 'pendente'
              WHEN v.id IS NOT NULL AND v.ativo = false THEN 'inativo'
              WHEN a.id IS NOT NULL AND a.ativo = false AND v.id IS NULL AND t.id IS NULL THEN 'inativo'
              ELSE 'ativo' END,
         true, c.created_at,
         t.id, v.id, v.crmv, v.uf_crmv, v.clinica, v.status_profissional, a.ativo,
         (SELECT count(*)::int FROM public.pets pe WHERE pe.tutor_id = t.id),
         (SELECT count(*)::int FROM public.pet_veterinarians pv WHERE pv.veterinarian_id = v.id AND pv.status = 'active'),
         (SELECT count(*)::int FROM public.tags tg JOIN public.pets pe ON pe.id = tg.pet_id WHERE pe.tutor_id = t.id)
    FROM contas c
    LEFT JOIN papeis p ON p.user_id = c.id
    LEFT JOIN public.tutores t ON t.user_id = c.id
    LEFT JOIN public.veterinarios v ON v.user_id = c.id
    LEFT JOIN public.admins a ON a.user_id = c.id

  UNION ALL
  -- Registros sem conta Auth ainda (aguardando vinculação/convite)
  SELECT 'tutor:' || t.id::text, NULL::uuid, lower(COALESCE(t.email, '')), t.nome,
         ARRAY['tutor']::text[], 'pendente', false, t.created_at,
         t.id, NULL::uuid, NULL, NULL, NULL, NULL, NULL,
         (SELECT count(*)::int FROM public.pets pe WHERE pe.tutor_id = t.id), 0,
         (SELECT count(*)::int FROM public.tags tg JOIN public.pets pe ON pe.id = tg.pet_id WHERE pe.tutor_id = t.id)
    FROM public.tutores t WHERE t.user_id IS NULL

  UNION ALL
  SELECT 'vet:' || v.id::text, NULL::uuid, lower(COALESCE(v.email, '')), v.nome,
         ARRAY['veterinarian']::text[], CASE WHEN v.ativo THEN 'pendente' ELSE 'inativo' END, false, v.created_at,
         NULL::uuid, v.id, v.crmv, v.uf_crmv, v.clinica, v.status_profissional, NULL,
         0, (SELECT count(*)::int FROM public.pet_veterinarians pv WHERE pv.veterinarian_id = v.id AND pv.status = 'active'), 0
    FROM public.veterinarios v WHERE v.user_id IS NULL;
END $$;

REVOKE ALL ON FUNCTION public.admin_listar_usuarios() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_listar_usuarios() TO authenticated;