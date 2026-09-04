import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { concluirCadastroVeterinario, vetLogin, vetSignup } from "@/lib/vetAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Stethoscope } from "lucide-react";

const VetLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [params] = useSearchParams();
  const [modo, setModo] = useState(params.get("modo") === "cadastro" ? "cadastro" : "login");
  const [login, setLogin] = useState({ email: "", senha: "" });
  const [cad, setCad] = useState({
    nome: "", email: "", senha: "", telefone: "", crmv: "", uf_crmv: "", clinica: "", especialidade: "",
  });

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const s = await vetLogin(login.email, login.senha);
      if (!s) {
        setCad((atual) => ({ ...atual, email: login.email }));
        setModo("concluir");
        return toast.info("Conta autenticada. Conclua seu cadastro profissional para liberar o acesso.");
      }
      toast.success("Acesso liberado.");
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
      const r = await vetSignup(cad);
      if (r.status === "confirmacao_pendente") {
        toast.info("Conta criada. Cadastro profissional pendente até a confirmação do e-mail.");
        return;
      }
      toast.success("Perfil concluído. Acesso liberado.");
      navigate("/vet", { replace: true });
    } catch (err: any) {
      toast.error(err.message?.includes("already") ? "E-mail já cadastrado." : err.message || "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  };

  const concluirPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const perfil = await concluirCadastroVeterinario(cad);
      if (!perfil) throw new Error("Perfil profissional ainda não foi liberado.");
      toast.success("Perfil concluído. Acesso liberado.");
      navigate("/vet", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Erro ao concluir o cadastro profissional");
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

        <Tabs value={modo} onValueChange={setModo}>
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

          <TabsContent value="concluir">
            <form onSubmit={concluirPerfil} className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Use esta opção se sua conta já existe e está autenticada, mas o perfil profissional ficou pendente.
              </p>
              <div>
                <Label htmlFor="r-nome">Nome completo *</Label>
                <Input id="r-nome" required value={cad.nome} onChange={(e) => setCad({ ...cad, nome: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="r-crmv">CRMV</Label>
                  <Input id="r-crmv" value={cad.crmv} onChange={(e) => setCad({ ...cad, crmv: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="r-uf">UF</Label>
                  <Input id="r-uf" maxLength={2} value={cad.uf_crmv}
                    onChange={(e) => setCad({ ...cad, uf_crmv: e.target.value.toUpperCase() })} />
                </div>
              </div>
              <div>
                <Label htmlFor="r-clinica">Clínica</Label>
                <Input id="r-clinica" value={cad.clinica} onChange={(e) => setCad({ ...cad, clinica: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="r-tel">Telefone</Label>
                <Input id="r-tel" value={cad.telefone} onChange={(e) => setCad({ ...cad, telefone: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Concluir cadastro profissional
              </Button>
            </form>
          </TabsContent>

          <Button
            type="button"
            variant="link"
            className="mt-4 w-full"
            onClick={() => setModo(modo === "concluir" ? "login" : "concluir")}
          >
            {modo === "concluir" ? "Voltar para entrar" : "Já tenho conta e preciso concluir meu perfil"}
          </Button>
        </Tabs>
      </div>
    </div>
  );
};

export default VetLogin;
