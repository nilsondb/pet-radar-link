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
  Bug,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Trash2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { logPetEvento } from "@/lib/petEventos";

type Vacina = {
  id: string;
  pet_id: string;
  nome_vacina: string;
  data_aplicacao: string;
  proxima_dose: string | null;
  observacoes: string | null;
  tipo: string;
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

function addToDate(dateStr: string, addMonths: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + addMonths);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface Props {
  tipo: "vacina" | "vermifugo";
}

export const VacinasView = ({ tipo }: Props) => {
  const id = useIdFromUrl();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isVermifugo = tipo === "vermifugo";
  const labelSing = isVermifugo ? "vermífugo" : "vacina";
  const labelTitle = isVermifugo ? "Vermifugação" : "Vacinação";
  const Icon = isVermifugo ? Bug : Syringe;
  const monthsToAdd = isVermifugo ? 3 : 12;

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
      .eq("tipo", tipo)
      .order("data_aplicacao", { ascending: false });
    setVacinas((data as Vacina[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!id) {
      navigate("/setup");
      return;
    }
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, tipo]);

  const resetForm = () => {
    setForm({ nome_vacina: "", data_aplicacao: "", proxima_dose: "", observacoes: "" });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (v: Vacina) => {
    setEditingId(v.id);
    setForm({
      nome_vacina: v.nome_vacina,
      data_aplicacao: v.data_aplicacao,
      proxima_dose: v.proxima_dose || "",
      observacoes: v.observacoes || "",
    });
    setDialogOpen(true);
  };

  const handleAplicacaoChange = (value: string) => {
    setForm((prev) => {
      const next = { ...prev, data_aplicacao: value };
      if (value) {
        next.proxima_dose = addToDate(value, monthsToAdd);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!id) return;
    if (!form.nome_vacina.trim() || !form.data_aplicacao) {
      toast.error(`Preencha nome e data de aplicação`);
      return;
    }
    setSaving(true);
    const payload = {
      nome_vacina: form.nome_vacina.trim(),
      data_aplicacao: form.data_aplicacao,
      proxima_dose: form.proxima_dose || null,
      observacoes: form.observacoes.trim() || null,
    };
    const { error } = editingId
      ? await supabase.from("vacinas").update(payload).eq("id", editingId)
      : await supabase.from("vacinas").insert({ ...payload, pet_id: id, tipo });
    setSaving(false);
    if (error) return toast.error(error.message);
    if (!editingId) {
      await logPetEvento(
        id,
        tipo === "vermifugo" ? "vermifugo" : "vacina",
        `${tipo === "vermifugo" ? "🪱 Vermífugo" : "💉 Vacina"}: ${payload.nome_vacina}`,
        `Aplicado em ${formatDate(payload.data_aplicacao)}`,
        { ...payload }
      );
    }
    toast.success(editingId ? "Atualizado ✏️" : `${isVermifugo ? "Vermífugo" : "Vacina"} adicionado 💉`);
    setDialogOpen(false);
    resetForm();
    load();
  };

  const handleDelete = async (vacinaId: string) => {
    if (!confirm(`Remover este ${labelSing}?`)) return;
    const { error } = await supabase.from("vacinas").delete().eq("id", vacinaId);
    if (error) return toast.error(error.message);
    toast.success("Removido");
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
      <PetHeader title={labelTitle} onMenuClick={() => setMenuOpen(true)} />

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <Button
          onClick={openCreate}
          className="w-full"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-1" />
          Adicionar {labelSing}
        </Button>

        {vacinas.length === 0 ? (
          <div className="pet-card flex flex-col items-center text-center py-10">
            <Icon className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              Nenhum registro ainda.
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
                      <Icon className="w-5 h-5 text-primary shrink-0" />
                      <h3 className="font-bold text-lg leading-tight">
                        {v.nome_vacina}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(v)}
                        className="text-muted-foreground hover:text-primary p-1"
                        aria-label="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="text-muted-foreground hover:text-destructive p-1"
                        aria-label="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Aplicado em {formatDate(v.data_aplicacao)}</span>
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
            <DialogTitle>{editingId ? `Editar ${labelSing}` : `Novo ${labelSing}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={form.nome_vacina}
                onChange={(e) => setForm({ ...form, nome_vacina: e.target.value })}
                placeholder={isVermifugo ? "Ex: Drontal, NexGard" : "Ex: V10, Antirrábica"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aplic">Data de aplicação *</Label>
              <Input
                id="aplic"
                type="date"
                value={form.data_aplicacao}
                onChange={(e) => handleAplicacaoChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prox">
                Próxima dose{" "}
                <span className="text-xs text-muted-foreground">
                  (auto +{isVermifugo ? "3 meses" : "1 ano"}, editável)
                </span>
              </Label>
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
