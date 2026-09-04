import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIdFromUrl } from "@/lib/petUtils";
import { abrirExame, removerExameArquivo, uploadExame } from "@/lib/exames";
import { PetHeader } from "@/components/PetHeader";
import { PetSidebar } from "@/components/PetSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Pill, FileText, Calendar as CalendarIcon, Trash2, Upload, Clock, ExternalLink, Pencil } from "lucide-react";
import { toast } from "sonner";
import { logPetEvento } from "@/lib/petEventos";

type Medicamento = {
  id: string;
  pet_id: string;
  nome_medicamento: string;
  dosagem: string | null;
  horario: string | null;
  frequencia: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  observacoes: string | null;
};

type Exame = {
  id: string;
  pet_id: string;
  nome_exame: string;
  arquivo_path: string | null;
  data_exame: string | null;
  observacoes: string | null;
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR");
}

function isMedicamentoAtivoHoje(m: Medicamento) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (m.data_inicio && new Date(`${m.data_inicio}T00:00:00`) > hoje) return false;
  if (m.data_fim && new Date(`${m.data_fim}T00:00:00`) < hoje) return false;
  return true;
}

function isMedicamentoFinalizado(m: Medicamento) {
  if (!m.data_fim) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return new Date(`${m.data_fim}T00:00:00`) < hoje;
}

function parseHorarios(h: string | null): string[] {
  if (!h) return [];
  return h.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean).sort();
}

