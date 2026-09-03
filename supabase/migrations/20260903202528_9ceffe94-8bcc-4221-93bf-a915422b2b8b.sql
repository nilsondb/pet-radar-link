-- 1. TUTORES: evolução
ALTER TABLE public.tutores
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

-- 2. TAGS
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid_publico text NOT NULL UNIQUE,
  pet_id text REFERENCES public.pets(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'estoque',
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  deactivated_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO anon, authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Anyone can view tags" ON public.tags FOR SELECT USING (true);
  CREATE POLICY "Anyone can insert tags" ON public.tags FOR INSERT WITH CHECK (true);
  CREATE POLICY "Anyone can update tags" ON public.tags FOR UPDATE USING (true);
  CREATE POLICY "Anyone can delete tags" ON public.tags FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS tags_one_active_per_pet
  ON public.tags(pet_id) WHERE status = 'ativa';

-- backfill: cada pet existente vira uma tag ativa
INSERT INTO public.tags (uid_publico, pet_id, status, activated_at, created_at)
SELECT p.id, p.id,
       CASE WHEN p.status_ativado THEN 'ativa' ELSE 'estoque' END,
       CASE WHEN p.status_ativado THEN p.data_criacao ELSE NULL END,
       p.created_at
FROM public.pets p
WHERE NOT EXISTS (SELECT 1 FROM public.tags t WHERE t.uid_publico = p.id);

-- 3. VETERINARIOS
CREATE TABLE IF NOT EXISTS public.veterinarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  nome text NOT NULL,
  email text,
  telefone text,
  crmv text,
  uf_crmv text,
  clinica text,
  especialidade text,
  senha_hash text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.veterinarios TO anon, authenticated;
GRANT ALL ON public.veterinarios TO service_role;
ALTER TABLE public.veterinarios ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Anyone can view veterinarios" ON public.veterinarios FOR SELECT USING (true);
  CREATE POLICY "Anyone can insert veterinarios" ON public.veterinarios FOR INSERT WITH CHECK (true);
  CREATE POLICY "Anyone can update veterinarios" ON public.veterinarios FOR UPDATE USING (true);
  CREATE POLICY "Anyone can delete veterinarios" ON public.veterinarios FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DROP TRIGGER IF EXISTS veterinarios_set_updated_at ON public.veterinarios;
CREATE TRIGGER veterinarios_set_updated_at BEFORE UPDATE ON public.veterinarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. PET x VETERINARIO
CREATE TABLE IF NOT EXISTS public.pet_veterinarians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id text NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  veterinarian_id uuid NOT NULL REFERENCES public.veterinarios(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  access_level text NOT NULL DEFAULT 'health',
  authorized_by uuid,
  requested_at timestamptz NOT NULL DEFAULT now(),
  authorized_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pet_id, veterinarian_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_veterinarians TO anon, authenticated;
GRANT ALL ON public.pet_veterinarians TO service_role;
ALTER TABLE public.pet_veterinarians ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Anyone can view pet_veterinarians" ON public.pet_veterinarians FOR SELECT USING (true);
  CREATE POLICY "Anyone can insert pet_veterinarians" ON public.pet_veterinarians FOR INSERT WITH CHECK (true);
  CREATE POLICY "Anyone can update pet_veterinarians" ON public.pet_veterinarians FOR UPDATE USING (true);
  CREATE POLICY "Anyone can delete pet_veterinarians" ON public.pet_veterinarians FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. ATENDIMENTOS
CREATE TABLE IF NOT EXISTS public.atendimentos_veterinarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id text NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  veterinarian_id uuid REFERENCES public.veterinarios(id) ON DELETE SET NULL,
  data_atendimento timestamptz NOT NULL DEFAULT now(),
  motivo text,
  anamnese text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.atendimentos_veterinarios TO anon, authenticated;
GRANT ALL ON public.atendimentos_veterinarios TO service_role;
ALTER TABLE public.atendimentos_veterinarios ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Anyone can view atendimentos" ON public.atendimentos_veterinarios FOR SELECT USING (true);
  CREATE POLICY "Anyone can insert atendimentos" ON public.atendimentos_veterinarios FOR INSERT WITH CHECK (true);
  CREATE POLICY "Anyone can update atendimentos" ON public.atendimentos_veterinarios FOR UPDATE USING (true);
  CREATE POLICY "Anyone can delete atendimentos" ON public.atendimentos_veterinarios FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DROP TRIGGER IF EXISTS atendimentos_set_updated_at ON public.atendimentos_veterinarios;
CREATE TRIGGER atendimentos_set_updated_at BEFORE UPDATE ON public.atendimentos_veterinarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. REGISTROS CLINICOS
CREATE TABLE IF NOT EXISTS public.registros_clinicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id text NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  veterinarian_id uuid REFERENCES public.veterinarios(id) ON DELETE SET NULL,
  atendimento_id uuid REFERENCES public.atendimentos_veterinarios(id) ON DELETE SET NULL,
  tipo text NOT NULL DEFAULT 'nota',
  titulo text NOT NULL,
  descricao text,
  dados_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registros_clinicos TO anon, authenticated;
GRANT ALL ON public.registros_clinicos TO service_role;
ALTER TABLE public.registros_clinicos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Anyone can view registros_clinicos" ON public.registros_clinicos FOR SELECT USING (true);
  CREATE POLICY "Anyone can insert registros_clinicos" ON public.registros_clinicos FOR INSERT WITH CHECK (true);
  CREATE POLICY "Anyone can update registros_clinicos" ON public.registros_clinicos FOR UPDATE USING (true);
  CREATE POLICY "Anyone can delete registros_clinicos" ON public.registros_clinicos FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. RASTREABILIDADE
ALTER TABLE public.vacinas
  ADD COLUMN IF NOT EXISTS created_by_user uuid,
  ADD COLUMN IF NOT EXISTS created_by_role text NOT NULL DEFAULT 'tutor',
  ADD COLUMN IF NOT EXISTS veterinarian_id uuid REFERENCES public.veterinarios(id) ON DELETE SET NULL;

ALTER TABLE public.medicamentos
  ADD COLUMN IF NOT EXISTS created_by_user uuid,
  ADD COLUMN IF NOT EXISTS created_by_role text NOT NULL DEFAULT 'tutor',
  ADD COLUMN IF NOT EXISTS veterinarian_id uuid REFERENCES public.veterinarios(id) ON DELETE SET NULL;

ALTER TABLE public.exames
  ADD COLUMN IF NOT EXISTS created_by_user uuid,
  ADD COLUMN IF NOT EXISTS created_by_role text NOT NULL DEFAULT 'tutor',
  ADD COLUMN IF NOT EXISTS veterinarian_id uuid REFERENCES public.veterinarios(id) ON DELETE SET NULL;

ALTER TABLE public.pet_eventos
  ADD COLUMN IF NOT EXISTS created_by_user uuid,
  ADD COLUMN IF NOT EXISTS created_by_role text NOT NULL DEFAULT 'tutor',
  ADD COLUMN IF NOT EXISTS veterinarian_id uuid REFERENCES public.veterinarios(id) ON DELETE SET NULL;

ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS especie text;
