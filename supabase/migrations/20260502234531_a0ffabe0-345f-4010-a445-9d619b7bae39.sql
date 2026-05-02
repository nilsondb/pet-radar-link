DROP FUNCTION IF EXISTS public.admin_login(text, text);

CREATE OR REPLACE FUNCTION public.admin_login(p_email text, p_senha_hash text)
RETURNS TABLE(id uuid, email text, nome text, ativo boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.email, a.nome, a.ativo
  FROM public.admins a
  WHERE a.email = p_email
    AND a.ativo = true
    AND a.senha_hash = p_senha_hash;
END;
$$;

INSERT INTO public.admins (email, senha_hash, nome, ativo)
VALUES ('admin', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Administrador', true)
ON CONFLICT (email) DO UPDATE SET
  senha_hash = EXCLUDED.senha_hash,
  ativo = true;
