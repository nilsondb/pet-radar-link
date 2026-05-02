import { supabase } from "@/integrations/supabase/client";

export type AdminSession = {
  id: string;
  email: string;
  nome?: string | null;
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
  localStorage.removeItem("isAdmin");
};

const sha256 = async (text: string): Promise<string> => {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export const adminLogin = async (email: string, senha: string) => {
  const senhaHash = await sha256(senha);
  const { data, error } = await supabase.rpc("admin_login", {
    p_email: email,
    p_senha_hash: senhaHash,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  const session: AdminSession = { id: row.id, email: row.email, nome: row.nome };
  localStorage.setItem(KEY, JSON.stringify(session));
  return session;
};

export const adminSetPassword = async (id: string, senha: string) => {
  const senhaHash = await sha256(senha);
  const { error } = await supabase
    .from("admins")
    .update({ senha_hash: senhaHash })
    .eq("id", id);
  if (error) throw error;
};

export const adminCreate = async (email: string, senha: string, nome: string) => {
  const senhaHash = await sha256(senha);
  const { data, error } = await supabase
    .from("admins")
    .insert({ email, senha_hash: senhaHash, nome, ativo: true })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
};
