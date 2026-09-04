import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIdFromUrl } from "@/lib/petUtils";
import { PetHeader } from "@/components/PetHeader";
import { PetSidebar } from "@/components/PetSidebar";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Sparkles,
  Syringe,
  Bug,
  Pill,
  FileText,
  MapPin,
  Bot,
  Scale,
  Siren,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

type Evento = {
  id: string;
  pet_id: string;
  tipo_evento: string;
  titulo: string;
  descricao: string | null;
  dados_json: any;
  created_at: string;
};

type Resumo = {
  id: string;
  resumo: string;
  score_saude: "verde" | "amarelo" | "vermelho";
  alertas: string[];
  recomendacoes: string[];
  created_at: string;
};

const ICONES: Record<string, any> = {
  vacina: Syringe,
  vermifugo: Bug,
  medicamento: Pill,
  exame: FileText,
  localizacao: MapPin,
  consulta_ia: Bot,
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
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [analisando, setAnalisando] = useState(false);

  const load = async () => {
    if (!id) return;
    const [petR, evR, resR] = await Promise.all([
      supabase.from("pets").select("*").eq("id", id).maybeSingle(),
      supabase.from("pet_eventos").select("*").eq("pet_id", id).order("created_at", { ascending: false }).limit(100),
      supabase.from("pet_resumos_ia").select("*").eq("pet_id", id).order("created_at", { ascending: false }).limit(1),
    ]);
    if (!petR.data) {
      navigate(`/setup?id=${id}`, { replace: true });
      return;
    }
    setPet(petR.data);
    const evs = (evR.data as Evento[]) || [];
    setEventos(evs);

    const pesoEvts = evs
      .filter((e) => e.tipo_evento === "peso" && e.dados_json?.peso)
      .map((e) => ({
        data: new Date(e.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        peso: Number(e.dados_json.peso),
      }))
      .reverse();
    if (petR.data.peso && pesoEvts.length === 0) {
      pesoEvts.push({ data: "Atual", peso: Number(petR.data.peso) });
    }
    setPesos(pesoEvts);

    const r = resR.data?.[0];
    if (r) {
      setResumo({
        id: r.id,
        resumo: r.resumo,
        score_saude: (r.score_saude as any) || "verde",
        alertas: Array.isArray(r.alertas) ? (r.alertas as string[]) : [],
        recomendacoes: Array.isArray(r.recomendacoes) ? (r.recomendacoes as string[]) : [],
        created_at: r.created_at,
      });
    }
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

  const gerarAnalise = async () => {
    if (!id) return;
    setAnalisando(true);
    try {
      const { data, error } = await supabase.functions.invoke("ia-resumo-pet", {
        body: { pet_id: id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Análise gerada ✨");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar análise");
    } finally {
      setAnalisando(false);
    }
  };

  const proximosCuidados = useMemo(() => {
    // próximas vacinas dos eventos ou dados_json
    const items: { titulo: string; data: string }[] = [];
    eventos
      .filter((e) => (e.tipo_evento === "vacina" || e.tipo_evento === "vermifugo") && e.dados_json?.proxima_dose)
      .forEach((e) => {
        items.push({
          titulo: `${e.tipo_evento === "vacina" ? "💉" : "🪱"} ${e.titulo}`,
          data: e.dados_json.proxima_dose,
        });
      });
    return items
      .sort((a, b) => a.data.localeCompare(b.data))
      .slice(0, 3);
  }, [eventos]);

  if (loading || !pet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const scoreClass = (s?: string) =>
    s === "vermelho"
      ? "bg-destructive/15 text-destructive border-destructive/40"
      : s === "amarelo"
      ? "bg-warning/20 text-warning-foreground border-warning/40"
      : "bg-success/15 text-success border-success/40";

  const scoreLabel = (s?: string) =>
    s === "vermelho" ? "🔴 Requer cuidados" : s === "amarelo" ? "🟡 Atenção" : "🟢 Saudável";

  return (
    <div className="min-h-screen">
      <PetSidebar id={id!} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <PetHeader title="Histórico Inteligente" onMenuClick={() => setMenuOpen(true)} />

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Score + ação */}
        <div className="pet-card space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Score de saúde
            </h2>
            <Button onClick={gerarAnalise} disabled={analisando} size="sm" variant="outline">
              {analisando ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Analisando...</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-1" /> {resumo ? "Atualizar" : "Gerar análise"}</>
              )}
            </Button>
          </div>

          <div className={cn("rounded-2xl border-2 px-4 py-3 text-center font-bold text-lg", scoreClass(resumo?.score_saude))}>
            {scoreLabel(resumo?.score_saude)}
          </div>

          {resumo ? (
            <>
              <div className="text-sm leading-relaxed whitespace-pre-line">{resumo.resumo}</div>
              {resumo.alertas?.length > 0 && (
                <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3">
                  <p className="font-semibold text-destructive flex items-center gap-1.5 text-sm mb-2">
                    <AlertTriangle className="w-4 h-4" /> Alertas
                  </p>
                  <ul className="space-y-1 text-sm">
                    {resumo.alertas.map((a, i) => (
                      <li key={i} className="flex gap-2"><span>•</span><span>{a}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {resumo.recomendacoes?.length > 0 && (
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
                  <p className="font-semibold text-primary flex items-center gap-1.5 text-sm mb-2">
                    <CheckCircle2 className="w-4 h-4" /> Recomendações
                  </p>
                  <ul className="space-y-1 text-sm">
                    {resumo.recomendacoes.map((r, i) => (
                      <li key={i} className="flex gap-2"><span>•</span><span>{r}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-muted-foreground text-right">
                Gerado em {new Date(resumo.created_at).toLocaleString("pt-BR")}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              Toque em "Gerar análise" para criar o resumo inteligente do seu pet.
            </p>
          )}
        </div>

        {/* Próximos cuidados */}
        {proximosCuidados.length > 0 && (
          <div className="pet-card space-y-2">
            <h3 className="font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Próximos cuidados
            </h3>
            <ul className="space-y-2">
              {proximosCuidados.map((p, i) => (
                <li key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                  <span>{p.titulo}</span>
                  <span className="text-muted-foreground">
                    {new Date(p.data + "T00:00:00").toLocaleDateString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Gráfico de peso */}
        {pesos.length > 0 && (
          <div className="pet-card">
            <h3 className="font-bold flex items-center gap-2 mb-3">
              <Scale className="w-5 h-5 text-primary" /> Evolução do peso
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pesos} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="data" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RTooltip />
                  <Line type="monotone" dataKey="peso" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Localização */}
        {pet.ultima_latitude && pet.ultima_longitude && (
          <div className="pet-card space-y-2">
            <h3 className="font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Última localização
            </h3>
            <div className="rounded-2xl overflow-hidden border border-border">
              <iframe
                title="Mapa"
                src={`https://maps.google.com/maps?q=${pet.ultima_latitude},${pet.ultima_longitude}&z=16&output=embed`}
                width="100%"
                height="200"
                style={{ border: 0 }}
                loading="lazy"
              />
            </div>
            {pet.ultima_leitura && (
              <p className="text-xs text-muted-foreground">
                {new Date(pet.ultima_leitura).toLocaleString("pt-BR")}
              </p>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="pet-card">
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" /> Timeline
          </h3>
          {eventos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum evento registrado ainda. Comece a usar o app para popular o histórico.
            </p>
          ) : (
            <ol className="relative border-l-2 border-primary/20 ml-3 space-y-5">
              {eventos.map((ev) => {
                const Icon = ICONES[ev.tipo_evento] || Sparkles;
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
          ⚠️ Este assistente não substitui um veterinário.
        </p>
      </main>
    </div>
  );
};

export default HistoricoInteligente;
