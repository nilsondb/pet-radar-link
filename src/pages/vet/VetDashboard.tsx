import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { VetLayout } from "@/components/VetLayout";
import { getVetSession } from "@/lib/vetAuth";
import { fetchPacientes, type PacienteVinculo } from "@/lib/vetData";
import { calcularIdade } from "@/lib/petUtils";
import { Dog, Clock, ShieldCheck, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const VetDashboard = () => {
  const session = getVetSession();
  const [ativos, setAtivos] = useState<PacienteVinculo[]>([]);
  const [pendentes, setPendentes] = useState<PacienteVinculo[]>([]);
  const [atendimentos, setAtendimentos] = useState(0);

  useEffect(() => {
    if (!session) return;
    (async () => {
      setAtivos(await fetchPacientes(session.id, "active"));
      setPendentes(await fetchPacientes(session.id, "pending"));
      const { count } = await supabase
        .from("atendimentos_veterinarios")
        .select("id", { count: "exact", head: true })
        .eq("veterinarian_id", session.id);
      setAtendimentos(count ?? 0);
    })();
  }, [session?.id]);

  const cards = [
    { label: "Pacientes ativos", value: ativos.length, icon: Dog, color: "from-primary to-primary-glow" },
    { label: "Acessos pendentes", value: pendentes.length, icon: Clock, color: "from-amber-500 to-amber-400" },
    { label: "Atendimentos", value: atendimentos, icon: Stethoscope, color: "from-emerald-500 to-emerald-400" },
    { label: "Nível de acesso", value: "health", icon: ShieldCheck, color: "from-fuchsia-500 to-pink-400" },
  ];

  return (
    <VetLayout title="Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="relative overflow-hidden bg-card rounded-2xl border p-5">
            <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${color} opacity-20`} />
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-xs text-muted-foreground font-medium">{label}</div>
            <div className="text-2xl font-bold mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-card border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Pacientes recentes</h3>
          <Link to="/vet/pacientes" className="text-sm text-primary font-medium">Ver todos</Link>
        </div>
        {ativos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum paciente vinculado ainda. Cadastre um novo paciente ou solicite acesso a um pet existente.
          </p>
        ) : (
          <ul className="divide-y">
            {ativos.slice(0, 5).map((v) => (
              <li key={v.id} className="py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                  {v.pet?.foto ? (
                    <img src={v.pet.foto} alt={`Foto de ${v.pet?.nome || "pet"}`} className="w-full h-full object-cover" />
                  ) : (
                    <Dog className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{v.pet?.nome || v.pet_id}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {v.pet?.raca || "—"} · {calcularIdade(v.pet?.data_nascimento ?? null)}
                  </p>
                </div>
                <Link to={`/vet/prontuario/${v.pet_id}`} className="text-sm text-primary font-medium">
                  Abrir prontuário
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </VetLayout>
  );
};

export default VetDashboard;
