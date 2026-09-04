import { ReactNode, useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUser, signIn, signUp } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, PawPrint, MailCheck } from "lucide-react";

/**
 * Protege as áreas privadas do tutor.
 * A sessão oficial é a do Supabase Auth; o acesso aos dados é garantido por RLS.
 * O token da tag serve apenas como prova de posse para o tutor assumir (claim) o pet.
 */
export const TutorGate = ({ children }: { children: ReactNode }) => {
  const [estado, setEstado] = useState<"checando" | "anon" | "ok">("checando");
  const [confirmar, setConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", senha: "" });

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const token = params.get("token");

  const verificar = useCallback(async () => {
    const user = await getUser();
    if (!user) {
      setEstado("anon");
      return;
    }
    // Claim do pet legado/ativado usando o token da própria tag
    if (id && token) {
      const { data: pet } = await supabase.from("pets").select("id").eq("id", id).maybeSingle();
      if (!pet) {
        await supabase.rpc("reivindicar_pet", { p_id: id, p_token: token });
      }
    }
    // O token da tag não é credencial de sessão: fora da ativação ele sai da URL.
    if (token && window.location.pathname !== "/setup") {
      const limpo = new URLSearchParams(window.location.search);
      limpo.delete("token");
      const qs = limpo.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${qs ? `?${qs}` : ""}`
      );
    }
    setEstado("ok");
  }, [id, token]);

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
    setLoading(true);
    try {
      const session = await signUp(form.email, form.senha, { tipo: "tutor" });
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary">
      <div className="pet-card w-full max-w-sm">
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mx-auto mb-3 text-primary-foreground">
            <PawPrint className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-primary">Authera Pet 🐾</h1>
          <p className="text-sm text-muted-foreground">Entre para acessar os dados do seu pet</p>
        </div>

        {confirmar ? (
          <div className="text-center space-y-3">
            <MailCheck className="w-10 h-10 mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Enviamos um e-mail de confirmação para <strong>{form.email}</strong>. Confirme o
              endereço e volte a esta página para continuar.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setConfirmar(false)}>
              Voltar
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="cadastro">Criar conta</TabsTrigger>
            </TabsList>
            {(["login", "cadastro"] as const).map((tab) => (
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
                    {tab === "login" ? "Entrar" : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
};
