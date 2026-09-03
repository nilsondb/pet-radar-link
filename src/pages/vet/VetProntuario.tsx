import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { VetLayout } from "@/components/VetLayout";
import { getVetSession } from "@/lib/vetAuth";
import { temAcessoAtivo } from "@/lib/vetData";
import { supabase } from "@/integrations/supabase/client";
import { calcularIdade } from "@/lib/petUtils";
import { abrirExame } from "@/lib/exames";
import { logPetEvento } from "@/lib/petEventos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dog, Loader2, ShieldAlert, Plus } from "lucide-react";
import { toast } from "sonner";

const VetProntuario = () => {
  const { petId } = useParams();
  const session = getVetSession();
  const [loading, setLoading] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [pet, setPet] = useState<any>(null);
  const [atendimentos, setAtendimentos] = useState<any[]>([]);
  const [registros, setRegistros] = useState<any[]>([]);
  const [vacinas, setVacinas] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [exames, setExames] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [novo, setNovo] = useState({ data_atendimento: "", motivo: "", anamnese: "", observacoes: "" });

  const carregar = async () => {
    if (!petId || !session) return;
    const acesso = await temAcessoAtivo(petId, session.id);
    setAutorizado(acesso.ok);
    if (!acesso.ok) {
      setLoading(false);
      return;
    }
    const [p, a, r, v, m, e] = await Promise.all([
      supabase.from("pets").select("*").eq("id", petId).maybeSingle(),
      supabase.from("atendimentos_veterinarios").select("*").eq("pet_id", petId).order("data_atendimento", { ascending: false }),
      supabase.from("registros_clinicos").select("*").eq("pet_id", petId).order("created_at", { ascending: false }),
      supabase.from("vacinas").select("*").eq("pet_id", petId).order("data_aplicacao", { ascending: false }),
      supabase.from("medicamentos").select("*").eq("pet_id", petId).order("created_at", { ascending: false }),
      supabase.from("exames").select("*").eq("pet_id", petId).order("created_at", { ascending: false }),
    ]);
    setPet(p.data);
    setAtendimentos(a.data || []);
    setRegistros(r.data || []);
    setVacinas(v.data || []);
    setMedicamentos(m.data || []);
    setExames(e.data || []);
    setLoading(false);
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  const registrarAtendimento = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!petId || !session) return;
    setSalvando(true);
    try {
      const { data, error } = await supabase
        .from("atendimentos_veterinarios")
        .insert({
          pet_id: petId,
          veterinarian_id: session.id,
          data_atendimento: novo.data_atendimento || new Date().toISOString(),
          motivo: novo.motivo || null,
          anamnese: novo.anamnese || null,
          observacoes: novo.observacoes || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      await supabase.from("registros_clinicos").insert({
        pet_id: petId,
        veterinarian_id: session.id,
        atendimento_id: data.id,
        tipo: "atendimento",
        titulo: novo.motivo || "Atendimento veterinário",
        descricao: novo.anamnese || null,
      });
      await logPetEvento(
        petId, "status_pet", "Atendimento veterinário realizado",
        `${novo.motivo || "Consulta"} — registrado por ${session.nome}`,
        null
      );
      toast.success("Atendimento registrado.");
      setNovo({ data_atendimento: "", motivo: "", anamnese: "", observacoes: "" });
      carregar();
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar");
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <VetLayout title="Prontuário">
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      </VetLayout>
    );
  }

  if (!autorizado) {
    return (
      <VetLayout title="Prontuário">
        <div className="bg-card border rounded-2xl p-8 text-center max-w-md mx-auto">
          <ShieldAlert className="w-10 h-10 mx-auto text-destructive mb-3" />
          <h3 className="font-bold mb-1">Acesso não autorizado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            O tutor precisa autorizar seu acesso a este pet antes de você visualizar o prontuário.
          </p>
          <Button asChild variant="outline"><Link to="/vet/pacientes">Voltar aos pacientes</Link></Button>
        </div>
      </VetLayout>
    );
  }

  return (
    <VetLayout title={`Prontuário · ${pet?.nome_pet || petId}`}>
      <div className="bg-card border rounded-2xl p-5 flex items-center gap-4 mb-5">
        {pet?.foto_url ? (
          <img src={pet.foto_url} alt={`Foto de ${pet?.nome_pet || "pet"}`} className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Dog className="w-7 h-7 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-bold text-lg">{pet?.nome_pet || petId}</h3>
          <p className="text-sm text-muted-foreground">
            {pet?.especie || "—"} · {pet?.raca || "—"} · {pet?.sexo || "—"} · {calcularIdade(pet?.data_nascimento)} · {pet?.peso ? `${pet.peso} kg` : "peso —"}
          </p>
          <p className="text-xs text-muted-foreground">Tutor: {pet?.nome_dono || "—"}</p>
        </div>
      </div>

      <Tabs defaultValue="atendimentos">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="atendimentos">Atendimentos</TabsTrigger>
          <TabsTrigger value="novo"><Plus className="w-3 h-3 mr-1" /> Novo</TabsTrigger>
          <TabsTrigger value="clinicos">Registros clínicos</TabsTrigger>
          <TabsTrigger value="vacinas">Vacinação</TabsTrigger>
          <TabsTrigger value="medicamentos">Medicamentos</TabsTrigger>
          <TabsTrigger value="exames">Exames</TabsTrigger>
        </TabsList>

        <TabsContent value="atendimentos" className="space-y-3 mt-4">
          {atendimentos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum atendimento registrado.</p>}
          {atendimentos.map((a) => (
            <div key={a.id} className="bg-card border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground">{new Date(a.data_atendimento).toLocaleString("pt-BR")}</p>
              <p className="font-medium">{a.motivo || "Atendimento"}</p>
              {a.anamnese && <p className="text-sm mt-1">{a.anamnese}</p>}
              {a.observacoes && <p className="text-sm text-muted-foreground mt-1">{a.observacoes}</p>}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="novo" className="mt-4">
          <form onSubmit={registrarAtendimento} className="bg-card border rounded-2xl p-5 space-y-3 max-w-xl">
            <div>
              <Label htmlFor="a-data">Data do atendimento</Label>
              <Input id="a-data" type="datetime-local" value={novo.data_atendimento}
                onChange={(e) => setNovo({ ...novo, data_atendimento: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="a-motivo">Motivo *</Label>
              <Input id="a-motivo" required value={novo.motivo} onChange={(e) => setNovo({ ...novo, motivo: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="a-anamnese">Anamnese</Label>
              <Textarea id="a-anamnese" rows={4} value={novo.anamnese} onChange={(e) => setNovo({ ...novo, anamnese: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="a-obs">Observações</Label>
              <Textarea id="a-obs" rows={3} value={novo.observacoes} onChange={(e) => setNovo({ ...novo, observacoes: e.target.value })} />
            </div>
            <Button type="submit" disabled={salvando}>
              {salvando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Registrar atendimento
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="clinicos" className="space-y-3 mt-4">
          {registros.length === 0 && <p className="text-sm text-muted-foreground">Nenhum registro clínico.</p>}
          {registros.map((r) => (
            <div key={r.id} className="bg-card border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleString("pt-BR")} · {r.tipo}
              </p>
              <p className="font-medium">{r.titulo}</p>
              {r.descricao && <p className="text-sm mt-1">{r.descricao}</p>}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="vacinas" className="space-y-3 mt-4">
          {vacinas.length === 0 && <p className="text-sm text-muted-foreground">Nenhum registro.</p>}
          {vacinas.map((v) => (
            <div key={v.id} className="bg-card border rounded-2xl p-4">
              <p className="font-medium">{v.nome_vacina} <span className="text-xs text-muted-foreground">({v.tipo})</span></p>
              <p className="text-sm text-muted-foreground">
                Aplicação: {v.data_aplicacao} · Próxima: {v.proxima_dose || "—"} · por {v.created_by_role || "tutor"}
              </p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="medicamentos" className="space-y-3 mt-4">
          {medicamentos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum medicamento.</p>}
          {medicamentos.map((m) => {
            const finalizado = m.data_fim && new Date(m.data_fim) < new Date();
            return (
              <div key={m.id} className="bg-card border rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{m.nome_medicamento}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${finalizado ? "bg-muted text-muted-foreground" : "bg-success/15 text-success"}`}>
                    {finalizado ? "Finalizado" : "Em uso"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {m.dosagem || "—"} · {m.frequencia || "—"} · {m.horario || "—"}
                </p>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="exames" className="space-y-3 mt-4">
          {exames.length === 0 && <p className="text-sm text-muted-foreground">Nenhum exame enviado.</p>}
          {exames.map((e) => (
            <div key={e.id} className="bg-card border rounded-2xl p-4">
              <p className="font-medium">{e.nome_exame}</p>
              <p className="text-sm text-muted-foreground">
                {e.data_exame || "—"} · enviado por {e.created_by_role || "tutor"}
              </p>
              {e.arquivo_url && (
                <button
                  type="button"
                  onClick={() => abrirExame(e.arquivo_url).catch(() => toast.error("Não foi possível abrir o arquivo"))}
                  className="text-sm text-primary font-medium"
                >
                  Abrir arquivo
                </button>
              )}
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </VetLayout>
  );
};

export default VetProntuario;
