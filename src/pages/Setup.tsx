import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getUser, signIn, signUp } from "@/lib/auth";
import { useIdFromUrl, useTokenFromUrl } from "@/lib/petUtils";
import { fetchMeuTutor } from "@/lib/tutorUtils";
import { PetHeader } from "@/components/PetHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, MailCheck, PawPrint, ShieldAlert } from "lucide-react";

type FormState = {
  email: string;
  senha: string;
  nome_dono: string;
  telefone: string;
  endereco: string;
  nome_pet: string;
  data_nascimento: string;
  peso: string;
};

const vazio: FormState = {
  email: "",
  senha: "",
  nome_dono: "",
  telefone: "",
  endereco: "",
  nome_pet: "",
  data_nascimento: "",
  peso: "",
};

const Setup = () => {
  const id = useIdFromUrl();
  const token = useTokenFromUrl();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [autenticado, setAutenticado] = useState(false);
  const [modo, setModo] = useState<"cadastro" | "login">("cadastro");
  const [form, setForm] = useState<FormState>(vazio);

  const redirectAtual = useMemo(() => window.location.href, []);

  const ativar = async (dados: FormState) => {
    if (!id || !token) return;

    const { data: petIdAtivado, error } = await supabase.rpc("ativar_pet_com_token", {
      p_id: id,
      p_token: token,
      p_nome_pet: dados.nome_pet.trim(),
      p_nome_dono: dados.nome_dono.trim(),
      p_telefone: dados.telefone.trim(),
      p_endereco: dados.endereco.trim() || null,
      p_data_nascimento: dados.data_nascimento || null,
      p_peso: dados.peso ? Number(dados.peso) : null,
      p_foto_url: null,
    });

    if (error) throw error;
    if (!petIdAtivado) throw new Error("Não foi possível identificar o pet ativado.");

    toast.success("Conta, tutor, pet e TAG ativados com sucesso! 🐾");
    navigate(`/dashboard?id=${petIdAtivado as string}`, { replace: true });
  };

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      if (!id) {
        if (ativo) setChecking(false);
        return;
      }

      const { data: status } = await supabase.rpc("pet_status_ativacao", { p_id: id });
      const row = Array.isArray(status) ? status[0] : status;

      if (row?.ativado && row?.pet_id) {
        navigate(`/dashboard?id=${row.pet_id}`, { replace: true });
        return;
      }

      if (ativo) setTokenValid(!!token);

      const user = await getUser();
      if (!user) {
        if (ativo) {
          setAutenticado(false);
          setChecking(false);
        }
        return;
      }

      if (ativo) setAutenticado(true);

      const tutor = await fetchMeuTutor();
      const pending = (user.user_metadata?.authera_pet_ativacao || null) as Partial<FormState> | null;

      const preenchido: FormState = {
        email: user.email || "",
        senha: "",
        nome_dono: tutor?.nome || pending?.nome_dono || "",
        telefone: tutor?.telefone || pending?.telefone || "",
        endereco: tutor?.endereco || pending?.endereco || "",
        nome_pet: pending?.nome_pet || "",
        data_nascimento: pending?.data_nascimento || "",
        peso: pending?.peso || "",
      };

      if (ativo) setForm(preenchido);

      const podeConcluirAutomatico =
        !!pending &&
        user.user_metadata?.tag_uid === id &&
        !!pending.nome_dono &&
        !!pending.telefone &&
        !!pending.nome_pet;

      if (podeConcluirAutomatico) {
        try {
          if (ativo) setSaving(true);
          await ativar(preenchido);
          return;
        } catch (err: any) {
          toast.error(err.message || "Não foi possível concluir a ativação automaticamente.");
        } finally {
          if (ativo) setSaving(false);
        }
      }

      if (ativo) setChecking(false);
    };

    carregar();
    const { data: sub } = supabase.auth.onAuthStateChange(() => carregar());

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !token) return;

    if (!form.nome_dono.trim() || !form.telefone.trim() || !form.nome_pet.trim()) {
      return toast.error("Informe nome do tutor, telefone e nome do pet.");
    }

    setSaving(true);
    try {
      if (!autenticado) {
        if (!form.email.trim() || !form.senha) throw new Error("Informe e-mail e senha.");

        if (modo === "login") {
          await signIn(form.email, form.senha);
          setAutenticado(true);
          await ativar(form);
          return;
        }

        const session = await signUp(
          form.email,
          form.senha,
          {
            tipo: "tutor",
            origem: "ativacao_tag",
            tag_uid: id,
            authera_pet_ativacao: {
              nome_dono: form.nome_dono.trim(),
              telefone: form.telefone.trim(),
              endereco: form.endereco.trim(),
              nome_pet: form.nome_pet.trim(),
              data_nascimento: form.data_nascimento,
              peso: form.peso,
            },
          },
          redirectAtual
        );

        if (!session) {
          setConfirmar(true);
          return;
        }

        setAutenticado(true);
      }

      await ativar(form);
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar conta e ativar TAG");
    } finally {
      setSaving(false);
    }
  };

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="pet-card max-w-md text-center">
          <PawPrint className="w-12 h-12 mx-auto text-primary mb-3" />
          <h1 className="text-xl font-bold mb-2">TAG não encontrada</h1>
          <p className="text-muted-foreground">Use o link de ativação recebido com sua TAG Authera Pet.</p>
        </div>
      </div>
    );
  }

  if (checking || saving) {
    return (
      <div className="min-h-screen flex flex-col gap-3 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{saving ? "Concluindo sua ativação..." : "Validando seu convite..."}</p>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="pet-card max-w-md text-center">
          <ShieldAlert className="w-12 h-12 mx-auto text-destructive mb-3" />
          <h1 className="text-xl font-bold mb-2">Link de ativação inválido</h1>
          <p className="text-muted-foreground text-sm">Use o link original fornecido com a sua TAG NFC Authera Pet.</p>
        </div>
      </div>
    );
  }

  if (confirmar) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-secondary">
        <div className="pet-card w-full max-w-md text-center space-y-4">
          <MailCheck className="w-12 h-12 mx-auto text-primary" />
          <h1 className="text-xl font-bold">Confirme seu e-mail</h1>
          <p className="text-sm text-muted-foreground">
            Enviamos a confirmação para <strong>{form.email}</strong>. Depois de confirmar, você volta para esta mesma TAG e o cadastro do tutor + primeiro pet é concluído.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PetHeader title="Ativar Authera Pet" />
      <main className="max-w-2xl mx-auto p-4">
        <div className="pet-card">
          <div className="mb-5">
            <p className="text-sm text-muted-foreground">TAG <span className="font-mono font-medium">#{id}</span></p>
            <h1 className="text-2xl font-bold mt-1">Crie seu acesso e cadastre seu primeiro pet</h1>
            <p className="text-sm text-muted-foreground mt-1">Tudo é concluído por este convite. Não existe cadastro público separado de tutor.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!autenticado && (
              <section className="space-y-3 border-b pb-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">Seu acesso</h2>
                  <Button type="button" variant="link" className="px-0" onClick={() => setModo(modo === "cadastro" ? "login" : "cadastro")}>
                    {modo === "cadastro" ? "Já tenho conta" : "Criar conta nova"}
                  </Button>
                </div>
                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="senha">Senha *</Label>
                  <Input id="senha" type="password" minLength={6} required value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
                </div>
              </section>
            )}

            <section className="space-y-3 border-b pb-5">
              <h2 className="font-semibold">Dados do tutor</h2>
              <div>
                <Label htmlFor="nome_dono">Nome completo *</Label>
                <Input id="nome_dono" required value={form.nome_dono} onChange={(e) => setForm({ ...form, nome_dono: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone com DDD *</Label>
                <Input id="telefone" required placeholder="81999999999" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input id="endereco" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-semibold">Seu primeiro pet</h2>
              <div>
                <Label htmlFor="nome_pet">Nome do pet *</Label>
                <Input id="nome_pet" required value={form.nome_pet} onChange={(e) => setForm({ ...form, nome_pet: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="data_nascimento">Data de nascimento</Label>
                <Input id="data_nascimento" type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="peso">Peso (kg)</Label>
                <Input id="peso" type="number" min="0" step="0.1" placeholder="Ex: 8.5" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} />
              </div>
              <p className="text-xs text-muted-foreground">A foto pode ser adicionada depois no painel do pet, sem interromper a ativação.</p>
            </section>

            <Button type="submit" className="w-full" size="lg" disabled={saving}>
              {modo === "login" || autenticado ? "Entrar e ativar TAG" : "Criar conta e ativar TAG"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Setup;
