import { supabase } from "@/integrations/supabase/client";

export type AdminSession = {
  id: string;
  email: string;
  nome: string | null;
};

const KEY = "admin_auth";

export const getAdminSession = (): AdminSession | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
};

export const isAdminAuthed = () => !!getAdminSession();

export const adminLogout = () => {
  localStorage.removeItem(KEY);
  // legacy
  localStorage.removeItem("isAdmin");
};

export const adminLogin = async (email: string, senha: string) => {
  const { data, error } = await supabase.rpc("admin_login", {
    p_email: email,
    p_senha: senha,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  const session: AdminSession = { id: row.id, email: row.email, nome: row.nome };
  localStorage.setItem(KEY, JSON.stringify(session));
  return session;
};

export const adminSetPassword = async (id: string, senha: string) => {
  const { error } = await supabase.rpc("admin_set_password", { p_id: id, p_senha: senha });
  if (error) throw error;
};

export const adminCreate = async (email: string, senha: string, nome: string) => {
  const { data, error } = await supabase.rpc("admin_create", {
    p_email: email,
    p_senha: senha,
    p_nome: nome,
  });
  if (error) throw error;
  return data as string;
};
