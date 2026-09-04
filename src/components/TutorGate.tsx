import { ReactNode, useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUser, hasRole, signIn, signUp } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, PawPrint, MailCheck, ShieldAlert } from "lucide-react";

/**
 * Área do tutor:
 * - Cadastro novo só existe quando a pessoa chega por um link válido de ativação da TAG.
 * - Fora do /setup, é obrigatório já possuir papel `tutor`.
 * - Durante /setup?id=UID&token=..., uma conta autenticada ainda sem papel tutor pode
 *   continuar; a RPC ativar_pet_com_token cria/vincula o tutor e concede o papel tutor.
 */
export const TutorGate = ({ children }: { children: ReactNode }) => {
  const [estado, setEstado] = useState<"checando" | "anon" | "sem_papel" | "ok">("checando");
  const [confirmar, setConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", senha: "" });

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const token = params.get("token");
  const emAtivacao = window.location.pathname === "/setup" && !!id && !!token;

  const verificar = useCallback(async () => {
    const user = await getUser();
    if (!user) {
      setEstado("anon");
      return;
    }

    // No fluxo de ativação, a própria RPC de ativação conclui o perfil tutor.
    if (emAtivacao) {
      setEstado("ok");
      return;
    }

    // Nas demais páginas privadas, somente contas com papel tutor entram.
    if (!(await hasRole("tutor"))) {
      setEstado("sem_papel");
      return;
    }

    // Token de ativação nunca deve permanecer fora da tela /setup.
    if (token) {
      const limpo = new URLSearchParams(window.location.search);
      limpo.delete("token");
      const qs = limpo.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
    }

    setEstado("ok");
  }, [emAtivacao, token]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      verificar();
    });
    verificar();
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(form.email, form.senha);
      await verificar();
    } catch (err: any) {
      toast.error(err.message || "Não foi possível entrar");
    } finally {
      setLoading(false);
    }
  };

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emAtivacao) {
      toast.error("Novos tutores só podem se cadastrar por um link de ativação da TAG.");
      return;
    }

    setLoading(true);
    try {
      const redirectTo = window.location.href;
      const session = await signUp(
        form.email,
        form.senha,
        { tipo: "tutor", origem: "ativacao_tag", tag_uid: id },
        redirectTo
      );
      if (!session) {
        setConfirmar(true);
        return;
      }
      await verificar();
    } catch (err: any) {
      toast.error(err.message || "Não foi possível criar a conta");
    } finally {
      setLoading(false);
    }
  };

  if (estado === "checando") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (estado === "ok") return <>{children}</>;

  if (estado === "sem_papel") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-secondary">
        <div className="pet-card w-full max-w-sm text-center space-y-3">
          <ShieldAlert className="w-10 h-10 mx-auto text-primary" />
          <h1 className="text-xl font-bold">Conta sem perfil de tutor</h1>
          <p className="text-sm text-muted-foreground">
            Esta conta não possui acesso à área do tutor. O primeiro cadastro de tutor é criado a partir do link de ativação recebido com uma TAG Authera Pet ou durante o atendimento veterinário.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary">
      <div className="pet-card w-full max-w-sm">
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mx-auto mb-3 text-primary-foreground">
            <PawPrint className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-primary">Authera Pet 🐾</h1>
          <p className="text-sm text-muted-foreground">
            {emAtivacao ? "Ative sua TAG e crie o acesso ao seu pet" : "Entre para acessar os dados do seu pet"}
          </p>
        </div>

        {confirmar ? (
          <div className="text-center space-y-3">
            <MailCheck className="w-10 h-10 mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Enviamos um e-mail de confirmação para <strong>{form.email}</strong>. Após confirmar, o link retorna para esta mesma ativação para você cadastrar o pet.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setConfirmar(false)}>
              Voltar
            </Button>
          </div>
        ) : emAtivacao ? (
          <Tabs defaultValue="cadastro">
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="cadastro">Criar conta</TabsTrigger>
              <TabsTrigger value="login">Já tenho conta</TabsTrigger>
            </TabsList>
            {(["cadastro", "login"] as const).map((tab) => (
              <TabsContent key={tab} value={tab}>
                <form onSubmit={tab === "login" ? entrar : criar} className="space-y-3">
                  <div>
                    <Label htmlFor={`${tab}-email`}>E-mail</Label>
                    <Input
                      id={`${tab}-email`}
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${tab}-senha`}>Senha</Label>
                    <Input
                      id={`${tab}-senha`}
                      type="password"
                      required
                      minLength={6}
                      autoComplete={tab === "login" ? "current-password" : "new-password"}
                      value={form.senha}
                      onChange={(e) => setForm({ ...form, senha: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {tab === "login" ? "Entrar e continuar" : "Criar conta e continuar"}
                  </Button>
                </form>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <form onSubmit={entrar} className="space-y-3">
            <div>
              <Label htmlFor="login-email">E-mail</Label>
              <Input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="login-senha">Senha</Label>
              <Input
                id="login-senha"
                type="password"
                required
                autoComplete="current-password"
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Entrar
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Ainda não é tutor? O cadastro é liberado pelo link de ativação da TAG Authera Pet.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
