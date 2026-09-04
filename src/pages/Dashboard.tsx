import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIdFromUrl, petPhotoUrl } from "@/lib/petUtils";
import { PetHeader } from "@/components/PetHeader";
import { PetSidebar } from "@/components/PetSidebar";
import { PetSwitcher } from "@/components/PetSwitcher";
import { Button } from "@/components/ui/button";
import { Loader2, PawPrint, MapPin, Clock, Calendar, ShieldCheck, Siren, HeartPulse, Syringe, Brain, Bot, Stethoscope } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const id = useIdFromUrl();
  const navigate = useNavigate();
  const [pet, setPet] = useState<any>(null);
  const [localizacao, setLocalizacao] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    if (!id) return;
    const [{ data, error }, { data: loc }] = await Promise.all([
      supabase.from("pets").select("*").eq("id", id).maybeSingle(),
      supabase.from("pet_localizacoes").select("latitude,longitude,endereco,data_leitura").eq("pet_id", id).order("data_leitura", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (error || !data || !data.ativo) {
      navigate("/meus-pets", { replace: true });
      return;
    }
    setPet(data);
    setLocalizacao(loc || null);
    setLoading(false);
  };

  useEffect(() => {
    if (!id) {
      navigate("/meus-pets", { replace: true });
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleStatus = async (perdido: boolean) => {
    if (!id) return;
    setUpdating(true);
    const { error } = await supabase.rpc("definir_status_perdido" as any, { p_pet_id: id, p_perdido: perdido } as any);
    setUpdating(false);
    if (error) return toast.error(error.message);
    toast.success(perdido ? "Pet marcado como perdido 🚨" : "Pet marcado como encontrado ✅");
    load();
  };

  if (loading || !pet) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const fotoUrl = petPhotoUrl(pet.foto_path);

  return (
    <div className="min-h-screen">
      <PetSidebar id={id!} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <PetHeader title="Dashboard" onMenuClick={() => setMenuOpen(true)} />
      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <PetSwitcher petId={id!} />
        <div className="pet-card flex flex-col items-center text-center">
          {fotoUrl ? <img src={fotoUrl} alt={pet.nome} className="w-36 h-36 rounded-full object-cover ring-4 ring-primary/30 mb-4" /> : <div className="w-36 h-36 rounded-full bg-muted flex items-center justify-center mb-4"><PawPrint className="w-14 h-14 text-muted-foreground" /></div>}
          <h2 className="text-2xl font-bold">{pet.nome}</h2>
          <div className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${pet.status_perdido ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}>
            {pet.status_perdido ? <><Siren className="w-4 h-4" /> Perdido</> : <><ShieldCheck className="w-4 h-4" /> Seguro</>}
          </div>
        </div>

        {localizacao && (
          <div className="pet-card space-y-3">
            <h3 className="font-bold flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Última localização</h3>
            <div className="rounded-2xl overflow-hidden border border-border">
              <iframe title="Mapa" src={`https://maps.google.com/maps?q=${localizacao.latitude},${localizacao.longitude}&z=16&output=embed`} width="100%" height="240" style={{ border: 0 }} loading="lazy" />
            </div>
            {localizacao.endereco && <p className="text-sm text-muted-foreground">{localizacao.endereco}</p>}
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="w-4 h-4" />{new Date(localizacao.data_leitura).toLocaleString("pt-BR")}</div>
            <a href={`https://maps.google.com/?q=${localizacao.latitude},${localizacao.longitude}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1">Abrir no Google Maps</a>
          </div>
        )}

        {pet.status_perdido && pet.perdido_desde && <div className="pet-card border-2 border-destructive/30"><h3 className="font-bold text-destructive flex items-center gap-2"><Siren className="w-5 h-5" /> Marcado como perdido</h3><div className="flex items-center gap-2 text-sm mt-3"><Calendar className="w-4 h-4 text-muted-foreground" />{new Date(pet.perdido_desde).toLocaleString("pt-BR")}</div></div>}

        <div className="pet-card">
          {pet.status_perdido ? <Button onClick={() => toggleStatus(false)} disabled={updating} className="w-full bg-success hover:bg-success/90 text-success-foreground" size="lg">✅ Marcar como encontrado</Button> : <Button onClick={() => toggleStatus(true)} disabled={updating} variant="destructive" className="w-full" size="lg">🚨 Marcar como perdido</Button>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { to: `/saude?id=${id}`, label: "Saúde", icon: HeartPulse },
            { to: `/vacinas?id=${id}`, label: "Vacinas", icon: Syringe },
            { to: `/historico?id=${id}`, label: "Histórico", icon: Brain },
            { to: `/assistente-ia?id=${id}`, label: "Assistente IA", icon: Bot },
            { to: `/veterinarios?id=${id}`, label: "Profissionais autorizados", icon: Stethoscope },
          ].map(({ to, label, icon: Icon }) => <Link key={to} to={to} className="pet-card flex flex-col items-center justify-center gap-2 py-5 hover:bg-accent/40 active:scale-[0.98] transition-all"><div className="w-12 h-12 rounded-2xl header-gradient flex items-center justify-center text-primary-foreground shadow-md"><Icon className="w-6 h-6" /></div><span className="text-sm font-semibold">{label}</span></Link>)}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
