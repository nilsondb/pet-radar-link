CREATE TABLE public.vacinas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id TEXT NOT NULL,
  nome_vacina TEXT NOT NULL,
  data_aplicacao DATE NOT NULL,
  proxima_dose DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_vacinas_pet_id ON public.vacinas(pet_id);

ALTER TABLE public.vacinas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vacinas"
  ON public.vacinas FOR SELECT USING (true);

CREATE POLICY "Anyone can create vacinas"
  ON public.vacinas FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update vacinas"
  ON public.vacinas FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete vacinas"
  ON public.vacinas FOR DELETE USING (true);

CREATE TRIGGER vacinas_set_updated_at
  BEFORE UPDATE ON public.vacinas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
