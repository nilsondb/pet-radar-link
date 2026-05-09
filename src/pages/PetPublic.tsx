import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIdFromUrl, formatTelefoneWA } from "@/lib/petUtils";
import { logPetEvento } from "@/lib/petEventos";
import { Loader2, PawPrint, MapPin, Phone, MessageCircle, Heart, AlertTriangle, CheckCircle2, User } from "lucide-react";

const COOLDOWN_MS = 5 * 60 * 1000;

const PetPublic = () => {
  const id = useIdFromUrl();
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusLocal, setStatusLocal] = useState<string>("Solicitando localização...");
  const [statusKind, setStatusKind] = useState<"loading" | "ok" | "error">("loading");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const podeAtualizar = (ultimo: string | null) => {
    if (!ultimo) return true;
    return Date.now() - new Date(ultimo).getTime() > COOLDOWN_MS;
  };

  const salvarLocalizacao = async (petId: string, lat: number, lng: number) => {
    const local = `https://maps.google.com/?q=${lat},${lng}`;
    const agora = new Date().toISOString();
    await supabase.from("pets").update({
      ultimo_local: local,
      ultimo_horario: agora,
      ultima_localizacao: local,
      ultima_leitura: agora,
      ultima_latitude: lat,
      ultima_longitude: lng,
    }).eq("id", petId);
    await supabase.from("pet_localizacoes").insert({
      pet_id: petId,
      latitude: lat,
      longitude: lng,
      endereco: local,
    });
    await logPetEvento(petId, "localizacao", "📍 Pet localizado", local, { lat, lng, local });
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase.from("pets").select("*").eq("id", id).maybeSingle();
      const visible = data && data.status_ativado ? data : null;
      setPet(visible);
      setLoading(false);

      if (visible && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setCoords({ lat, lng });
            setStatusLocal("Localização enviada com sucesso!");
            setStatusKind("ok");
            if (podeAtualizar(visible.ultimo_horario)) {
              await salvarLocalizacao(id, lat, lng);
            }
          },
          () => {
            setStatusLocal("Não foi possível obter localização");
            setStatusKind("error");
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5DC]">
        <Loader2 className="w-10 h-10 animate-spin text-[#8B5CF6]" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F5F5DC]">
        <div className="bg-white rounded-3xl p-8 text-center max-w-md shadow-xl border border-[#8B5CF6]/10">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center mb-4">
            <PawPrint className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold mb-2 text-gray-900">Pet não registrado</h1>
          <p className="text-gray-500 text-sm">Esta tag NFC ainda não está vinculada a um pet.</p>
        </div>
      </div>
    );
  }

  const telefone = formatTelefoneWA(pet.telefone || "");
  const endereco = coords
    ? `https://maps.google.com/?q=${coords.lat},${coords.lng}`
    : "Local não identificado";

  const enviarWhatsApp = () => {
    const hora = new Date().toLocaleString();
    const link = window.location.href;
    const mensagem = `🐕 Olá! Encontrei um pet que pode ser seu!

📍 Localização:
${endereco}

🕒 Horário:
${hora}

👉 Veja aqui:
${link}

Vou tentar ajudar 👍`;
    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
  };

  const ligar = () => {
    window.location.href = `tel:+55${telefone}`;
  };

  const StatusIcon = statusKind === "ok" ? CheckCircle2 : statusKind === "error" ? AlertTriangle : Loader2;
  const statusBg =
    statusKind === "ok"
      ? "bg-green-50 text-green-700 border-green-200"
      : statusKind === "error"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20";

  return (
    <div className="min-h-screen bg-[#F5F5DC] relative overflow-hidden">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-br from-[#8B5CF6] via-[#A78BFA] to-[#C4B5FD] rounded-b-[40px] shadow-lg" />
      <div className="absolute top-12 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />

      <main className="relative max-w-md mx-auto px-5 pt-8 pb-10 space-y-5 animate-fade-in">
        {/* Header */}
        <div className="text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-semibold mb-3 border border-white/30">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            PET PERDIDO
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-sm">
            🐕 Ajude a voltar pra casa
          </h1>
          <p className="text-sm text-white/90 mt-1 flex items-center justify-center gap-1">
            Sua ajuda faz toda a diferença <Heart className="w-4 h-4 fill-red-400 text-red-400" />
          </p>
        </div>

        {/* Pet photo */}
        <div className="flex justify-center pt-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6] to-[#C4B5FD] rounded-full blur-xl opacity-60 scale-110" />
            {pet.foto_url ? (
              <img
                src={pet.foto_url}
                alt={pet.nome_pet}
                className="relative w-56 h-56 rounded-full object-cover ring-4 ring-white shadow-2xl"
              />
            ) : (
              <div className="relative w-56 h-56 rounded-full bg-white ring-4 ring-white shadow-2xl flex items-center justify-center">
                <PawPrint className="w-24 h-24 text-[#8B5CF6]/40" />
              </div>
            )}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> PERDIDO
            </div>
          </div>
        </div>

        {/* Pet info card */}
        <div className="bg-white rounded-3xl p-5 shadow-xl border border-white/50 space-y-3 mt-6">
          <div className="text-center pb-3 border-b border-gray-100">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Nome do pet</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-0.5">{pet.nome_pet}</h2>
          </div>
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-[#8B5CF6]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Tutor</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{pet.nome_dono}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-[#8B5CF6]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Telefone</p>
              <p className="text-sm font-semibold text-gray-900">{pet.telefone}</p>
            </div>
          </div>
        </div>

        {/* Emotional message */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl leading-none">⚠️</span>
          <p className="text-sm font-medium text-amber-900 leading-relaxed">
            Esse pet pode estar perdido e precisa da sua ajuda para voltar pra família dele!
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-1">
          <button
            onClick={enviarWhatsApp}
            className="w-full bg-gradient-to-r from-[#25D366] to-[#1EBE5D] text-white font-bold py-5 rounded-2xl text-base shadow-lg shadow-green-500/30 active:scale-[0.98] hover:shadow-xl hover:shadow-green-500/40 transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Avisar no WhatsApp
          </button>

          <button
            onClick={ligar}
            className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white font-bold py-5 rounded-2xl text-base shadow-lg shadow-purple-500/30 active:scale-[0.98] hover:shadow-xl hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-2"
          >
            <Phone className="w-5 h-5" />
            Ligar agora
          </button>
        </div>

        {/* Location status */}
        <div className={`rounded-2xl p-3 border flex items-center gap-2 text-sm font-medium ${statusBg}`}>
          <StatusIcon className={`w-4 h-4 shrink-0 ${statusKind === "loading" ? "animate-spin" : ""}`} />
          <span>{statusLocal}</span>
        </div>

        {/* Map */}
        {coords && (
          <div className="bg-white rounded-3xl p-3 shadow-xl border border-white/50 animate-fade-in">
            <div className="flex items-center gap-2 px-2 pb-2">
              <MapPin className="w-4 h-4 text-[#8B5CF6]" />
              <span className="text-sm font-semibold text-gray-900">Localização atual</span>
            </div>
            <iframe
              title="Mapa"
              width="100%"
              height={220}
              className="rounded-2xl border-0"
              src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`}
            />
          </div>
        )}

        <p className="text-center text-xs text-gray-500 pt-2 pb-2">
          Powered by <span className="font-semibold text-[#8B5CF6]">Pet_ID</span> 🐾
        </p>
      </main>
    </div>
  );
};

export default PetPublic;
