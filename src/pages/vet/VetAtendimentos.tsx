import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { VetLayout } from "@/components/VetLayout";
import { getVetSession } from "@/lib/vetAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";

const VetAtendimentos = () => {
  const session = getVetSession();
  const [loading, setLoading] = useState(true);
  const [itens, setItens] = useState<any[]>([]);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from("atendimentos_veterinarios")
        .select("id, pet_id, data_atendimento, motivo, anamnese, pet:pets(nome)")
        .eq("veterinarian_id", session.id)
        .order("data_atendimento", { ascending: false });

      if (error) toast.error(error.message);
      setItens(data || []);
      setLoading(false);
    })();
  }, [session?.id]);

  return (
    <VetLayout title="Atendimentos">
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : itens.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum atendimento registrado. Abra o prontuário de um paciente para registrar.
        </p>
      ) : (
        <div className="space-y-3">
          {itens.map((a) => (
            <div key={a.id} className="bg-card border rounded-2xl p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{new Date(a.data_atendimento).toLocaleString("pt-BR")}</p>
                <p className="font-medium truncate">{a.motivo || "Atendimento"}</p>
                <p className="text-sm text-muted-foreground truncate">{a.pet?.nome || a.pet_id}</p>
              </div>
              <Link to={`/vet/prontuario/${a.pet_id}`} className="text-sm text-primary font-medium whitespace-nowrap">
                Prontuário
              </Link>
            </div>
          ))}
        </div>
      )}
    </VetLayout>
  );
};

export default VetAtendimentos;
