import { supabase } from "@/integrations/supabase/client";
import { getUser, hasRole, signIn, signOut, signUp } from "@/lib/auth";

export type AdminSession = {
  id: string;
  email: string;
  nome?: string | null;
};

/**
 * Autenticação administrativa via Supabase Auth.
 * A autorização é sempre verificada no banco (papel `admin` em user_roles + RLS),
 * nunca por valores guardados no navegador.
 */
export const adminLogin = async (email: string, senha: string): Promise<AdminSession | null> => {
  await signIn(email, senha);
  return adminSessionAtual();
};

export const adminSignUp = (email: string, senha: string) => signUp(email, senha);

export const adminLogout = async () => {
  await signOut();
};

/** Retorna a sessão administrativa somente se o usuário possuir o papel admin. */
export const adminSessionAtual = async (): Promise<AdminSession | null> => {
  const user = await getUser();
  if (!user) return null;
  if (!(await hasRole("admin"))) return null;
  const { data } = await supabase
    .from("admins")
    .select("id, email, nome")
    .eq("user_id", user.id)
    .maybeSingle();
  return {
    id: data?.id ?? user.id,
    email: data?.email ?? user.email ?? "",
    nome: data?.nome ?? null,
  };
};

/** Migração de admin legado: prova a posse da senha antiga e vincula a conta atual. */
export const reivindicarAdminLegado = async (email: string, senhaAntiga: string) => {
  const { error } = await supabase.rpc("reivindicar_admin", {
    p_email: email.trim().toLowerCase(),
    p_senha: senhaAntiga,
  });
  if (error) throw error;
  return true;
};

/** Troca de senha do administrador autenticado (Supabase Auth). */
export const adminAlterarSenha = async (senhaAtual: string, novaSenha: string) => {
  const { error } = await supabase.auth.updateUser({
    password: novaSenha,
    current_password: senhaAtual,
  } as Parameters<typeof supabase.auth.updateUser>[0]);
  if (error) throw error;
};

export const concederPapel = async (email: string, role: "tutor" | "veterinarian" | "admin") => {
  const { error } = await supabase.rpc("admin_conceder_papel", {
    p_email: email.trim().toLowerCase(),
    p_role: role,
  });
  if (error) throw error;
};

export const revogarPapel = async (email: string, role: "tutor" | "veterinarian" | "admin") => {
  const { error } = await supabase.rpc("admin_revogar_papel", {
    p_email: email.trim().toLowerCase(),
    p_role: role,
  });
  if (error) throw error;
};
