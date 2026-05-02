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
    { label: "Total de Pets", value: stats.total, icon: Dog },
    { label: "Ativados", value: stats.ativos, icon: CheckCircle2 },
    { label: "Pendentes", value: stats.pendentes, icon: Circle },
    { label: "Receita (R$)", value: stats.receita.toFixed(2), icon: DollarSign },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card rounded-xl border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-xl font-bold">{value}</div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default Admin;
