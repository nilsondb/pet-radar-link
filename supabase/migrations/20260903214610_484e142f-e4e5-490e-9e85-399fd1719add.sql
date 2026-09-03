CREATE OR REPLACE FUNCTION public.admin_conceder_papel(p_email text, p_role public.app_role)
RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso restrito a administradores'; END IF;
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = lower(p_email) LIMIT 1;
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Nenhuma conta encontrada com este e-mail'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, p_role) ON CONFLICT DO NOTHING;
  IF p_role = 'admin' THEN
    IF EXISTS (SELECT 1 FROM public.admins WHERE lower(email) = lower(p_email)) THEN
      UPDATE public.admins SET user_id = v_uid, ativo = true WHERE lower(email) = lower(p_email);
    ELSE
      INSERT INTO public.admins (email, senha_hash, nome, ativo, user_id)
      VALUES (lower(p_email), NULL, p_email, true, v_uid);
    END IF;
  END IF;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.admin_revogar_papel(p_email text, p_role public.app_role)
RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso restrito a administradores'; END IF;
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = lower(p_email) LIMIT 1;
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Nenhuma conta encontrada com este e-mail'; END IF;
  IF v_uid = auth.uid() AND p_role = 'admin' THEN
    RAISE EXCEPTION 'Não é possível revogar o próprio acesso de administrador';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = v_uid AND role = p_role;
  IF p_role = 'admin' THEN
    UPDATE public.admins SET ativo = false WHERE user_id = v_uid;
  END IF;
  RETURN true;
END $$;

ALTER TABLE public.admins ALTER COLUMN senha_hash DROP NOT NULL;

REVOKE ALL ON FUNCTION public.admin_conceder_papel(text, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_revogar_papel(text, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_conceder_papel(text, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revogar_papel(text, public.app_role) TO authenticated;
