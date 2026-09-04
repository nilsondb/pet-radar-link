CREATE UNIQUE INDEX IF NOT EXISTS veterinarios_user_id_unique
  ON public.veterinarios (user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS veterinarios_email_normalized_unique
  ON public.veterinarios (lower(btrim(email)))
  WHERE NULLIF(btrim(email), '') IS NOT NULL;

CREATE OR REPLACE FUNCTION public.concluir_cadastro_veterinario(
  p_nome text,
  p_telefone text DEFAULT NULL,
  p_crmv text DEFAULT NULL,
  p_uf_crmv text DEFAULT NULL,
  p_clinica text DEFAULT NULL,
  p_especialidade text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_auth_email text;
  v_id uuid;
  v_linked_uid uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória';
  END IF;

  SELECT lower(btrim(email))
    INTO v_auth_email
    FROM auth.users
   WHERE id = v_uid;

  IF v_auth_email IS NULL OR v_auth_email = '' THEN
    RAISE EXCEPTION 'A conta autenticada não possui e-mail válido';
  END IF;

  IF NULLIF(btrim(p_nome), '') IS NULL THEN
    RAISE EXCEPTION 'Nome profissional obrigatório';
  END IF;

  SELECT id
    INTO v_id
    FROM public.veterinarios
   WHERE user_id = v_uid
   FOR UPDATE;

  IF v_id IS NULL THEN
    SELECT id, user_id
      INTO v_id, v_linked_uid
      FROM public.veterinarios
     WHERE lower(btrim(email)) = v_auth_email
     FOR UPDATE;

    IF v_id IS NOT NULL AND v_linked_uid IS NOT NULL AND v_linked_uid <> v_uid THEN
      RAISE EXCEPTION 'Este e-mail profissional já está vinculado a outra conta';
    END IF;
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO public.veterinarios (
      user_id, nome, email, telefone, crmv, uf_crmv, clinica,
      especialidade, ativo, status_profissional
    ) VALUES (
      v_uid, btrim(p_nome), v_auth_email, NULLIF(btrim(p_telefone), ''),
      NULLIF(btrim(p_crmv), ''), upper(NULLIF(btrim(p_uf_crmv), '')),
      NULLIF(btrim(p_clinica), ''), NULLIF(btrim(p_especialidade), ''),
      true, 'pending'
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.veterinarios
       SET user_id = v_uid,
           nome = btrim(p_nome),
           email = v_auth_email,
           telefone = COALESCE(NULLIF(btrim(p_telefone), ''), telefone),
           crmv = COALESCE(NULLIF(btrim(p_crmv), ''), crmv),
           uf_crmv = COALESCE(upper(NULLIF(btrim(p_uf_crmv), '')), uf_crmv),
           clinica = COALESCE(NULLIF(btrim(p_clinica), ''), clinica),
           especialidade = COALESCE(NULLIF(btrim(p_especialidade), ''), especialidade),
           ativo = true
     WHERE id = v_id;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'veterinarian')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.concluir_cadastro_veterinario(text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.concluir_cadastro_veterinario(text, text, text, text, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.criar_perfil_veterinario(
  p_nome text,
  p_email text,
  p_telefone text DEFAULT NULL,
  p_crmv text DEFAULT NULL,
  p_uf_crmv text DEFAULT NULL,
  p_clinica text DEFAULT NULL,
  p_especialidade text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN public.concluir_cadastro_veterinario(
    p_nome,
    p_telefone,
    p_crmv,
    p_uf_crmv,
    p_clinica,
    p_especialidade
  );
END;
$$;

REVOKE ALL ON FUNCTION public.criar_perfil_veterinario(text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.criar_perfil_veterinario(text, text, text, text, text, text, text) TO authenticated, service_role;