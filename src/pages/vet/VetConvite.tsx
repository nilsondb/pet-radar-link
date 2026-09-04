import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getUser, signIn, signUp } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, MailCheck, ShieldAlert, Stethoscope } from "lucide-react";

type Convite = {
  nome: string;
  email: string;
  telefone: string | null;
  crmv: string | null;
  uf_crmv: string | null;
  clinica: string | null;
  especialidade: string | null;
};

type PerfilForm = { nome: string; telefone: string; crmv: string; uf_crmv: string; clinica: string; especialidade: string };

const VetConvite = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [convite, setConvite] = useState<Convite | null>(null);
  const [senha, setSenha] = useState("");
  const [modo, setModo] = useState<"cadastro" | "login">("cadastro");
  const [form, setForm] = useState<PerfilForm>({ nome: "", telefone: "", crmv: "", uf_crmv: "", clinica: "", especialidade: "" });

  const concluir = async (dados: PerfilForm) => {
    if (!token) return;
    const { error } = await supabase.rpc("concluir_convite_veterinario", {
      p_token: token,
      p_nome: dados.nome.trim(),
      p_telefone: dados.telefone.trim() || null,
      p_crmv: dados.crmv.trim() || null,
      p_uf_crmv: dados.uf_crmv.trim() || null,
      p_clinica: dados.clinica.trim() || null,
      p_especialidade: dados.especialidade.trim() || null,
    });
    if (error) throw error;
    toast.success("Cadastro profissional concluído.");
    navigate("/vet", { replace: true });
  };

  useEffect(() => {
    let ativo = true;
    (async () => {
      if (!token) {
        if (ativo) setLoading(false);
        return;
      }
      const { data, error } = await supabase.rpc("validar_convite_veterinario", { p_token: token });
      if (error) toast.error(error.message);
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        if (ativo) setLoading(false);
        return;
      }
      const c = row as Convite;
      const dados: PerfilForm = {
        nome: c.nome || "",
        telefone: c.telefone || "",
        crmv: c.crmv || "",
        uf_crmv: c.uf_crmv || "",
        clinica: c.clinica || "",
        especialidade: c.especialidade || "",
      };
      if (ativo) {
        setConvite(c);
        setForm(dados);
      }

      const user = await getUser();
      if (user && user.email?.toLowerCase() === c.email.toLowerCase()) {
        try {
          if (ativo) setSaving(true);
          await concluir(dados);
          return;
        } catch (err: any) {
          toast.error(err.message || "Não foi possível concluir o convite.");
        } finally {
          if (ativo) setSaving(false);
        }
      }
      if (ativo) setLoading(false);
    })();
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convite) return;
    setSaving(true);
    try {
      if (modo === "login") {
        await signIn(convite.email, senha);
        await concluir(form);
        return;
      }
      const session = await signUp(
        convite.email,
        senha,
        { tipo: "veterinarian", origem: "convite_authera", vet_convite: token },
        window.location.href
      );
      if (!session) {
        setConfirmar(true);
        return;
      }
      await concluir(form);
    } catch (err: any) {
      toast.error(err.message || "Não foi possível concluir o cadastro profissional.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || saving) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!convite) {
    return <div className="min-h-screen flex items-center justify-center p-4 bg-secondary"><div className="pet-card max-w-md text-center"><ShieldAlert className="w-12 h-12 mx-auto text-destructive mb-3" /><h1 className="text-xl font-bold">Convite inválido ou expirado</h1><p className="text-sm text-muted-foreground mt-2">Solicite um novo convite à Authera.</p></div></div>;
  }

  if (confirmar) {
    return <div className="min-h-screen flex items-center justify-center p-4 bg-secondary"><div className="pet-card max-w-md text-center space-y-3"><MailCheck className="w-12 h-12 mx-auto text-primary" /><h1 className="text-xl font-bold">Confirme seu e-mail</h1><p className="text-sm text-muted-foreground">Depois de confirmar <strong>{convite.email}</strong>, você volta para este convite e o perfil profissional é liberado.</p></div></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary">
      <div className="pet-card w-full max-w-md">
        <div className="text-center mb-6"><Stethoscope className="w-12 h-12 mx-auto text-primary mb-3" /><h1 className="text-2xl font-bold text-primary">Convite Authera Pet Pro</h1><p className="text-sm text-muted-foreground">Sua solicitação foi aprovada. Crie o acesso profissional.</p></div>
        <form onSubmit={enviar} className="space-y-3">
          <div><Label>E-mail aprovado</Label><Input value={convite.email} readOnly /></div>
          <div><Label>Senha *</Label><Input type="password" minLength={6} required value={senha} onChange={(e) => setSenha(e.target.value)} /></div>
          <div><Label>Nome completo *</Label><Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3"><div><Label>CRMV</Label><Input value={form.crmv} onChange={(e) => setForm({ ...form, crmv: e.target.value })} /></div><div><Label>UF</Label><Input maxLength={2} value={form.uf_crmv} onChange={(e) => setForm({ ...form, uf_crmv: e.target.value.toUpperCase() })} /></div></div>
          <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
          <div><Label>Clínica</Label><Input value={form.clinica} onChange={(e) => setForm({ ...form, clinica: e.target.value })} /></div>
          <div><Label>Especialidade</Label><Input value={form.especialidade} onChange={(e) => setForm({ ...form, especialidade: e.target.value })} /></div>
          <Button type="submit" className="w-full" size="lg">{modo === "cadastro" ? "Criar conta profissional" : "Entrar e concluir convite"}</Button>
          <Button type="button" variant="link" className="w-full" onClick={() => setModo(modo === "cadastro" ? "login" : "cadastro")}>{modo === "cadastro" ? "Já tenho uma conta com este e-mail" : "Criar uma conta nova"}</Button>
        </form>
      </div>
    </div>
  );
};

export default VetConvite;
