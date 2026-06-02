import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    // Validar token
    const auth = req.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: settings } = await supabase
      .from('integration_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!settings || !settings.enabled || settings.integration_token !== token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Recalcular e retornar
    await supabase.rpc('recalc_app_metrics');
    const { data: m } = await supabase
      .from('app_metrics')
      .select('*')
      .order('last_update', { ascending: false })
      .limit(1)
      .maybeSingle();

    await supabase.from('integration_settings').update({
      last_sync: new Date().toISOString(),
      status: 'online',
    }).eq('id', settings.id);

    await supabase.from('integration_sync_logs').insert({
      status: 'sucesso',
      message: 'Métricas consultadas via /saas-center',
      payload: m as any,
    });

    const body = {
      app_name: 'Pet_ID',
      status: 'online',
      total_users: m?.total_users ?? 0,
      active_users: m?.active_users ?? 0,
      premium_users: m?.premium_users ?? 0,
      subscriptions: m?.total_subscriptions ?? 0,
      monthly_revenue: Number(m?.monthly_revenue ?? 0),
      annual_revenue: Number(m?.annual_revenue ?? 0),
      new_users_today: m?.new_users_today ?? 0,
      new_users_month: m?.new_users_month ?? 0,
      cancellations_month: m?.cancellations_month ?? 0,
      custom_metrics: m?.custom_metrics ?? {},
      last_update: m?.last_update ?? new Date().toISOString(),
    };

    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
