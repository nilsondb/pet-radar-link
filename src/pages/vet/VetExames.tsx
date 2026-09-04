import { useEffect, useState } from "react";
import { VetLayout } from "@/components/VetLayout";
import { getVetSession } from "@/lib/vetAuth";
import { fetchPacientes } from "@/lib/vetData";
import { supabase } from "@/integrations/supabase/client";
import { abrirExame } from "@/lib/exames";
import { toast } from "sonner";
import { Loader2, FlaskConical } from "lucide-react";

const VetExames = () => {
  const session = getVetSession();
  const [loading, setLoading] = useState(true);
  const [itens, setItens] = useState<any[]>([]);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    (async () => {
      const pacientes = await fetchPacientes(session.id, "active");
      const ids = pacientes.map((p) => p.pet_id);
      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("exames")
        .select("id, pet_id, nome_exame, arquivo_path, data_exame, observacoes, created_by_role, pet:pets(nome)")
        .in("pet_id", ids)
        .order("created_at", { ascending: false });

      if (error) toast.error(error.message);
      setItens(data || []);
      setLoading(false);
    })();
  }, [session?.id]);

  return (
    <VetLayout title="Exames">
      <p className="text-sm text-muted-foreground mb-4">
        Exames dos pacientes que autorizaram seu acesso.
      </p>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : itens.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum exame disponível.</p>
      ) : (
        <div className="space-y-3">
          {itens.map((e) => (
            <div key={e.id} className="bg-card border rounded-2xl p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{e.nome_exame}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {e.pet?.nome || e.pet_id} · {e.data_exame || "—"} · por {e.created_by_role || "tutor"}
                </p>
                {e.observacoes && <p className="text-sm mt-1">{e.observacoes}</p>}
              </div>
              {e.arquivo_path && (
                <button
                  type="button"
                  onClick={() => abrirExame(e.arquivo_path).catch(() => toast.error("Não foi possível abrir o arquivo"))}
                  className="text-sm text-primary font-medium whitespace-nowrap"
                >
                  Abrir
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </VetLayout>
  );
};

export default VetExames;