const Saude = () => {
  const id = useIdFromUrl();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [meds, setMeds] = useState<Medicamento[]>([]);
  const [exames, setExames] = useState<Exame[]>([]);
  const [medFilter, setMedFilter] = useState<"todos" | "ativos" | "finalizados">("todos");
  const [medDialog, setMedDialog] = useState(false);
  const [exameDialog, setExameDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [editingExameId, setEditingExameId] = useState<string | null>(null);
  const [editingExamePath, setEditingExamePath] = useState<string | null>(null);

  const [medForm, setMedForm] = useState({ nome_medicamento: "", dosagem: "", horario: "", frequencia: "", data_inicio: "", data_fim: "", observacoes: "" });
  const [exameForm, setExameForm] = useState({ nome_exame: "", data_exame: "", observacoes: "", file: null as File | null });

  const load = async () => {
    if (!id) return;
    const { data: pet } = await supabase.from("pets").select("id,ativo").eq("id", id).maybeSingle();
    if (!pet || !pet.ativo) {
      navigate("/meus-pets", { replace: true });
      return;
    }

    const [m, e] = await Promise.all([
      supabase.from("medicamentos").select("*").eq("pet_id", id).order("created_at", { ascending: false }),
      supabase.from("exames").select("*").eq("pet_id", id).order("data_exame", { ascending: false }),
    ]);

    const medsData = (m.data as Medicamento[]) || [];
    setMeds(medsData);
    setExames((e.data as Exame[]) || []);
    setLoading(false);

    try {
      const finalizados = medsData.filter(isMedicamentoFinalizado);
      if (!finalizados.length) return;
      const { data: eventos } = await supabase.from("pet_eventos").select("dados_json").eq("pet_id", id).eq("titulo", "Medicamento finalizado");
      const jaLogados = new Set((eventos || []).map((ev: any) => ev?.dados_json?.medicamento_id).filter(Boolean));
      for (const med of finalizados) {
        if (!jaLogados.has(med.id)) {
          await logPetEvento(id, "medicamento", "Medicamento finalizado", `${med.nome_medicamento} finalizou o período de uso`, { medicamento_id: med.id, data_fim: med.data_fim });
        }
      }
    } catch (err) {
      console.warn("auto-log finalizados failed", err);
    }
  };

  useEffect(() => {
    if (!id) {
      navigate("/meus-pets", { replace: true });
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const agendaHoje = useMemo(() => {
    const items: { hora: string; med: Medicamento }[] = [];
    meds.filter(isMedicamentoAtivoHoje).forEach((m) => parseHorarios(m.horario).forEach((hora) => items.push({ hora, med: m })));
    return items.sort((a, b) => a.hora.localeCompare(b.hora));
  }, [meds]);

  const resetMed = () => {
    setMedForm({ nome_medicamento: "", dosagem: "", horario: "", frequencia: "", data_inicio: "", data_fim: "", observacoes: "" });
    setEditingMedId(null);
  };

  const resetExame = () => {
    setExameForm({ nome_exame: "", data_exame: "", observacoes: "", file: null });
    setEditingExameId(null);
    setEditingExamePath(null);
  };

  const openEditMed = (m: Medicamento) => {
    setEditingMedId(m.id);
    setMedForm({
      nome_medicamento: m.nome_medicamento,
      dosagem: m.dosagem || "",
      horario: m.horario || "",
      frequencia: m.frequencia || "",
      data_inicio: m.data_inicio || "",
      data_fim: m.data_fim || "",
      observacoes: m.observacoes || "",
    });
    setMedDialog(true);
  };

  const openEditExame = (e: Exame) => {
    setEditingExameId(e.id);
    setEditingExamePath(e.arquivo_path);
    setExameForm({ nome_exame: e.nome_exame, data_exame: e.data_exame || "", observacoes: e.observacoes || "", file: null });
    setExameDialog(true);
  };

  const handleSaveMed = async () => {
    if (!id || !medForm.nome_medicamento.trim()) return toast.error("Informe o nome do medicamento");
    setSaving(true);
    const payload = {
      nome_medicamento: medForm.nome_medicamento.trim(),
      dosagem: medForm.dosagem.trim() || null,
      horario: medForm.horario.trim() || null,
      frequencia: medForm.frequencia.trim() || null,
      data_inicio: medForm.data_inicio || null,
      data_fim: medForm.data_fim || null,
      observacoes: medForm.observacoes.trim() || null,
    };
    const { error } = editingMedId
      ? await supabase.from("medicamentos").update(payload).eq("id", editingMedId)
      : await supabase.from("medicamentos").insert({ ...payload, pet_id: id });
    setSaving(false);
    if (error) return toast.error(error.message);
    if (!editingMedId) await logPetEvento(id, "medicamento", `💊 ${payload.nome_medicamento}`, payload.dosagem, payload);
    toast.success(editingMedId ? "Atualizado ✏️" : "Medicamento adicionado 💊");
    setMedDialog(false);
    resetMed();
    load();
  };

  const handleDeleteMed = async (mid: string) => {
    if (!confirm("Remover este medicamento?")) return;
    const { error } = await supabase.from("medicamentos").delete().eq("id", mid);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    load();
  };

  const handleSaveExame = async () => {
    if (!id || !exameForm.nome_exame.trim()) return toast.error("Informe o nome do exame");
    setSaving(true);
    try {
      let arquivo_path = editingExamePath;
      if (exameForm.file) {
        const novoPath = await uploadExame(id, exameForm.file);
        if (editingExamePath && editingExamePath !== novoPath) {
          await removerExameArquivo(editingExamePath).catch(() => {});
        }
        arquivo_path = novoPath;
      }

      const payload = {
        nome_exame: exameForm.nome_exame.trim(),
        data_exame: exameForm.data_exame || null,
        observacoes: exameForm.observacoes.trim() || null,
        arquivo_path,
      };

      const { error } = editingExameId
        ? await supabase.from("exames").update(payload).eq("id", editingExameId)
        : await supabase.from("exames").insert({ ...payload, pet_id: id });
      if (error) throw error;
      if (!editingExameId) await logPetEvento(id, "exame", `📄 Exame: ${payload.nome_exame}`, payload.observacoes, payload);
      toast.success(editingExameId ? "Exame atualizado ✏️" : "Exame salvo 📄");
      setExameDialog(false);
      resetExame();
      load();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar exame");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExame = async (exame: Exame) => {
    if (!confirm("Remover este exame?")) return;
    try {
      const { error } = await supabase.from("exames").delete().eq("id", exame.id);
      if (error) throw error;
      if (exame.arquivo_path) await removerExameArquivo(exame.arquivo_path).catch(() => {});
      toast.success("Removido");
      load();
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover exame");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const medsFiltrados = meds.filter((m) => medFilter === "todos" || (medFilter === "ativos" ? !isMedicamentoFinalizado(m) : isMedicamentoFinalizado(m)));

  return (
    <div className="min-h-screen">
      <PetSidebar id={id!} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <PetHeader title="Saúde do Pet" onMenuClick={() => setMenuOpen(true)} />
      <main className="max-w-2xl mx-auto p-4">
        <Tabs defaultValue="agenda" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="medicamentos">Medicamentos</TabsTrigger>
            <TabsTrigger value="exames">Exames</TabsTrigger>
          </TabsList>

          <TabsContent value="agenda" className="space-y-3 mt-4">
            <div className="pet-card">
              <div className="flex items-center gap-2 mb-3"><CalendarIcon className="w-5 h-5 text-primary" /><h2 className="font-bold text-lg">Agenda de hoje</h2></div>
              {agendaHoje.length === 0 ? <p className="text-muted-foreground text-sm py-4 text-center">Nenhum medicamento programado para hoje.</p> : <ul className="space-y-2">{agendaHoje.map((it, idx) => <li key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20"><div className="flex flex-col items-center justify-center bg-primary text-primary-foreground rounded-lg px-3 py-2 min-w-[60px]"><Clock className="w-4 h-4 mb-0.5" /><span className="text-sm font-bold leading-none">{it.hora}</span></div><div className="flex-1 min-w-0"><p className="font-semibold truncate">{it.med.nome_medicamento}</p>{it.med.dosagem && <p className="text-xs text-muted-foreground">{it.med.dosagem}</p>}</div></li>)}</ul>}
            </div>
          </TabsContent>

          <TabsContent value="medicamentos" className="space-y-3 mt-4">
            <Button onClick={() => { resetMed(); setMedDialog(true); }} className="w-full" size="lg"><Plus className="w-5 h-5 mr-1" /> Adicionar medicamento</Button>
            {meds.length > 0 && <div className="flex gap-2">{([['todos','Todos'],['ativos','Em uso'],['finalizados','Finalizados']] as const).map(([v,label]) => <button key={v} onClick={() => setMedFilter(v)} className={`flex-1 px-3 py-2 rounded-full text-sm font-medium border transition-colors ${medFilter === v ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:bg-muted'}`}>{label}</button>)}</div>}
            {medsFiltrados.length === 0 ? <div className="pet-card flex flex-col items-center text-center py-10"><Pill className="w-12 h-12 text-muted-foreground mb-3" /><p className="text-muted-foreground">Nenhum medicamento neste filtro.</p></div> : medsFiltrados.map((m) => {
              const finalizado = isMedicamentoFinalizado(m);
              return <div key={m.id} className="pet-card"><div className="flex items-start justify-between gap-2"><div className="flex items-center gap-2"><Pill className={`w-5 h-5 ${finalizado ? 'text-muted-foreground' : 'text-primary'}`} /><h3 className="font-bold text-lg">{m.nome_medicamento}</h3></div><div><button onClick={() => openEditMed(m)} className="text-muted-foreground hover:text-primary p-1"><Pencil className="w-4 h-4" /></button><button onClick={() => handleDeleteMed(m.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="w-4 h-4" /></button></div></div><div className="mt-2 text-sm text-muted-foreground space-y-1">{m.dosagem && <p><strong className="text-foreground">Dose:</strong> {m.dosagem}</p>}{m.horario && <p><strong className="text-foreground">Horários:</strong> {m.horario}</p>}{m.frequencia && <p><strong className="text-foreground">Frequência:</strong> {m.frequencia}</p>}<p><strong className="text-foreground">Período:</strong> {formatDate(m.data_inicio)} → {formatDate(m.data_fim)}</p>{m.observacoes && <p className="italic">{m.observacoes}</p>}{finalizado && <p className="text-xs font-medium">⚠️ Período de uso encerrado</p>}</div></div>;
            })}
          </TabsContent>

          <TabsContent value="exames" className="space-y-3 mt-4">
            <Button onClick={() => { resetExame(); setExameDialog(true); }} className="w-full" size="lg"><Plus className="w-5 h-5 mr-1" /> Adicionar exame</Button>
            {exames.length === 0 ? <div className="pet-card flex flex-col items-center text-center py-10"><FileText className="w-12 h-12 text-muted-foreground mb-3" /><p className="text-muted-foreground">Nenhum exame cadastrado.</p></div> : exames.map((e) => <div key={e.id} className="pet-card"><div className="flex items-start justify-between gap-2"><div className="flex items-center gap-2 min-w-0"><FileText className="w-5 h-5 text-primary shrink-0" /><h3 className="font-bold text-lg truncate">{e.nome_exame}</h3></div><div><button onClick={() => openEditExame(e)} className="text-muted-foreground hover:text-primary p-1"><Pencil className="w-4 h-4" /></button><button onClick={() => handleDeleteExame(e)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="w-4 h-4" /></button></div></div><p className="text-sm text-muted-foreground mt-1">Data: {formatDate(e.data_exame)}</p>{e.observacoes && <p className="text-sm italic text-muted-foreground mt-1">{e.observacoes}</p>}{e.arquivo_path && <button type="button" onClick={() => abrirExame(e.arquivo_path).catch(() => toast.error("Não foi possível abrir o arquivo"))} className="inline-flex items-center gap-1.5 mt-3 text-primary hover:underline text-sm font-medium"><ExternalLink className="w-4 h-4" /> Abrir arquivo</button>}</div>)}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={medDialog} onOpenChange={setMedDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editingMedId ? "Editar medicamento" : "Novo medicamento"}</DialogTitle></DialogHeader><div className="space-y-3 py-2"><div><Label>Nome *</Label><Input value={medForm.nome_medicamento} onChange={(e) => setMedForm({ ...medForm, nome_medicamento: e.target.value })} /></div><div><Label>Dosagem</Label><Input value={medForm.dosagem} onChange={(e) => setMedForm({ ...medForm, dosagem: e.target.value })} /></div><div><Label>Horários</Label><Input value={medForm.horario} onChange={(e) => setMedForm({ ...medForm, horario: e.target.value })} placeholder="08:00, 20:00" /></div><div><Label>Frequência</Label><Input value={medForm.frequencia} onChange={(e) => setMedForm({ ...medForm, frequencia: e.target.value })} /></div><div className="grid grid-cols-2 gap-3"><div><Label>Início</Label><Input type="date" value={medForm.data_inicio} onChange={(e) => setMedForm({ ...medForm, data_inicio: e.target.value })} /></div><div><Label>Fim</Label><Input type="date" value={medForm.data_fim} onChange={(e) => setMedForm({ ...medForm, data_fim: e.target.value })} /></div></div><div><Label>Observações</Label><Textarea value={medForm.observacoes} onChange={(e) => setMedForm({ ...medForm, observacoes: e.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => { setMedDialog(false); resetMed(); }}>Cancelar</Button><Button onClick={handleSaveMed} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar</Button></DialogFooter></DialogContent>
      </Dialog>

      <Dialog open={exameDialog} onOpenChange={setExameDialog}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{editingExameId ? "Editar exame" : "Novo exame"}</DialogTitle></DialogHeader><div className="space-y-3 py-2"><div><Label>Nome do exame *</Label><Input value={exameForm.nome_exame} onChange={(e) => setExameForm({ ...exameForm, nome_exame: e.target.value })} /></div><div><Label>Data do exame</Label><Input type="date" value={exameForm.data_exame} onChange={(e) => setExameForm({ ...exameForm, data_exame: e.target.value })} /></div><div><Label>Arquivo (PDF ou imagem){editingExameId && editingExamePath ? " — substituir" : ""}</Label>{editingExamePath && !exameForm.file && <button type="button" onClick={() => abrirExame(editingExamePath).catch(() => toast.error("Não foi possível abrir o arquivo"))} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mb-2"><ExternalLink className="w-3 h-3" /> Arquivo atual</button>}<Input type="file" accept="application/pdf,image/*" onChange={(e) => setExameForm({ ...exameForm, file: e.target.files?.[0] ?? null })} />{exameForm.file && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Upload className="w-3 h-3" /> {exameForm.file.name}</p>}</div><div><Label>Observações</Label><Textarea value={exameForm.observacoes} onChange={(e) => setExameForm({ ...exameForm, observacoes: e.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => { setExameDialog(false); resetExame(); }}>Cancelar</Button><Button onClick={handleSaveExame} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
};

export default Saude;
