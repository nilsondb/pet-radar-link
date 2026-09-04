import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { vetLogin } from "@/lib/vetAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Stethoscope } from "lucide-react";

const VetLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [login, setLogin] = useState({ email: "", senha: "" });

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const s = await vetLogin(login.email, login.senha);
      if (!s) throw new Error("Esta conta ainda não possui perfil veterinário liberado pela Authera.");
      toast.success("Acesso liberado.");
      navigate("/vet", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary">
      <div className="pet-card w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mx-auto mb-3 text-primary-foreground">
            <Stethoscope className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-primary">Authera Pet Pro</h1>
          <p className="text-sm text-muted-foreground">Área exclusiva para profissionais aprovados pela Authera.</p>
        </div>

        <form onSubmit={entrar} className="space-y-3">
          <div>
            <Label htmlFor="v-email">E-mail</Label>
            <Input id="v-email" type="email" required value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="v-senha">Senha</Label>
            <Input id="v-senha" type="password" required value={login.senha} onChange={(e) => setLogin({ ...login, senha: e.target.value })} />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Entrar
          </Button>
        </form>

        <div className="mt-5 border-t pt-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">Ainda não possui acesso profissional?</p>
          <Link to="/vet/solicitar"><Button variant="outline" className="w-full">Solicitar cadastro profissional</Button></Link>
        </div>
      </div>
    </div>
  );
};

export default VetLogin;
