-- 1. Tutores
CREATE TABLE public.tutores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text NOT NULL,
  email text,
  endereco text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutores TO authenticated;
GRANT ALL ON public.tutores TO service_role;

ALTER TABLE public.tutores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tutores" ON public.tutores FOR SELECT USING (true);
CREATE POLICY "Anyone can insert tutores" ON public.tutores FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tutores" ON public.tutores FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete tutores" ON public.tutores FOR DELETE USING (true);

CREATE TRIGGER tutores_set_updated_at
BEFORE UPDATE ON public.tutores
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Pets: vínculo com tutor + campos adicionais
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS tutor_id uuid REFERENCES public.tutores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tag_id text,
  ADD COLUMN IF NOT EXISTS raca text,
  ADD COLUMN IF NOT EXISTS sexo text,
  ADD COLUMN IF NOT EXISTS cor text;

CREATE INDEX IF NOT EXISTS pets_tutor_id_idx ON public.pets (tutor_id);

-- tag_id espelha o id publico da tag quando nao informado
UPDATE public.pets SET tag_id = id WHERE tag_id IS NULL;

-- 3. Migracao segura dos dados de dono existentes -> tutores
WITH grupos AS (
  SELECT
    regexp_replace(COALESCE(telefone, ''), '\D', '', 'g') AS tel_norm,
    min(NULLIF(btrim(nome_dono), '')) AS nome,
    min(NULLIF(btrim(telefone), '')) AS telefone,
    min(NULLIF(btrim(endereco), '')) AS endereco
  FROM public.pets
  WHERE tutor_id IS NULL
    AND regexp_replace(COALESCE(telefone, ''), '\D', '', 'g') <> ''
  GROUP BY 1
), novos AS (
  INSERT INTO public.tutores (nome, telefone, endereco)
  SELECT COALESCE(nome, 'Tutor'), COALESCE(telefone, ''), endereco
  FROM grupos
  RETURNING id, regexp_replace(COALESCE(telefone, ''), '\D', '', 'g') AS tel_norm
)
UPDATE public.pets p
SET tutor_id = n.id
FROM novos n
WHERE p.tutor_id IS NULL
  AND regexp_replace(COALESCE(p.telefone, ''), '\D', '', 'g') = n.tel_norm;