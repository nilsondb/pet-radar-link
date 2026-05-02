
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  senha_hash text NOT NULL,
  nome text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view admins" ON public.admins FOR SELECT USING (true);
CREATE POLICY "Anyone can insert admins" ON public.admins FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update admins" ON public.admins FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete admins" ON public.admins FOR DELETE USING (true);

CREATE TRIGGER admins_set_updated_at
BEFORE UPDATE ON public.admins
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.admins (email, senha_hash, nome, ativo)
VALUES ('admin', crypt('12345678', gen_salt('bf')), 'Administrador', true)
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.admin_login(p_email text, p_senha text)
RETURNS TABLE(id uuid, email text, nome text, ativo boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.email, a.nome, a.ativo
  FROM public.admins a
  WHERE a.email = p_email
    AND a.ativo = true
    AND a.senha_hash = crypt(p_senha, a.senha_hash);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_password(p_id uuid, p_senha text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.admins SET senha_hash = crypt(p_senha, gen_salt('bf')) WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create(p_email text, p_senha text, p_nome text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.admins (email, senha_hash, nome, ativo)
  VALUES (p_email, crypt(p_senha, gen_salt('bf')), p_nome, true)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE TABLE IF NOT EXISTS public.pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id text,
  descricao text,
  valor numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente',
  data_pagamento timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pagamentos" ON public.pagamentos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pagamentos" ON public.pagamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update pagamentos" ON public.pagamentos FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete pagamentos" ON public.pagamentos FOR DELETE USING (true);

CREATE TRIGGER pagamentos_set_updated_at
BEFORE UPDATE ON public.pagamentos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
