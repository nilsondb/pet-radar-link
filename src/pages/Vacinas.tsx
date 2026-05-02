import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIdFromUrl } from "@/lib/petUtils";
import { PetHeader } from "@/components/PetHeader";
import { PetSidebar } from "@/components/PetSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  Syringe,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Vacina = {
  id: string;
  pet_id: string;
  nome_vacina: string;
  data_aplicacao: string;
  proxima_dose: string | null;
  observacoes: string | null;
};

type StatusVacina = "atrasada" | "proxima" | "ok" | "sem_proxima";

function getStatus(proxima: string | null): StatusVacina {
  if (!proxima) return "sem_proxima";
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prox = new Date(proxima);
  const diff = Math.ceil((prox.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "atrasada";
  if (diff <= 30) return "proxima";
  return "ok";
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

const Vacinas = () => {
  const id = useIdFromUrl();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nome_vacina: "",
    data_aplicacao: "",
    proxima_dose: "",
    observacoes: "",
  });

  const load = async () => {
    if (!id) return;
    const { data: pet } = await supabase
      .from("pets")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!pet) {
      navigate(`/setup?id=${id}`, { replace: true });
      return;
    }
    const { data } = await supabase
      .from("vacinas")
      .select("*")
      .eq("pet_id", id)
      .order("data_aplicacao", { ascending: false });
    setVacinas((data as Vacina[]) || []);
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

  const resetForm = () =>
    setForm({ nome_vacina: "", data_aplicacao: "", proxima_dose: "", observacoes: "" });

  const handleSave = async () => {
    if (!id) return;
    if (!form.nome_vacina.trim() || !form.data_aplicacao) {
      toast.error("Preencha nome e data de aplicação");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("vacinas").insert({
      pet_id: id,
      nome_vacina: form.nome_vacina.trim(),
      data_aplicacao: form.data_aplicacao,
      proxima_dose: form.proxima_dose || null,
      observacoes: form.observacoes.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Vacina adicionada 💉");
    setDialogOpen(false);
    resetForm();
    load();
  };

  const handleDelete = async (vacinaId: string) => {
    if (!confirm("Remover esta vacina?")) return;
    const { error } = await supabase.from("vacinas").delete().eq("id", vacinaId);
    if (error) return toast.error(error.message);
    toast.success("Vacina removida");
    load();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PetSidebar id={id!} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <PetHeader title="Vacinação" onMenuClick={() => setMenuOpen(true)} />

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <Button
          onClick={() => setDialogOpen(true)}
          className="w-full"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-1" />
          Adicionar vacina
        </Button>

        {vacinas.length === 0 ? (
          <div className="pet-card flex flex-col items-center text-center py-10">
            <Syringe className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              Nenhuma vacina cadastrada ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {vacinas.map((v) => {
              const status = getStatus(v.proxima_dose);
              return (
                <div
                  key={v.id}
                  className={cn(
                    "pet-card border-2 transition-colors",
                    status === "atrasada" && "border-destructive/40 bg-destructive/5",
                    status === "proxima" && "border-warning/40 bg-warning/5",
                    status === "ok" && "border-success/30",
                    status === "sem_proxima" && "border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Syringe className="w-5 h-5 text-primary shrink-0" />
                      <h3 className="font-bold text-lg leading-tight">
                        {v.nome_vacina}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="text-muted-foreground hover:text-destructive p-1"
                      aria-label="Remover vacina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Aplicada em {formatDate(v.data_aplicacao)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>Próxima dose: {formatDate(v.proxima_dose)}</span>
                    </div>
                    {v.observacoes && (
                      <p className="text-muted-foreground italic pt-1">
                        {v.observacoes}
                      </p>
                    )}
                  </div>

                  {status !== "sem_proxima" && (
                    <div
                      className={cn(
                        "mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                        status === "atrasada" && "bg-destructive/15 text-destructive",
                        status === "proxima" && "bg-warning/20 text-warning-foreground",
                        status === "ok" && "bg-success/15 text-success"
                      )}
                    >
                      {status === "atrasada" && (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5" /> Atrasada
                        </>
                      )}
                      {status === "proxima" && (
                        <>
                          <Clock className="w-3.5 h-3.5" /> Vence em breve
                        </>
                      )}
                      {status === "ok" && (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Em dia
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova vacina</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da vacina *</Label>
              <Input
                id="nome"
                value={form.nome_vacina}
                onChange={(e) => setForm({ ...form, nome_vacina: e.target.value })}
                placeholder="Ex: V10, Antirrábica"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aplic">Data de aplicação *</Label>
              <Input
                id="aplic"
                type="date"
                value={form.data_aplicacao}
                onChange={(e) => setForm({ ...form, data_aplicacao: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prox">Próxima dose</Label>
              <Input
                id="prox"
                type="date"
                value={form.proxima_dose}
                onChange={(e) => setForm({ ...form, proxima_dose: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obs">Observações</Label>
              <Textarea
                id="obs"
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Lote, veterinário, reações..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vacinas;
