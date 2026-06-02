
-- Tabela de configurações de integração
CREATE TABLE public.integration_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  saas_center_url text,
  integration_token text,
  last_sync timestamptz,
  status text NOT NULL DEFAULT 'inativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_settings TO anon, authenticated;
GRANT ALL ON public.integration_settings TO service_role;

ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view integration_settings" ON public.integration_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert integration_settings" ON public.integration_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update integration_settings" ON public.integration_settings FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete integration_settings" ON public.integration_settings FOR DELETE USING (true);

CREATE TRIGGER trg_integration_settings_updated_at
BEFORE UPDATE ON public.integration_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Tabela de métricas
CREATE TABLE public.app_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_users integer NOT NULL DEFAULT 0,
  active_users integer NOT NULL DEFAULT 0,
  premium_users integer NOT NULL DEFAULT 0,
  total_subscriptions integer NOT NULL DEFAULT 0,
  monthly_revenue numeric NOT NULL DEFAULT 0,
  annual_revenue numeric NOT NULL DEFAULT 0,
  new_users_today integer NOT NULL DEFAULT 0,
  new_users_month integer NOT NULL DEFAULT 0,
  cancellations_month integer NOT NULL DEFAULT 0,
  custom_metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_update timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_metrics TO anon, authenticated;
GRANT ALL ON public.app_metrics TO service_role;

ALTER TABLE public.app_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view app_metrics" ON public.app_metrics FOR SELECT USING (true);
CREATE POLICY "Anyone can insert app_metrics" ON public.app_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update app_metrics" ON public.app_metrics FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete app_metrics" ON public.app_metrics FOR DELETE USING (true);

-- Tabela de histórico de sincronizações
CREATE TABLE public.integration_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL,
  message text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_sync_logs TO anon, authenticated;
GRANT ALL ON public.integration_sync_logs TO service_role;

ALTER TABLE public.integration_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view integration_sync_logs" ON public.integration_sync_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert integration_sync_logs" ON public.integration_sync_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete integration_sync_logs" ON public.integration_sync_logs FOR DELETE USING (true);

-- Função que recalcula métricas com base nas tabelas existentes
CREATE OR REPLACE FUNCTION public.recalc_app_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_users integer;
  v_active_users integer;
  v_premium_users integer;
  v_total_subs integer;
  v_month_rev numeric;
  v_year_rev numeric;
  v_new_today integer;
  v_new_month integer;
  v_cancel_month integer;
  v_custom jsonb;
  v_pets_total integer;
  v_nfc_links integer;
  v_ia_queries integer;
  v_id uuid;
BEGIN
  SELECT count(*) INTO v_total_users FROM public.pets;
  SELECT count(*) INTO v_active_users FROM public.pets WHERE status_ativado = true;
  SELECT count(*) INTO v_premium_users FROM public.pets WHERE status_ativado = true;
  SELECT count(*) INTO v_total_subs FROM public.pagamentos WHERE status = 'pago';

  SELECT COALESCE(sum(valor),0) INTO v_month_rev
    FROM public.pagamentos
    WHERE status = 'pago'
      AND data_pagamento >= date_trunc('month', now());

  SELECT COALESCE(sum(valor),0) INTO v_year_rev
    FROM public.pagamentos
    WHERE status = 'pago'
      AND data_pagamento >= date_trunc('year', now());

  SELECT count(*) INTO v_new_today FROM public.pets WHERE created_at >= date_trunc('day', now());
  SELECT count(*) INTO v_new_month FROM public.pets WHERE created_at >= date_trunc('month', now());

  SELECT count(*) INTO v_cancel_month
    FROM public.pagamentos
    WHERE status = 'cancelado'
      AND updated_at >= date_trunc('month', now());

  SELECT count(*) INTO v_pets_total FROM public.pets;
  SELECT count(*) INTO v_nfc_links FROM public.pets WHERE token IS NOT NULL;
  SELECT count(*) INTO v_ia_queries FROM public.pet_resumos_ia;

  v_custom := jsonb_build_object(
    'pets_cadastrados', v_pets_total,
    'links_nfc', v_nfc_links,
    'consultas_ia', v_ia_queries
  );

  SELECT id INTO v_id FROM public.app_metrics ORDER BY last_update DESC LIMIT 1;

  IF v_id IS NULL THEN
    INSERT INTO public.app_metrics (
      total_users, active_users, premium_users, total_subscriptions,
      monthly_revenue, annual_revenue, new_users_today, new_users_month,
      cancellations_month, custom_metrics, last_update
    ) VALUES (
      v_total_users, v_active_users, v_premium_users, v_total_subs,
      v_month_rev, v_year_rev, v_new_today, v_new_month,
      v_cancel_month, v_custom, now()
    );
  ELSE
    UPDATE public.app_metrics SET
      total_users = v_total_users,
      active_users = v_active_users,
      premium_users = v_premium_users,
      total_subscriptions = v_total_subs,
      monthly_revenue = v_month_rev,
      annual_revenue = v_year_rev,
      new_users_today = v_new_today,
      new_users_month = v_new_month,
      cancellations_month = v_cancel_month,
      custom_metrics = v_custom,
      last_update = now()
    WHERE id = v_id;
  END IF;
END;
$$;

-- Trigger genérico para chamar recalc
CREATE OR REPLACE FUNCTION public.trg_recalc_app_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recalc_app_metrics();
  RETURN NULL;
END;
$$;

CREATE TRIGGER pets_recalc_metrics
AFTER INSERT OR UPDATE OR DELETE ON public.pets
FOR EACH STATEMENT EXECUTE FUNCTION public.trg_recalc_app_metrics();

CREATE TRIGGER pagamentos_recalc_metrics
AFTER INSERT OR UPDATE OR DELETE ON public.pagamentos
FOR EACH STATEMENT EXECUTE FUNCTION public.trg_recalc_app_metrics();

-- Inicializar métricas
SELECT public.recalc_app_metrics();
