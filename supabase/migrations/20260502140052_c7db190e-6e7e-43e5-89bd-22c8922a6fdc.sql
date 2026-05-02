-- Create activation tokens table (one token per tag id; consumed on signup, but we keep it for re-validation on edit)
CREATE TABLE IF NOT EXISTS public.activation_tokens (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activation_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read activation tokens"
ON public.activation_tokens FOR SELECT USING (true);

CREATE POLICY "Anyone can update activation tokens"
ON public.activation_tokens FOR UPDATE USING (true);

CREATE POLICY "Anyone can create activation tokens"
ON public.activation_tokens FOR INSERT WITH CHECK (true);

-- Seed a demo token row so we can test
INSERT INTO public.activation_tokens (id, token) VALUES ('demo-pet-001', 'demo-token-001')
ON CONFLICT (id) DO NOTHING;