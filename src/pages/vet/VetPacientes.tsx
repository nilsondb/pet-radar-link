import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { VetLayout } from "@/components/VetLayout";
import { getVetSession } from "@/lib/vetAuth";
import {
  buscarPetPorTag, criarPacienteSemTag, fetchPacientes, solicitarAcesso, solicitarTag,
  type PacienteVinculo, type PetPorTag,
} from "@/lib/vetData";
import { calcularIdade } from "@/lib/petUtils";
import { logPetEvento } from "@/lib/petEventos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Dog, Loader2, Plus, Search, ShieldCheck, Siren, Clock, Nfc, Lock } from "lucide-react";
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
  const [buscaTag, setBuscaTag] = useState("");
  const [encontrado, setEncontrado] = useState<PetPorTag | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [novoOpen, setNovoOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    nome: "", especie: "", raca: "", sexo: "", data_nascimento: "", peso_kg: "",
    observacoes: "", tutor_nome: "", tutor_telefone: "", tutor_email: "",
  });

  const carregar = async () => {
    if (!session) return;
    setLista(await fetchPacientes(session.id));
    setLoading(false);
  };

  useEffect(() => {
    carregar();
  }, [session?.id]);

  const buscarPet = async () => {
    const alvo = buscaTag.trim();
    if (!alvo) return;
    setBuscando(true);
    setEncontrado(null);
    try {
      const pet = await buscarPetPorTag(alvo);
      if (!pet) {
        toast.error("Nenhum pet encontrado para esta TAG.");
        return;
      }
      setEncontrado(pet);
    } catch (e: any) {
      toast.error(e.message || "Não foi possível consultar a TAG.");
    } finally {
      setBuscando(false);
    }
  };

  const pedirAcesso = async () => {
    if (!session || !encontrado) return;
    try {
      const r = await solicitarAcesso(encontrado.pet_id, session.id);
      toast.success(
        r.status === "active"
          ? "Você já possui acesso autorizado a este pet."
          : "Solicitação enviada. O tutor precisa autorizar o acesso."
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
      await criarPacienteSemTag(form);
      toast.success("Paciente cadastrado sem TAG. O tutor poderá vincular a conta depois. 🐾");
      setNovoOpen(false);
      setForm({
        nome: "", especie: "", raca: "", sexo: "", data_nascimento: "", peso_kg: "",
        observacoes: "", tutor_nome: "", tutor_telefone: "", tutor_email: "",
      });
      carregar();
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar paciente");
    } finally {
      setSalvando(false);
    }
  };

  const pedirTag = async (petId: string, nome: string) => {
    if (!session) return;
    try {
      await solicitarTag(petId, session.id);
      await logPetEvento(petId, "status_pet", "TAG solicitada", `${session.nome} solicitou uma TAG para ${nome}.`);
      toast.success("Solicitação de TAG registrada. O administrador vai preparar a TAG e o tutor receberá o link de ativação.");
    } catch (e: any) {
      toast.error(e.message || "Não foi possível solicitar a TAG");
    }
  };

  const filtrados = lista.filter((v) => {
    const t = busca.toLowerCase();
    return (
      !t ||
      (v.pet?.nome || "").toLowerCase().includes(t) ||
      (v.pet?.tutor_nome || "").toLowerCase().includes(t) ||
      v.pet_id.toLowerCase().includes(t)
    );
  });

  return (
    <VetLayout title="Meus Pacientes">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por pet, tutor ou identificação" value={busca}
            onChange={(e) => setBusca(e.target.value)} />
        </div>
        <Button onClick={() => setNovoOpen(true)}><Plus className="w-4 h-4 mr-1" /> Novo Paciente</Button>
      </div>

      <div className="bg-card border rounded-2xl p-5 mb-5">
        <h3 className="font-bold mb-1 flex items-center gap-2"><Nfc className="w-4 h-4 text-primary" /> Buscar pet por TAG</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Informe o identificador público da TAG. Os dados clínicos só ficam disponíveis após a autorização do tutor.
        </p>
        <div className="flex gap-2">
          <Input placeholder="Identificação da TAG" value={buscaTag} onChange={(e) => setBuscaTag(e.target.value)} />
          <Button variant="outline" onClick={buscarPet} disabled={buscando}>
            {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
        {encontrado && (
          <div className="mt-4 p-4 rounded-xl bg-muted flex flex-col sm:flex-row sm:items-center gap-3">
            {encontrado.foto ? (
              <img src={encontrado.foto} alt={`Foto de ${encontrado.nome || "pet"}`}
                className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center">
                <Dog className="w-7 h-7 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-bold">{encontrado.nome || encontrado.pet_id}</p>
              <p className="text-xs text-muted-foreground">
                {encontrado.especie || "—"} · {encontrado.raca || "—"} · TAG {encontrado.tag_uid}
              </p>
              <p className="text-xs text-muted-foreground">Tutor: {encontrado.tutor_nome || "—"}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Lock className="w-3 h-3" /> Prontuário protegido até a autorização do tutor
              </p>
            </div>
            {encontrado.vinculo_status === "active" ? (
              <Button asChild><Link to={`/vet/prontuario/${encontrado.pet_id}`}>Abrir prontuário</Link></Button>
            ) : encontrado.vinculo_status === "pending" ? (
              <Button variant="outline" disabled>Aguardando autorização</Button>
            ) : (
              <Button onClick={pedirAcesso}>SOLICITAR ACESSO</Button>
            )}
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
              {v.pet?.foto ? (
                <img src={v.pet.foto} alt={`Foto de ${v.pet?.nome || "pet"}`}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/20" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <Dog className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <h3 className="font-bold">{v.pet?.nome || v.pet_id}</h3>
                <p className="text-xs text-muted-foreground">Tutor: {v.pet?.tutor_nome || "—"}</p>
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
                <div className="w-full space-y-2">
                  <Button asChild className="w-full"><Link to={`/vet/prontuario/${v.pet_id}`}>Abrir prontuário</Link></Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => pedirTag(v.pet_id, v.pet?.nome || v.pet_id)}
                  >
                    <Nfc className="w-4 h-4 mr-1" /> SOLICITAR TAG
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full" disabled>Aguardando autorização</Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
        <DialogContent className="bg-background max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo paciente (sem TAG)</DialogTitle>
            <DialogDescription>
              O responsável já existente é reaproveitado pelo telefone ou e-mail. Nenhuma conta de acesso é criada: o tutor vincula a conta depois.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={criarPaciente} className="space-y-3">
            <div className="pb-2 border-b">
              <p className="text-sm font-medium mb-2">1. Responsável</p>
              <div className="space-y-3">
                <Input placeholder="Nome do responsável *" required value={form.tutor_nome}
                  onChange={(e) => setForm({ ...form, tutor_nome: e.target.value })} />
                <Input placeholder="Telefone *" required value={form.tutor_telefone}
                  onChange={(e) => setForm({ ...form, tutor_telefone: e.target.value })} />
                <Input placeholder="E-mail" type="email" value={form.tutor_email}
                  onChange={(e) => setForm({ ...form, tutor_email: e.target.value })} />
              </div>
            </div>
            <p className="text-sm font-medium">2. Pet</p>
            <div>
              <Label htmlFor="p-nome">Nome do pet *</Label>
              <Input id="p-nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
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
                <Input id="p-peso" type="number" step="0.1" value={form.peso_kg} onChange={(e) => setForm({ ...form, peso_kg: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="p-nasc">Data de nascimento</Label>
              <Input id="p-nasc" type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="p-obs">Observações básicas</Label>
              <Input id="p-obs" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
            </div>
            <Button type="submit" className="w-full" disabled={salvando}>
              {salvando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Cadastrar paciente
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </VetLayout>
  );
};

export default VetPacientes;
