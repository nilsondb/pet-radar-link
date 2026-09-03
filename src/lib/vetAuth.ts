import { supabase } from "@/integrations/supabase/client";

export type VetSession = {
  id: string;
  email: string;
  nome: string;
  crmv?: string | null;
  clinica?: string | null;
};

const KEY = "vet_auth";

export const getVetSession = (): VetSession | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as VetSession) : null;
  } catch {
    return null;
  }
};

export const vetLogout = () => localStorage.removeItem(KEY);

const sha256 = async (text: string) => {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const saveSession = (row: any): VetSession => {
  const session: VetSession = {
    id: row.id,
    email: row.email,
    nome: row.nome,
    crmv: row.crmv,
    clinica: row.clinica,
  };
  localStorage.setItem(KEY, JSON.stringify(session));
  return session;
};

export const vetLogin = async (email: string, senha: string) => {
  const senha_hash = await sha256(senha);
  const { data, error } = await supabase
    .from("veterinarios")
    .select("id, email, nome, crmv, clinica, ativo, senha_hash")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error) throw error;
  if (!data || !data.ativo || data.senha_hash !== senha_hash) return null;
  return saveSession(data);
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
  const senha_hash = await sha256(dados.senha);
  const { data, error } = await supabase
    .from("veterinarios")
    .insert({
      nome: dados.nome,
      email: dados.email.trim().toLowerCase(),
      senha_hash,
      telefone: dados.telefone || null,
      crmv: dados.crmv || null,
      uf_crmv: dados.uf_crmv || null,
      clinica: dados.clinica || null,
      especialidade: dados.especialidade || null,
      ativo: true,
    })
    .select("id, email, nome, crmv, clinica")
    .single();
  if (error) throw error;
  return saveSession(data);
};
