import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { adminCreate, adminSetPassword } from "@/lib/adminAuth";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, KeyRound } from "lucide-react";

type Admin = { id: string; email: string; nome: string | null; ativo: boolean; created_at: string };

const AdminUsuarios = () => {
  const [list, setList] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [novo, setNovo] = useState({ email: "", nome: "", senha: "" });
  const [resetId, setResetId] = useState<string | null>(null);
  const [novaSenha, setNovaSenha] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("admins").select("id,email,nome,ativo,created_at").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setList((data as Admin[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const criar = async () => {
    try {
      await adminCreate(novo.email.trim(), novo.senha, novo.nome.trim());
      toast.success("Admin criado");
      setOpenNew(false);
      setNovo({ email: "", nome: "", senha: "" });
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const toggleAtivo = async (a: Admin) => {
    const { error } = await supabase.from("admins").update({ ativo: !a.ativo }).eq("id", a.id);
    if (error) return toast.error(error.message);
    load();
  };

  const editarNome = async (a: Admin, nome: string) => {
    const { error } = await supabase.from("admins").update({ nome }).eq("id", a.id);
    if (error) return toast.error(error.message);
    load();
  };

  const resetar = async () => {
    if (!resetId || novaSenha.length < 6) { toast.error("Senha mínima de 6 caracteres"); return; }
    try {
      await adminSetPassword(resetId, novaSenha);
      toast.success("Senha redefinida");
      setResetId(null); setNovaSenha("");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <AdminLayout title="Usuários">
      <div className="flex justify-end mb-4">
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4" /> Novo admin</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo admin</DialogTitle></DialogHeader>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
              <Label>Email</Label>
              <Input value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} />
              <Label>Senha</Label>
              <Input type="password" value={novo.senha} onChange={(e) => setNovo({ ...novo, senha: e.target.value })} />
            </div>
            <DialogFooter><Button onClick={criar}>Criar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /> : (
        <div className="bg-card border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr className="text-left">
              <th className="p-3">Nome</th><th className="p-3">Email</th><th className="p-3">Ativo</th><th className="p-3 text-right">Ações</th>
            </tr></thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3">
                    <Input defaultValue={a.nome || ""} onBlur={(e) => e.target.value !== (a.nome || "") && editarNome(a, e.target.value)} className="h-8" />
                  </td>
                  <td className="p-3">{a.email}</td>
                  <td className="p-3"><Switch checked={a.ativo} onCheckedChange={() => toggleAtivo(a)} /></td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => setResetId(a.id)}><KeyRound className="w-4 h-4" /> Resetar senha</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!resetId} onOpenChange={(o) => !o && setResetId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resetar senha</DialogTitle></DialogHeader>
          <Label>Nova senha</Label>
          <Input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
          <DialogFooter><Button onClick={resetar}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsuarios;
