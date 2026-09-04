import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIdFromUrl } from "@/lib/petUtils";
import { abrirExame, uploadExame } from "@/lib/exames";
import { PetHeader } from "@/components/PetHeader";
import { PetSidebar } from "@/components/PetSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Pill,
  FileText,
  Calendar as CalendarIcon,
  Trash2,
  Upload,
  Clock,
  ExternalLink,
  Pencil,
} from "lucide-react";
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
  arquivo_url: string | null;
  data_exame: string | null;
  observacoes: string | null;
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

function isMedicamentoAtivoHoje(m: Medicamento): boolean {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (m.data_inicio) {
    const ini = new Date(m.data_inicio + "T00:00:00");
    if (ini > hoje) return false;
  }
  if (m.data_fim) {
    const fim = new Date(m.data_fim + "T00:00:00");
    if (fim < hoje) return false;
  }
  return true;
}

function isMedicamentoFinalizado(m: Medicamento): boolean {
  if (!m.data_fim) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const fim = new Date(m.data_fim + "T00:00:00");
  return fim < hoje;
}

function parseHorarios(h: string | null): string[] {
  if (!h) return [];
  return h
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .sort();
}

const Saude = () => {
  const id = useIdFromUrl();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [meds, setMeds] = useState<Medicamento[]>([]);
  const [medFilter, setMedFilter] = useState<"todos" | "ativos" | "finalizados">("todos");
  const [exames, setExames] = useState<Exame[]>([]);

  const [medDialog, setMedDialog] = useState(false);
  const [exameDialog, setExameDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [editingExameId, setEditingExameId] = useState<string | null>(null);
  const [editingExameUrl, setEditingExameUrl] = useState<string | null>(null);

  const [medForm, setMedForm] = useState({
    nome_medicamento: "",
    dosagem: "",
    horario: "",
    frequencia: "",
    data_inicio: "",
    data_fim: "",
    observacoes: "",
  });

  const [exameForm, setExameForm] = useState({
    nome_exame: "",
    data_exame: "",
    observacoes: "",
    file: null as File | null,
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
    const [m, e] = await Promise.all([
      supabase.from("medicamentos").select("*").eq("pet_id", id).order("created_at", { ascending: false }),
      supabase.from("exames").select("*").eq("pet_id", id).order("data_exame", { ascending: false }),
    ]);
    const medsData = (m.data as Medicamento[]) || [];
    setMeds(medsData);
    setExames((e.data as Exame[]) || []);
    setLoading(false);

    // Auto-log finalization events (once per medicamento per pet)
    try {
      const finalizados = medsData.filter(isMedicamentoFinalizado);
      if (finalizados.length) {
        const { data: evts } = await supabase
          .from("pet_eventos")
          .select("dados_json")
          .eq("pet_id", id)
          .eq("titulo", "Medicamento finalizado");
        const jaLogados = new Set(
          (evts || []).map((ev: any) => ev?.dados_json?.medicamento_id).filter(Boolean)
        );
        for (const med of finalizados) {
          if (!jaLogados.has(med.id)) {
            await logPetEvento(
              id,
              "medicamento",
              "Medicamento finalizado",
              `${med.nome_medicamento} finalizou o período de uso`,
              { medicamento_id: med.id, nome_medicamento: med.nome_medicamento, data_fim: med.data_fim }
            );
          }
        }
      }
    } catch (err) {
      console.warn("auto-log finalizados failed", err);
    }
  };

  useEffect(() => {
    if (!id) {
      navigate("/setup");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const agendaHoje = useMemo(() => {
    const items: { hora: string; med: Medicamento }[] = [];
    meds.filter(isMedicamentoAtivoHoje).forEach((m) => {
      parseHorarios(m.horario).forEach((h) => items.push({ hora: h, med: m }));
    });
    items.sort((a, b) => a.hora.localeCompare(b.hora));
    return items;
  }, [meds]);

  const resetMed = () => {
    setMedForm({
      nome_medicamento: "",
      dosagem: "",
      horario: "",
      frequencia: "",
      data_inicio: "",
      data_fim: "",
      observacoes: "",
    });
    setEditingMedId(null);
  };

  const resetExame = () => {
    setExameForm({ nome_exame: "", data_exame: "", observacoes: "", file: null });
    setEditingExameId(null);
    setEditingExameUrl(null);
  };

  const openCreateMed = () => {
    resetMed();
    setMedDialog(true);
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

  const openCreateExame = () => {
    resetExame();
    setExameDialog(true);
  };

  const openEditExame = (e: Exame) => {
    setEditingExameId(e.id);
    setEditingExameUrl(e.arquivo_url);
    setExameForm({
      nome_exame: e.nome_exame,
      data_exame: e.data_exame || "",
      observacoes: e.observacoes || "",
      file: null,
    });
    setExameDialog(true);
  };

  const handleSaveMed = async () => {
    if (!id) return;
    if (!medForm.nome_medicamento.trim()) {
      toast.error("Informe o nome do medicamento");
      return;
    }
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
    if (!editingMedId) {
      await logPetEvento(id, "medicamento", `💊 ${payload.nome_medicamento}`, payload.dosagem || null, payload);
    }
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
    if (!id) return;
    if (!exameForm.nome_exame.trim()) {
      toast.error("Informe o nome do exame");
      return;
    }
    setSaving(true);
    try {
      let arquivo_url: string | null = editingExameUrl;
      if (exameForm.file) {
        // Bucket privado: guardamos apenas o caminho interno do arquivo
        arquivo_url = await uploadExame(id, exameForm.file);
      }

      const payload = {
        nome_exame: exameForm.nome_exame.trim(),
        data_exame: exameForm.data_exame || null,
        observacoes: exameForm.observacoes.trim() || null,
        arquivo_url,
      };
      const { error } = editingExameId
        ? await supabase.from("exames").update(payload).eq("id", editingExameId)
        : await supabase.from("exames").insert({ ...payload, pet_id: id });
      if (error) throw error;
      if (!editingExameId) {
        await logPetEvento(id, "exame", `📄 Exame: ${payload.nome_exame}`, payload.observacoes, payload);
      }
      toast.success(editingExameId ? "Exame atualizado ✏️" : "Exame salvo 📄");
      setExameDialog(false);
      resetExame();
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExame = async (eid: string) => {
    if (!confirm("Remover este exame?")) return;
    const { error } = await supabase.from("exames").delete().eq("id", eid);
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
      <PetHeader title="Saúde do Pet" onMenuClick={() => setMenuOpen(true)} />

      <main className="max-w-2xl mx-auto p-4">
        <Tabs defaultValue="agenda" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="medicamentos">Medicamentos</TabsTrigger>
            <TabsTrigger value="exames">Exames</TabsTrigger>
          </TabsList>

          {/* AGENDA */}
          <TabsContent value="agenda" className="space-y-3 mt-4">
            <div className="pet-card">
              <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">Agenda de hoje</h2>
              </div>
              {agendaHoje.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  Nenhum medicamento programado para hoje.
                </p>
              ) : (
                <ul className="space-y-2">
                  {agendaHoje.map((it, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20"
                    >
                      <div className="flex flex-col items-center justify-center bg-primary text-primary-foreground rounded-lg px-3 py-2 min-w-[60px]">
                        <Clock className="w-4 h-4 mb-0.5" />
                        <span className="text-sm font-bold leading-none">{it.hora}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{it.med.nome_medicamento}</p>
                        {it.med.dosagem && (
                          <p className="text-xs text-muted-foreground">{it.med.dosagem}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>

          {/* MEDICAMENTOS */}
          <TabsContent value="medicamentos" className="space-y-3 mt-4">
            <Button onClick={openCreateMed} className="w-full" size="lg">
              <Plus className="w-5 h-5 mr-1" /> Adicionar medicamento
            </Button>

            {meds.length > 0 && (
              <div className="flex gap-2">
                {([
                  { v: "todos", label: "Todos" },
                  { v: "ativos", label: "Em uso" },
                  { v: "finalizados", label: "Finalizados" },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setMedFilter(opt.v)}
                    className={
                      "flex-1 px-3 py-2 rounded-full text-sm font-medium border transition-colors " +
                      (medFilter === opt.v
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-muted")
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {meds.length === 0 ? (
              <div className="pet-card flex flex-col items-center text-center py-10">
                <Pill className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhum medicamento cadastrado.</p>
              </div>
            ) : (
              (() => {
                const filtered = meds.filter((m) => {
                  if (medFilter === "ativos") return !isMedicamentoFinalizado(m);
                  if (medFilter === "finalizados") return isMedicamentoFinalizado(m);
                  return true;
                });
                if (filtered.length === 0) {
                  return (
                    <div className="pet-card flex flex-col items-center text-center py-8">
                      <p className="text-muted-foreground text-sm">Nenhum medicamento neste filtro.</p>
                    </div>
                  );
                }
                return filtered.map((m) => {
                  const finalizado = isMedicamentoFinalizado(m);
                  return (
                    <div key={m.id} className="pet-card">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Pill className={"w-5 h-5 shrink-0 " + (finalizado ? "text-muted-foreground" : "text-primary")} />
                          <h3 className="font-bold text-lg leading-tight">{m.nome_medicamento}</h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditMed(m)}
                            className="text-muted-foreground hover:text-primary p-1"
                            aria-label="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMed(m.id)}
                            className="text-muted-foreground hover:text-destructive p-1"
                            aria-label="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2">
                        <span
                          className={
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border " +
                            (finalizado
                              ? "bg-muted text-muted-foreground border-border"
                              : "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30")
                          }
                        >
                          <span className={"w-2 h-2 rounded-full " + (finalizado ? "bg-muted-foreground" : "bg-green-500")} />
                          {finalizado ? "Finalizado" : "Em uso"}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {m.dosagem && <p><strong className="text-foreground">Dose:</strong> {m.dosagem}</p>}
                        {m.horario && <p><strong className="text-foreground">Horários:</strong> {m.horario}</p>}
                        {m.frequencia && <p><strong className="text-foreground">Frequência:</strong> {m.frequencia}</p>}
                        {(m.data_inicio || m.data_fim) && (
                          <p>
                            <strong className="text-foreground">Período:</strong>{" "}
                            {formatDate(m.data_inicio)} → {formatDate(m.data_fim)}
                          </p>
                        )}
                        {m.observacoes && <p className="italic pt-1">{m.observacoes}</p>}
                        {finalizado && (
                          <p className="text-xs font-medium text-muted-foreground pt-1">
                            ⚠️ Período de uso encerrado
                          </p>
                        )}
                      </div>
                    </div>
                  );
                });
              })()
            )}
          </TabsContent>

          {/* EXAMES */}
          <TabsContent value="exames" className="space-y-3 mt-4">
            <Button onClick={openCreateExame} className="w-full" size="lg">
              <Plus className="w-5 h-5 mr-1" /> Adicionar exame
            </Button>
            {exames.length === 0 ? (
              <div className="pet-card flex flex-col items-center text-center py-10">
                <FileText className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhum exame cadastrado.</p>
              </div>
            ) : (
              exames.map((e) => (
                <div key={e.id} className="pet-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-5 h-5 text-primary shrink-0" />
                      <h3 className="font-bold text-lg leading-tight truncate">{e.nome_exame}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditExame(e)}
                        className="text-muted-foreground hover:text-primary p-1"
                        aria-label="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExame(e.id)}
                        className="text-muted-foreground hover:text-destructive p-1"
                        aria-label="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Data: {formatDate(e.data_exame)}
                  </p>
                  {e.observacoes && (
                    <p className="text-sm italic text-muted-foreground mt-1">{e.observacoes}</p>
                  )}
                  {e.arquivo_url && (
                    <button
                      type="button"
                      onClick={() =>
                        abrirExame(e.arquivo_url).catch(() => toast.error("Não foi possível abrir o arquivo"))
                      }
                      className="inline-flex items-center gap-1.5 mt-3 text-primary hover:underline text-sm font-medium"
                    >
                      <ExternalLink className="w-4 h-4" /> Abrir arquivo
                    </button>
                  )}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* MEDICAMENTO DIALOG */}
      <Dialog open={medDialog} onOpenChange={setMedDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMedId ? "Editar medicamento" : "Novo medicamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input
                value={medForm.nome_medicamento}
                onChange={(e) => setMedForm({ ...medForm, nome_medicamento: e.target.value })}
                placeholder="Ex: Antibiótico"
              />
            </div>
            <div className="space-y-1">
              <Label>Dosagem</Label>
              <Input
                value={medForm.dosagem}
                onChange={(e) => setMedForm({ ...medForm, dosagem: e.target.value })}
                placeholder="Ex: 1 comprimido / 5ml"
              />
            </div>
            <div className="space-y-1">
              <Label>Horários (separados por vírgula)</Label>
              <Input
                value={medForm.horario}
                onChange={(e) => setMedForm({ ...medForm, horario: e.target.value })}
                placeholder="Ex: 08:00, 14:00, 20:00"
              />
            </div>
            <div className="space-y-1">
              <Label>Frequência</Label>
              <Input
                value={medForm.frequencia}
                onChange={(e) => setMedForm({ ...medForm, frequencia: e.target.value })}
                placeholder="Ex: Diário, 8 em 8h, 1x ao dia"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Início</Label>
                <Input
                  type="date"
                  value={medForm.data_inicio}
                  onChange={(e) => setMedForm({ ...medForm, data_inicio: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Fim</Label>
                <Input
                  type="date"
                  value={medForm.data_fim}
                  onChange={(e) => setMedForm({ ...medForm, data_fim: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Observações</Label>
              <Textarea
                rows={2}
                value={medForm.observacoes}
                onChange={(e) => setMedForm({ ...medForm, observacoes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setMedDialog(false); resetMed(); }} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMed} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EXAME DIALOG */}
      <Dialog open={exameDialog} onOpenChange={setExameDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExameId ? "Editar exame" : "Novo exame"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Nome do exame *</Label>
              <Input
                value={exameForm.nome_exame}
                onChange={(e) => setExameForm({ ...exameForm, nome_exame: e.target.value })}
                placeholder="Ex: Hemograma"
              />
            </div>
            <div className="space-y-1">
              <Label>Data do exame</Label>
              <Input
                type="date"
                value={exameForm.data_exame}
                onChange={(e) => setExameForm({ ...exameForm, data_exame: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Arquivo (PDF, imagem){editingExameId && editingExameUrl ? " — substituir" : ""}</Label>
              {editingExameId && editingExameUrl && !exameForm.file && (
                <a
                  href={editingExameUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mb-1"
                >
                  <ExternalLink className="w-3 h-3" /> Arquivo atual
                </a>
              )}
              <Input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setExameForm({ ...exameForm, file: e.target.files?.[0] ?? null })}
              />
              {exameForm.file && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Upload className="w-3 h-3" /> {exameForm.file.name}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Observações</Label>
              <Textarea
                rows={2}
                value={exameForm.observacoes}
                onChange={(e) => setExameForm({ ...exameForm, observacoes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setExameDialog(false); resetExame(); }} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveExame} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Saude;
