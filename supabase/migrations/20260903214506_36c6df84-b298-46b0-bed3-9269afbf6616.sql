-- Revoga EXECUTE herdado de PUBLIC em todas as funções do schema public
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;

-- Helpers de autorização usados nas policies (avaliados como o papel que consulta)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.meu_tutor_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.meu_vet_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.e_meu_pet(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vet_tem_acesso(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pode_ver_clinico(text) TO authenticated;

-- API pública mínima da tag NFC
GRANT EXECUTE ON FUNCTION public.pet_publico(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_leitura_publica(text, numeric, numeric, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pet_status_ativacao(text) TO anon, authenticated;

-- Fluxos autenticados
GRANT EXECUTE ON FUNCTION public.ativar_pet_com_token(text, text, text, text, text, text, date, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reivindicar_pet(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.criar_perfil_veterinario(text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reivindicar_admin(text, text) TO authenticated;
