-- Add peso to pets
ALTER TABLE public.pets ADD COLUMN peso numeric;

-- Add tipo to vacinas
ALTER TABLE public.vacinas ADD COLUMN tipo text NOT NULL DEFAULT 'vacina';

-- Medicamentos table
CREATE TABLE public.medicamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id text NOT NULL,
  nome_medicamento text NOT NULL,
  dosagem text,
  horario text,
  frequencia text,
  data_inicio date,
  data_fim date,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.medicamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view medicamentos" ON public.medicamentos FOR SELECT USING (true);
CREATE POLICY "Anyone can create medicamentos" ON public.medicamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update medicamentos" ON public.medicamentos FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete medicamentos" ON public.medicamentos FOR DELETE USING (true);
CREATE TRIGGER set_medicamentos_updated_at BEFORE UPDATE ON public.medicamentos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Exames table
CREATE TABLE public.exames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id text NOT NULL,
  nome_exame text NOT NULL,
  arquivo_url text,
  data_exame date,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exames ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view exames" ON public.exames FOR SELECT USING (true);
CREATE POLICY "Anyone can create exames" ON public.exames FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update exames" ON public.exames FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete exames" ON public.exames FOR DELETE USING (true);
CREATE TRIGGER set_exames_updated_at BEFORE UPDATE ON public.exames FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for exam files
INSERT INTO storage.buckets (id, name, public) VALUES ('pet-exames', 'pet-exames', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Public read exames" ON storage.objects FOR SELECT USING (bucket_id = 'pet-exames');
CREATE POLICY "Public upload exames" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pet-exames');
CREATE POLICY "Public update exames" ON storage.objects FOR UPDATE USING (bucket_id = 'pet-exames');
CREATE POLICY "Public delete exames" ON storage.objects FOR DELETE USING (bucket_id = 'pet-exames');