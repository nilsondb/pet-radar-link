import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIdFromUrl } from "@/lib/petUtils";
import { PetHeader } from "@/components/PetHeader";
import { PetSidebar } from "@/components/PetSidebar";
import { Button } from "@/components/ui/button";
import { Loader2, PawPrint, MapPin, Clock, Calendar, ShieldCheck, Siren } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const id = useIdFromUrl();
  const navigate = useNavigate();
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data } = await supabase.from("pets").select("*").eq("id", id).maybeSingle();
    if (!data) navigate(`/setup?id=${id}`, { replace: true });
    else setPet(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!id) {
      navigate("/setup");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleStatus = async (perdido: boolean) => {
    if (!id) return;
    setUpdating(true);
    const { error } = await supabase
      .from("pets")
      .update({
        status_perdido: perdido,
        data_perdido: perdido ? new Date().toISOString() : null,
      })
      .eq("id", id);
    setUpdating(false);
    if (error) return toast.error(error.message);
    toast.success(perdido ? "Pet marcado como perdido 🚨" : "Pet marcado como encontrado ✅");
    load();
  };

  if (loading || !pet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PetSidebar id={id!} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <PetHeader title="Dashboard" onMenuClick={() => setMenuOpen(true)} />

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="pet-card flex flex-col items-center text-center">
          {pet.foto_url ? (
            <img src={pet.foto_url} alt={pet.nome_pet}
              className="w-36 h-36 rounded-full object-cover ring-4 ring-primary/30 mb-4" />
          ) : (
            <div className="w-36 h-36 rounded-full bg-muted flex items-center justify-center mb-4">
              <PawPrint className="w-14 h-14 text-muted-foreground" />
            </div>
          )}
          <h2 className="text-2xl font-bold">{pet.nome_pet}</h2>

          <div className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            pet.status_perdido
              ? "bg-destructive/15 text-destructive"
              : "bg-success/15 text-success"
          }`}>
            {pet.status_perdido ? <><Siren className="w-4 h-4" /> Perdido</> : <><ShieldCheck className="w-4 h-4" /> Seguro</>}
          </div>
        </div>

        {pet.status_perdido && (
          <div className="pet-card border-2 border-destructive/30 space-y-3">
            <h3 className="font-bold text-destructive flex items-center gap-2">
              <Siren className="w-5 h-5" /> Informações de busca
            </h3>
            {pet.data_perdido && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Perdido em {new Date(pet.data_perdido).toLocaleString("pt-BR")}
              </div>
            )}
            {pet.ultimo_local && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="break-all">{pet.ultimo_local}</span>
              </div>
            )}
            {pet.ultimo_horario && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Avistado: {new Date(pet.ultimo_horario).toLocaleString("pt-BR")}
              </div>
            )}
          </div>
        )}

        <div className="pet-card">
          {pet.status_perdido ? (
            <Button onClick={() => toggleStatus(false)} disabled={updating}
              className="w-full bg-success hover:bg-success/90 text-success-foreground" size="lg">
              ✅ Marcar como encontrado
            </Button>
          ) : (
            <Button onClick={() => toggleStatus(true)} disabled={updating}
              variant="destructive" className="w-full" size="lg">
              🚨 Marcar como perdido
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
