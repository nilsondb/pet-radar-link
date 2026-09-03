import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { adminLogin, reivindicarAdminLegado, adminSessionAtual } from "@/lib/adminAuth";
import { ShieldCheck } from "lucide-react";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [precisaVincular, setPrecisaVincular] = useState(false);
  const [legado, setLegado] = useState({ email: "", senha: "" });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const session = await adminLogin(email.trim(), senha);
      if (!session) {
        // Conta autenticada, mas ainda sem papel de administrador no banco
        setPrecisaVincular(true);
        setLegado({ email: email.trim(), senha: "" });
        toast.error("Esta conta ainda não possui acesso administrativo.");
        return;
      }
      navigate("/admin", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Email ou senha inválidos");
    } finally {
      setLoading(false);
    }
  };

  const vincular = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await reivindicarAdminLegado(legado.email, legado.senha);
      const session = await adminSessionAtual();
      if (!session) throw new Error("Não foi possível confirmar o acesso administrativo");
      toast.success("Acesso administrativo vinculado à sua conta");
      navigate("/admin", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Não foi possível vincular");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-sm space-y-4">
        <form onSubmit={onSubmit} className="bg-card rounded-2xl shadow-lg p-6 space-y-4 border">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-primary">Authera Pet 🐾</h1>
            <p className="text-sm text-muted-foreground">Área administrativa</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required autoComplete="current-password" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        {precisaVincular && (
          <form onSubmit={vincular} className="bg-card rounded-2xl shadow-lg p-6 space-y-3 border">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Vincular acesso administrativo antigo</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Informe o e-mail e a senha do administrador do sistema anterior para vincular esse
              acesso à sua conta atual. Essa validação é feita no servidor.
            </p>
            <div className="space-y-2">
              <Label htmlFor="l-email">E-mail do admin antigo</Label>
              <Input id="l-email" type="email" required value={legado.email}
                onChange={(e) => setLegado({ ...legado, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="l-senha">Senha antiga</Label>
              <Input id="l-senha" type="password" required value={legado.senha}
                onChange={(e) => setLegado({ ...legado, senha: e.target.value })} />
            </div>
            <Button type="submit" variant="outline" className="w-full" disabled={loading}>
              Vincular acesso
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
