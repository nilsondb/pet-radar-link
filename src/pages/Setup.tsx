import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getUser, signIn, signOut } from "@/lib/auth";
import { useIdFromUrl, useTokenFromUrl } from "@/lib/petUtils";
import { fetchMeuTutor } from "@/lib/tutorUtils";
import { PetHeader } from "@/components/PetHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, PawPrint, ShieldAlert } from "lucide-react";

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
  const [modo, setModo] = useState<"cadastro" | "login">("cadastro");
  const [form, setForm] = useState<FormState>(vazio);
  const [contaAtual, setContaAtual] = useState<string | null>(null);

  const uid = useMemo(() => (id || "").trim().toUpperCase(), [id]);

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

    toast.success("Tutor, pet e TAG ativados com sucesso! 🐾");
    navigate(`/dashboard?id=${petIdAtivado as string}`, { replace: true });
  };

  useEffect(() => {
    let ativo = true;

    (async () => {
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
      if (user && ativo) {
        setContaAtual(user.email || null);
        const tutor = await fetchMeuTutor();
        if (tutor) {
          setForm((f) => ({
            ...f,
            email: user.email || "",
            nome_dono: tutor.nome || "",
            telefone: tutor.telefone || "",
            endereco: tutor.endereco || "",
          }));
        }
      }

      if (ativo) setChecking(false);
    })();

    return () => { ativo = false; };
  }, [id, token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !token) return;

    if (!form.nome_dono.trim() || !form.telefone.trim() || !form.nome_pet.trim()) {
      return toast.error("Informe nome do tutor, telefone e nome do pet.");
    }
    if (!form.email.trim() || !form.senha) {
      return toast.error("Informe e-mail e senha.");
    }

    setSaving(true);
    try {
      if (modo === "cadastro") {
        // O link da TAG é a autorização de entrada. Qualquer sessão já aberta no navegador
        // não pode ser reaproveitada silenciosamente para criar o novo tutor.
        if (await getUser()) await signOut();

        const { data, error } = await supabase.functions.invoke("criar-tutor-por-tag", {
          body: {
            email: form.email.trim().toLowerCase(),
            senha: form.senha,
            tag_uid: uid,
            token,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        await signIn(form.email, form.senha);
      } else {
        if (await getUser()) await signOut();
        await signIn(form.email, form.senha);
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
        <p className="text-sm text-muted-foreground">{saving ? "Criando acesso e ativando sua TAG..." : "Validando seu convite..."}</p>
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

  return (
    <div className="min-h-screen">
      <PetHeader title="Ativar Authera Pet" />
      <main className="max-w-2xl mx-auto p-4">
        <div className="pet-card">
          <div className="mb-5">
            <p className="text-sm text-muted-foreground">TAG <span className="font-mono font-medium">#{id}</span></p>
            <h1 className="text-2xl font-bold mt-1">Crie seu acesso e cadastre seu primeiro pet</h1>
            <p className="text-sm text-muted-foreground mt-1">Este link autorizado cria seu acesso, seu perfil de tutor e o primeiro pet em um único fluxo.</p>
            {contaAtual && (
              <p className="mt-2 text-xs text-muted-foreground">
                Há uma sessão aberta como <strong>{contaAtual}</strong>. Ela não será usada automaticamente.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
              {modo === "cadastro" && (
                <p className="text-xs text-muted-foreground">
                  Não há confirmação por e-mail neste fluxo: o próprio convite da TAG é a autorização de cadastro.
                </p>
              )}
            </section>

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
              {modo === "login" ? "Entrar e ativar TAG" : "Criar conta e ativar TAG"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Setup;
