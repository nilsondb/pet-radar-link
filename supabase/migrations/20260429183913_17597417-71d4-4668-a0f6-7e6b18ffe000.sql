
-- Pets table
CREATE TABLE public.pets (
  id TEXT PRIMARY KEY,
  nome_pet TEXT NOT NULL,
  data_nascimento DATE,
  foto_url TEXT,
  nome_dono TEXT NOT NULL,
  telefone TEXT NOT NULL,
  endereco TEXT,
  status_perdido BOOLEAN NOT NULL DEFAULT false,
  data_perdido TIMESTAMPTZ,
  ultimo_local TEXT,
  ultimo_horario TIMESTAMPTZ,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Public access by URL/ID (NFC tag-based, no auth)
CREATE POLICY "Anyone can view pets"
  ON public.pets FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create a pet"
  ON public.pets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update pets"
  ON public.pets FOR UPDATE
  USING (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER pets_set_updated_at
  BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for pet photos (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet-photos', 'pet-photos', true);

CREATE POLICY "Public read pet photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pet-photos');

CREATE POLICY "Anyone can upload pet photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pet-photos');

CREATE POLICY "Anyone can update pet photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'pet-photos');
