REVOKE ALL ON public.tag_solicitacoes FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.tag_solicitacoes TO authenticated;
GRANT ALL ON public.tag_solicitacoes TO service_role;