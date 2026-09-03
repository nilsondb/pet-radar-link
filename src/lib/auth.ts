import { supabase } from "@/integrations/supabase/client";

export type AppRole = "tutor" | "veterinarian" | "admin";

/** Usuário autenticado revalidado no servidor de auth. */
export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function signIn(email: string, senha: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: senha,
  });
  if (error) throw error;
  return data.session;
}

export async function signUp(email: string, senha: string, metadata?: Record<string, unknown>) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password: senha,
    options: { emailRedirectTo: window.location.origin, data: metadata },
  });
  if (error) throw error;
  return data.session; // null quando a confirmação de e-mail está ativa
}

export async function signOut() {
  await supabase.auth.signOut();
}

/** Papéis do usuário atual, sempre lidos do banco (nunca do localStorage). */
export async function myRoles(): Promise<AppRole[]> {
  const user = await getUser();
  if (!user) return [];
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  return ((data || []) as { role: AppRole }[]).map((r) => r.role);
}

export async function hasRole(role: AppRole) {
  return (await myRoles()).includes(role);
}
