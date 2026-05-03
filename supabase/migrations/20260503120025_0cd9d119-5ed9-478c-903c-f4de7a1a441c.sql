CREATE TABLE public.pet_localizacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  endereco text,
  data_leitura timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_localizacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pet_localizacoes" ON public.pet_localizacoes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pet_localizacoes" ON public.pet_localizacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete pet_localizacoes" ON public.pet_localizacoes FOR DELETE USING (true);

CREATE INDEX idx_pet_localizacoes_pet_data ON public.pet_localizacoes (pet_id, data_leitura DESC);

ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS ultima_localizacao text;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS ultima_leitura timestamptz;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS ultima_latitude numeric;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS ultima_longitude numeric;