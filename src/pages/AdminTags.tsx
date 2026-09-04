import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Loader2, Nfc, Search } from "lucide-react";
import { toast } from "sonner";

type TagRow = {
  id: string;
  uid_publico: string;
  pet_id: string | null;
  status: string;
  created_at: string;
  activated_at: string | null;
  pet: { nome_pet: string | null; tutor_id: string | null; tutores: { nome: string } | null } | null;
};

type Solicitacao = {
  id: string;
  pet_id: string;
  status: string;
  tag_uid: string | null;
  created_at: string;
  observacoes: string | null;
};

const statusClass: Record<string, string> = {
  ativa: "bg-success/15 text-success",
  estoque: "bg-primary/15 text-primary",
  inativa: "bg-muted text-muted-foreground",
  substituida: "bg-destructive/15 text-destructive",
};

const AdminTags = () => {
  const [tags, setTags] = useState<TagRow[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todas");

  const [prepararOpen, setPrepararOpen] = useState(false);
  const [prep, setPrep] = useState({ uid: "", pet_id: "", solicitacao: "" });
  const [salvando, setSalvando] = useState(false);
  const [tokenGerado, setTokenGerado] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: t }, { data: s }] = await Promise.all([
      supabase
        .from("tags")
        .select("id, uid_publico, pet_id, status, created_at, activated_at, pet:pets(nome_pet, tutor_id, tutores(nome))")
        .order("created_at", { ascending: false }),
      supabase
        .from("tag_solicitacoes")
        .select("id, pet_id, status, tag_uid, created_at, observacoes")
        .order("created_at", { ascending: false }),
    ]);
    setTags((t as unknown as TagRow[]) || []);
    setSolicitacoes((s as Solicitacao[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const preparar = async () => {
    const uid = prep.uid.trim().toUpperCase();
    const pet = prep.pet_id.trim();
    if (!uid || !pet) return toast.error("Informe o UID da TAG e o pet.");
    setSalvando(true);
    try {
      const { data, error } = await supabase.rpc("admin_preparar_tag", {
        p_uid: uid,
        p_pet_id: pet,
        p_solicitacao: prep.solicitacao || null,
      });
      if (error) throw error;
      setTokenGerado(data as string);
      toast.success("TAG preparada. Envie o link de ativação ao tutor.");
      load();
    } catch (e: any) {
      toast.error(e.message || "Não foi possível preparar a TAG");
    } finally {
      setSalvando(false);
    }
  };

  const alterarStatus = async (tag: TagRow, status: string) => {
    const { error } = await supabase
      .from("tags")
      .update({ status, deactivated_at: status === "ativa" ? null : new Date().toISOString() })
      .eq("id", tag.id);
    if (error) return toast.error(error.message);
    toast.success("Status da TAG atualizado. O pet e o histórico são preservados.");
    load();
  };

  const copiarLink = (uid: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/meus-pets?tag=${uid}`);
    toast.success("Link copiado");
  };

  const filtradas = tags.filter((t) => {
    const q = filtro.trim().toLowerCase();
    const okStatus = statusFiltro === "todas" || t.status === statusFiltro;
    return (
      okStatus &&
      (!q ||
        t.uid_publico.toLowerCase().includes(q) ||
        (t.pet_id || "").toLowerCase().includes(q) ||
        (t.pet?.nome_pet || "").toLowerCase().includes(q))
    );
  });

  const pendentes = solicitacoes.filter((s) => s.status === "pendente");

  return (
    <AdminLayout title="TAGs">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total", valor: tags.length },
          { label: "Em estoque", valor: tags.filter((t) => t.status === "estoque").length },
          { label: "Ativas", valor: tags.filter((t) => t.status === "ativa").length },
          { label: "Solicitações pendentes", valor: pendentes.length },
        ].map((c) => (
          <div key={c.label} className="bg-card border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-bold">{c.valor}</p>
          </div>
        ))}
      </div>

      {pendentes.length > 0 && (
        <div className="bg-card border rounded-2xl p-5 mb-5">
          <h3 className="font-bold mb-3">Solicitações de TAG</h3>
          <div className="space-y-2">
            {pendentes.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 text-sm border-b pb-2 last:border-0">
                <span className="font-mono">{s.pet_id}</span>
                <span className="text-muted-foreground">
                  {new Date(s.created_at).toLocaleDateString("pt-BR")}
                </span>
                {s.observacoes && <span className="text-muted-foreground">{s.observacoes}</span>}
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                  onClick={() => {
                    setPrep({ uid: "", pet_id: s.pet_id, solicitacao: s.id });
                    setTokenGerado(null);
                    setPrepararOpen(true);
                  }}
                >
                  Preparar TAG
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por UID, pet" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
        </div>
        <select
          className="border rounded-lg px-3 py-2 text-sm bg-background"
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
        >
          {["todas", "estoque", "ativa", "inativa", "substituida"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <Button onClick={() => { setPrep({ uid: "", pet_id: "", solicitacao: "" }); setTokenGerado(null); setPrepararOpen(true); }}>
          <Nfc className="w-4 h-4 mr-1" /> Preparar TAG
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                {["UID público", "Pet", "Tutor", "Status", "Criada", "Ativada", "Ações"].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtradas.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-mono">{t.uid_publico}</td>
                  <td className="px-4 py-3">{t.pet?.nome_pet || t.pet_id || "—"}</td>
                  <td className="px-4 py-3">{t.pet?.tutores?.nome || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass[t.status] || "bg-muted"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(t.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {t.activated_at ? new Date(t.activated_at).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => copiarLink(t.uid_publico)}>
                        <Copy className="w-3 h-3 mr-1" /> Link
                      </Button>
                      {t.status !== "inativa" && (
                        <Button size="sm" variant="outline" onClick={() => alterarStatus(t, "inativa")}>Inativar</Button>
                      )}
                      {t.status !== "substituida" && t.status === "ativa" && (
                        <Button size="sm" variant="outline" onClick={() => alterarStatus(t, "substituida")}>Substituir</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Nenhuma TAG encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={prepararOpen} onOpenChange={setPrepararOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Preparar TAG para um pet existente</DialogTitle>
            <DialogDescription>
              A TAG é vinculada ao pet que já existe — nenhum pet novo é criado e o histórico é
              preservado. O código de ativação é entregue somente ao tutor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>UID público da TAG</Label>
              <Input value={prep.uid} onChange={(e) => setPrep({ ...prep, uid: e.target.value })} placeholder="Ex: 9YUY9X" />
            </div>
            <div>
              <Label>ID do pet</Label>
              <Input value={prep.pet_id} onChange={(e) => setPrep({ ...prep, pet_id: e.target.value })} placeholder="Ex: APX12Y" />
            </div>
            <Button onClick={preparar} disabled={salvando} className="w-full">
              {salvando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Preparar TAG
            </Button>
            {tokenGerado && (
              <div className="p-3 rounded-xl bg-muted text-sm space-y-2">
                <p className="font-medium">Código de ativação do tutor</p>
                <p className="font-mono break-all">{tokenGerado}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/meus-pets?tag=${prep.uid.trim().toUpperCase()}&codigo=${tokenGerado}`
                    );
                    toast.success("Link de ativação copiado");
                  }}
                >
                  <Copy className="w-3 h-3 mr-1" /> Copiar link para o tutor
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminTags;
