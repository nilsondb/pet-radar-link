import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Dog, CheckCircle2, Circle, DollarSign } from "lucide-react";

const Admin = () => {
  const [stats, setStats] = useState({ total: 0, ativos: 0, pendentes: 0, receita: 0 });

  useEffect(() => {
    (async () => {
      const { data: pets } = await supabase.from("pets").select("status_ativado");
      const { data: pags } = await supabase.from("pagamentos").select("valor, status");
      const total = pets?.length ?? 0;
      const ativos = pets?.filter((p: any) => p.status_ativado).length ?? 0;
      const receita = (pags || [])
        .filter((p: any) => p.status === "pago")
        .reduce((s: number, p: any) => s + Number(p.valor || 0), 0);
      setStats({ total, ativos, pendentes: total - ativos, receita });
    })();
  }, []);

  const cards = [
    { label: "Total de Pets", value: stats.total, icon: Dog, color: "from-primary to-primary-glow" },
    { label: "Ativados", value: stats.ativos, icon: CheckCircle2, color: "from-emerald-500 to-emerald-400" },
    { label: "Pendentes", value: stats.pendentes, icon: Circle, color: "from-amber-500 to-amber-400" },
    { label: "Receita (R$)", value: Number(stats.receita).toFixed(2), icon: DollarSign, color: "from-fuchsia-500 to-pink-400" },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="relative overflow-hidden bg-card rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${color} opacity-20`} />
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-md mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-xs text-muted-foreground font-medium">{label}</div>
            <div className="text-2xl font-bold mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-card border rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-1">Bem-vindo ao painel</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie pets, usuários e financeiro pelo menu ao lado.
        </p>
      </div>
    </AdminLayout>
  );
};

export default Admin;
