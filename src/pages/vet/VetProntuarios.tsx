import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { VetLayout } from "@/components/VetLayout";
import { getVetSession } from "@/lib/vetAuth";
import { fetchPacientes, type PacienteVinculo } from "@/lib/vetData";
import { calcularIdade } from "@/lib/petUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Loader2, Search } from "lucide-react";

/** Prontuários dos pacientes com acesso autorizado pelo tutor. */
const VetProntuarios = () => {
  const session = getVetSession();
  const [loading, setLoading] = useState(true);
  const [lista, setLista] = useState<PacienteVinculo[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    (async () => {
      if (!session) return;
      setLista(await fetchPacientes(session.id, "active"));
      setLoading(false);
    })();
  }, [session?.id]);

  const filtrados = lista.filter((v) => {
    const t = busca.toLowerCase();
    return !t || (v.pet?.nome || "").toLowerCase().includes(t) || v.pet_id.toLowerCase().includes(t);
  });

  return (
    <VetLayout title="Prontuários">
      <div className="relative mb-5 max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar paciente" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtrados.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum prontuário disponível. O acesso precisa ser autorizado pelo tutor.
        </p>
      ) : (
        <div className="bg-card border rounded-2xl divide-y">
          {filtrados.map((v) => (
            <div key={v.id} className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{v.pet?.nome || v.pet_id}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {v.pet?.especie || "—"} · {calcularIdade(v.pet?.data_nascimento ?? null)} · Tutor: {v.pet?.tutor_nome || "—"}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to={`/vet/prontuario/${v.pet_id}`}>Abrir</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </VetLayout>
  );
};

export default VetProntuarios;
