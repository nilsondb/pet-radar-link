import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIdFromUrl, formatTelefoneWA } from "@/lib/petUtils";
import { logPetEvento } from "@/lib/petEventos";
import { Loader2, PawPrint } from "lucide-react";

const COOLDOWN_MS = 5 * 60 * 1000;

const PetPublic = () => {
  const id = useIdFromUrl();
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusLocal, setStatusLocal] = useState<string>("📡 Solicitando localização...");
  const [statusColor, setStatusColor] = useState<string>("#666");
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
            setStatusLocal("📍 Localização enviada com sucesso!");
            setStatusColor("#16a34a");
            if (podeAtualizar(visible.ultimo_horario)) {
              await salvarLocalizacao(id, lat, lng);
            }
          },
          () => {
            setStatusLocal("⚠️ Não foi possível obter localização");
            setStatusColor("#dc2626");
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F5DC" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#8B5CF6" }} />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#F5F5DC" }}>
        <div className="bg-white rounded-2xl p-6 text-center max-w-md shadow">
          <PawPrint className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h1 className="text-xl font-bold mb-2">Este pet ainda não foi registrado</h1>
          <p className="text-muted-foreground">Esta tag NFC ainda não está vinculada a um pet.</p>
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

  return (
    <div style={{ background: "#F5F5DC", minHeight: "100vh" }}>
      <main className="max-w-md mx-auto p-4 space-y-4">
        <div className="text-center pt-4">
          <h1 className="text-3xl font-extrabold" style={{ color: "#8B5CF6" }}>🐕 PET PERDIDO</h1>
          <p className="text-base text-gray-700 mt-1">Ajude esse pet a voltar pra casa ❤️</p>
        </div>

        <div className="flex justify-center">
          {pet.foto_url ? (
            <img
              src={pet.foto_url}
              alt={pet.nome_pet}
              className="w-56 h-56 rounded-full object-cover ring-4"
              style={{ borderColor: "#8B5CF6", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
            />
          ) : (
            <div className="w-56 h-56 rounded-full bg-white flex items-center justify-center ring-4" style={{ borderColor: "#8B5CF6" }}>
              <PawPrint className="w-24 h-24 text-gray-400" />
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow space-y-2 text-center">
          <p className="text-lg"><span className="font-semibold">Nome:</span> {pet.nome_pet}</p>
          <p className="text-lg"><span className="font-semibold">Dono:</span> {pet.nome_dono}</p>
          <p className="text-lg"><span className="font-semibold">Telefone:</span> {pet.telefone}</p>
        </div>

        <div className="bg-yellow-100 border border-yellow-300 rounded-2xl p-4 text-center">
          <p className="text-sm font-medium text-yellow-900">
            ⚠️ Esse pet pode estar perdido. Sua ajuda é muito importante!
          </p>
        </div>

        <button
          onClick={enviarWhatsApp}
          className="w-full text-white font-bold py-4 rounded-2xl text-base shadow active:scale-95 transition"
          style={{ background: "#25D366" }}
        >
          📲 Avisar no WhatsApp
        </button>

        <button
          onClick={ligar}
          className="w-full text-white font-bold py-4 rounded-2xl text-base shadow active:scale-95 transition"
          style={{ background: "#8B5CF6" }}
        >
          📞 Ligar agora
        </button>

        <div className="text-center text-sm font-medium" style={{ color: statusColor, marginTop: 10 }}>
          {statusLocal}
        </div>

        {coords && (
          <iframe
            title="Mapa"
            width="100%"
            height={250}
            style={{ border: 0, borderRadius: 12, marginTop: 10 }}
            src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`}
          />
        )}

        <p className="text-center text-xs text-gray-500 pt-4 pb-6">
          Powered by Pet_ID 🐾
        </p>
      </main>
    </div>
  );
};

export default PetPublic;
