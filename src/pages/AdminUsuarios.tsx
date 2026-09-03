import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { concederPapel, revogarPapel } from "@/lib/adminAuth";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, ShieldOff } from "lucide-react";

type Admin = { id: string; email: string; nome: string | null; ativo: boolean; created_at: string; user_id: string | null };

const AdminUsuarios = () => {
  const [list, setList] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [novo, setNovo] = useState({ email: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admins")
      .select("id,email,nome,ativo,created_at,user_id")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setList((data as Admin[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const criar = async () => {
    try {
      await concederPapel(novo.email, "admin");
      toast.success("Acesso administrativo concedido");
      setOpenNew(false);
      setNovo({ email: "" });
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const revogar = async (a: Admin) => {
    try {
      await revogarPapel(a.email, "admin");
      toast.success("Acesso administrativo revogado");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const editarNome = async (a: Admin, nome: string) => {
    const { error } = await supabase.from("admins").update({ nome }).eq("id", a.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <AdminLayout title="Usuários">
      <div className="flex items-center justify-between mb-4 gap-4">
        <p className="text-sm text-muted-foreground">
          O acesso administrativo é concedido a contas já existentes no login (Supabase Auth).
          A pessoa deve criar a conta primeiro e depois receber o papel de administrador aqui.
        </p>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4" /> Conceder admin</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Conceder acesso administrativo</DialogTitle></DialogHeader>
            <div className="space-y-2">
              <Label>E-mail da conta</Label>
              <Input type="email" value={novo.email} onChange={(e) => setNovo({ email: e.target.value })} />
              <p className="text-xs text-muted-foreground">
                A conta precisa existir. Senhas são gerenciadas pelo próprio usuário no login.
              </p>
            </div>
            <DialogFooter><Button onClick={criar}>Conceder</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /> : (
        <div className="bg-card border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr className="text-left">
              <th className="p-3">Nome</th><th className="p-3">Email</th><th className="p-3">Conta vinculada</th><th className="p-3">Ativo</th><th className="p-3 text-right">Ações</th>
            </tr></thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3">
                    <Input defaultValue={a.nome || ""} onBlur={(e) => e.target.value !== (a.nome || "") && editarNome(a, e.target.value)} className="h-8" />
                  </td>
                  <td className="p-3">{a.email}</td>
                  <td className="p-3">{a.user_id ? "Sim" : "Pendente"}</td>
                  <td className="p-3">{a.ativo ? "Sim" : "Não"}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => revogar(a)}>
                      <ShieldOff className="w-4 h-4" /> Revogar admin
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsuarios;
