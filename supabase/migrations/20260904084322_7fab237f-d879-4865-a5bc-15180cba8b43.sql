DROP POLICY IF EXISTS "vets_claim_matching_email" ON public.veterinarios;
CREATE POLICY "vets_claim_matching_email"
ON public.veterinarios
FOR ALL
TO authenticated
USING (
  user_id IS NULL
  AND lower(btrim(email)) = lower(btrim(auth.jwt() ->> 'email'))
)
WITH CHECK (
  user_id = auth.uid()
  AND lower(btrim(email)) = lower(btrim(auth.jwt() ->> 'email'))
);

CREATE OR REPLACE FUNCTION public.registrar_papel_veterinario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'veterinarian')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_papel_veterinario() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_papel_veterinario() TO service_role;

DROP TRIGGER IF EXISTS veterinarios_registrar_papel ON public.veterinarios;
CREATE TRIGGER veterinarios_registrar_papel
AFTER INSERT OR UPDATE OF user_id ON public.veterinarios
FOR EACH ROW
EXECUTE FUNCTION public.registrar_papel_veterinario();

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
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_auth_email text := lower(btrim(auth.jwt() ->> 'email'));
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória';
  END IF;

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
      OR (user_id IS NULL AND lower(btrim(email)) = v_auth_email)
   ORDER BY (user_id = v_uid) DESC
   LIMIT 1
   FOR UPDATE;

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

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.concluir_cadastro_veterinario(text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.concluir_cadastro_veterinario(text, text, text, text, text, text) TO authenticated, service_role;