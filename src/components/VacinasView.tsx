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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Syringe, Bug, Calendar, AlertTriangle, Clock, CheckCircle2, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { logPetEvento } from "@/lib/petEventos";

type Registro = {
  id: string;
  pet_id: string;
  nome: string;
  data_aplicacao: string;
  proxima_data: string | null;
  observacoes: string | null;
  dose?: string | null;
};

type StatusRegistro = "atrasada" | "proxima" | "ok" | "sem_proxima";

function getStatus(proxima: string | null): StatusRegistro {
  if (!proxima) return "sem_proxima";
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prox = new Date(`${proxima}T00:00:00`);
  const diff = Math.ceil((prox.getTime() - hoje.getTime()) / 86400000);
  if (diff < 0) return "atrasada";
  if (diff <= 15) return "proxima";
  return "ok";
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR");
}

function addToDate(dateStr: string, addMonths: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setMonth(d.getMonth() + addMonths);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface Props { tipo: "vacina" | "vermifugo"; }

export const VacinasView = ({ tipo }: Props) => {
  const id = useIdFromUrl();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [filtro, setFiltro] = useState<"todas" | "ok" | "proxima" | "atrasada">("todas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isVermifugo = tipo === "vermifugo";
  const labelSing = isVermifugo ? "vermífugo" : "vacina";
  const labelTitle = isVermifugo ? "Vermifugação" : "Vacinação";
  const Icon = isVermifugo ? Bug : Syringe;
  const monthsToAdd = isVermifugo ? 3 : 12;

  const [form, setForm] = useState({ nome: "", data_aplicacao: "", proxima_data: "", observacoes: "", dose: "" });

  const load = async () => {
    if (!id) return;
    const { data: pet } = await supabase.from("pets").select("id").eq("id", id).maybeSingle();
    if (!pet) {
      navigate("/meus-pets", { replace: true });
      return;
    }

    if (isVermifugo) {
      const { data } = await supabase
        .from("vermifugacoes")
        .select("id,pet_id,produto,data_aplicacao,proxima_data,observacoes,dose")
        .eq("pet_id", id)
        .order("data_aplicacao", { ascending: false });
      setRegistros((data || []).map((r: any) => ({ ...r, nome: r.produto })));
    } else {
      const { data } = await supabase
        .from("vacinas")
        .select("id,pet_id,nome_vacina,data_aplicacao,proxima_data,observacoes")
        .eq("pet_id", id)
        .order("data_aplicacao", { ascending: false });
      setRegistros((data || []).map((r: any) => ({ ...r, nome: r.nome_vacina })));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!id) {
      navigate("/meus-pets");
      return;
    }
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, tipo]);

  const resetForm = () => {
    setForm({ nome: "", data_aplicacao: "", proxima_data: "", observacoes: "", dose: "" });
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (r: Registro) => {
    setEditingId(r.id);
    setForm({
      nome: r.nome,
      data_aplicacao: r.data_aplicacao,
      proxima_data: r.proxima_data || "",
      observacoes: r.observacoes || "",
      dose: r.dose || "",
    });
    setDialogOpen(true);
  };

  const handleAplicacaoChange = (value: string) => {
    setForm((prev) => ({ ...prev, data_aplicacao: value, proxima_data: value ? addToDate(value, monthsToAdd) : "" }));
  };

  const handleSave = async () => {
    if (!id) return;
    if (!form.nome.trim() || !form.data_aplicacao) return toast.error("Preencha nome e data de aplicação");
    setSaving(true);

    let error: any = null;
    if (isVermifugo) {
      const payload = {
        produto: form.nome.trim(),
        data_aplicacao: form.data_aplicacao,
        proxima_data: form.proxima_data || null,
        dose: form.dose.trim() || null,
        observacoes: form.observacoes.trim() || null,
      };
      ({ error } = editingId
        ? await supabase.from("vermifugacoes").update(payload).eq("id", editingId)
        : await supabase.from("vermifugacoes").insert({ ...payload, pet_id: id }));
    } else {
      const payload = {
        nome_vacina: form.nome.trim(),
        data_aplicacao: form.data_aplicacao,
        proxima_data: form.proxima_data || null,
        observacoes: form.observacoes.trim() || null,
      };
      ({ error } = editingId
        ? await supabase.from("vacinas").update(payload).eq("id", editingId)
        : await supabase.from("vacinas").insert({ ...payload, pet_id: id }));
    }

    setSaving(false);
    if (error) return toast.error(error.message);

    if (!editingId) {
      await logPetEvento(
        id,
        isVermifugo ? "vermifugo" : "vacina",
        `${isVermifugo ? "🪱 Vermífugo" : "💉 Vacina"}: ${form.nome.trim()}`,
        `Aplicado em ${formatDate(form.data_aplicacao)}`,
        { proxima_data: form.proxima_data || null, dose: form.dose || null }
      );
    }

    toast.success(editingId ? "Atualizado ✏️" : `${isVermifugo ? "Vermífugo" : "Vacina"} adicionado`);
    setDialogOpen(false);
    resetForm();
    load();
  };

  const handleDelete = async (registroId: string) => {
    if (!confirm(`Remover este ${labelSing}?`)) return;
    const { error } = isVermifugo
      ? await supabase.from("vermifugacoes").delete().eq("id", registroId)
      : await supabase.from("vacinas").delete().eq("id", registroId);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    load();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const filtrados = registros.filter((r) => filtro === "todas" || getStatus(r.proxima_data) === filtro);

  return (
    <div className="min-h-screen">
      <PetSidebar id={id!} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <PetHeader title={labelTitle} onMenuClick={() => setMenuOpen(true)} />

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <Button onClick={openCreate} className="w-full" size="lg"><Plus className="w-5 h-5 mr-1" />Adicionar {labelSing}</Button>

        {registros.length === 0 ? (
          <div className="pet-card flex flex-col items-center text-center py-10"><Icon className="w-12 h-12 text-muted-foreground mb-3" /><p className="text-muted-foreground">Nenhum registro ainda.</p></div>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {([
                { v: "todas", label: "Todas" },
                { v: "ok", label: "🟢 Em dia" },
                { v: "proxima", label: "🟡 Próximas" },
                { v: "atrasada", label: "🔴 Atrasadas" },
              ] as const).map((opt) => <button key={opt.v} onClick={() => setFiltro(opt.v)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors", filtro === opt.v ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted")}>{opt.label}</button>)}
            </div>

            <div className="space-y-3">
              {filtrados.map((r) => {
                const status = getStatus(r.proxima_data);
                return (
                  <div key={r.id} className={cn("pet-card border-2 transition-colors", status === "atrasada" && "border-destructive/40 bg-destructive/5", status === "proxima" && "border-warning/40 bg-warning/5", status === "ok" && "border-success/30", status === "sem_proxima" && "border-border")}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2"><Icon className="w-5 h-5 text-primary shrink-0" /><h3 className="font-bold text-lg leading-tight">{r.nome}</h3></div>
                      <div className="flex items-center gap-1"><button onClick={() => openEdit(r)} className="text-muted-foreground hover:text-primary p-1"><Pencil className="w-4 h-4" /></button><button onClick={() => handleDelete(r.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="w-4 h-4" /></button></div>
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span>Aplicado em {formatDate(r.data_aplicacao)}</span></div>
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /><span>Próxima dose: {formatDate(r.proxima_data)}</span></div>
                      {isVermifugo && r.dose && <p>Dose: {r.dose}</p>}
                      {r.observacoes && <p className="text-muted-foreground italic pt-1">{r.observacoes}</p>}
                    </div>
                    {status !== "sem_proxima" && <div className={cn("mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium", status === "atrasada" && "bg-destructive/15 text-destructive", status === "proxima" && "bg-warning/20 text-warning-foreground", status === "ok" && "bg-success/15 text-success")}>{status === "atrasada" && <><AlertTriangle className="w-3.5 h-3.5" /> Atrasada</>}{status === "proxima" && <><Clock className="w-3.5 h-3.5" /> Vence em breve</>}{status === "ok" && <><CheckCircle2 className="w-3.5 h-3.5" /> Em dia</>}</div>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? `Editar ${labelSing}` : `Novo ${labelSing}`}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label htmlFor="nome">Nome *</Label><Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder={isVermifugo ? "Ex: Drontal" : "Ex: V10, Antirrábica"} /></div>
            {isVermifugo && <div className="space-y-2"><Label htmlFor="dose">Dose</Label><Input id="dose" value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} placeholder="Ex: 1 comprimido" /></div>}
            <div className="space-y-2"><Label htmlFor="aplic">Data de aplicação *</Label><Input id="aplic" type="date" value={form.data_aplicacao} onChange={(e) => handleAplicacaoChange(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="prox">Próxima dose <span className="text-xs text-muted-foreground">(auto +{isVermifugo ? "3 meses" : "1 ano"}, editável)</span></Label><Input id="prox" type="date" value={form.proxima_data} onChange={(e) => setForm({ ...form, proxima_data: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="obs">Observações</Label><Textarea id="obs" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0"><Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} disabled={saving}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
