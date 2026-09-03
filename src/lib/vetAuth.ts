import { supabase } from "@/integrations/supabase/client";
import { getUser, signIn, signOut, signUp } from "@/lib/auth";

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
  const { data } = await supabase
    .from("veterinarios")
    .select("id, email, nome, crmv, clinica, ativo, status_profissional")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data || !data.ativo) {
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
  if (!session) return { precisaConfirmarEmail: true as const, session: null };
  const perfil = await criarPerfilVeterinario(dados);
  return { precisaConfirmarEmail: false as const, session: perfil };
};

/** Cria/vincula o perfil profissional e o papel veterinarian (fluxo controlado no banco). */
export const criarPerfilVeterinario = async (dados: {
  nome: string;
  email: string;
  telefone?: string;
  crmv?: string;
  uf_crmv?: string;
  clinica?: string;
  especialidade?: string;
}) => {
  const { error } = await supabase.rpc("criar_perfil_veterinario", {
    p_nome: dados.nome,
    p_email: dados.email.trim().toLowerCase(),
    p_telefone: dados.telefone || null,
    p_crmv: dados.crmv || null,
    p_uf_crmv: dados.uf_crmv || null,
    p_clinica: dados.clinica || null,
    p_especialidade: dados.especialidade || null,
  });
  if (error) throw error;
  return loadVetSession();
};
