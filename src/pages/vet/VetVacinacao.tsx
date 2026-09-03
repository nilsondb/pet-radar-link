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
import { Loader2, Syringe } from "lucide-react";
import { toast } from "sonner";

const addMeses = (data: string, meses: number) => {
  const d = new Date(data);
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().slice(0, 10);
};

const VetVacinacao = () => {
  const session = getVetSession();
  const [pacientes, setPacientes] = useState<PacienteVinculo[]>([]);
  const [itens, setItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    pet_id: "", tipo: "vacina", nome_vacina: "", data_aplicacao: "", observacoes: "",
  });

  const carregar = async (ids?: string[]) => {
    const alvo = ids ?? pacientes.map((p) => p.pet_id);
    if (alvo.length === 0) return setLoading(false);
    const { data } = await supabase
      .from("vacinas")
      .select("id, pet_id, nome_vacina, tipo, data_aplicacao, proxima_dose, created_by_role, pet:pets(nome_pet)")
      .in("pet_id", alvo)
      .order("data_aplicacao", { ascending: false });
    setItens(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!session) return;
    (async () => {
      const list = await fetchPacientes(session.id, "active");
      setPacientes(list);
      await carregar(list.map((p) => p.pet_id));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !form.pet_id) return toast.error("Selecione o paciente.");
    setSalvando(true);
    try {
      const aplicacao = form.data_aplicacao || new Date().toISOString().slice(0, 10);
      const proxima = addMeses(aplicacao, form.tipo === "vermifugo" ? 3 : 12);
      const { error } = await supabase.from("vacinas").insert({
        pet_id: form.pet_id,
        tipo: form.tipo,
        nome_vacina: form.nome_vacina,
        data_aplicacao: aplicacao,
        proxima_dose: proxima,
        observacoes: form.observacoes || null,
        veterinarian_id: session.id,
        created_by_role: "veterinario",
      });
      if (error) throw error;
      await logPetEvento(
        form.pet_id,
        form.tipo === "vermifugo" ? "vermifugo" : "vacina",
        `${form.tipo === "vermifugo" ? "Vermifugação" : "Vacina"} aplicada`,
        `${form.nome_vacina} — aplicada por ${session.nome}`
      );
      toast.success("Registro salvo.");
      setForm({ pet_id: form.pet_id, tipo: form.tipo, nome_vacina: "", data_aplicacao: "", observacoes: "" });
      carregar();
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
          <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vacina">Vacina (próxima em 12 meses)</SelectItem>
              <SelectItem value="vermifugo">Vermífugo (próxima em 3 meses)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="v-nome">Nome *</Label>
          <Input id="v-nome" required value={form.nome_vacina} onChange={(e) => setForm({ ...form, nome_vacina: e.target.value })} />
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
          {itens.map((v) => (
            <div key={v.id} className="bg-card border rounded-2xl p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Syringe className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{v.nome_vacina} <span className="text-xs text-muted-foreground">({v.tipo})</span></p>
                <p className="text-sm text-muted-foreground truncate">
                  {v.pet?.nome_pet || v.pet_id} · aplicada {v.data_aplicacao} · próxima {v.proxima_dose || "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </VetLayout>
  );
};

export default VetVacinacao;
