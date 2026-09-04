import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { calcularIdade } from "@/lib/petUtils";
import { ativarTagParaPet, fetchMeuTutor, fetchMeusPets, petQuery, type PetResumo, type Tutor } from "@/lib/tutorUtils";
import { PetHeader } from "@/components/PetHeader";
import { PetSidebar } from "@/components/PetSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, PawPrint, Plus, Cake, ShieldCheck, Siren, Nfc } from "lucide-react";
import { toast } from "sonner";

const MeusPets = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pets, setPets] = useState<PetResumo[]>([]);
  const [tutor, setTutor] = useState<Tutor | null>(null);

  const [novaTag, setNovaTag] = useState("");
  const [novoToken, setNovoToken] = useState("");
  const [dialogAberto, setDialogAberto] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const [tagUid, setTagUid] = useState(params.get("tag") || "");
  const [tagCodigo, setTagCodigo] = useState(params.get("codigo") || "");
  const [petSelecionado, setPetSelecionado] = useState("");
  const [tagOpen, setTagOpen] = useState(!!(params.get("tag") && params.get("codigo")));
  const [vinculando, setVinculando] = useState(false);

  const carregar = async () => {
    const [t, lista] = await Promise.all([fetchMeuTutor(), fetchMeusPets()]);
    setTutor(t);
    setPets(lista);
    if (!petSelecionado && lista[0]) setPetSelecionado(lista[0].id);
    setLoading(false);
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vincularTag = async () => {
    if (!petSelecionado) return toast.error("Selecione o pet que receberá a TAG.");
    if (!tagUid.trim() || !tagCodigo.trim()) return toast.error("Informe a TAG e o código de ativação.");

    setVinculando(true);
    try {
      const petId = await ativarTagParaPet(petSelecionado, tagUid, tagCodigo);
      toast.success("TAG vinculada ao pet. Todo o histórico foi preservado. 🐾");
      setTagOpen(false);
      await carregar();
      navigate(`/dashboard?id=${petId}`);
    } catch (e: any) {
      toast.error(e.message || "Não foi possível vincular a TAG");
    } finally {
      setVinculando(false);
    }
  };

  const irParaAtivacao = () => {
    const tagId = novaTag.trim().toUpperCase();
    const tk = novoToken.trim();
    if (!tagId || !tk) return toast.error("Informe o ID e o token da TAG.");
    setDialogAberto(false);
    navigate(`/setup?id=${encodeURIComponent(tagId)}&token=${encodeURIComponent(tk)}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen">
      {pets[0] && <PetSidebar id={pets[0].id} open={menuOpen} onClose={() => setMenuOpen(false)} />}
      <PetHeader title="Meus Pets" onMenuClick={pets[0] ? () => setMenuOpen(true) : undefined} />

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {tutor && (
          <div className="pet-card">
            <p className="text-sm text-muted-foreground">Tutor</p>
            <h2 className="text-lg font-bold">{tutor.nome}</h2>
            <p className="text-sm text-muted-foreground">{pets.length} {pets.length === 1 ? "pet vinculado" : "pets vinculados"}</p>
          </div>
        )}

        {pets.length === 0 ? (
          <div className="pet-card text-center py-10 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto"><PawPrint className="w-8 h-8 text-primary" /></div>
            <div>
              <h2 className="text-xl font-bold">Você ainda não possui pets cadastrados.</h2>
              <p className="text-sm text-muted-foreground mt-1">Ative a TAG NFC que você recebeu para cadastrar o seu primeiro pet.</p>
            </div>
            <Button size="lg" onClick={() => setDialogAberto(true)}><Nfc className="w-4 h-4 mr-2" /> ATIVAR MINHA TAG</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pets.map((p) => (
              <div key={p.id} className="pet-card flex flex-col items-center text-center gap-3">
                {p.foto_url ? <img src={p.foto_url} alt={`Foto de ${p.nome_pet || "pet"}`} className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/30" /> : <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center"><PawPrint className="w-10 h-10 text-muted-foreground" /></div>}
                <div>
                  <h3 className="font-bold text-lg">{p.nome_pet || p.codigo_publico}</h3>
                  <span className={`mt-1 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${p.status_perdido ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}>
                    {p.status_perdido ? <><Siren className="w-3 h-3" /> Perdido</> : <><ShieldCheck className="w-3 h-3" /> Seguro</>}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground"><p className="flex items-center justify-center gap-1"><Cake className="w-4 h-4" /> {calcularIdade(p.data_nascimento)}</p></div>
                <Button className="w-full" onClick={() => navigate(`/dashboard${petQuery(p.id)}`)}>Abrir Pet</Button>
              </div>
            ))}
          </div>
        )}

        {pets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="outline" size="lg" onClick={() => setDialogAberto(true)}><Plus className="w-4 h-4 mr-1" /> Adicionar outro pet</Button>
            <Button variant="outline" size="lg" onClick={() => setTagOpen(true)}><Nfc className="w-4 h-4 mr-1" /> Vincular/substituir TAG</Button>
          </div>
        )}

        <Dialog open={tagOpen} onOpenChange={setTagOpen}>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Vincular ou substituir TAG</DialogTitle>
              <DialogDescription>Escolha o pet e informe a nova TAG. O cadastro e todo o histórico do animal serão preservados.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Pet</Label>
                <select value={petSelecionado} onChange={(e) => setPetSelecionado(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {pets.map((p) => <option key={p.id} value={p.id}>{p.nome_pet || p.codigo_publico}</option>)}
                </select>
              </div>
              <div><Label>Identificação da TAG</Label><Input value={tagUid} onChange={(e) => setTagUid(e.target.value)} placeholder="Ex: AP9YUY9X" /></div>
              <div><Label>Código de ativação</Label><Input value={tagCodigo} onChange={(e) => setTagCodigo(e.target.value)} placeholder="Código recebido" /></div>
              <Button onClick={vincularTag} disabled={vinculando} className="w-full">{vinculando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Vincular TAG</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>{pets.length ? "Adicionar outro pet" : "Ativar minha TAG"}</DialogTitle>
              <DialogDescription>Cada novo pet começa pela sua própria TAG NFC. Informe a identificação e o código de ativação recebidos.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>ID da TAG</Label><Input value={novaTag} onChange={(e) => setNovaTag(e.target.value)} placeholder="Ex: AP3F9KX" /></div>
              <div><Label>Código de ativação</Label><Input value={novoToken} onChange={(e) => setNovoToken(e.target.value)} placeholder="Código de ativação" /></div>
              <Button onClick={irParaAtivacao} className="w-full">Continuar cadastro</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default MeusPets;
