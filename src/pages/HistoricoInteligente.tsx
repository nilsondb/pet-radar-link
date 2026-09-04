import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIdFromUrl } from "@/lib/petUtils";
import { PetHeader } from "@/components/PetHeader";
import { PetSidebar } from "@/components/PetSidebar";
import { Loader2, Syringe, Bug, Pill, FileText, MapPin, Scale, Siren, Calendar, History } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Evento = {
  id: string;
  pet_id: string;
  tipo_evento: string;
  titulo: string;
  descricao: string | null;
  dados_json: any;
  created_at: string;
};

type Cuidado = { titulo: string; data: string };
type Localizacao = { latitude: number; longitude: number; endereco: string | null; data_leitura: string };

const ICONES: Record<string, any> = {
  vacina: Syringe,
  vermifugo: Bug,
  medicamento: Pill,
  exame: FileText,
  localizacao: MapPin,
  peso: Scale,
  status_pet: Siren,
};

const HistoricoInteligente = () => {
  const id = useIdFromUrl();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pet, setPet] = useState<any>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [pesos, setPesos] = useState<{ data: string; peso: number }[]>([]);
  const [cuidados, setCuidados] = useState<Cuidado[]>([]);
  const [localizacao, setLocalizacao] = useState<Localizacao | null>(null);

  const load = async () => {
    if (!id) return;

    setLoading(true);

    const [petR, evR, vacR, vermR, locR] = await Promise.all([
      supabase
        .from("pets")
        .select("id,nome,peso_kg,status_perdido")
        .eq("id", id)
        .eq("ativo", true)
        .maybeSingle(),
      supabase
        .from("pet_eventos")
        .select("*")
        .eq("pet_id", id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("vacinas")
        .select("nome_vacina,proxima_data")
        .eq("pet_id", id)
        .not("proxima_data", "is", null),
      supabase
        .from("vermifugacoes")
        .select("produto,proxima_data")
        .eq("pet_id", id)
        .not("proxima_data", "is", null),
      supabase
        .from("pet_localizacoes")
        .select("latitude,longitude,endereco,data_leitura")
        .eq("pet_id", id)
        .order("data_leitura", { ascending: false })
        .limit(1),
    ]);

    if (!petR.data) {
      navigate("/meus-pets", { replace: true });
      return;
    }

    setPet(petR.data);

    const evs = (evR.data as Evento[]) || [];
    setEventos(evs);

    const pesoEvts = evs
      .filter(
        (e) =>
          e.tipo_evento === "peso" &&
          (e.dados_json?.peso_kg ?? e.dados_json?.peso)
      )
      .map((e) => ({
        data: new Date(e.created_at).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        peso: Number(e.dados_json?.peso_kg ?? e.dados_json?.peso),
      }))
      .reverse();

    if (petR.data.peso_kg && pesoEvts.length === 0) {
      pesoEvts.push({ data: "Atual", peso: Number(petR.data.peso_kg) });
    }

    setPesos(pesoEvts);

    const lista: Cuidado[] = [
      ...((vacR.data || []).map((v: any) => ({
        titulo: `💉 ${v.nome_vacina}`,
        data: v.proxima_data,
      }))),
      ...((vermR.data || []).map((v: any) => ({
        titulo: `🪱 ${v.produto}`,
        data: v.proxima_data,
      }))),
    ]
      .filter((c) => c.data)
      .sort((a, b) => a.data.localeCompare(b.data))
      .slice(0, 5);

    setCuidados(lista);
    setLocalizacao((locR.data?.[0] as Localizacao) || null);
    setLoading(false);
  };

  useEffect(() => {
    if (!id) {
      navigate("/meus-pets", { replace: true });
      return;
    }

    load();
  }, [id]);

  const proximosCuidados = useMemo(() => cuidados, [cuidados]);

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
      <PetHeader title="Histórico do Pet" onMenuClick={() => setMenuOpen(true)} />

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="pet-card space-y-2">
          <h2 className="font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Histórico de {pet.nome}
          </h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe registros de saúde, cuidados, peso, localização e mudanças de status do seu pet.
          </p>
        </div>

        {proximosCuidados.length > 0 && (
          <div className="pet-card space-y-2">
            <h3 className="font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Próximos cuidados
            </h3>
            <ul className="space-y-2">
              {proximosCuidados.map((p, i) => (
                <li
                  key={`${p.titulo}-${p.data}-${i}`}
                  className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50"
                >
                  <span>{p.titulo}</span>
                  <span className="text-muted-foreground">
                    {new Date(p.data + "T00:00:00").toLocaleDateString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {pesos.length > 0 && (
          <div className="pet-card">
            <h3 className="font-bold flex items-center gap-2 mb-3">
              <Scale className="w-5 h-5 text-primary" />
              Evolução do peso
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pesos} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="data" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RTooltip />
                  <Line
                    type="monotone"
                    dataKey="peso"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {localizacao && (
          <div className="pet-card space-y-2">
            <h3 className="font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Última localização
            </h3>
            <div className="rounded-2xl overflow-hidden border border-border">
              <iframe
                title="Mapa"
                src={`https://maps.google.com/maps?q=${localizacao.latitude},${localizacao.longitude}&z=16&output=embed`}
                width="100%"
                height="200"
                style={{ border: 0 }}
                loading="lazy"
              />
            </div>
            {localizacao.endereco && (
              <p className="text-sm text-muted-foreground">{localizacao.endereco}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {new Date(localizacao.data_leitura).toLocaleString("pt-BR")}
            </p>
          </div>
        )}

        <div className="pet-card">
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-primary" />
            Timeline
          </h3>

          {eventos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum evento registrado ainda. Os acontecimentos do pet aparecerão aqui conforme o app for usado.
            </p>
          ) : (
            <ol className="relative border-l-2 border-primary/20 ml-3 space-y-5">
              {eventos.map((ev) => {
                const Icon = ICONES[ev.tipo_evento] || History;

                return (
                  <li key={ev.id} className="ml-6">
                    <span className="absolute -left-[14px] flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground ring-4 ring-background">
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <div className="rounded-xl bg-muted/40 p-3">
                      <p className="font-semibold text-sm">{ev.titulo}</p>
                      {ev.descricao && (
                        <p className="text-xs text-muted-foreground mt-0.5">{ev.descricao}</p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {new Date(ev.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center px-2">
          Este histórico organiza os registros do pet e não substitui avaliação profissional de médico-veterinário.
        </p>
      </main>
    </div>
  );
};

export default HistoricoInteligente;
