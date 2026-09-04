import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { calcularIdade } from "@/lib/petUtils";
import { ativarTagParaPet, fetchMeuTutor, fetchMeusPets, petQuery, type PetResumo, type Tutor } from "@/lib/tutorUtils";
import { PetHeader } from "@/components/PetHeader";
import { PetSidebar } from "@/components/PetSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, PawPrint, Plus, MapPin, Cake, ShieldCheck, Siren, Nfc } from "lucide-react";
import { toast } from "sonner";

/**
 * Área do tutor autenticado. A identidade vem exclusivamente da sessão
 * (Supabase Auth + RPC meu_tutor_id) — o token da tag NFC não é credencial.
 */
const MeusPets = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pets, setPets] = useState<PetResumo[]>([]);
  const [tutor, setTutor] = useState<Tutor | null>(null);

  // fluxo "ativar minha tag" / "adicionar outro pet"
  const [novaTag, setNovaTag] = useState("");
  const [novoToken, setNovoToken] = useState("");
  const [dialogAberto, setDialogAberto] = useState(false);

  // vinculação de TAG a um pet que já existe (TAG nova, perdida ou substituída)
  const params = new URLSearchParams(window.location.search);
  const [tagUid, setTagUid] = useState(params.get("tag") || "");
  const [tagCodigo, setTagCodigo] = useState(params.get("codigo") || "");
  const [tagOpen, setTagOpen] = useState(!!(params.get("tag") && params.get("codigo")));
  const [vinculando, setVinculando] = useState(false);

  useEffect(() => {
    (async () => {
      const [t, lista] = await Promise.all([fetchMeuTutor(), fetchMeusPets()]);
      setTutor(t);
      setPets(lista);
      setLoading(false);
    })();
  }, []);

  const vincularTag = async () => {
    if (!tagUid.trim() || !tagCodigo.trim()) return toast.error("Informe a TAG e o código de ativação.");
    setVinculando(true);
    try {
      // O servidor valida o código e vincula a TAG ao pet existente, sem criar novo pet.
      const petId = await ativarTagParaPet(tagUid, tagCodigo);
      toast.success("TAG vinculada ao seu pet. O histórico foi preservado. 🐾");
      setTagOpen(false);
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
    if (!tagId || !tk) return toast.error("Informe o ID e o token da tag.");
    setDialogAberto(false);
    // O token é validado no servidor pela RPC ativar_pet_com_token.
    navigate(`/setup?id=${encodeURIComponent(tagId)}&token=${encodeURIComponent(tk)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const ativos = pets.filter((p) => p.status_ativado);

  return (
    <div className="min-h-screen">
      {ativos[0] && (
        <PetSidebar id={ativos[0].id} open={menuOpen} onClose={() => setMenuOpen(false)} />
      )}
      <PetHeader title="Meus Pets" onMenuClick={ativos[0] ? () => setMenuOpen(true) : undefined} />

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {tutor && (
          <div className="pet-card">
            <p className="text-sm text-muted-foreground">Tutor</p>
            <h2 className="text-lg font-bold">{tutor.nome}</h2>
            <p className="text-sm text-muted-foreground">
              {pets.length} {pets.length === 1 ? "pet vinculado" : "pets vinculados"}
            </p>
          </div>
        )}

        {pets.length === 0 ? (
          <div className="pet-card text-center py-10 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <PawPrint className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Você ainda não possui pets cadastrados.</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ative a tag NFC que você recebeu para cadastrar o seu primeiro pet. Você também pode
                simplesmente abrir o link recebido com a tag.
              </p>
            </div>
            <Button size="lg" onClick={() => setDialogAberto(true)}>
              <Nfc className="w-4 h-4 mr-2" /> ATIVAR MINHA TAG
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pets.map((p) => (
              <div key={p.id} className="pet-card flex flex-col items-center text-center gap-3">
                {p.foto_url ? (
                  <img
                    src={p.foto_url}
                    alt={`Foto de ${p.nome_pet || "pet"}`}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/30"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                    <PawPrint className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg">{p.nome_pet || p.id}</h3>
                  <span
                    className={`mt-1 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      p.status_perdido ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"
                    }`}
                  >
                    {p.status_perdido ? <><Siren className="w-3 h-3" /> Perdido</> : <><ShieldCheck className="w-3 h-3" /> Seguro</>}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="flex items-center justify-center gap-1">
                    <Cake className="w-4 h-4" /> {calcularIdade(p.data_nascimento)}
                  </p>
                  {p.ultima_localizacao && (
                    <p className="flex items-center justify-center gap-1">
                      <MapPin className="w-4 h-4" />{" "}
                      <span className="truncate max-w-[12rem]">{p.ultima_localizacao}</span>
                    </p>
                  )}
                </div>
                <Button
                  className="w-full"
                  onClick={() =>
                    navigate(p.status_ativado ? `/dashboard${petQuery(p.id)}` : `/setup?id=${p.id}`)
                  }
                >
                  {p.status_ativado ? "Abrir Pet" : "Concluir cadastro"}
                </Button>
              </div>
            ))}
          </div>
        )}

        {pets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="outline" size="lg" onClick={() => setDialogAberto(true)}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar outro pet
            </Button>
            <Button variant="outline" size="lg" onClick={() => setTagOpen(true)}>
              <Nfc className="w-4 h-4 mr-1" /> Vincular TAG a um pet existente
            </Button>
          </div>
        )}

        <Dialog open={tagOpen} onOpenChange={setTagOpen}>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Vincular TAG a um pet existente</DialogTitle>
              <DialogDescription>
                Use esta opção quando o pet já está cadastrado e recebeu uma TAG nova ou de
                substituição. O pet e todo o histórico são preservados.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Identificação da TAG</Label>
                <Input value={tagUid} onChange={(e) => setTagUid(e.target.value)} placeholder="Ex: 9YUY9X" />
              </div>
              <div>
                <Label>Código de ativação</Label>
                <Input value={tagCodigo} onChange={(e) => setTagCodigo(e.target.value)} placeholder="Código recebido" />
              </div>
              <Button onClick={vincularTag} disabled={vinculando} className="w-full">
                {vinculando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Vincular TAG
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>{pets.length ? "Adicionar outro pet" : "Ativar minha tag"}</DialogTitle>
              <DialogDescription>
                Cada pet precisa de sua própria tag NFC. Informe o ID e o token de ativação da tag
                que você recebeu.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>ID da tag</Label>
                <Input value={novaTag} onChange={(e) => setNovaTag(e.target.value)} placeholder="Ex: A3F9KX" />
              </div>
              <div>
                <Label>Token de ativação</Label>
                <Input value={novoToken} onChange={(e) => setNovoToken(e.target.value)} placeholder="Token de ativação" />
              </div>
              <Button onClick={irParaAtivacao} className="w-full">
                Continuar cadastro
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default MeusPets;
