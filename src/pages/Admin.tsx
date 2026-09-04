import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Dog, CheckCircle2, Siren, Tags } from "lucide-react";

const Admin = () => {
  const [stats, setStats] = useState({
    total: 0,
    ativos: 0,
    perdidos: 0,
    tagsAtivas: 0,
  });

  useEffect(() => {
    (async () => {
      const [{ data: pets, error: petsError }, { data: tags, error: tagsError }] = await Promise.all([
        supabase.from("pets").select("id, ativo, status_perdido"),
        supabase.from("tags").select("id, status"),
      ]);

      if (petsError || tagsError) {
        console.error("Erro ao carregar indicadores do admin", petsError || tagsError);
        return;
      }

      const listaPets = pets || [];
      const listaTags = tags || [];

      setStats({
        total: listaPets.length,
        ativos: listaPets.filter((p: any) => p.ativo).length,
        perdidos: listaPets.filter((p: any) => p.status_perdido).length,
        tagsAtivas: listaTags.filter((t: any) => t.status === "active").length,
      });
    })();
  }, []);

  const cards = [
    { label: "Total de Pets", value: stats.total, icon: Dog, color: "from-primary to-primary-glow" },
    { label: "Pets Ativos", value: stats.ativos, icon: CheckCircle2, color: "from-emerald-500 to-emerald-400" },
    { label: "Pets Perdidos", value: stats.perdidos, icon: Siren, color: "from-rose-500 to-red-400" },
    { label: "TAGs Ativas", value: stats.tagsAtivas, icon: Tags, color: "from-cyan-500 to-blue-400" },
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Link to="/admin/pets" className="bg-card border rounded-2xl p-6 hover:shadow-md transition-shadow">
          <h3 className="font-bold">Pets</h3>
          <p className="text-sm text-muted-foreground mt-1">Consulte os pets cadastrados e acompanhe o status de cada animal.</p>
        </Link>

        <Link to="/admin/tags" className="bg-card border rounded-2xl p-6 hover:shadow-md transition-shadow">
          <h3 className="font-bold">TAGs NFC</h3>
          <p className="text-sm text-muted-foreground mt-1">Gerencie estoque, ativação, substituição e vínculo das TAGs.</p>
        </Link>
      </div>

      <div className="mt-6 bg-card border rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-1">Authera Pet</h3>
        <p className="text-sm text-muted-foreground">
          Painel administrativo conectado ao schema atual do Authera Pet.
        </p>
      </div>
    </AdminLayout>
  );
};

export default Admin;
