
CREATE TABLE public.pet_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id text NOT NULL,
  tipo_evento text NOT NULL,
  titulo text NOT NULL,
  descricao text,
  dados_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pet_eventos_pet_id ON public.pet_eventos(pet_id);
CREATE INDEX idx_pet_eventos_created_at ON public.pet_eventos(created_at DESC);

ALTER TABLE public.pet_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view pet_eventos" ON public.pet_eventos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pet_eventos" ON public.pet_eventos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update pet_eventos" ON public.pet_eventos FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete pet_eventos" ON public.pet_eventos FOR DELETE USING (true);

CREATE TABLE public.pet_resumos_ia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id text NOT NULL,
  resumo text NOT NULL,
  score_saude text NOT NULL DEFAULT 'verde',
  alertas jsonb DEFAULT '[]'::jsonb,
  recomendacoes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pet_resumos_ia_pet_id ON public.pet_resumos_ia(pet_id);
CREATE INDEX idx_pet_resumos_ia_created_at ON public.pet_resumos_ia(created_at DESC);

ALTER TABLE public.pet_resumos_ia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view pet_resumos_ia" ON public.pet_resumos_ia FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pet_resumos_ia" ON public.pet_resumos_ia FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update pet_resumos_ia" ON public.pet_resumos_ia FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete pet_resumos_ia" ON public.pet_resumos_ia FOR DELETE USING (true);
