import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/AdminLayout";
import { Loader2, ExternalLink, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Pet = {
  id: string;
  codigo_publico: string;
  nome: string | null;
  ativo: boolean;
  status_perdido: boolean;
  created_at: string;
  tutor_id: string | null;
  tutores?: { id: string; nome: string | null; telefone: string | null } | null;
  tags?: { uid_publico: string; status: string }[] | null;
};

const AdminPets = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativos" | "inativos" | "perdidos">("todos");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pets")
      .select("id, codigo_publico, nome, ativo, status_perdido, created_at, tutor_id, tutores(id, nome, telefone), tags(uid_publico, status)")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setPets((data as unknown as Pet[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const tagAtiva = (p: Pet) => p.tags?.find((tag) => tag.status === "active") ?? null;
  const tutorNome = (p: Pet) => p.tutores?.nome || "";
  const tutorTel = (p: Pet) => p.tutores?.telefone || "";
  const petsDoTutor = (p: Pet) => p.tutor_id ? pets.filter((x) => x.tutor_id === p.tutor_id).length : 1;

  const filtered = pets.filter((p) => {
    if (statusFilter === "ativos" && !p.ativo) return false;
    if (statusFilter === "inativos" && p.ativo) return false;
    if (statusFilter === "perdidos" && !p.status_perdido) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.nome || "").toLowerCase().includes(q) ||
      p.codigo_publico.toLowerCase().includes(q) ||
      (tagAtiva(p)?.uid_publico || "").toLowerCase().includes(q) ||
      tutorNome(p).toLowerCase().includes(q) ||
      tutorTel(p).replace(/\D/g, "").includes(q.replace(/\D/g, "") || "\u0000")
    );
  });

  const abrirDashboard = (p: Pet) => window.open(`/dashboard?id=${p.id}`, "_blank");
  const abrirPublica = (p: Pet) => {
    const tag = tagAtiva(p);
    if (!tag) return toast.error("Este pet não possui TAG ativa.");
    window.open(`/pet?id=${tag.uid_publico}`, "_blank");
  };

  const deletar = async (p: Pet) => {
    const { error } = await supabase.from("pets").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Pet excluído");
    load();
  };

  return (
    <AdminLayout title="Pets">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">{pets.length} pets cadastrados</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, código, TAG ou tutor..."
          className="flex-1 h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex gap-1 flex-wrap">
          {([
            { v: "todos", label: "Todos" },
            { v: "ativos", label: "Ativos" },
            { v: "inativos", label: "Inativos" },
            { v: "perdidos", label: "Perdidos" },
          ] as const).map((o) => (
            <button
              key={o.v}
              onClick={() => setStatusFilter(o.v)}
              className={`px-3 h-10 rounded-lg text-sm font-medium border transition-colors ${
                statusFilter === o.v
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="p-3">Nome</th>
                <th className="p-3">Tutor</th>
                <th className="p-3">Código / TAG</th>
                <th className="p-3">Status</th>
                <th className="p-3">Criado</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const tag = tagAtiva(p);
                return (
                  <tr key={p.id} className="border-t hover:bg-muted/40">
                    <td className="p-3 font-medium">{p.nome || <span className="text-muted-foreground">Não definido</span>}</td>
                    <td className="p-3">
                      {tutorNome(p) ? (
                        <div>
                          <div className="font-medium">{tutorNome(p)}</div>
                          <div className="text-xs text-muted-foreground">
                            {tutorTel(p)}{petsDoTutor(p) > 1 && ` · ${petsDoTutor(p)} pets`}
                          </div>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="p-3">
                      <div className="font-mono">{p.codigo_publico}</div>
                      <div className="text-xs text-muted-foreground font-mono">{tag?.uid_publico || "Sem TAG ativa"}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${p.ativo ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                          {p.ativo ? "Ativo" : "Inativo"}
                        </span>
                        {p.status_perdido && <span className="px-2 py-0.5 rounded-full text-xs bg-destructive/15 text-destructive">Perdido</span>}
                      </div>
                    </td>
                    <td className="p-3">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => abrirDashboard(p)} title="Dashboard"><ExternalLink className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => abrirPublica(p)} title="Página pública" disabled={!tag}><Eye className="w-4 h-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" title="Excluir"><Trash2 className="w-4 h-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir pet?</AlertDialogTitle>
                              <AlertDialogDescription>O pet <b>{p.nome || p.codigo_publico}</b> será removido permanentemente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deletar(p)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum pet encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPets;
