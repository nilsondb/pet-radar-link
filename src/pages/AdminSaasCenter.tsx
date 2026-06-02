import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, RefreshCw, CheckCircle2, XCircle } from "lucide-react";

type Settings = {
  id?: string;
  enabled: boolean;
  saas_center_url: string | null;
  integration_token: string | null;
  last_sync: string | null;
  status: string;
};

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/saas-center`;

const AdminSaasCenter = () => {
  const [settings, setSettings] = useState<Settings>({
    enabled: false, saas_center_url: "", integration_token: "", last_sync: null, status: "inativo",
  });
  const [metrics, setMetrics] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: m }, { data: l }] = await Promise.all([
      supabase.from("integration_settings").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("app_metrics").select("*").order("last_update", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("integration_sync_logs").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    if (s) setSettings(s as any);
    setMetrics(m);
    setLogs(l || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const payload = {
      enabled: settings.enabled,
      saas_center_url: settings.saas_center_url,
      integration_token: settings.integration_token,
      status: settings.enabled ? (settings.status === "inativo" ? "configurado" : settings.status) : "inativo",
    };
    const res = settings.id
      ? await supabase.from("integration_settings").update(payload).eq("id", settings.id)
      : await supabase.from("integration_settings").insert(payload);
    setSaving(false);
    if (res.error) toast.error("Erro ao salvar"); else { toast.success("Configurações salvas"); load(); }
  };

  const testar = async () => {
    if (!settings.integration_token) { toast.error("Informe o token primeiro"); return; }
    setTesting(true);
    try {
      const r = await fetch(FN_URL, { headers: { Authorization: `Bearer ${settings.integration_token}` } });
      const data = await r.json();
      if (!r.ok) {
        toast.error("Falha: " + (data.error || r.status));
        await supabase.from("integration_sync_logs").insert({ status: "erro", message: data.error || `HTTP ${r.status}` });
      } else {
        toast.success("Integração funcionando!");
      }
      load();
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <AdminLayout title="SaaS Center"><div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div></AdminLayout>;

  return (
    <AdminLayout title="SaaS Center">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Configurações da Integração</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Ativar Integração</Label>
              <Switch checked={settings.enabled} onCheckedChange={(v) => setSettings({ ...settings, enabled: v })} />
            </div>
            <div className="space-y-2">
              <Label>URL do SaaS Center</Label>
              <Input value={settings.saas_center_url || ""} onChange={(e) => setSettings({ ...settings, saas_center_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Token de Integração</Label>
              <Input value={settings.integration_token || ""} onChange={(e) => setSettings({ ...settings, integration_token: e.target.value })} placeholder="Bearer token" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Última Sincronização</p>
                <p className="font-medium">{settings.last_sync ? new Date(settings.last_sync).toLocaleString("pt-BR") : "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium flex items-center gap-1">
                  {settings.enabled ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                  {settings.status}
                </p>
              </div>
            </div>
            <div className="bg-muted rounded p-3 text-xs break-all">
              <strong>Endpoint:</strong> GET {FN_URL}
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar</Button>
              <Button variant="outline" onClick={testar} disabled={testing}>
                {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Testar Integração
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Métricas Enviadas</CardTitle></CardHeader>
          <CardContent>
            {metrics ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {Object.entries({
                  "Total de usuários": metrics.total_users,
                  "Ativos": metrics.active_users,
                  "Premium": metrics.premium_users,
                  "Assinaturas": metrics.total_subscriptions,
                  "Receita mensal": `R$ ${Number(metrics.monthly_revenue).toFixed(2)}`,
                  "Receita anual": `R$ ${Number(metrics.annual_revenue).toFixed(2)}`,
                  "Novos hoje": metrics.new_users_today,
                  "Novos no mês": metrics.new_users_month,
                  "Cancelamentos": metrics.cancellations_month,
                }).map(([k, v]) => (
                  <div key={k} className="border rounded p-3">
                    <p className="text-muted-foreground text-xs">{k}</p>
                    <p className="font-semibold">{String(v)}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground">Sem métricas ainda.</p>}
            {metrics?.custom_metrics && Object.keys(metrics.custom_metrics).length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Métricas customizadas</p>
                <pre className="bg-muted rounded p-3 text-xs overflow-auto">{JSON.stringify(metrics.custom_metrics, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Histórico de Sincronizações</CardTitle></CardHeader>
          <CardContent>
            {logs.length === 0 ? <p className="text-muted-foreground text-sm">Nenhum registro.</p> : (
              <div className="space-y-2">
                {logs.map((l) => (
                  <div key={l.id} className="flex items-start gap-2 text-sm border-b pb-2">
                    {l.status === "sucesso" ? <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" /> : <XCircle className="w-4 h-4 text-destructive mt-0.5" />}
                    <div className="flex-1">
                      <p>{l.message || l.status}</p>
                      <p className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSaasCenter;
