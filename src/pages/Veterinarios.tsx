import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIdFromUrl, useTokenFromUrl, validateActivationToken } from "@/lib/petUtils";
import { fetchVinculosDoPet, atualizarVinculo } from "@/lib/vetData";
import { logPetEvento } from "@/lib/petEventos";
import { PetHeader } from "@/components/PetHeader";
import { PetSidebar } from "@/components/PetSidebar";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, ShieldCheck, Stethoscope, X, Clock } from "lucide-react";
import { toast } from "sonner";

const Veterinarios = () => {
  const id = useIdFromUrl();
  const token = useTokenFromUrl();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [vinculos, setVinculos] = useState<any[]>([]);

  const carregar = async (petId: string) => {
    setVinculos(await fetchVinculosDoPet(petId));
  };

  useEffect(() => {
    if (!id) {
      navigate("/setup", { replace: true });
      return;
    }
    (async () => {
      const valido = token ? await validateActivationToken(id, token) : false;
      setAutorizado(valido);
      if (valido) await carregar(id);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const agir = async (vinculoId: string, status: "active" | "revoked", nome: string) => {
    try {
      await atualizarVinculo(vinculoId, status);
      await logPetEvento(
        id!, "status_pet",
        status === "active" ? "Acesso veterinário autorizado" : "Acesso veterinário revogado",
        `${nome} — ação do tutor`
      );
      toast.success(status === "active" ? "Acesso autorizado." : "Acesso revogado.");
      carregar(id!);
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar");
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
          <p className="text-muted-foreground">Abra esta página pelo link privado da sua tag NFC.</p>
        </div>
      </div>
    );
  }

  const pendentes = vinculos.filter((v) => v.status === "pending");
  const ativos = vinculos.filter((v) => v.status === "active");
  const revogados = vinculos.filter((v) => v.status === "revoked");

  const Card = ({ v, acoes }: { v: any; acoes: React.ReactNode }) => (
    <div className="pet-card flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
        <Stethoscope className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold truncate">{v.vet?.nome || "Veterinário"}</p>
        <p className="text-xs text-muted-foreground">
          {v.vet?.crmv ? `CRMV ${v.vet.crmv}${v.vet.uf_crmv ? `/${v.vet.uf_crmv}` : ""}` : "CRMV não informado"}
          {v.vet?.clinica ? ` · ${v.vet.clinica}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">Nível de acesso: {v.access_level}</p>
        <div className="mt-2 flex flex-wrap gap-2">{acoes}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <PetSidebar id={id!} token={token} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <PetHeader title="Veterinários" onMenuClick={() => setMenuOpen(true)} />

      <main className="max-w-3xl mx-auto p-4 space-y-6">
        <div className="pet-card">
          <h2 className="font-bold mb-1">Quem pode acessar o prontuário</h2>
          <p className="text-sm text-muted-foreground">
            Ler a tag NFC nunca dá acesso clínico. Somente você, como tutor, pode autorizar ou revogar
            o acesso de um veterinário aos dados de saúde do seu pet.
          </p>
        </div>

        <section>
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-warning" /> Solicitações pendentes ({pendentes.length})
          </h3>
          {pendentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente.</p>
          ) : (
            <div className="space-y-3">
              {pendentes.map((v) => (
                <Card key={v.id} v={v} acoes={
                  <>
                    <Button size="sm" onClick={() => agir(v.id, "active", v.vet?.nome || "Veterinário")}>
                      Autorizar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => agir(v.id, "revoked", v.vet?.nome || "Veterinário")}>
                      Recusar
                    </Button>
                  </>
                } />
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-success" /> Acessos autorizados ({ativos.length})
          </h3>
          {ativos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum veterinário autorizado.</p>
          ) : (
            <div className="space-y-3">
              {ativos.map((v) => (
                <Card key={v.id} v={v} acoes={
                  <Button size="sm" variant="destructive" onClick={() => agir(v.id, "revoked", v.vet?.nome || "Veterinário")}>
                    <X className="w-3 h-3 mr-1" /> Revogar acesso
                  </Button>
                } />
              ))}
            </div>
          )}
        </section>

        {revogados.length > 0 && (
          <section>
            <h3 className="font-bold mb-2 text-muted-foreground">Histórico revogado ({revogados.length})</h3>
            <div className="space-y-3 opacity-70">
              {revogados.map((v) => (
                <Card key={v.id} v={v} acoes={
                  <Button size="sm" variant="outline" onClick={() => agir(v.id, "active", v.vet?.nome || "Veterinário")}>
                    Reautorizar
                  </Button>
                } />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Veterinarios;
