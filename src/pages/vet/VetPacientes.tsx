import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { VetLayout } from "@/components/VetLayout";
import { getVetSession } from "@/lib/vetAuth";
import { fetchPacientes, solicitarAcesso, type PacienteVinculo } from "@/lib/vetData";
import { calcularIdade } from "@/lib/petUtils";
import { ensureTutor } from "@/lib/tutorUtils";
import { logPetEvento } from "@/lib/petEventos";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Dog, Loader2, Plus, Search, ShieldCheck, Siren, Clock } from "lucide-react";
import { toast } from "sonner";

const statusLabel: Record<string, string> = {
  active: "Autorizado",
  pending: "Aguardando tutor",
  revoked: "Acesso revogado",
};

const VetPacientes = () => {
  const session = getVetSession();
  const [loading, setLoading] = useState(true);
  const [lista, setLista] = useState<PacienteVinculo[]>([]);
  const [busca, setBusca] = useState("");

  // buscar pet existente
  const [buscaTag, setBuscaTag] = useState("");
  const [encontrado, setEncontrado] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);

  // novo paciente
  const [novoOpen, setNovoOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    nome_pet: "", especie: "", raca: "", sexo: "", data_nascimento: "", peso: "",
    tutor_nome: "", tutor_telefone: "", tutor_email: "",
  });

  const carregar = async () => {
    if (!session) return;
    setLista(await fetchPacientes(session.id));
    setLoading(false);
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buscarPet = async () => {
    const alvo = buscaTag.trim();
    if (!alvo) return;
    setBuscando(true);
    setEncontrado(null);
    try {
      const { data } = await supabase
        .from("pets")
        .select("id, nome_pet, foto_url, raca, especie, data_nascimento, status_ativado, nome_dono")
        .eq("id", alvo.toUpperCase())
        .maybeSingle();
      if (!data) return toast.error("Nenhum pet encontrado com este ID de tag.");
      setEncontrado(data);
    } finally {
      setBuscando(false);
    }
  };

  const pedirAcesso = async () => {
    if (!session || !encontrado) return;
    try {
      const r = await solicitarAcesso(encontrado.id, session.id);
      toast.success(
        r.status === "active"
          ? "Você já possui acesso autorizado a este pet."
          : "Solicitação enviada. O tutor precisa autorizar o acesso."
      );
      await logPetEvento(
        encontrado.id, "status_pet",
        "Solicitação de acesso veterinário",
        `${session.nome} solicitou acesso ao prontuário.`
      );
      setEncontrado(null);
      setBuscaTag("");
      carregar();
    } catch (e: any) {
      toast.error(e.message || "Erro ao solicitar acesso");
    }
  };

  const criarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSalvando(true);
    try {
      const tutor_id = await ensureTutor({
        nome: form.tutor_nome,
        telefone: form.tutor_telefone,
        email: form.tutor_email || null,
      });
      const petId = `AP${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const { error } = await supabase.from("pets").insert({
        id: petId,
        nome_pet: form.nome_pet,
        especie: form.especie || null,
        raca: form.raca || null,
        sexo: form.sexo || null,
        data_nascimento: form.data_nascimento || null,
        peso: form.peso ? Number(form.peso) : null,
        nome_dono: form.tutor_nome,
        telefone: form.tutor_telefone,
        tutor_id,
        status_ativado: false,
      });
      if (error) throw error;

      await supabase.from("pet_veterinarians").insert({
        pet_id: petId,
        veterinarian_id: session.id,
        status: "active",
        access_level: "health",
        authorized_at: new Date().toISOString(),
      });
      await logPetEvento(
        petId, "status_pet",
        "Paciente cadastrado pelo veterinário",
        `Cadastro criado por ${session.nome}. O tutor poderá assumir a conta posteriormente.`
      );
      toast.success("Paciente cadastrado! 🐾");
      setNovoOpen(false);
      setForm({
        nome_pet: "", especie: "", raca: "", sexo: "", data_nascimento: "", peso: "",
        tutor_nome: "", tutor_telefone: "", tutor_email: "",
      });
      carregar();
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar paciente");
    } finally {
      setSalvando(false);
    }
  };

  const filtrados = lista.filter((v) => {
    const t = busca.toLowerCase();
    return (
      !t ||
      (v.pet?.nome_pet || "").toLowerCase().includes(t) ||
      (v.pet?.nome_dono || "").toLowerCase().includes(t) ||
      v.pet_id.toLowerCase().includes(t)
    );
  });

  return (
    <VetLayout title="Meus Pacientes">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por pet, tutor ou tag" value={busca}
            onChange={(e) => setBusca(e.target.value)} />
        </div>
        <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> Novo Paciente</Button>
          </DialogTrigger>
          <DialogContent className="bg-background max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo paciente</DialogTitle>
              <DialogDescription>
                O pet será criado no Authera Pet e vinculado a você. O tutor poderá assumir a conta depois.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={criarPaciente} className="space-y-3">
              <div>
                <Label htmlFor="p-nome">Nome do pet *</Label>
                <Input id="p-nome" required value={form.nome_pet} onChange={(e) => setForm({ ...form, nome_pet: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="p-especie">Espécie</Label>
                  <Input id="p-especie" placeholder="Cão / Gato" value={form.especie} onChange={(e) => setForm({ ...form, especie: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="p-raca">Raça</Label>
                  <Input id="p-raca" value={form.raca} onChange={(e) => setForm({ ...form, raca: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="p-sexo">Sexo</Label>
                  <Input id="p-sexo" placeholder="Macho / Fêmea" value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="p-peso">Peso (kg)</Label>
                  <Input id="p-peso" type="number" step="0.1" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} />
                </div>
              </div>
              <div>
                <Label htmlFor="p-nasc">Data de nascimento</Label>
                <Input id="p-nasc" type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2">Tutor</p>
                <div className="space-y-3">
                  <Input placeholder="Nome do tutor *" required value={form.tutor_nome} onChange={(e) => setForm({ ...form, tutor_nome: e.target.value })} />
                  <Input placeholder="Telefone *" required value={form.tutor_telefone} onChange={(e) => setForm({ ...form, tutor_telefone: e.target.value })} />
                  <Input placeholder="E-mail" type="email" value={form.tutor_email} onChange={(e) => setForm({ ...form, tutor_email: e.target.value })} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={salvando}>
                {salvando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Cadastrar paciente
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border rounded-2xl p-5 mb-5">
        <h3 className="font-bold mb-1">Pet já cadastrado no Authera Pet?</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Informe o ID da tag para localizar o pet e solicitar acesso ao prontuário.
        </p>
        <div className="flex gap-2">
          <Input placeholder="ID da tag" value={buscaTag} onChange={(e) => setBuscaTag(e.target.value)} />
          <Button variant="outline" onClick={buscarPet} disabled={buscando}>
            {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
        {encontrado && (
          <div className="mt-4 p-4 rounded-xl bg-muted flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">Este pet já utiliza Authera Pet</p>
              <p className="font-bold">{encontrado.nome_pet || encontrado.id}</p>
              <p className="text-xs text-muted-foreground">
                {encontrado.especie || "—"} · {encontrado.raca || "—"} · {calcularIdade(encontrado.data_nascimento)}
              </p>
            </div>
            <Button onClick={pedirAcesso}>Solicitar acesso veterinário</Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtrados.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum paciente encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((v) => (
            <div key={v.id} className="bg-card border rounded-2xl p-5 flex flex-col items-center text-center gap-3">
              {v.pet?.foto_url ? (
                <img src={v.pet.foto_url} alt={`Foto de ${v.pet?.nome_pet || "pet"}`}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/20" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <Dog className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <h3 className="font-bold">{v.pet?.nome_pet || v.pet_id}</h3>
                <p className="text-xs text-muted-foreground">Tutor: {v.pet?.nome_dono || "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {v.pet?.raca || "—"} · {calcularIdade(v.pet?.data_nascimento ?? null)}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                  v.pet?.status_perdido ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"
                }`}>
                  {v.pet?.status_perdido ? <><Siren className="w-3 h-3" /> Perdido</> : <><ShieldCheck className="w-3 h-3" /> Seguro</>}
                </span>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                  v.status === "active" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {v.status !== "active" && <Clock className="w-3 h-3" />} {statusLabel[v.status]}
                </span>
              </div>
              {v.status === "active" ? (
                <Button asChild className="w-full"><Link to={`/vet/prontuario/${v.pet_id}`}>Abrir prontuário</Link></Button>
              ) : (
                <Button variant="outline" className="w-full" disabled>Aguardando autorização</Button>
              )}
            </div>
          ))}
        </div>
      )}
    </VetLayout>
  );
};

export default VetPacientes;
