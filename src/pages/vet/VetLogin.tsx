import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { vetLogin, vetSignup } from "@/lib/vetAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Stethoscope } from "lucide-react";

const VetLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [login, setLogin] = useState({ email: "", senha: "" });
  const [cad, setCad] = useState({
    nome: "", email: "", senha: "", telefone: "", crmv: "", uf_crmv: "", clinica: "", especialidade: "",
  });

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const s = await vetLogin(login.email, login.senha);
      if (!s) return toast.error("E-mail ou senha inválidos.");
      navigate("/vet", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await vetSignup(cad);
      toast.success("Cadastro realizado! 🩺");
      navigate("/vet", { replace: true });
    } catch (err: any) {
      toast.error(err.message?.includes("duplicate") ? "E-mail já cadastrado." : err.message || "Erro ao cadastrar");
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
          <p className="text-sm text-muted-foreground">Área do médico veterinário</p>
        </div>

        <Tabs defaultValue="login">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="cadastro">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={entrar} className="space-y-3">
              <div>
                <Label htmlFor="v-email">E-mail</Label>
                <Input id="v-email" type="email" required value={login.email}
                  onChange={(e) => setLogin({ ...login, email: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="v-senha">Senha</Label>
                <Input id="v-senha" type="password" required value={login.senha}
                  onChange={(e) => setLogin({ ...login, senha: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Entrar
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="cadastro">
            <form onSubmit={cadastrar} className="space-y-3">
              <div>
                <Label htmlFor="c-nome">Nome completo *</Label>
                <Input id="c-nome" required value={cad.nome} onChange={(e) => setCad({ ...cad, nome: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="c-crmv">CRMV</Label>
                  <Input id="c-crmv" value={cad.crmv} onChange={(e) => setCad({ ...cad, crmv: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="c-uf">UF</Label>
                  <Input id="c-uf" maxLength={2} value={cad.uf_crmv}
                    onChange={(e) => setCad({ ...cad, uf_crmv: e.target.value.toUpperCase() })} />
                </div>
              </div>
              <div>
                <Label htmlFor="c-clinica">Clínica</Label>
                <Input id="c-clinica" value={cad.clinica} onChange={(e) => setCad({ ...cad, clinica: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="c-tel">Telefone</Label>
                <Input id="c-tel" value={cad.telefone} onChange={(e) => setCad({ ...cad, telefone: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="c-email">E-mail *</Label>
                <Input id="c-email" type="email" required value={cad.email}
                  onChange={(e) => setCad({ ...cad, email: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="c-senha">Senha *</Label>
                <Input id="c-senha" type="password" required minLength={6} value={cad.senha}
                  onChange={(e) => setCad({ ...cad, senha: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Criar conta
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VetLogin;
