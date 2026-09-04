import { supabase } from "@/integrations/supabase/client";
import { getUser, hasRole, signIn, signOut, signUp } from "@/lib/auth";

export type VetSession = {
  id: string;
  email: string;
  nome: string;
  crmv?: string | null;
  clinica?: string | null;
  status_profissional?: string | null;
};

const KEY = "vet_profile";

/** Cache apenas para exibição (nome/CRMV). NUNCA usado como prova de autorização. */
export const getVetSession = (): VetSession | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as VetSession) : null;
  } catch {
    return null;
  }
};

/** Carrega o perfil profissional do veterinário autenticado (fonte da verdade: banco). */
export const loadVetSession = async (): Promise<VetSession | null> => {
  const user = await getUser();
  if (!user) {
    localStorage.removeItem(KEY);
    return null;
  }
  const [{ data, error }, possuiPapel] = await Promise.all([
    supabase
      .from("veterinarios")
      .select("id, user_id, email, nome, crmv, clinica, ativo, status_profissional")
      .eq("user_id", user.id)
      .maybeSingle(),
    hasRole("veterinarian"),
  ]);
  if (error || !data || !data.ativo || data.user_id !== user.id || !possuiPapel) {
    localStorage.removeItem(KEY);
    return null;
  }
  const session: VetSession = {
    id: data.id,
    email: data.email ?? user.email ?? "",
    nome: data.nome,
    crmv: data.crmv,
    clinica: data.clinica,
    status_profissional: (data as any).status_profissional ?? null,
  };
  localStorage.setItem(KEY, JSON.stringify(session));
  return session;
};

export const vetLogout = async () => {
  localStorage.removeItem(KEY);
  await signOut();
};

export const vetLogin = async (email: string, senha: string) => {
  await signIn(email, senha);
  return loadVetSession();
};

export type VetCadastroResultado =
  | { status: "perfil_concluido"; session: VetSession }
  | { status: "confirmacao_pendente"; session: null };

export const vetSignup = async (dados: {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  crmv?: string;
  uf_crmv?: string;
  clinica?: string;
  especialidade?: string;
}) => {
  const session = await signUp(dados.email, dados.senha, { nome: dados.nome, tipo: "veterinarian" });
  if (!session) return { status: "confirmacao_pendente", session: null } satisfies VetCadastroResultado;
  const perfil = await concluirCadastroVeterinario(dados);
  if (!perfil) throw new Error("Não foi possível validar o perfil profissional.");
  return { status: "perfil_concluido", session: perfil } satisfies VetCadastroResultado;
};

/** Cria ou repara o perfil do usuário autenticado; o e-mail vem da sessão oficial. */
export const concluirCadastroVeterinario = async (dados: {
  nome: string;
  telefone?: string;
  crmv?: string;
  uf_crmv?: string;
  clinica?: string;
  especialidade?: string;
}) => {
  const user = await getUser();
  if (!user) throw new Error("Entre com sua conta para concluir o cadastro profissional.");

  const { error } = await supabase.rpc("concluir_cadastro_veterinario", {
    p_nome: dados.nome,
    p_telefone: dados.telefone || null,
    p_crmv: dados.crmv || null,
    p_uf_crmv: dados.uf_crmv || null,
    p_clinica: dados.clinica || null,
    p_especialidade: dados.especialidade || null,
  });
  if (error) throw error;
  return loadVetSession();
};

export const criarPerfilVeterinario = concluirCadastroVeterinario;
