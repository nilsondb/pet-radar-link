import { useEffect, useState } from "react";
import { VetLayout } from "@/components/VetLayout";
import { getVetSession } from "@/lib/vetAuth";
import { fetchPacientes, type PacienteVinculo } from "@/lib/vetData";
import { supabase } from "@/integrations/supabase/client";
import { logPetEvento } from "@/lib/petEventos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Syringe, Bug } from "lucide-react";
import { toast } from "sonner";

const addMeses = (data: string, meses: number) => {
  const d = new Date(`${data}T00:00:00`);
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().slice(0, 10);
};

type Registro = {
  id: string;
  pet_id: string;
  tipo: "vacina" | "vermifugo";
  nome: string;
  data_aplicacao: string;
  proxima_data: string | null;
  pet_nome?: string | null;
};

const VetVacinacao = () => {
  const session = getVetSession();
  const [pacientes, setPacientes] = useState<PacienteVinculo[]>([]);
  const [itens, setItens] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    pet_id: "", tipo: "vacina" as "vacina" | "vermifugo", nome: "", data_aplicacao: "", observacoes: "",
  });

  const carregar = async (ids?: string[]) => {
    const alvo = ids ?? pacientes.map((p) => p.pet_id);
    if (alvo.length === 0) {
      setItens([]);
      setLoading(false);
      return;
    }

    const [{ data: vacinas, error: erroVacinas }, { data: vermifugacoes, error: erroVermifugacoes }] = await Promise.all([
      supabase
        .from("vacinas")
        .select("id, pet_id, nome_vacina, data_aplicacao, proxima_data, pet:pets(nome)")
        .in("pet_id", alvo)
        .order("data_aplicacao", { ascending: false }),
      supabase
        .from("vermifugacoes")
        .select("id, pet_id, produto, data_aplicacao, proxima_data, pet:pets(nome)")
        .in("pet_id", alvo)
        .order("data_aplicacao", { ascending: false }),
    ]);

    if (erroVacinas) toast.error(erroVacinas.message);
    if (erroVermifugacoes) toast.error(erroVermifugacoes.message);

    const normalizadas: Registro[] = [
      ...(vacinas || []).map((v: any) => ({
        id: v.id,
        pet_id: v.pet_id,
        tipo: "vacina" as const,
        nome: v.nome_vacina,
        data_aplicacao: v.data_aplicacao,
        proxima_data: v.proxima_data,
        pet_nome: v.pet?.nome,
      })),
      ...(vermifugacoes || []).map((v: any) => ({
        id: v.id,
        pet_id: v.pet_id,
        tipo: "vermifugo" as const,
        nome: v.produto,
        data_aplicacao: v.data_aplicacao,
        proxima_data: v.proxima_data,
        pet_nome: v.pet?.nome,
      })),
    ].sort((a, b) => (b.data_aplicacao || "").localeCompare(a.data_aplicacao || ""));

    setItens(normalizadas);
    setLoading(false);
  };

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    (async () => {
      const list = await fetchPacientes(session.id, "active");
      setPacientes(list);
      await carregar(list.map((p) => p.pet_id));
    })();
  }, [session?.id]);

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !form.pet_id) return toast.error("Selecione o paciente.");
    if (!form.nome.trim()) return toast.error("Informe o nome do produto.");

    setSalvando(true);
    try {
      const aplicacao = form.data_aplicacao || new Date().toISOString().slice(0, 10);
      const proxima = addMeses(aplicacao, form.tipo === "vermifugo" ? 3 : 12);

      if (form.tipo === "vermifugo") {
        const { error } = await supabase.from("vermifugacoes").insert({
          pet_id: form.pet_id,
          produto: form.nome.trim(),
          data_aplicacao: aplicacao,
          proxima_data: proxima,
          observacoes: form.observacoes.trim() || null,
          veterinarian_id: session.id,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("vacinas").insert({
          pet_id: form.pet_id,
          nome_vacina: form.nome.trim(),
          data_aplicacao: aplicacao,
          proxima_data: proxima,
          observacoes: form.observacoes.trim() || null,
          veterinarian_id: session.id,
        });
        if (error) throw error;
      }

      await logPetEvento(
        form.pet_id,
        form.tipo === "vermifugo" ? "vermifugo" : "vacina",
        `${form.tipo === "vermifugo" ? "Vermifugação" : "Vacina"} aplicada`,
        `${form.nome.trim()} — aplicada por ${session.nome}`,
        { proxima_data: proxima }
      );

      toast.success("Registro salvo.");
      setForm({ pet_id: form.pet_id, tipo: form.tipo, nome: "", data_aplicacao: "", observacoes: "" });
      await carregar();
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <VetLayout title="Vacinação e vermifugação">
      <form onSubmit={registrar} className="bg-card border rounded-2xl p-5 space-y-3 max-w-xl mb-6">
        <div>
          <Label>Paciente *</Label>
          <Select value={form.pet_id} onValueChange={(v) => setForm({ ...form, pet_id: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
            <SelectContent>
              {pacientes.map((p) => (
                <SelectItem key={p.pet_id} value={p.pet_id}>{p.pet?.nome_pet || p.pet_id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tipo</Label>
          <Select value={form.tipo} onValueChange={(v: "vacina" | "vermifugo") => setForm({ ...form, tipo: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vacina">Vacina (próxima em 12 meses)</SelectItem>
              <SelectItem value="vermifugo">Vermífugo (próxima em 3 meses)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="v-nome">Nome *</Label>
          <Input id="v-nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="v-data">Data de aplicação</Label>
          <Input id="v-data" type="date" value={form.data_aplicacao} onChange={(e) => setForm({ ...form, data_aplicacao: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="v-obs">Observações</Label>
          <Textarea id="v-obs" rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
        </div>
        <Button type="submit" disabled={salvando}>
          {salvando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Registrar
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : itens.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum registro ainda.</p>
      ) : (
        <div className="space-y-3">
          {itens.map((v) => {
            const Icon = v.tipo === "vermifugo" ? Bug : Syringe;
            return (
              <div key={`${v.tipo}-${v.id}`} className="bg-card border rounded-2xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{v.nome} <span className="text-xs text-muted-foreground">({v.tipo})</span></p>
                  <p className="text-sm text-muted-foreground truncate">
                    {v.pet_nome || v.pet_id} · aplicada {v.data_aplicacao} · próxima {v.proxima_data || "—"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </VetLayout>
  );
};

export default VetVacinacao;
