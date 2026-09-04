import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Stethoscope } from "lucide-react";

type Solicitacao = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  crmv: string | null;
  uf_crmv: string | null;
  clinica: string | null;
  especialidade: string | null;
  status: "pending" | "invited" | "registered" | "rejected";
  created_at: string;
};

const gerarToken = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

const AdminVetSolicitacoes = () => {
  const [lista, setLista] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [convite, setConvite] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vet_solicitacoes_cadastro")
      .select("id,nome,email,telefone,crmv,uf_crmv,clinica,especialidade,status,created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setLista((data as Solicitacao[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const preparar = async (s: Solicitacao) => {
    const token = gerarToken();
    const expira = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.rpc("admin_preparar_convite_veterinario", {
      p_solicitacao_id: s.id,
      p_token: token,
      p_expira_em: expira,
    });
    if (error) return toast.error(error.message);
    const link = `${window.location.origin}/vet/convite?token=${encodeURIComponent(token)}`;
    setConvite(link);
    toast.success("Convite profissional preparado. O link é exibido somente agora.");
    load();
  };

  const rejeitar = async (id: string) => {
    const { error } = await supabase.from("vet_solicitacoes_cadastro").update({ status: "rejected", updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Solicitação rejeitada.");
    load();
  };

  return (
    <AdminLayout title="Solicitações de Veterinários">
      <div className="mb-5 bg-card border rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <Stethoscope className="w-7 h-7 text-primary" />
          <div>
            <h3 className="font-bold">Cadastro profissional controlado</h3>
            <p className="text-sm text-muted-foreground">O veterinário solicita acesso; a Authera analisa e gera um convite único após aprovação.</p>
          </div>
        </div>
      </div>

      {convite && (
        <div className="mb-5 bg-primary/10 border border-primary/20 rounded-2xl p-4 space-y-2">
          <p className="font-semibold">Link de convite — exibição única</p>
          <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono" value={convite} readOnly onFocus={(e) => e.currentTarget.select()} />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => window.open(convite, "_blank", "noopener,noreferrer")}>Abrir convite</Button>
          </div>
          <p className="text-xs text-muted-foreground">Validade: 7 dias. O banco armazena somente o hash do token.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left"><tr>{["Profissional","CRMV","Clínica","Status","Solicitado","Ações"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {lista.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3"><div className="font-medium">{s.nome}</div><div className="text-xs text-muted-foreground">{s.email}</div><div className="text-xs text-muted-foreground">{s.telefone || ""}</div></td>
                  <td className="px-4 py-3">{s.crmv || "—"}{s.uf_crmv ? ` / ${s.uf_crmv}` : ""}</td>
                  <td className="px-4 py-3">{s.clinica || "—"}</td>
                  <td className="px-4 py-3">{s.status}</td>
                  <td className="px-4 py-3">{new Date(s.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3"><div className="flex gap-2">{(s.status === "pending" || s.status === "invited") && <Button size="sm" onClick={() => preparar(s)}>Preparar convite</Button>}{s.status === "pending" && <Button size="sm" variant="outline" onClick={() => rejeitar(s.id)}>Rejeitar</Button>}</div></td>
                </tr>
              ))}
              {lista.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Nenhuma solicitação encontrada.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminVetSolicitacoes;
