import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIdFromUrl, useTokenFromUrl, calcularIdade, validateActivationToken } from "@/lib/petUtils";
import { fetchPetResumo, fetchPetsDoTutor, fetchTutor, petQuery, type PetResumo, type Tutor } from "@/lib/tutorUtils";
import { supabase } from "@/integrations/supabase/client";
import { PetHeader } from "@/components/PetHeader";
import { PetSidebar } from "@/components/PetSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, PawPrint, Plus, MapPin, Cake, ShieldCheck, Siren, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const MeusPets = () => {
  const id = useIdFromUrl();
  const token = useTokenFromUrl();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pets, setPets] = useState<PetResumo[]>([]);
  const [tutor, setTutor] = useState<Tutor | null>(null);

  // fluxo "adicionar outro pet"
  const [novaTag, setNovaTag] = useState("");
  const [novoToken, setNovoToken] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [dialogAberto, setDialogAberto] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate("/setup", { replace: true });
      return;
    }
    (async () => {
      const valido = token ? await validateActivationToken(id, token) : false;
      if (!valido) {
        setAutorizado(false);
        setLoading(false);
        return;
      }
      setAutorizado(true);
      const pet = await fetchPetResumo(id);
      const lista = await fetchPetsDoTutor(pet?.tutor_id ?? null, id);
      setPets(lista);
      if (pet?.tutor_id) setTutor(await fetchTutor(pet.tutor_id));
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const vincularNovaTag = async () => {
    const tagId = novaTag.trim().toUpperCase();
    const tk = novoToken.trim();
    if (!tagId || !tk) return toast.error("Informe o ID e o token da nova tag.");
    setVerificando(true);
    try {
      const { data: pet } = await supabase
        .from("pets")
        .select("id, token, status_ativado")
        .eq("id", tagId)
        .maybeSingle();
      if (!pet || pet.token !== tk) {
        toast.error("Tag não encontrada ou token inválido.");
        return;
      }
      if (pet.status_ativado) {
        toast.error("Esta tag já possui um pet cadastrado.");
        return;
      }
      const destino = `/setup?id=${tagId}&token=${tk}${tutor ? `&tutor=${tutor.id}` : ""}`;
      setDialogAberto(false);
      navigate(destino);
    } finally {
      setVerificando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!autorizado) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="pet-card max-w-md text-center">
          <ShieldAlert className="w-12 h-12 mx-auto text-destructive mb-3" />
          <h1 className="text-xl font-bold mb-2">Acesso restrito</h1>
          <p className="text-muted-foreground">
            Abra esta página pelo link privado da sua tag NFC.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PetSidebar id={id!} token={token} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <PetHeader title="Meus Pets" onMenuClick={() => setMenuOpen(true)} />

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
                    <MapPin className="w-4 h-4" /> <span className="truncate max-w-[12rem]">{p.ultima_localizacao}</span>
                  </p>
                )}
              </div>
              <Button
                className="w-full"
                onClick={() => navigate(`/dashboard${petQuery(p.id, p.token)}&pet=1`)}
              >
                Abrir Pet
              </Button>
            </div>
          ))}
        </div>

        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button variant="outline" size="lg" className="w-full">
              <Plus className="w-4 h-4 mr-1" /> Adicionar outro pet
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Adicionar outro pet</DialogTitle>
              <DialogDescription>
                Cada pet precisa de sua própria tag NFC. Informe os dados da nova tag que você
                recebeu para cadastrar o novo pet.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>ID da nova tag</Label>
                <Input value={novaTag} onChange={(e) => setNovaTag(e.target.value)} placeholder="Ex: A3F9KX" />
              </div>
              <div>
                <Label>Token da nova tag</Label>
                <Input value={novoToken} onChange={(e) => setNovoToken(e.target.value)} placeholder="Token de ativação" />
              </div>
              <Button onClick={vincularNovaTag} disabled={verificando} className="w-full">
                {verificando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
