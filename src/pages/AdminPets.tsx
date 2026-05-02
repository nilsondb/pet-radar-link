import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/AdminLayout";
import { Loader2, Plus, Copy, ExternalLink, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Pet = {
  id: string;
  nome_pet: string | null;
  token: string | null;
  status_ativado: boolean;
  data_criacao: string;
};

const genId = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
};
const genToken = () => crypto.randomUUID().replace(/-/g, "").slice(0, 24);

const AdminPets = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pets")
      .select("id, nome_pet, token, status_ativado, data_criacao")
      .order("data_criacao", { ascending: false });
    if (error) toast.error(error.message);
    setPets((data as Pet[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const novoPet = async () => {
    setCreating(true);
    try {
      let id = genId();
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase.from("pets").select("id").eq("id", id).maybeSingle();
        if (!data) break;
        id = genId();
      }
      const token = genToken();
      const { error } = await supabase.from("pets").insert({
        id, token, status_ativado: false, nome_pet: "", nome_dono: "", telefone: "",
      } as any);
      if (error) throw error;
      const link = `${window.location.origin}/dashboard?id=${id}&token=${token}`;
      await navigator.clipboard.writeText(link).catch(() => {});
      toast.success("Pet criado! Link copiado.");
      load();
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar pet");
    } finally {
      setCreating(false);
    }
  };

  const copiarLink = (p: Pet) => {
    navigator.clipboard.writeText(`${window.location.origin}/dashboard?id=${p.id}&token=${p.token ?? ""}`);
    toast.success("Link copiado");
  };
  const abrirDashboard = (p: Pet) => window.open(`/dashboard?id=${p.id}${p.token ? `&token=${p.token}` : ""}`, "_blank");
  const abrirPublica = (p: Pet) => window.open(`/pet?id=${p.id}`, "_blank");

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
        <Button onClick={novoPet} disabled={creating}>
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Novo Pet
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="p-3">Nome</th>
                <th className="p-3">ID</th>
                <th className="p-3">Status</th>
                <th className="p-3">Criado</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pets.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3 font-medium">{p.nome_pet || <span className="text-muted-foreground">Não definido</span>}</td>
                  <td className="p-3 font-mono">{p.id}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${p.status_ativado ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                      {p.status_ativado ? "Ativo" : "Não ativado"}
                    </span>
                  </td>
                  <td className="p-3">{new Date(p.data_criacao).toLocaleDateString("pt-BR")}</td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-end flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => copiarLink(p)} title="Copiar link"><Copy className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => abrirDashboard(p)} title="Dashboard"><ExternalLink className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => abrirPublica(p)} title="Página pública"><Eye className="w-4 h-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" title="Excluir"><Trash2 className="w-4 h-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir pet?</AlertDialogTitle>
                            <AlertDialogDescription>O pet <b>{p.nome_pet || p.id}</b> será removido permanentemente.</AlertDialogDescription>
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
              ))}
              {pets.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum pet cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPets;
