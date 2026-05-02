import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminSetPassword, getAdminSession } from "@/lib/adminAuth";
import { toast } from "sonner";

const AdminPerfil = () => {
  const session = getAdminSession();
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");

  const salvar = async () => {
    if (!session) return;
    if (senha.length < 6) return toast.error("Senha mínima de 6 caracteres");
    if (senha !== confirma) return toast.error("Senhas não coincidem");
    try {
      await adminSetPassword(session.id, senha);
      toast.success("Senha alterada com sucesso");
      setSenha(""); setConfirma("");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <AdminLayout title="Perfil">
      <div className="bg-card border rounded-xl p-6 max-w-md space-y-4">
        <div>
          <Label>Email</Label>
          <Input value={session?.email || ""} disabled />
        </div>
        <div>
          <Label>Nova senha</Label>
          <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </div>
        <div>
          <Label>Confirmar senha</Label>
          <Input type="password" value={confirma} onChange={(e) => setConfirma(e.target.value)} />
        </div>
        <Button onClick={salvar}>Alterar senha</Button>
      </div>
    </AdminLayout>
  );
};

export default AdminPerfil;
