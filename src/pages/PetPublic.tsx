import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIdFromUrl, calcularIdade, formatTelefoneWA } from "@/lib/petUtils";
import { Button } from "@/components/ui/button";
import { Loader2, PawPrint, Phone, MessageCircle, MapPin, Siren, Heart, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos

const PetPublic = () => {
  const id = useIdFromUrl();
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingLoc, setSendingLoc] = useState(false);
  const [autoSent, setAutoSent] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const podeAtualizar = (ultimo: string | null) => {
    if (!ultimo) return true;
    return Date.now() - new Date(ultimo).getTime() > COOLDOWN_MS;
  };

  const salvarLocalizacao = async (petId: string, lat: number, lng: number) => {
    const local = `https://maps.google.com/?q=${lat},${lng}`;
    await supabase.from("pets").update({
      ultimo_local: local,
      ultimo_horario: new Date().toISOString(),
    }).eq("id", petId);
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase.from("pets").select("*").eq("id", id).maybeSingle();
      setPet(data);
      setLoading(false);

      if (data && navigator.geolocation && podeAtualizar(data.ultimo_horario)) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await salvarLocalizacao(id, pos.coords.latitude, pos.coords.longitude);
            setAutoSent(true);
          },
          (err) => {
            if (err.code === err.PERMISSION_DENIED) setPermissionDenied(true);
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      }
    })();
  }, [id]);

  const enviarLocalizacao = () => {
    if (!navigator.geolocation || !id) return;
    if (!podeAtualizar(pet?.ultimo_horario)) {
      toast.info("Localização já enviada recentemente. Aguarde alguns minutos.");
      return;
    }
    setSendingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await salvarLocalizacao(id, pos.coords.latitude, pos.coords.longitude);
        setSendingLoc(false);
        setAutoSent(true);
        setPermissionDenied(false);
        toast.success("Localização enviada ao dono! ❤️");
      },
      () => {
        setSendingLoc(false);
        setPermissionDenied(true);
        toast.error("Não foi possível obter sua localização.");
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="pet-card text-center max-w-md">
          <PawPrint className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h1 className="text-xl font-bold mb-2">Pet não encontrado</h1>
          <p className="text-muted-foreground">Esta tag ainda não foi cadastrada.</p>
        </div>
      </div>
    );
  }

  const tel = formatTelefoneWA(pet.telefone);
  const wa = `https://wa.me/55${tel}?text=${encodeURIComponent(`Olá! Encontrei o ${pet.nome_pet} 🐾`)}`;

  return (
    <div className="min-h-screen">
      {pet.status_perdido && (
        <div className="bg-destructive text-destructive-foreground py-4 px-4 text-center font-bold sticky top-0 z-30 shadow-lg flex items-center justify-center gap-2">
          <Siren className="w-5 h-5 animate-pulse" />
          PET PERDIDO — Ajude a devolver ao dono
        </div>
      )}

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="pet-card flex flex-col items-center text-center">
          {pet.foto_url ? (
            <img src={pet.foto_url} alt={pet.nome_pet}
              className="w-48 h-48 rounded-full object-cover ring-4 ring-primary/30 mb-4" />
          ) : (
            <div className="w-48 h-48 rounded-full bg-muted flex items-center justify-center mb-4">
              <PawPrint className="w-20 h-20 text-muted-foreground" />
            </div>
          )}
          <h1 className="text-3xl font-bold">{pet.nome_pet}</h1>
          <p className="text-muted-foreground mt-1">{calcularIdade(pet.data_nascimento)}</p>
          <p className="text-sm mt-2">Dono: <span className="font-medium">{pet.nome_dono}</span></p>

          <div className="mt-5 bg-accent text-accent-foreground rounded-2xl p-4 flex items-start gap-2">
            <Heart className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-left">
              Oi, estou perdido 😢 Você pode me ajudar a voltar pra casa?
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <a href={wa} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="w-full bg-success hover:bg-success/90 text-success-foreground h-14 text-base">
              <MessageCircle className="w-5 h-5 mr-2" /> Avisar pelo WhatsApp
            </Button>
          </a>
          <a href={`tel:+55${tel}`}>
            <Button size="lg" className="w-full h-14 text-base mt-3">
              <Phone className="w-5 h-5 mr-2" /> Ligar para o dono
            </Button>
          </a>

          {autoSent && !permissionDenied ? (
            <div className="flex items-center justify-center gap-2 text-xs text-success bg-success/10 rounded-xl py-2 px-3">
              <CheckCircle2 className="w-4 h-4" />
              Localização enviada automaticamente
            </div>
          ) : (
            <Button
              onClick={enviarLocalizacao}
              disabled={sendingLoc}
              size="lg"
              variant="outline"
              className="w-full h-14 text-base"
            >
              {sendingLoc ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <MapPin className="w-5 h-5 mr-2" />}
              Enviar minha localização
            </Button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground pt-4">
          Powered by Pet_ID 🐾
        </p>
      </main>
    </div>
  );
};

export default PetPublic;
